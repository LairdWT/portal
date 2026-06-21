import type { JSAnimation } from 'animejs';
import { type RefObject, useEffect, useRef } from 'react';

import { useReducedMotion } from '../hooks/useReducedMotion';
import type { MotionPreset } from './motionPresets';

// Plays a preset whenever the tracked value changes, never on first mount. The
// previous value lives in a ref written only inside the effect (never during
// render), so the rules-of-refs hold.
export function useChangeMotion<ElementType extends HTMLElement>(
    value: unknown,
    preset: MotionPreset,
): RefObject<ElementType | null> {
    const elementRef: RefObject<ElementType | null> = useRef<ElementType | null>(
        null,
    );
    const previousValue: RefObject<unknown> = useRef<unknown>(value);
    const prefersReducedMotion: boolean = useReducedMotion();

    useEffect((): (() => void) | undefined => {
        if (previousValue.current === value) {
            return undefined;
        }
        previousValue.current = value;
        const element: ElementType | null = elementRef.current;
        if (element === null || prefersReducedMotion) {
            return undefined;
        }
        const animation: JSAnimation = preset(element);
        return (): void => {
            animation.revert();
        };
    }, [value, prefersReducedMotion, preset]);

    return elementRef;
}
