import type { JSAnimation, Timeline } from 'animejs';
import { type RefObject, useEffect, useRef } from 'react';

import { useReducedMotion } from '../hooks/useReducedMotion';
import type { EntrancePreset } from './motionPresets';

// Plays one entrance preset on mount. Captures the animation or timeline and
// reverts it on unmount (idempotent, so React StrictMode's double-invoke cannot
// corrupt state). When reduced motion is on, the element renders its natural
// final state with no animation.
export function useEntranceMotion<ElementType extends HTMLElement>(
    preset: EntrancePreset,
): RefObject<ElementType | null> {
    const ref: RefObject<ElementType | null> = useRef<ElementType | null>(null);
    const prefersReducedMotion: boolean = useReducedMotion();

    useEffect((): (() => void) | undefined => {
        const node: ElementType | null = ref.current;
        if (node === null || prefersReducedMotion) {
            return undefined;
        }
        const animation: JSAnimation | Timeline = preset(node);
        return (): void => {
            animation.revert();
        };
    }, [prefersReducedMotion, preset]);

    return ref;
}
