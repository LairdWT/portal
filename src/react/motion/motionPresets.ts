import { animate, type JSAnimation, type Timeline } from 'animejs';

// The only place anime.js animate is called for Portal motion. Every concrete
// preset animates transform or opacity only (GPU-composited, no reflow) and
// returns its JSAnimation or Timeline so the caller can revert it on unmount.
// v4 API: the `ease` property (not v3 `easing`) and v4 ease names (`outExpo`).

// Layout-agnostic motion durations in milliseconds.
const MOTION_DURATION: {
    readonly fast: 140;
    readonly base: 240;
    readonly slow: 420;
} = {
    fast: 140,
    base: 240,
    slow: 420,
};

export { MOTION_DURATION };

// A preset that animates a single target and returns its JSAnimation.
export type MotionPreset = (target: HTMLElement) => JSAnimation;

// An entrance preset may be a single animation or a multi-target timeline; both
// expose revert() for cleanup.
export type EntrancePreset = (target: HTMLElement) => JSAnimation | Timeline;

// A staggered entrance timeline keyed to a container; the caller decides when to
// play it.
export type StaggerPreset = (container: HTMLElement) => Timeline;

// Brief transform-only rise so an element reads as deliberately presented. No
// opacity fade, so text never passes through a low-contrast translucent state
// mid-entrance.
export function riseIn(target: HTMLElement): JSAnimation {
    return animate(target, {
        translateY: [14, 0],
        duration: MOTION_DURATION.slow,
        ease: 'outExpo',
    });
}

// A changed value pulses to draw the eye without moving layout.
export function pulse(target: HTMLElement): JSAnimation {
    return animate(target, {
        scale: [1, 1.25, 1],
        duration: MOTION_DURATION.base,
        ease: 'inOutQuad',
    });
}
