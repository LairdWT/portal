import { type Toned } from '../tone';

// Reticle glyph style. The kebab values double as the data-variant attribute
// the CSS keys the drawn parts off.
export const EReticleVariant: {
    readonly Cross: 'cross';
    readonly Dot: 'dot';
    readonly Circle: 'circle';
    readonly Brackets: 'brackets';
} = {
    Cross: 'cross',
    Dot: 'dot',
    Circle: 'circle',
    Brackets: 'brackets',
};
export type EReticleVariant =
    (typeof EReticleVariant)[keyof typeof EReticleVariant];

// Props for the Reticle: a PURELY DECORATIVE aiming glyph (crosshair, dot,
// ring, or corner brackets) for game overlays. The whole element is
// aria-hidden presentation - it carries no semantics, no focus, and no
// input; any gameplay meaning (hits, target state) must also be conveyed
// through real UI elsewhere.
//
// Optional props admit `undefined` explicitly so composition wrappers can
// forward their own optional values under exactOptionalPropertyTypes.
export type ReticleProps = Readonly<{
    /**
     * Glyph style. Default Cross.
     */
    variant?: EReticleVariant | undefined;
    /**
     * Bloom offset in px pushing the arms / brackets outward (weapon
     * spread). Default 0; negative values clamp to 0.
     */
    spreadPx?: number | undefined;
    /**
     * One-shot hit-marker flash trigger: each change to a new POSITIVE
     * value remounts the flash (key the count of hits). The flash is a
     * bounded transform/opacity animation and is suppressed entirely under
     * reduced motion.
     */
    hitToken?: number | undefined;
}> &
    Toned;
