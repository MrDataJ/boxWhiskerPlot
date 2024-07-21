import powerbi from "powerbi-visuals-api";
import DataViewObjects = powerbi.DataViewObjects;
import Fill = powerbi.Fill;

export class VisualSettings {
    public quartileColors: QuartileColorsSettings = new QuartileColorsSettings();
    public medianLineColor: string = '#000000'; // Default color for median line

    public static parse(dataView: powerbi.DataView): VisualSettings {
        const settings = new VisualSettings();
        const objects: DataViewObjects = dataView.metadata.objects;

        settings.quartileColors.lowerQuartileColor = VisualSettings.getFillColor(objects, 'quartileColors', 'lowerQuartileColor', '#1f77b4');
        settings.quartileColors.upperQuartileColor = VisualSettings.getFillColor(objects, 'quartileColors', 'upperQuartileColor', '#ff7f0e');
        settings.medianLineColor = VisualSettings.getFillColor(objects, 'medianLine', 'color', '#000000');

        return settings;
    }

    private static getFillColor(objects: DataViewObjects, objectName: string, propertyName: string, defaultColor: string): string {
        const color = objects && objects[objectName] && objects[objectName][propertyName];
        return color ? (color as Fill).solid.color : defaultColor;
    }
}

export class QuartileColorsSettings {
    public lowerQuartileColor: string = '#1f77b4'; // Default color
    public upperQuartileColor: string = '#ff7f0e'; // Default color
}
