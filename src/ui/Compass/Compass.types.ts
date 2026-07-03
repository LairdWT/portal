import { type Toned } from '../tone';

// Props for the Compass: a NON-interactive heading strip instrument in the
// Chart-family chrome. The consumer owns the heading; the strip windows the
// 360-degree rose around it with a fixed center index. Like the Dial, the
// instrument is chirality-fixed: bearings always increase to the visual
// right, so the strip does not mirror under RTL.
//
// Optional props admit `undefined` explicitly so composition wrappers can
// forward their own optional values under exactOptionalPropertyTypes.
export type CompassProps = Readonly<{
    /**
     * Caption text above the strip; also the accessible readout's subject.
     */
    label: string;
    /**
     * Heading in degrees clockwise from north; normalized into [0, 360).
     */
    heading: number;
    /**
     * Visible window width in degrees. Default 90.
     */
    span?: number | undefined;
    /**
     * Formats the readout (visible and spoken). Default a zero-padded
     * three-digit heading plus the nearest cardinal ("073 NE").
     */
    formatHeading?: ((degrees: number) => string) | undefined;
}> &
    Toned;
