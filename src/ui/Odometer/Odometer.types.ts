import { type Toned } from '../tone';

// Props for the Odometer: a rolling digit-column readout (ammo counters,
// scores, credits). The consumer owns the value; each digit column rolls to
// its new face through a transform transition (instant under reduced
// motion). The digit reels are decorative; a role=img label carries the
// accessible value, and announcements are OPT-IN because rapid ticks (ammo
// fire) would spam a live region.
//
// Optional props admit `undefined` explicitly so composition wrappers can
// forward their own optional values under exactOptionalPropertyTypes.
export type OdometerProps = Readonly<{
    /**
     * Accessible subject for the readout ("Ammo", "Score").
     */
    label: string;
    /**
     * Displayed count. Floored to an integer; negatives and non-finite
     * values clamp to 0.
     */
    value: number;
    /**
     * Minimum rendered digit count, zero-padded. Default 1.
     */
    minDigits?: number | undefined;
    /**
     * Politely announce value changes. Default false (silent readout).
     */
    announce?: boolean | undefined;
}> &
    Toned;
