import { type Toned } from '../tone';

// A single discrete readout in a ReadoutPanel. The value is an integer or a
// string presented as real text (not a 0..1 bar). `id` is the React key and the
// stable identity of the row (labels may collide, ids may not). `tone` is an
// optional opaque CSS color the consumer supplies so a single row can be toned
// independently of the panel; the row never enumerates a palette.
export type Readout = Readonly<{
    id: string;
    label: string;
    value: string | number;
    tone?: string;
}>;

// Props for the ReadoutPanel discrete-value stat panel. Distinct from HudPanel,
// which renders 0..1 progress bars; ReadoutPanel presents integer or string
// values as text with no bars and no progressbar role. `label` names the group
// for assistive technology. `tone` is the panel-level opaque CSS color; each
// readout may override it with its own per-row tone.
export type ReadoutPanelProps = Readonly<
    {
        label: string;
        readouts: readonly Readout[];
    } & Toned
>;
