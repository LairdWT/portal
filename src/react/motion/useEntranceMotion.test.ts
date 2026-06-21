import {
    act,
    render,
    renderHook,
    type RenderHookResult,
} from '@testing-library/react';
import { animate, type JSAnimation } from 'animejs';
import { createElement, type ReactElement, type RefObject } from 'react';
import { afterEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import type { EntrancePreset } from './motionPresets';
import { useEntranceMotion } from './useEntranceMotion';

let reducedMotion: boolean = false;

vi.mock('../hooks/useReducedMotion', () => ({
    useReducedMotion: (): boolean => reducedMotion,
}));

// A real, fully-typed JSAnimation that schedules no animation frame (autoplay
// off), so tests exercise the hook's capture/revert wiring without depending on
// the animation loop.
function buildAnimation(): JSAnimation {
    return animate(document.createElement('div'), {
        opacity: [0, 1],
        duration: 1,
        autoplay: false,
    });
}

function HarnessComponent({ preset }: { preset: EntrancePreset }): ReactElement {
    const ref: RefObject<HTMLDivElement | null> =
        useEntranceMotion<HTMLDivElement>(preset);
    return createElement('div', { ref });
}

afterEach((): void => {
    reducedMotion = false;
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe('useEntranceMotion (motion enabled)', (): void => {
    it('plays the preset on mount when the ref is attached', (): void => {
        const preset: EntrancePreset = vi.fn((): JSAnimation => buildAnimation());

        render(createElement(HarnessComponent, { preset }));

        expect(preset).toHaveBeenCalledTimes(1);
    });

    it('returns a ref object', (): void => {
        const view: RenderHookResult<
            RefObject<HTMLDivElement | null>,
            unknown
        > = renderHook(
            (): RefObject<HTMLDivElement | null> =>
                useEntranceMotion<HTMLDivElement>(
                    (): JSAnimation => buildAnimation(),
                ),
        );

        expect(view.result.current).toHaveProperty('current');
    });

    it('reverts the captured animation on unmount without throwing', (): void => {
        const animation: JSAnimation = buildAnimation();
        const revertSpy: MockInstance<JSAnimation['revert']> = vi.spyOn(
            animation,
            'revert',
        );
        const preset: EntrancePreset = vi.fn((): JSAnimation => animation);

        const view: ReturnType<typeof render> = render(
            createElement(HarnessComponent, { preset }),
        );

        expect((): void => {
            act((): void => {
                view.unmount();
            });
        }).not.toThrow();
        expect(revertSpy).toHaveBeenCalledTimes(1);
    });
});

describe('useEntranceMotion (reduced motion)', (): void => {
    it('does not play the preset', (): void => {
        reducedMotion = true;
        const preset: EntrancePreset = vi.fn((): JSAnimation => buildAnimation());

        render(createElement(HarnessComponent, { preset }));

        expect(preset).not.toHaveBeenCalled();
    });
});
