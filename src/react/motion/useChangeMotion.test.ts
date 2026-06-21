import {
    act,
    render,
    renderHook,
    type RenderHookResult,
} from '@testing-library/react';
import { animate, type JSAnimation } from 'animejs';
import { createElement, type ReactElement, type RefObject } from 'react';
import { afterEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import type { MotionPreset } from './motionPresets';
import { useChangeMotion } from './useChangeMotion';

let reducedMotion: boolean = false;

vi.mock('../hooks/useReducedMotion', () => ({
    useReducedMotion: (): boolean => reducedMotion,
}));

// A real, fully-typed JSAnimation that schedules no animation frame (autoplay
// off), so tests exercise the change-detection and revert wiring without the
// animation loop.
function buildAnimation(): JSAnimation {
    return animate(document.createElement('div'), {
        opacity: [0, 1],
        duration: 1,
        autoplay: false,
    });
}

function HarnessComponent({
    value,
    preset,
}: {
    value: unknown;
    preset: MotionPreset;
}): ReactElement {
    const ref: RefObject<HTMLDivElement | null> = useChangeMotion<HTMLDivElement>(
        value,
        preset,
    );
    return createElement('div', { ref });
}

afterEach((): void => {
    reducedMotion = false;
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe('useChangeMotion (motion enabled)', (): void => {
    it('does not play the preset on first mount', (): void => {
        const preset: MotionPreset = vi.fn((): JSAnimation => buildAnimation());

        render(createElement(HarnessComponent, { value: 0, preset }));

        expect(preset).not.toHaveBeenCalled();
    });

    it('plays the preset when the tracked value changes', (): void => {
        const preset: MotionPreset = vi.fn((): JSAnimation => buildAnimation());

        const view: ReturnType<typeof render> = render(
            createElement(HarnessComponent, { value: 0, preset }),
        );
        act((): void => {
            view.rerender(createElement(HarnessComponent, { value: 1, preset }));
        });

        expect(preset).toHaveBeenCalledTimes(1);
    });

    it('returns a ref object', (): void => {
        const view: RenderHookResult<
            RefObject<HTMLDivElement | null>,
            unknown
        > = renderHook(
            (): RefObject<HTMLDivElement | null> =>
                useChangeMotion<HTMLDivElement>(
                    0,
                    (): JSAnimation => buildAnimation(),
                ),
        );

        expect(view.result.current).toHaveProperty('current');
    });

    it('reverts on unmount without throwing', (): void => {
        const animation: JSAnimation = buildAnimation();
        const revertSpy: MockInstance<JSAnimation['revert']> = vi.spyOn(
            animation,
            'revert',
        );
        const preset: MotionPreset = vi.fn((): JSAnimation => animation);

        const view: ReturnType<typeof render> = render(
            createElement(HarnessComponent, { value: 0, preset }),
        );
        act((): void => {
            view.rerender(createElement(HarnessComponent, { value: 1, preset }));
        });

        expect((): void => {
            act((): void => {
                view.unmount();
            });
        }).not.toThrow();
        expect(revertSpy).toHaveBeenCalledTimes(1);
    });
});

describe('useChangeMotion (reduced motion)', (): void => {
    it('does not play the preset when the value changes', (): void => {
        reducedMotion = true;
        const preset: MotionPreset = vi.fn((): JSAnimation => buildAnimation());

        const view: ReturnType<typeof render> = render(
            createElement(HarnessComponent, { value: 0, preset }),
        );
        act((): void => {
            view.rerender(createElement(HarnessComponent, { value: 1, preset }));
        });

        expect(preset).not.toHaveBeenCalled();
    });
});
