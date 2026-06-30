import type { Timeline } from 'animejs';
import { type RefObject, useEffect, useRef } from 'react';

import { useReducedMotion } from '../hooks/useReducedMotion';
import type { StaggerPreset } from './motionPresets';

// Builds a paused entrance timeline on mount, so its targets sit pre-positioned
// at the start offset (no snap), then plays it once isReady turns true. Reverts
// on unmount. When reduced motion is on, nothing is built or moved, so the
// elements render their natural final state.
export function useEntranceOnReady<ElementType extends HTMLElement>(
    isReady: boolean,
    preset: StaggerPreset,
): RefObject<ElementType | null> {
    const ref: RefObject<ElementType | null> = useRef<ElementType | null>(null);
    const timelineRef: RefObject<Timeline | null> = useRef<Timeline | null>(null);
    const prefersReducedMotion: boolean = useReducedMotion();
    // Mirror the latest readiness so the build effect can play immediately when it
    // re-runs after readiness has already flipped true (the play-on-transition
    // effect below would not re-fire because isReady did not change). Synced in a
    // dedicated effect (refs must not be written during render) and declared before
    // the build effect so a same-commit readiness change is visible to the rebuild.
    const isReadyRef: RefObject<boolean> = useRef<boolean>(isReady);
    useEffect((): void => {
        isReadyRef.current = isReady;
    }, [isReady]);

    useEffect((): (() => void) | undefined => {
        const node: ElementType | null = ref.current;
        if (node === null || prefersReducedMotion) {
            return undefined;
        }
        const timeline: Timeline = preset(node);
        timeline.pause();
        timeline.seek(0);
        timelineRef.current = timeline;
        // A rebuild after readiness (e.g. reduce-motion toggled on->off, or a
        // preset change while already ready) must not leave the fresh timeline
        // stuck paused at its start offset; play it now since the transition
        // effect will not re-run on an unchanged isReady.
        if (isReadyRef.current) {
            timeline.play();
        }
        return (): void => {
            timeline.revert();
            timelineRef.current = null;
        };
    }, [prefersReducedMotion, preset]);

    useEffect((): void => {
        if (!isReady) {
            return;
        }
        timelineRef.current?.play();
    }, [isReady]);

    return ref;
}
