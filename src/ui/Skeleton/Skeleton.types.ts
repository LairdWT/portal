// Public contract for Skeleton: a domain-agnostic, non-interactive loading
// placeholder for the generic UI layer. It paints a low-contrast machined
// block (its own neutral --portal-skeleton-* fill, NOT the tone ramp) while
// real content loads.
//
// a11y model (decide-and-document): a skeleton is DECORATIVE by default, so the
// visual nodes are aria-hidden and the whole element is removed from the
// accessibility tree. Passing `label` opts into an announced loading state: the
// root becomes a single polite live region (role="status", aria-busy="true")
// and a visually-hidden copy of `label` is the only thing a screen reader
// reads, so the decorative bars never reach assistive tech. Default =
// aria-hidden decorative; opt-in = role=status busy. This is the recommended
// default because most skeletons sit beside a heading or region that already
// owns the loading semantics.
//
// Skeleton is non-interactive: no `enabled`, no focus target, no keyboard
// model, no pointer handling. Both animations are pure CSS gated behind
// prefers-reduced-motion, with the static muted block as the reduced-motion
// fallback.

// The geometry variant. Modeled as an E-prefixed annotated const-object enum (a
// bare `as const` is rejected by @typescript-eslint/typedef); the kebab values
// double as the data-variant attribute the CSS keys off. Text is N stacked
// bars (a shorter last bar); Block is a single beveled rectangle; Circle is a
// single decorative circular marker (the one allowed circular decoration - it
// never carries AA-critical text).
export const ESkeletonVariant: {
    readonly Text: 'text';
    readonly Block: 'block';
    readonly Circle: 'circle';
} = {
    Text: 'text',
    Block: 'block',
    Circle: 'circle',
};
export type ESkeletonVariant =
    (typeof ESkeletonVariant)[keyof typeof ESkeletonVariant];

// The animation mode. Shimmer is a moving --portal-* sheen gradient (default);
// Pulse is an opacity breathing loop; None is a fully static block. The kebab
// values double as the data-animation attribute the CSS keys off. BOTH Shimmer
// and Pulse animate only inside the prefers-reduced-motion: no-preference
// query; under reduced motion every mode degrades to the same static muted
// block.
export const ESkeletonAnimation: {
    readonly Shimmer: 'shimmer';
    readonly Pulse: 'pulse';
    readonly None: 'none';
} = {
    Shimmer: 'shimmer',
    Pulse: 'pulse',
    None: 'none',
};
export type ESkeletonAnimation =
    (typeof ESkeletonAnimation)[keyof typeof ESkeletonAnimation];

// Props for Skeleton.
//
//   - `variant` selects the geometry (default Block).
//   - `width` / `height` are opaque CSS size strings (e.g. '12rem', '100%',
//     '2ch') applied inline. For Block/Circle they size the painted node; for
//     Text, `width` sizes the bar column and `height` sizes each bar. Omitted
//     dimensions fall back to the per-variant CSS defaults.
//   - `radius` is an optional opaque CSS length overriding the corner radius
//     (e.g. a custom avatar rounding). Ignored shape-wise for Circle, which is
//     always fully round.
//   - `lines` (Text only) is the stacked bar count (default 3, floored to 1);
//     the final bar renders shorter to suggest a ragged paragraph end. Ignored
//     for Block/Circle.
//   - `animation` selects the motion mode (default Shimmer).
//   - `label`, when set, opts into the announced loading state: the root
//     becomes role="status" aria-busy="true" with a visually-hidden copy of
//     `label`. When omitted, the root is aria-hidden decorative.
export type SkeletonProps = Readonly<{
    variant?: ESkeletonVariant;
    width?: string;
    height?: string;
    radius?: string;
    lines?: number;
    animation?: ESkeletonAnimation;
    label?: string;
}>;
