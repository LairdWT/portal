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

    it('plays a timeline rebuilt while already ready (reduce-motion toggled off)', (): void => {
        // Mount with reduced motion ON and already ready: nothing is built or
        // played, content shows its natural visible state.
        reducedMotion = true;
        const spied: SpiedTimeline = buildSpiedTimeline();
        const preset: StaggerPreset = vi.fn((): Timeline => spied.timeline);

        const view: ReturnType<typeof render> = render(
            createElement(HarnessComponent, { isReady: true, preset }),
        );
        expect(preset).not.toHaveBeenCalled();
        expect(spied.playSpy).not.toHaveBeenCalled();

        // OS reduce-motion flips OFF while still ready: the build effect re-runs
        // and rebuilds a fresh paused timeline, but the play-on-transition effect
        // does NOT re-fire (isReady unchanged). The rebuilt timeline must still end
        // up playing, not stuck paused at its hidden start offset.
        reducedMotion = false;
        act((): void => {
            view.rerender(
                createElement(HarnessComponent, { isReady: true, preset }),
            );
        });

        expect(preset).toHaveBeenCalledTimes(1);
        expect(spied.playSpy).toHaveBeenCalledTimes(1);
    });

    it('plays a timeline rebuilt on a preset change while already ready', (): void => {
        const first: SpiedTimeline = buildSpiedTimeline();
        const second: SpiedTimeline = buildSpiedTimeline();
        const firstPreset: StaggerPreset = vi.fn((): Timeline => first.timeline);
        const secondPreset: StaggerPreset = vi.fn((): Timeline => second.timeline);

        const view: ReturnType<typeof render> = render(
            createElement(HarnessComponent, { isReady: true, preset: firstPreset }),
        );
        // Ready on mount: the first timeline plays (the build effect plays it since
        // readiness is already true, and the transition effect also fires on mount).
        expect(first.playSpy).toHaveBeenCalled();

        // A new preset identity rebuilds the timeline while isReady stays true; the
        // rebuilt timeline must also play (the transition effect will not re-fire).
        act((): void => {
            view.rerender(
                createElement(HarnessComponent, {
                    isReady: true,
                    preset: secondPreset,
                }),
            );
        });

        expect(second.playSpy).toHaveBeenCalledTimes(1);
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
