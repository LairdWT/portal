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

// Normalize a series onto the 0..100 viewBox as polyline points (min..max
// spans the full height; a flat or single-sample series draws its midline).
// Non-finite samples clamp to the series floor so one bad value cannot emit a
// NaN attribute. Shared by Sparkline and LineChart.
export function linePoints(values: readonly number[]): string {
    const finite: readonly number[] = values.filter((value: number): boolean =>
        Number.isFinite(value),
    );
    const min: number = finite.length > 0 ? Math.min(...finite) : 0;
    const max: number = finite.length > 0 ? Math.max(...finite) : 0;
    const span: number = max - min;
    const step: number = values.length > 1 ? 100 / (values.length - 1) : 0;
    return values
        .map((value: number, index: number): string => {
            const sample: number = Number.isFinite(value) ? value : min;
            const fraction: number = span > 0 ? (sample - min) / span : 0.5;
            const x: number = values.length > 1 ? index * step : 50;
            const y: number = 100 - fraction * 100;
            return `${String(svgValue(x))},${String(svgValue(y))}`;
        })
        .join(' ');
}
