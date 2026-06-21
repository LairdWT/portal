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

    useEffect((): (() => void) | undefined => {
        const node: ElementType | null = ref.current;
        if (node === null || prefersReducedMotion) {
            return undefined;
        }
        const timeline: Timeline = preset(node);
        timeline.pause();
        timeline.seek(0);
        timelineRef.current = timeline;
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
