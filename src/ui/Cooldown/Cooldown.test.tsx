import { act, render, screen } from '@testing-library/react';
import { type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { Cooldown } from './Cooldown';

// Mutable reduced-motion flag the mocked hook reads (the Progress/Popover
// pattern). Hoisted so the vi.mock factory may reference it.
const reducedMotion: { value: boolean } = vi.hoisted((): { value: boolean } => ({
    value: false,
}));

vi.mock('../../react/hooks/useReducedMotion', () => ({
    useReducedMotion: (): boolean => reducedMotion.value,
}));

// Mirrors the component's completion backstop: jsdom plays no CSS animation,
// so a full-motion countdown settles by the fallback timer, never
// animationend.
const FALLBACK_HEADROOM_MS: number = 400;

type CompleteCallback = () => void;

beforeEach((): void => {
    reducedMotion.value = false;
    vi.useFakeTimers();
});

afterEach((): void => {
    vi.useRealTimers();
});

describe('Cooldown', (): void => {
    it('renders the cooling timer over its children', (): void => {
        render(
            <Cooldown label="Blink cooldown" durationMs={8000} remainingMs={8000}>
                <span>Q</span>
            </Cooldown>,
        );
        const timer: HTMLElement = screen.getByRole('timer', {
            name: 'Blink cooldown',
        });
        expect(timer).toHaveAttribute('data-state', 'cooling');
        expect(screen.getByText('Q')).toBeInTheDocument();
    });

    it('mounts already-ready without a scrim and never reports completion', (): void => {
        const handleComplete: Mock<CompleteCallback> = vi.fn<CompleteCallback>();
        const view: { container: HTMLElement } = render(
            <Cooldown
                label="Blink cooldown"
                durationMs={8000}
                remainingMs={0}
                onComplete={handleComplete}
            >
                <span>Q</span>
            </Cooldown>,
        );
        expect(screen.getByRole('timer')).toHaveAttribute('data-state', 'ready');
        expect(view.container.querySelector('[aria-hidden="true"]')).toBeNull();
        act((): void => {
            vi.advanceTimersByTime(10000);
        });
        expect(handleComplete).not.toHaveBeenCalled();
    });

    it('completes exactly once via the backstop under full motion', (): void => {
        const handleComplete: Mock<CompleteCallback> = vi.fn<CompleteCallback>();
        render(
            <Cooldown
                label="Blink cooldown"
                durationMs={8000}
                remainingMs={3000}
                onComplete={handleComplete}
            >
                <span>Q</span>
            </Cooldown>,
        );
        act((): void => {
            vi.advanceTimersByTime(3000 + FALLBACK_HEADROOM_MS);
        });
        expect(handleComplete).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('timer')).toHaveAttribute('data-state', 'ready');
        act((): void => {
            vi.advanceTimersByTime(10000);
        });
        expect(handleComplete).toHaveBeenCalledTimes(1);
    });

    it('re-arms when the controlled inputs change', (): void => {
        const handleComplete: Mock<CompleteCallback> = vi.fn<CompleteCallback>();
        const view: {
            rerender: (element: ReactElement) => void;
        } = render(
            <Cooldown
                label="Blink cooldown"
                durationMs={8000}
                remainingMs={1000}
                onComplete={handleComplete}
            >
                <span>Q</span>
            </Cooldown>,
        );
        act((): void => {
            vi.advanceTimersByTime(1000 + FALLBACK_HEADROOM_MS);
        });
        expect(handleComplete).toHaveBeenCalledTimes(1);
        view.rerender(
            <Cooldown
                label="Blink cooldown"
                durationMs={8000}
                remainingMs={2000}
                onComplete={handleComplete}
            >
                <span>Q</span>
            </Cooldown>,
        );
        expect(screen.getByRole('timer')).toHaveAttribute('data-state', 'cooling');
        act((): void => {
            vi.advanceTimersByTime(2000 + FALLBACK_HEADROOM_MS);
        });
        expect(handleComplete).toHaveBeenCalledTimes(2);
    });

    it('clamps remaining time to the duration', (): void => {
        const handleComplete: Mock<CompleteCallback> = vi.fn<CompleteCallback>();
        render(
            <Cooldown
                label="Blink cooldown"
                durationMs={4000}
                remainingMs={8000}
                onComplete={handleComplete}
            >
                <span>Q</span>
            </Cooldown>,
        );
        act((): void => {
            vi.advanceTimersByTime(4000 + FALLBACK_HEADROOM_MS);
        });
        expect(handleComplete).toHaveBeenCalledTimes(1);
    });

    it('counts down numerically under reduced motion', (): void => {
        reducedMotion.value = true;
        const handleComplete: Mock<CompleteCallback> = vi.fn<CompleteCallback>();
        render(
            <Cooldown
                label="Blink cooldown"
                durationMs={8000}
                remainingMs={3000}
                onComplete={handleComplete}
            >
                <span>Q</span>
            </Cooldown>,
        );
        expect(screen.getByText('3s')).toBeInTheDocument();
        act((): void => {
            vi.advanceTimersByTime(1000);
        });
        expect(screen.getByText('2s')).toBeInTheDocument();
        act((): void => {
            vi.advanceTimersByTime(2000);
        });
        expect(handleComplete).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('timer')).toHaveAttribute('data-state', 'ready');
    });
});
