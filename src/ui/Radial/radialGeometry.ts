// Pure geometry for the radial surfaces (RadialMenu, RadialPad). No React, no
// DOM: it maps a side count to the per-section slot angles the CSS consumes as
// the --radial-angle custom property. Kept separate so the angle math is unit
// testable on its own and shared byte-for-byte between the menu and controller
// variants.

// Supported polygon side counts. A radial has one section slot per edge, so the
// side count is also the maximum section count. Modeled as a numeric literal
// union (not an E-prefixed const object): the members are geometry, not a named
// domain vocabulary, and 4 | 6 | 8 reads directly at every call site.
export type RadialSides = 4 | 6 | 8;

// The full turn in degrees. Named so the angle step is not a bare 360 literal.
const FULL_TURN_DEGREES: number = 360;

// Clockwise angle (in degrees) of each section slot for a flat-top N-gon, with
// section 0 at the top. A slot is placed by rotating from straight up
// (rotate(angle) then translating outward), so angle 0 points at the top edge
// and each subsequent slot steps one edge clockwise. The returned array has one
// entry per side; a consumer with fewer items simply uses the leading angles.
export function radialSectionAngles(sides: RadialSides): readonly number[] {
    const step: number = FULL_TURN_DEGREES / sides;
    const angles: number[] = [];
    for (let index: number = 0; index < sides; index += 1) {
        angles.push(index * step);
    }
    return angles;
}
