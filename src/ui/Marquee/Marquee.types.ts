// Public contract for the Marquee ticker.
//
// Marquee is a fixed-height horizontal strip that scrolls its (overflowing)
// content continuously toward the inline-start edge and loops seamlessly with a
// configurable gap between repeats. When the content fits the strip it renders
// statically (no motion). The motion is a pure CSS-transform animation on the
// compositor - never a requestAnimationFrame loop and never per-frame React
// state - and is FULLY reduced-motion gated: under prefers-reduced-motion the
// component degrades to a static, readable, manually-scrollable strip with a
// persistent pause/resume control (WCAG 2.2.2 Pause, Stop, Hide).
//
// The scrolling content is interface-forwarded as `children`: Marquee owns no
// text, item shape, or data - only the clip, the seamless duplication, the
// motion, and the accessibility shell. This mirrors Helicon's marquee(id, text)
// borrowing a &str and owning no app state.

import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type AccessibleName } from '../accessibleName';
import { type EUiStatus, type Toned } from '../tone';

// Scroll direction, expressed in LOGICAL terms so it stays RTL-safe (Helicon
// only scrolls one way; this is a cheap logical enhancement). Start = toward the
// inline-start edge (right-to-left in LTR, Helicon's default). The string value
// doubles as the data-direction attribute the CSS keys its keyframe off.
export const EMarqueeDirection: {
    readonly Start: 'start';
    readonly End: 'end';
} = { Start: 'start', End: 'end' };
export type EMarqueeDirection =
    (typeof EMarqueeDirection)[keyof typeof EMarqueeDirection];

// Play state, surfaced as the data-play-state attribute the CSS reads to set
// animation-play-state, and reported through onPlayStateChange. Internal
// (uncontrolled) by default; see the API note on the controlled-default
// divergence.
export const EMarqueePlayState: {
    readonly Running: 'running';
    readonly Paused: 'paused';
} = { Running: 'running', Paused: 'paused' };
export type EMarqueePlayState =
    (typeof EMarqueePlayState)[keyof typeof EMarqueePlayState];

// Props for the Marquee ticker.
//
// API notes (each a documented decision for the code-review pass):
// - AccessibleName (XOR label | labelledBy) is REQUIRED: the group associates
//   the scrolling content with its pause control and is named for AT.
// - Play state is UNCONTROLLED-internal by default (a useState owned by the
//   component), a deliberate divergence from Portal's controlled-default
//   convention (Tabs/Select). The pause/resume toggle is an intrinsic
//   presentation affordance local to the widget, not application state.
//   onPlayStateChange is offered for observers.
// - speed is px/second, clamped >= 0 (mirrors Helicon's .max(0.0)); 0 => no
//   motion. gap is a CSS length STRING so it stays token-valued (never a literal
//   px in props or CSS).
// - Toned drives the strip border/glow and edge-fade only, NEVER AA-critical
//   text (the text stays --portal-color-text-0 on the dark HUD surface).
export type MarqueeProps = Readonly<{
    /**
     * Interface-forwarded scrolling content. Marquee owns no text/data; it
     * duplicates this subtree for the seamless loop (the clone is aria-hidden).
     */
    children: ReactNode;
    /**
     * Constant scroll speed in CSS px/second (Helicon DEFAULT_SPEED = 60).
     * Clamped to >= 0; 0 => no motion (renders static). Default 60.
     */
    speed?: number;
    /**
     * Inline gap between the end of the content and its next repeat (Helicon
     * DEFAULT_GAP). A token-valued CSS length, NOT a literal px. Default
     * var(--portal-space-6).
     */
    gap?: string;
    direction?: EMarqueeDirection; // default Start (right-to-left in LTR)
    pauseOnHover?: boolean; // default true (Helicon parity)
    pauseOnFocus?: boolean; // default true (a11y add; focus-within)
    /**
     * Initial play state for the persistent pause control (uncontrolled).
     * Default true (Running). Reduced motion forces a non-animated static strip
     * regardless of this value.
     */
    autoPlay?: boolean;
    /**
     * Optional observer of the internal play-state toggle (NOT a controlled
     * value). Lets a consumer mirror the state if it wants.
     */
    onPlayStateChange?: (state: EMarqueePlayState) => void;
    pauseLabel?: string; // pause-button accessible name, default 'Pause ticker'
    resumeLabel?: string; // resume-button accessible name, default 'Resume ticker'
    enabled?: EEnabledState; // resolved via useResolvedEnabled
    status?: EUiStatus; // default EUiStatus.None
}> &
    AccessibleName &
    Toned;
