import * as d3 from 'd3';
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import DataViewCategorical = powerbi.DataViewCategorical;
import IColorPalette = powerbi.extensibility.IColorPalette;
import { VisualSettings } from "./settings";
import { DataPoint } from "./interfaces";

export class Visual implements IVisual {
    private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    private host: powerbi.extensibility.visual.IVisualHost;
    private colorPalette: IColorPalette;
    private settings: VisualSettings;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.colorPalette = options.host.colorPalette;
        this.svg = d3.select(options.element)
                     .append('svg')
                     .classed('boxWhiskerPlot', true);
    }

    public update(options: VisualUpdateOptions) {
        const dataView: DataView = options.dataViews[0];
        const width = options.viewport.width;
        const height = options.viewport.height;

        this.svg.attr('width', width).attr('height', height);

        this.settings = VisualSettings.parse(dataView);

        const data = this.parseData(dataView.categorical);
        this.drawBoxWhiskerPlot(data, width, height, this.settings);
    }

    private parseData(categorical: DataViewCategorical): DataPoint[] {
        const categories = categorical.categories[0].values;
        const minValues = categorical.values[0].values;
        const maxValues = categorical.values[1].values;
        const meanValues = categorical.values[2].values;
        const lowerQuartileValues = categorical.values[3].values;
        const upperQuartileValues = categorical.values[4].values;
        const medianValues = categorical.values[5].values;
    
        return categories.map((category, i) => ({
            category: category as string,
            min: minValues[i] as number,
            max: maxValues[i] as number,
            mean: meanValues[i] as number,
            lowerQuartile: lowerQuartileValues[i] as number,
            upperQuartile: upperQuartileValues[i] as number,
            median: medianValues[i] as number
        }));
    }    

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        const quartileColorsCard: powerbi.visuals.FormattingCard = {
            displayName: "Quartile Colors",
            uid: "quartileColorsCard",
            groups: [
                {
                    displayName: "Colors",
                    uid: "colorsGroup",
                    slices: [
                        this.createColorSlice("Lower Quartile Color", "lowerQuartileColor", this.settings.quartileColors.lowerQuartileColor),
                        this.createColorSlice("Upper Quartile Color", "upperQuartileColor", this.settings.quartileColors.upperQuartileColor)
                    ]
                }
            ]
        };

        const medianLineCard: powerbi.visuals.FormattingCard = {
            displayName: "Median Line",
            uid: "medianLineCard",
            groups: [
                {
                    displayName: "Line",
                    uid: "lineGroup",
                    slices: [
                        this.createColorSlice("Median Line Color", "color", this.settings.medianLineColor)
                    ]
                }
            ]
        };

        return { cards: [quartileColorsCard, medianLineCard] };
    }

    private createColorSlice(displayName: string, propertyName: string, colorValue: string): powerbi.visuals.FormattingSlice {
        return {
            displayName,
            uid: `${propertyName}Slice`,
            control: {
                type: powerbi.visuals.FormattingComponent.ColorPicker,
                properties: {
                    descriptor: {
                        objectName: "quartileColors",
                        propertyName
                    },
                    value: {
                        value: colorValue
                    }
                }
            }
        };
    }

    private drawBoxWhiskerPlot(data: DataPoint[], width: number, height: number, settings: VisualSettings) {
    const margin = { top: 10, right: 30, bottom: 30, left: 40 };
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    this.svg.selectAll("*").remove();

    const svg = this.svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.category))
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Calculate the min and max values for the y-axis and extend by 10%
    const yMin = d3.min(data, d => d.min)!;
    const yMax = d3.max(data, d => d.max)!;
    const yRange = yMax - yMin;

    const y = d3.scaleLinear()
        .domain([yMin - 0.1 * yRange, yMax + 0.1 * yRange])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    data.forEach(d => this.drawDataPoint(svg, x, y, d, settings));
}

    

    private drawDataPoint(svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>, x: d3.ScaleBand<string>, y: d3.ScaleLinear<number, number>, d: DataPoint, settings: VisualSettings) {
        
        // Draw lower quartile box
        svg.append("rect")
            .attr("x", x(d.category)! + x.bandwidth() / 4)
            .attr("y", y(d.median))
            .attr("height", y(d.lowerQuartile) - y(d.median))
            .attr("width", x.bandwidth() / 2)
            .attr("fill", settings.quartileColors.lowerQuartileColor);

        // Draw upper quartile box
        svg.append("rect")
            .attr("x", x(d.category)! + x.bandwidth() / 4)
            .attr("y", y(d.upperQuartile))
            .attr("height", y(d.median) - y(d.upperQuartile))
            .attr("width", x.bandwidth() / 2)
            .attr("fill", settings.quartileColors.upperQuartileColor);
    
        // Draw median line
        svg.append("line")
            .attr("x1", x(d.category)! + x.bandwidth() / 4)
            .attr("x2", x(d.category)! + 3 * x.bandwidth() / 4)
            .attr("y1", y(d.median))
            .attr("y2", y(d.median))
            .attr("stroke", settings.medianLineColor);
    
        // Draw whiskers
        svg.append("line")
            .attr("x1", x(d.category)! + x.bandwidth() / 2)
            .attr("x2", x(d.category)! + x.bandwidth() / 2)
            .attr("y1", y(d.min))
            .attr("y2", y(d.lowerQuartile))
            .attr("stroke", "black");
    
        svg.append("line")
            .attr("x1", x(d.category)! + x.bandwidth() / 2)
            .attr("x2", x(d.category)! + x.bandwidth() / 2)
            .attr("y1", y(d.upperQuartile))
            .attr("y2", y(d.max))
            .attr("stroke", "black");
    
        // Draw whisker caps
        svg.append("line")
            .attr("x1", x(d.category)! + x.bandwidth() / 4)
            .attr("x2", x(d.category)! + 3 * x.bandwidth() / 4)
            .attr("y1", y(d.min))
            .attr("y2", y(d.min))
            .attr("stroke", "black");

        svg.append("line")
            .attr("x1", x(d.category)! + x.bandwidth() / 4)
            .attr("x2", x(d.category)! + 3 * x.bandwidth() / 4) 
            .attr("y1", y(d.upperQuartile))
            .attr("y2", y(d.upperQuartile))
            .attr("stroke", "black");
    
        svg.append("line")
            .attr("x1", x(d.category)! + x.bandwidth() / 4)
            .attr("x2", x(d.category)! + 3 * x.bandwidth() / 4)
            .attr("y1", y(d.max))
            .attr("y2", y(d.max))
            .attr("stroke", "black");

        svg.append("line")
            .attr("x1", x(d.category)! + x.bandwidth() / 4)
            .attr("x2", x(d.category)! + 3 * x.bandwidth() / 4)
            .attr("y1", y(d.lowerQuartile))
            .attr("y2", y(d.lowerQuartile))
            .attr("stroke", "black");
    
        // Optional: Draw mean circle
        svg.append("circle")
            .attr("cx", x(d.category)! + x.bandwidth() / 2)
            .attr("cy", y(d.mean))
            .attr("r", 3)
            .attr("fill", "white")
            .attr("stroke", "black");
    }
    
}
