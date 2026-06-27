import { type Toned } from '../tone';

// Decorative CRT scanline overlay - the React-DOM realization of Helicon
// scanlines::draw_overlay / draw_overlay_rect. Renders an aria-hidden,
// pointer-events:none layer of evenly-spaced horizontal lines painted with a
// single repeating-linear-gradient (no per-frame work; the compositor handles
// scroll/resize). It owns NO content and NO a11y identity: it conveys no
// information, intercepts no input, and contributes nothing to the document
// outline. The underlying content carries all meaning; the overlay is
// presentational chrome only. The optional flicker is reduced-motion gated and
// off by default (Helicon parity is the static overlay).

// Where the overlay paints. Fixed => the whole viewport (Helicon draw_overlay);
// Contained => fills the nearest positioned ancestor (Helicon draw_overlay_rect,
// "CRT shimmer on one panel"). The string value doubles as the data-extent
// attribute the CSS keys off.
export const EScanlineExtent: {
    readonly Fixed: 'fixed';
    readonly Contained: 'contained';
} = {
    Fixed: 'fixed',
    Contained: 'contained',
};
export type EScanlineExtent =
    (typeof EScanlineExtent)[keyof typeof EScanlineExtent];

// Optional CRT shimmer. None (default) => a static overlay (Helicon parity).
// Subtle => a reduced-motion-gated opacity flicker (an additive web aesthetic;
// Helicon has no flicker). The string value doubles as the data-flicker
// attribute the CSS keys off.
export const EScanlineFlicker: {
    readonly None: 'none';
    readonly Subtle: 'subtle';
} = {
    None: 'none',
    Subtle: 'subtle',
};
export type EScanlineFlicker =
    (typeof EScanlineFlicker)[keyof typeof EScanlineFlicker];

// Props for the Scanlines overlay. All inputs are static appearance props - there
// is no open/close state, no selection, no value - mirroring Helicon's stateless
// per-frame draw_overlay_rect(ctx, rect, config) call. The Toned mixin carries
// the opaque tone color the line gradient derives from; with no tone the scope
// falls back to the base accent, matching Helicon's "palette.accent unless
// overridden". There is deliberately NO status (danger/success have no meaning
// for a decorative texture), NO enabled flag (a non-interactive layer has nothing
// to disable; consumers conditionally render), and NO children (it is a sibling
// overlay, never a wrapper - wrapping would force pointer-events:none onto real
// content). For Contained, place it as the last child of a position:relative host.
export type ScanlinesProps = Readonly<{
    // Where the overlay paints. Default EScanlineExtent.Contained.
    extent?: EScanlineExtent;
    // Optional CRT shimmer. Default EScanlineFlicker.None (static).
    flicker?: EScanlineFlicker;
    // Vertical pitch as a CSS length (Helicon pitch_pixels; default token 3px).
    // A CSS length string, NOT a raw number, so it stays unit-explicit. Omitting
    // it falls through to the --portal-scanline-pitch token default.
    pitch?: string;
    // Per-line layer opacity in [0, 1] (Helicon alpha; default token ~0.06). Kept
    // low so underlying text stays AA-legible. Omitting it falls through to the
    // --portal-scanline-alpha token default.
    opacity?: number;
}> &
    Toned;
