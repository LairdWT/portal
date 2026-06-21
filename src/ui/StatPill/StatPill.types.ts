import { type EUiStatus, type Toned } from '../tone';

// Props for the StatPill chip. The pill presents a label and a value as a single
// non-interactive unit; tone drives its accent and border, and the universal
// status overrides the tone seed. The value is exposed as real text, and the
// pill carries a combined aria-label so assistive technology reads it as one
// unit (for example "Energy 7").
export type StatPillProps = Readonly<
    {
        label: string;
        value: string | number;
        status?: EUiStatus;
    } & Toned
>;
