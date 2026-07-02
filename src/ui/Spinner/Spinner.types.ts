import type { Toned } from '../tone';

export const ESpinnerSize: {
    readonly Sm: 'sm';
    readonly Md: 'md';
    readonly Lg: 'lg';
} = {
    Sm: 'sm',
    Md: 'md',
    Lg: 'lg',
};
export type ESpinnerSize = (typeof ESpinnerSize)[keyof typeof ESpinnerSize];

// Props for the Spinner: the compact inline busy indicator (Progress covers
// block-level loading; Skeleton covers placeholders). `label` names the
// status for assistive tech - the visual is a spinning toned arc, and under
// reduced motion a STATIC partial ring still reads as "busy" without motion.
export type SpinnerProps = Readonly<
    {
        label?: string | undefined;
        size?: ESpinnerSize | undefined;
    } & Toned
>;
