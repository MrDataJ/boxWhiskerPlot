# My Custom Visual for Power BI

This repository contains a custom visual for Power BI created using the `pbiviz` tool. The visual is a simple bar chart designed to display categorical data.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Installation

To install the necessary dependencies for this project, run the following command:

```bash
npm install
```

## Usage

To use the custom visual in Power BI:

1. Open Power BI Desktop.
2. Go to the `Visualizations` pane and click on the ellipsis (`...`).
3. Select `Import from file` and choose the `.pbiviz` file located in the `dist` folder.
4. Your custom visual should now be available in the `Visualizations` pane.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later recommended)
- [Power BI Visual Tools](https://github.com/Microsoft/PowerBI-visuals-tools)

### Create a New Visual

To create a new Power BI visual, run the following command:

```bash
pbiviz new MyCustomVisual
```

### Modify the Visual

Edit the `src/visual.ts` file to modify the visual. Below is an example of a simple bar chart visual:

```typescript
module powerbi.extensibility.visual {
    import DataView = powerbi.DataView;
    import IVisual = powerbi.extensibility.visual.IVisual;
    import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
    import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

    export class Visual implements IVisual {
        private target: HTMLElement;

        constructor(options: VisualConstructorOptions) {
            this.target = options.element;
        }

        public update(options: VisualUpdateOptions) {
            this.target.innerHTML = `<svg width="${options.viewport.width}" height="${options.viewport.height}"></svg>`;
            let svg = d3.select(this.target).select("svg");

            let dataView = options.dataViews[0];
            let values = dataView.categorical.values[0].values;
            let categories = dataView.categorical.categories[0].values;

            let x = d3.scaleBand()
                .domain(categories.map(d => d.toString()))
                .range([0, options.viewport.width])
                .padding(0.1);

            let y = d3.scaleLinear()
                .domain([0, d3.max(values) as number])
                .range([options.viewport.height, 0]);

            let bars = svg.selectAll(".bar")
                .data(values)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", (d, i) => x(categories[i].toString()) as number)
                .attr("y", d => y(d) as number)
                .attr("width", x.bandwidth())
                .attr("height", d => options.viewport.height - (y(d) as number))
                .attr("fill", "steelblue");
        }
    }
}
```

### Start the Development Server

To start the development server and test your visual, run:

```bash
pbiviz start
```

This will host your visual locally and open a new browser window with Power BI, where you can see and test your visual.

### Package the Visual

Once you are satisfied with your visual, you can package it for distribution:

```bash
pbiviz package
```

This will create a `.pbiviz` file in the `dist` folder, which you can import into Power BI.

## Contributing

If you would like to contribute to this project, please fork the repository and create a pull request with your changes. We welcome all contributions!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

 root directory of your project. It provides an overview of the project, instructions for installation and usage, 