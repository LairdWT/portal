import {
    act,
    render,
    renderHook,
    type RenderHookResult,
} from '@testing-library/react';
import { createTimeline, type Timeline } from 'animejs';
import { createElement, type ReactElement, type RefObject } from 'react';
import { afterEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import type { StaggerPreset } from './motionPresets';
import { useEntranceOnReady } from './useEntranceOnReady';

let reducedMotion: boolean = false;

vi.mock('../hooks/useReducedMotion', () => ({
    useReducedMotion: (): boolean => reducedMotion,
}));

// A real, fully-typed Timeline that schedules no animation frame (autoplay off).
// play is mocked to a no-op return so asserting on it never starts the loop.
type SpiedTimeline = Readonly<{
    timeline: Timeline;
    pauseSpy: MockInstance<Timeline['pause']>;
    seekSpy: MockInstance<Timeline['seek']>;
    playSpy: MockInstance<Timeline['play']>;
    revertSpy: MockInstance<Timeline['revert']>;
}>;

function buildSpiedTimeline(): SpiedTimeline {
    const timeline: Timeline = createTimeline({ autoplay: false });
    return {
        timeline,
        pauseSpy: vi.spyOn(timeline, 'pause'),
        seekSpy: vi.spyOn(timeline, 'seek'),
        playSpy: vi.spyOn(timeline, 'play').mockReturnValue(timeline),
        revertSpy: vi.spyOn(timeline, 'revert'),
    };
}

function HarnessComponent({
    isReady,
    preset,
}: {
    isReady: boolean;
    preset: StaggerPreset;
}): ReactElement {
    const ref: RefObject<HTMLDivElement | null> =
        useEntranceOnReady<HTMLDivElement>(isReady, preset);
    return createElement('div', { ref });
}

afterEach((): void => {
    reducedMotion = false;
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe('useEntranceOnReady (motion enabled)', (): void => {
    it('builds the paused timeline on mount but does not play until ready', (): void => {
        const spied: SpiedTimeline = buildSpiedTimeline();
        const preset: StaggerPreset = vi.fn((): Timeline => spied.timeline);

        render(createElement(HarnessComponent, { isReady: false, preset }));

        expect(preset).toHaveBeenCalledTimes(1);
        expect(spied.pauseSpy).toHaveBeenCalledTimes(1);
        expect(spied.seekSpy).toHaveBeenCalledWith(0);
        expect(spied.playSpy).not.toHaveBeenCalled();
    });

    it('plays the timeline after isReady flips true', (): void => {
        const spied: SpiedTimeline = buildSpiedTimeline();
        const preset: StaggerPreset = vi.fn((): Timeline => spied.timeline);

        const view: ReturnType<typeof render> = render(
            createElement(HarnessComponent, { isReady: false, preset }),
        );
        act((): void => {
            view.rerender(
                createElement(HarnessComponent, { isReady: true, preset }),
            );
        });

        expect(spied.playSpy).toHaveBeenCalledTimes(1);
    });

    it('returns a ref object', (): void => {
        const spied: SpiedTimeline = buildSpiedTimeline();
        const view: RenderHookResult<
            RefObject<HTMLDivElement | null>,
            unknown
        > = renderHook(
            (): RefObject<HTMLDivElement | null> =>
                useEntranceOnReady<HTMLDivElement>(
                    false,
                    (): Timeline => spied.timeline,
                ),
        );

        expect(view.result.current).toHaveProperty('current');
    });

    it('reverts the timeline on unmount without throwing', (): void => {
        const spied: SpiedTimeline = buildSpiedTimeline();
        const preset: StaggerPreset = vi.fn((): Timeline => spied.timeline);

        const view: ReturnType<typeof render> = render(
            createElement(HarnessComponent, { isReady: false, preset }),
        );

        expect((): void => {
            act((): void => {
                view.unmount();
            });
        }).not.toThrow();
        expect(spied.revertSpy).toHaveBeenCalledTimes(1);
    });
});

describe('useEntranceOnReady (reduced motion)', (): void => {
    it('does not build or play the timeline', (): void => {
        reducedMotion = true;
        const spied: SpiedTimeline = buildSpiedTimeline();
        const preset: StaggerPreset = vi.fn((): Timeline => spied.timeline);

        const view: ReturnType<typeof render> = render(
            createElement(HarnessComponent, { isReady: false, preset }),
        );
        act((): void => {
            view.rerender(
                createElement(HarnessComponent, { isReady: true, preset }),
            );
        });

        expect(preset).not.toHaveBeenCalled();
        expect(spied.playSpy).not.toHaveBeenCalled();
    });
});
