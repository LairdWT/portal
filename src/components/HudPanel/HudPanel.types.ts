// A single read-only readout. `value01` is a normalized magnitude the panel
// clamps to the 0..1 range before expressing it as a fill percentage.
export type HudReadout = Readonly<{
    id: string;
    label: string;
    value01: number;
}>;

// Props for the HudPanel readout group. The panel renders no controls and
// emits no input signals; it presents labelled, decorative fill bars with the
// numeric value exposed as text for assistive technology.
export type HudPanelProps = Readonly<{
    label: string;
    readouts: readonly HudReadout[];
}>;
