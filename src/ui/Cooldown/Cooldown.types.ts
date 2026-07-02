import { type ReactNode } from 'react';

import { type Toned } from '../tone';

// Props for the Cooldown: a radial sweep overlay wrapping arbitrary children
// (an ability key, a hotbar tile) that unwinds clockwise as the cooldown
// elapses and reports completion once.
//
// The component is CONTROLLED by (durationMs, remainingMs) sampled at render:
// the CSS animation (or, under reduced motion, a one-second countdown tick)
// carries the remainder autonomously, so the consumer does not re-render per
// frame. Changing either prop re-arms the sweep from the new remaining time.
// Re-triggering with IDENTICAL values (casting the same ability again) is a
// remount concern: key the component by the cast instance.
//
// The scrim never intercepts input (pointer-events: none) - disabling the
// wrapped control while cooling is the consumer's contract.
export type CooldownProps = Readonly<{
    /**
     * Accessible name for the role=timer wrapper.
     */
    label: string;
    /**
     * Total cooldown length in milliseconds. Non-positive reads as ready.
     */
    durationMs: number;
    /**
     * Remaining time in milliseconds at this render, clamped into
     * [0, durationMs]. Non-positive reads as ready.
     */
    remainingMs: number;
    /**
     * Fired exactly once when a LIVE countdown reaches zero (mounting
     * already-ready never fires it).
     */
    onComplete?: (() => void) | undefined;
    children: ReactNode;
}> &
    Toned;
