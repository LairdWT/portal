import { type EUiStatus, type Toned } from '../tone';

// EStatTileEmphasis: which of the two metric shapes to render. Folds the Helicon
// metric_cell (label-led, medium value) and stat_tile (value-led, large hero
// value) shapes into one named member set. The kebab values double as the
// data-emphasis attribute the CSS reads.
export const EStatTileEmphasis: {
    readonly Hero: 'hero';
    readonly Metric: 'metric';
} = {
    Hero: 'hero',
    Metric: 'metric',
};
export type EStatTileEmphasis =
    (typeof EStatTileEmphasis)[keyof typeof EStatTileEmphasis];

// EStatTrend: direction of a delta indicator. This is DIRECTION ONLY (the visual
// caret plus the spoken word). It carries no sentiment or color: whether a rise
// is good or bad is domain-specific (higher latency is bad, higher throughput is
// good), so sentiment is bound by the consumer through status/tone, never
// inferred from the trend. The values double as the data-trend attribute the CSS
// reads.
export const EStatTrend: {
    readonly Up: 'up';
    readonly Down: 'down';
    readonly Flat: 'flat';
} = {
    Up: 'up',
    Down: 'down',
    Flat: 'flat',
};
export type EStatTrend = (typeof EStatTrend)[keyof typeof EStatTrend];

// An optional change indicator shown beside the value. `value` is the rendered
// delta text the consumer formats (for example "+12%" or "-3 ms"); `trend`
// selects the CSS-drawn directional caret and the spoken trend word. Color is
// taken from tone/status, never from the trend.
export type StatDelta = Readonly<{
    value: string;
    trend: EStatTrend;
}>;

// Props for StatTile, a non-interactive stacked metric display. `value` is a
// DISPLAY value (string or number), not a controlled input value - the tile is
// read-only, so it has no value/onChange. `unit` is an optional secondary unit
// string (for example "ops/s"). `delta` is an optional change indicator.
// `emphasis` switches the hero (value-led, large) and metric (label-led, medium)
// shapes; default Hero. `status` is the universal danger/success signal flowing
// through the tone scope; `tone` is the opaque domain color seed. Neither carries
// domain meaning - the consumer binds that.
export type StatTileProps = Readonly<
    {
        label: string;
        value: string | number;
        unit?: string;
        delta?: StatDelta;
        emphasis?: EStatTileEmphasis;
        status?: EUiStatus;
    } & Toned
>;

// trendWord: the spoken trend word for the accessible name. The switch has no
// default branch, so adding an EStatTrend member fails to compile under
// noFallthroughCasesInSwitch until it is handled here.
export function trendWord(trend: EStatTrend): string {
    switch (trend) {
        case EStatTrend.Up:
            return 'up';
        case EStatTrend.Down:
            return 'down';
        case EStatTrend.Flat:
            return 'no change';
    }
}

// composeStatName: builds the coherent phrase exposed as the group's accessible
// name, for example "Throughput 1,024 ops/s, up 12%". role="group" + aria-label
// ADDS this name; it does not suppress the descendants, so assistive tech still
// announces the visible value, unit, label, and delta individually. The composed
// name guards a stable reading order independent of the CSS reflow between the
// emphases; it does not replace the child content.
export function composeStatName(
    label: string,
    valueText: string,
    unit: string | undefined,
    delta: StatDelta | undefined,
): string {
    const head: string =
        unit !== undefined
            ? `${label} ${valueText} ${unit}`
            : `${label} ${valueText}`;
    if (delta === undefined) {
        return head;
    }
    return `${head}, ${trendWord(delta.trend)} ${delta.value}`;
}
