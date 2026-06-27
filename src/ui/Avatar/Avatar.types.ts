import { type ReactNode } from 'react';

import { type EUiStatus, type Toned } from '../tone';

// EAvatarSize: the token-driven box size. Modeled as an E-prefixed annotated
// const-object enum (a bare `as const` is rejected by @typescript-eslint/typedef
// `variableDeclaration`; native `enum` is banned). The kebab values double as the
// data-size attribute the CSS reads to pick the --portal-avatar-size-* box token.
export const EAvatarSize: {
    readonly Sm: 'sm';
    readonly Md: 'md';
    readonly Lg: 'lg';
} = {
    Sm: 'sm',
    Md: 'md',
    Lg: 'lg',
};
export type EAvatarSize = (typeof EAvatarSize)[keyof typeof EAvatarSize];

// EAvatarShape: the silhouette. Circle is a fully-rounded (border-radius 50%)
// DECORATIVE marker - the project explicitly permits circular avatar markers.
// Bevel is the machined HUD shape: it composes the shared `.beveled` corner
// identity and pairs it with a non-zero --portal-bevel-2 radius (the bevel cut is
// a silent no-op without a radius). The kebab values double as the data-shape
// attribute and select the matching shape class in the CSS.
export const EAvatarShape: {
    readonly Circle: 'circle';
    readonly Bevel: 'bevel';
} = {
    Circle: 'circle',
    Bevel: 'bevel',
};
export type EAvatarShape = (typeof EAvatarShape)[keyof typeof EAvatarShape];

// EAvatarContent: which link of the fallback chain actually rendered. Surfaced to
// CSS through the data-content attribute and asserted in tests, so the resolved
// chain state is a named member set rather than a tangle of booleans. Image = the
// raster loaded and did not error; Initials = name-derived initials; Icon = the
// consumer-supplied generic icon; Glyph = the built-in generic fallback glyph.
export const EAvatarContent: {
    readonly Image: 'image';
    readonly Initials: 'initials';
    readonly Icon: 'icon';
    readonly Glyph: 'glyph';
} = {
    Image: 'image',
    Initials: 'initials',
    Icon: 'icon',
    Glyph: 'glyph',
};
export type EAvatarContent = (typeof EAvatarContent)[keyof typeof EAvatarContent];

// An optional presence indicator drawn as a small dot at the avatar corner.
// `status` seeds the dot color through an ISOLATED tone scope (none -> the theme
// accent, danger/success -> the universal status tokens), so the dot color never
// follows the avatar's own `tone` border and is never the avatar identity color.
// `label` is the REQUIRED visually-hidden text equivalent (for example "Online",
// "Busy"): the dot must carry an accessible text equivalent, never color alone, so
// the type forces the consumer to supply it. EUiStatus is intentionally the only
// color source per the directive; richer presence semantics (away/busy) are mapped
// consumer-side onto status + label (see OPEN DECISIONS).
export type AvatarStatus = Readonly<{
    status: EUiStatus;
    label: string;
}>;

// Props for the Avatar: a static, domain-agnostic identity marker.
//
//   - `src` is the image URL. On a load error (onError) OR when absent, the
//     fallback chain takes over: initials (from `name`) -> `icon` -> generic glyph.
//   - `name` drives both the initials fallback and, by default, the accessible
//     name. Initials are derived by the pure `deriveInitials` helper.
//   - `alt` is the explicit image alt text; it defaults from `name`. When the box
//     renders a fallback, `alt` (then `name`) supplies the role="img" aria-label.
//   - `icon` is a generic fallback node rendered when there is no image and no
//     name-derived initials.
//   - `size` selects the token-driven box size (default Md).
//   - `shape` selects Circle (decorative 50% marker) or Bevel (HUD) (default
//     Circle).
//   - `status` renders the decorative presence dot plus its required hidden label.
//   - `decorative` removes the avatar IDENTITY from the accessibility tree (image
//     alt="" and the fallback box aria-hidden) for the case where a visible name
//     sits beside it; default false, where the box names itself via alt or
//     role="img" + aria-label. (The presence label is independent - see OPEN
//     DECISIONS.)
//   - `tone` flows through the shared tone scope and drives the box border, fill,
//     and glow only, never the AA-critical initials text.
export type AvatarProps = Readonly<{
    src?: string;
    name?: string;
    alt?: string;
    icon?: ReactNode;
    size?: EAvatarSize;
    shape?: EAvatarShape;
    status?: AvatarStatus;
    decorative?: boolean;
}> &
    Toned;

// deriveInitials: pure, explicit-return helper that folds a display name into 1-2
// initial graphemes. Negative-first: an empty/whitespace name yields '' so the
// caller falls through to the icon/glyph link. One word yields its first grapheme;
// multiple words yield the first grapheme of the first and last words. Grapheme
// access goes through Array.from so surrogate-pair and non-Latin code points are
// not split mid-character. Uppercasing is locale-naive toUpperCase (a no-op for
// scripts without case, for example CJK), which is correct and side-effect free.
export function deriveInitials(name: string): string {
    const trimmed: string = name.trim();
    if (trimmed.length === 0) {
        return '';
    }
    const words: readonly string[] = trimmed.split(/\s+/);
    const firstWord: string = words[0] ?? '';
    const firstChar: string = Array.from(firstWord)[0] ?? '';
    if (words.length === 1) {
        return firstChar.toUpperCase();
    }
    const lastWord: string = words[words.length - 1] ?? '';
    const lastChar: string = Array.from(lastWord)[0] ?? '';
    return `${firstChar}${lastChar}`.toUpperCase();
}
