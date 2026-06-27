import { type CSSProperties, type ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Scanlines.module.css';
import {
    EScanlineExtent,
    EScanlineFlicker,
    type ScanlinesProps,
} from './Scanlines.types';

// String-typed (not a string literal) so the computed key satisfies the
// CSSProperties type, matching the established --portal-slider-fill /
// --portal-progress-fill inline custom-property pattern. These mirror the token
// defaults (--portal-scanline-pitch / --portal-scanline-alpha) so a per-instance
// pitch/opacity override resolves through the exact same custom properties the
// stylesheet consumes.
const PITCH_PROPERTY: string = '--portal-scanline-pitch';
const ALPHA_PROPERTY: string = '--portal-scanline-alpha';

// Decorative CRT scanline overlay. A single composited CSS layer (one
// repeating-linear-gradient, zero per-frame work), aria-hidden and
// pointer-events:none so it never enters the a11y tree or intercepts input. The
// optional flicker is gated entirely by the stylesheet's prefers-reduced-motion
// media query (no JS motion read, so the component owns no subscription and needs
// no cleanup). For Contained, place it as the last child of a position:relative
// host so it fills - and is clipped to - that host's box.
export function Scanlines({
    extent = EScanlineExtent.Contained,
    flicker = EScanlineFlicker.None,
    pitch,
    opacity,
    tone,
}: ScanlinesProps): ReactElement {
    // The tone scope resolves --portal-tone-accent for the line color; both
    // class names are always defined, but the filter-join is the established tone
    // scope idiom (Section.tsx) and stays robust if either becomes conditional.
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    // Build the inline style from the tone first, then add the per-instance pitch
    // and opacity custom properties ONLY when supplied. Omitting them entirely
    // (rather than writing undefined) is exactOptionalPropertyTypes-safe and lets
    // the token defaults apply, mirroring toneProperties.
    const style: CSSProperties = {
        ...toneProperties(tone),
        ...(pitch !== undefined ? { [PITCH_PROPERTY]: pitch } : {}),
        ...(opacity !== undefined ? { [ALPHA_PROPERTY]: String(opacity) } : {}),
    };

    return (
        <div
            className={className}
            style={style}
            data-extent={extent}
            data-flicker={flicker}
            data-testid="scanlines"
            aria-hidden="true"
        />
    );
}
