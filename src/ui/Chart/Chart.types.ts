// Shared contract for the Chart primitive family (BarChart, StackedBar,
// RankedBars, RatioBar, LegendRow). These are NON-interactive display
// primitives: the consumer passes a readonly data series and the component only
// draws it - the chart owns no data and no state (interface-forwarding). Every
// primitive mixes in `Toned`, so a consumer themes a chart by passing an opaque
// CSS color that derives the accent/border/glow ramp through the shared tone
// scope; charts never enumerate a palette.
//
// Accessibility: each data-bearing primitive exposes a summarizing accessible
// name (a role=img aria-label on the pure-SVG primitives, or real text rows on
// the row-structured ones) plus an optional visually-hidden data table for the
// full series. No hover-only affordance: SVG `<title>` gives pointer hints and
// the row primitives (RankedBars, LegendRow) are focusable Tooltip triggers.

import { type EUiStatus, type Toned } from '../tone';

// One labeled magnitude for the ranked-bar list. `value` is a non-negative
// count/magnitude; the widest value in the set drives the gauge maximum.
export type ChartRankedEntry = Readonly<{
    label: string;
    value: number;
}>;

// One slice of a stacked bar. `value` is the slice weight (clamped at 0); its
// share is value / sum(values). `tone` is an optional opaque CSS color seed for
// this slice, derived through the same tone ramp; when omitted the slice uses
// the instance tone stepped by index.
export type ChartSegment = Readonly<{
    label: string;
    value: number;
    tone?: string;
}>;

// One legend entry: a tone swatch, a label, and an optional formatted value.
export type ChartLegendItem = Readonly<{
    label: string;
    value?: string | number;
    tone?: string;
}>;

// Screen-reader fallback depth for the data-bearing primitives. `Summary` keeps
// only the summarizing accessible name; `Table` additionally renders a
// visually-hidden <table> with the full series. Labeled charts default to
// Table; the bare numeric BarChart defaults to Summary.
export const EChartA11yDetail: {
    readonly Summary: 'summary';
    readonly Table: 'table';
} = { Summary: 'summary', Table: 'table' };
export type EChartA11yDetail =
    (typeof EChartA11yDetail)[keyof typeof EChartA11yDetail];

// Vertical bar sparkline over a bare numeric series (Helicon `bar_chart`).
// `detail` defaults to Summary: the role=img name conveys only count/range/peak
// and per-bar values are reachable only through the pointer-hover SVG <title>.
// Summary is therefore intended for decorative sparklines where per-bar values
// are non-essential; pass detail=Table when each bar value must have a keyboard
// and screen-reader path (the visually-hidden data table).
export type BarChartProps = Readonly<{
    label: string;
    values: readonly number[];
    summary?: string;
    emptyLabel?: string;
    detail?: EChartA11yDetail;
    status?: EUiStatus;
}> &
    Toned;

// Compact inline trend line over a bare numeric series: the sparkline proper.
// No frame, caption, or axes - it slots beside a value (a StatTile, a table
// cell) and its role=img name carries the summary. `filled` adds the toned
// area wash under the line.
export type SparklineProps = Readonly<{
    label: string;
    values: readonly number[];
    filled?: boolean;
    status?: EUiStatus;
}> &
    Toned;

// Framed trend line with the family's caption, baseline, and gridlines.
// `detail` defaults to Table (the series is data-bearing); `filled` adds the
// toned area wash under the line.
export type LineChartProps = Readonly<{
    label: string;
    values: readonly number[];
    summary?: string;
    emptyLabel?: string;
    detail?: EChartA11yDetail;
    filled?: boolean;
    status?: EUiStatus;
}> &
    Toned;

// Horizontal stacked bar of weighted slices (Helicon `stacked_bar`).
export type StackedBarProps = Readonly<{
    label: string;
    segments: readonly ChartSegment[];
    summary?: string;
    emptyLabel?: string;
    detail?: EChartA11yDetail;
    status?: EUiStatus;
}> &
    Toned;

// Top-to-bottom labeled gauges; the widest value drives the gauge maximum
// (Helicon `ranked_bars`). Rows are focusable Tooltip triggers.
export type RankedBarsProps = Readonly<{
    entries: readonly ChartRankedEntry[];
    summary?: string;
    emptyLabel?: string;
    detail?: EChartA11yDetail;
    status?: EUiStatus;
}> &
    Toned;

// Single ratio gauge: a track with a fill = clamp(value / max, 0, 1)
// (Helicon `ratio_bar`).
export type RatioBarProps = Readonly<{
    label: string;
    value: number;
    max?: number;
    summary?: string;
    status?: EUiStatus;
}> &
    Toned;

// A wrapping row of legend entries (Helicon `legend_row`, batched). Entries are
// focusable Tooltip triggers.
export type LegendRowProps = Readonly<{
    items: readonly ChartLegendItem[];
}> &
    Toned;
