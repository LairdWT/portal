// Domain-agnostic tone system for the generic UI layer.
//
// A consumer passes `tone` as an OPAQUE CSS color string (hex, oklch(...),
// rgb(...), or a var ref like var(--faction-crimson)). A component applies it to
// the inherited --portal-tone custom property; tone.module.css derives the
// accent/border/glow/fill ramp from it. Portal never enumerates a palette -
// domain meaning is bound entirely consumer-side. No DOM globals, no game types.

import type { CSSProperties } from 'react';

export type Toned = Readonly<{
    /**
     * The per-instance tone, mixed into a component's own props: an OPAQUE CSS
     * color string (hex, `oklch(...)`, `rgb(...)`, or a `var()` reference). The
     * component applies it to the inherited `--portal-tone` custom property and
     * `tone.module.css` derives the accent/border/glow/fill ramp from it.
     * Portal never enumerates a palette - domain meaning is bound consumer-side.
     */
    tone?: string | undefined;
}>;

// Universal (non-domain) status that overrides the tone seed via the data-status
// attribute the tone scope reads. danger/success are not game concepts; they map
// to the portal danger/success tokens.
export const EUiStatus: {
    readonly None: 'none';
    readonly Danger: 'danger';
    readonly Success: 'success';
} = {
    None: 'none',
    Danger: 'danger',
    Success: 'success',
};
export type EUiStatus = (typeof EUiStatus)[keyof typeof EUiStatus];

// String-typed (not a string literal) so the computed key satisfies the
// CSSProperties type, matching the existing --portal-slider-fill pattern.
const TONE_PROPERTY: string = '--portal-tone';

// Build the inline style that sets --portal-tone, omitting the property when no
// tone is supplied (exactOptionalPropertyTypes-safe; the scope default applies).
export function toneProperties(tone?: string): CSSProperties {
    if (tone === undefined) {
        return {};
    }
    const properties: CSSProperties = { [TONE_PROPERTY]: tone };
    return properties;
}

// Typed mirror of the derived tone custom properties, so an R3F material (or a
// consumer bridging to a Unity URP material) can read the SAME tone values and
// keep React and Unity palettes in sync.
export const PORTAL_TONE: {
    readonly accent: 'var(--portal-tone-accent)';
    readonly edge: 'var(--portal-tone-edge)';
    readonly border: 'var(--portal-tone-border)';
    readonly glow: 'var(--portal-tone-glow)';
    readonly glowStrong: 'var(--portal-tone-glow-strong)';
    readonly fill: 'var(--portal-tone-fill)';
    readonly on: 'var(--portal-tone-on)';
} = {
    accent: 'var(--portal-tone-accent)',
    edge: 'var(--portal-tone-edge)',
    border: 'var(--portal-tone-border)',
    glow: 'var(--portal-tone-glow)',
    glowStrong: 'var(--portal-tone-glow-strong)',
    fill: 'var(--portal-tone-fill)',
    on: 'var(--portal-tone-on)',
};
