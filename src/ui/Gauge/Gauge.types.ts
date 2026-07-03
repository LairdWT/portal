import { type ReactNode } from 'react';

import { type EUiStatus, type Toned } from '../tone';

// One highlighted span of the dial, drawn as a thin arc segment outside the
// main track (the tachometer redline read). `from`/`to` are in VALUE units
// (the same space as `value`/`min`/`max`) and are clamped to the bounds; an
// inverted pair is normalized. `status` keys the segment color to the
// universal danger/success tokens; omitted (or None) uses the tone accent.
export type GaugeBand = Readonly<{
    from: number;
    to: number;
    status?: EUiStatus | undefined;
}>;

// Props for the Gauge: a NON-interactive radial arc meter in the Chart-family
// chrome (figure/figcaption frame) whose readout carries the ARIA meter
// semantics. The consumer owns the value (interface-forwarding, like every
// Chart primitive); the gauge only draws it.
//
// Optional props admit `undefined` explicitly so composition wrappers can
// forward their own optional values under exactOptionalPropertyTypes.
export type GaugeProps = Readonly<{
    /**
     * Caption text above the dial; also the meter's accessible name.
     */
    label: string;
    /**
     * The measured value. Clamped into [min, max] for the arc and the ARIA
     * values; a non-finite value reads as the floor.
     */
    value: number;
    /**
     * Value bounds. Default 0 / 100; an inverted max collapses to min.
     */
    min?: number | undefined;
    max?: number | undefined;
    /**
     * Highlighted value spans drawn outside the main track.
     */
    bands?: readonly GaugeBand[] | undefined;
    /**
     * Unit suffix rendered after the readout value and appended to the
     * spoken aria-valuetext.
     */
    units?: string | undefined;
    /**
     * Formats the (clamped) value for the readout and aria-valuetext.
     * Default String(value).
     */
    formatValue?: ((value: number) => string) | undefined;
    /**
     * Decorative icon or text rendered in the dial hub above the value
     * readout. The meter still speaks the numeric value; pass something
     * self-explanatory visually (a glyph, a short tag).
     */
    centerContent?: ReactNode | undefined;
    /**
     * A units-independent amount line under the value (e.g. '620 / 1000'),
     * also appended to the spoken aria-valuetext.
     */
    amountLabel?: string | undefined;
    /**
     * Renders the min/max bounds at the dial shoulders.
     */
    showBounds?: boolean | undefined;
    /**
     * Universal status routed through the tone scope (data-status).
     */
    status?: EUiStatus | undefined;
}> &
    Toned;
