// Pure heading math for the Compass strip. React-free and DOM-free (the
// gaugeMath split). Headings are degrees clockwise from north; the strip
// windows a span of the 360-degree rose around the current heading, so the
// tick generator must wrap cleanly across the 0/360 seam.

// The eight cardinal / intercardinal labels, one per 45 degrees from north.
export const COMPASS_CARDINALS: readonly string[] = [
    'N',
    'NE',
    'E',
    'SE',
    'S',
    'SW',
    'W',
    'NW',
];

const FULL_TURN_DEGREES: number = 360;
const CARDINAL_STEP_DEGREES: number = 45;

// Normalize a heading into [0, 360); non-finite input reads as north.
export function normalizeHeading(degrees: number): number {
    if (!Number.isFinite(degrees)) {
        return 0;
    }
    const wrapped: number = degrees % FULL_TURN_DEGREES;
    return wrapped < 0 ? wrapped + FULL_TURN_DEGREES : wrapped;
}

// The shortest signed turn from one heading to another, in (-180, 180].
export function headingDelta(from: number, to: number): number {
    const raw: number =
        (normalizeHeading(to) - normalizeHeading(from) + FULL_TURN_DEGREES) %
        FULL_TURN_DEGREES;
    return raw > FULL_TURN_DEGREES / 2 ? raw - FULL_TURN_DEGREES : raw;
}

// The cardinal label nearest a heading ("073" reads NE at 67.5 and up).
export function nearestCardinal(degrees: number): string {
    const index: number =
        Math.round(normalizeHeading(degrees) / CARDINAL_STEP_DEGREES) %
        COMPASS_CARDINALS.length;
    return COMPASS_CARDINALS[index] ?? 'N';
}

// One strip tick: its rose degrees (normalized), its horizontal position as
// a fraction of the strip (-0.5 left edge .. +0.5 right edge), and the
// cardinal label carried by 45-degree majors.
export type CompassTick = Readonly<{
    degrees: number;
    offsetFraction: number;
    major: boolean;
    label: string | undefined;
}>;

// The ticks visible in a `spanDegrees` window centered on `heading`, one
// every `stepDegrees`. Wraps across the 0/360 seam; degenerate input (a
// non-positive span or step) yields no ticks.
export function compassTicks(
    heading: number,
    spanDegrees: number,
    stepDegrees: number,
): readonly CompassTick[] {
    if (!Number.isFinite(spanDegrees) || spanDegrees <= 0) {
        return [];
    }
    if (!Number.isFinite(stepDegrees) || stepDegrees <= 0) {
        return [];
    }
    const centered: number = normalizeHeading(heading);
    const half: number = spanDegrees / 2;
    const first: number = Math.ceil((centered - half) / stepDegrees) * stepDegrees;
    const ticks: CompassTick[] = [];
    for (let raw: number = first; raw <= centered + half; raw += stepDegrees) {
        const degrees: number = normalizeHeading(raw);
        const major: boolean = degrees % CARDINAL_STEP_DEGREES === 0;
        ticks.push({
            degrees,
            offsetFraction: (raw - centered) / spanDegrees,
            major,
            label: major
                ? COMPASS_CARDINALS[degrees / CARDINAL_STEP_DEGREES]
                : undefined,
        });
    }
    return ticks;
}
