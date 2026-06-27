// Shared pure helpers for the Chart primitive family (BarChart, StackedBar,
// RankedBars, RatioBar, LegendRow). Kept in a non-component module so the
// rounding and class-join logic lives in exactly one place - a fix to the
// rounding or joining reaches every primitive at once - while the component
// modules stay export-pure.

// Round an SVG coordinate so emitted attributes stay tidy and finite.
export function svgValue(value: number): number {
    return Math.round(value * 1000) / 1000;
}

// Compose class names, dropping unresolved CSS-module names so the join is
// exactly the defined classes.
export function withClass(...names: readonly (string | undefined)[]): string {
    return names
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
}
