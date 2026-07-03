import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { EUiStatus } from '../tone';
import { FloatingText } from './FloatingText';
import { type FloatingTextEvent } from './FloatingText.types';

type ExpireCallback = (id: string) => void;

const EVENTS: readonly FloatingTextEvent[] = [
    { id: 'hit-1', text: '128' },
    {
        id: 'hit-2',
        text: 'CRIT 340',
        status: EUiStatus.Danger,
        emphasis: true,
    },
];

beforeEach((): void => {
    vi.useFakeTimers();
});

afterEach((): void => {
    vi.useRealTimers();
});

describe('FloatingText', (): void => {
    it('renders events on an aria-hidden plane', (): void => {
        const view: { container: HTMLElement } = render(
            <FloatingText events={EVENTS} />,
        );
        const plane: Element | null = view.container.querySelector(
            '[aria-hidden="true"]',
        );
        expect(plane).not.toBeNull();
        expect(screen.getByText('128')).toBeInTheDocument();
        const crit: HTMLElement = screen.getByText('CRIT 340');
        expect(crit).toHaveAttribute('data-status', 'danger');
        expect(crit).toHaveAttribute('data-emphasis', 'true');
    });

    it('fans overlapping events across drift lanes', (): void => {
        render(<FloatingText events={EVENTS} />);
        const first: HTMLElement = screen.getByText('128');
        const second: HTMLElement = screen.getByText('CRIT 340');
        expect(first.style.getPropertyValue('--portal-floating-drift')).not.toBe(
            second.style.getPropertyValue('--portal-floating-drift'),
        );
    });

    it('expires exactly once through the backstop timer', (): void => {
        const onExpire: Mock<ExpireCallback> = vi.fn<ExpireCallback>();
        render(
            <FloatingText
                events={[EVENTS[0] ?? { id: 'x', text: 'x' }]}
                onExpire={onExpire}
            />,
        );
        act((): void => {
            vi.advanceTimersByTime(1400);
        });
        expect(onExpire).toHaveBeenCalledTimes(1);
        expect(onExpire).toHaveBeenCalledWith('hit-1');
        // A late animationend after the timer must not double-expire.
        fireEvent.animationEnd(screen.getByText('128'), {
            animationName: 'portal-floating-rise-abc',
        });
        expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('ignores foreign animationend events', (): void => {
        // jsdom cannot carry animationName through a synthesized
        // animationend (the Cooldown lesson: real completion rides the
        // backstop timer here; the animationend fast path is probe
        // territory). A foreign / nameless event must never expire.
        const onExpire: Mock<ExpireCallback> = vi.fn<ExpireCallback>();
        render(
            <FloatingText
                events={[EVENTS[0] ?? { id: 'x', text: 'x' }]}
                onExpire={onExpire}
            />,
        );
        fireEvent.animationEnd(screen.getByText('128'), {
            animationName: 'portal-something-else',
        });
        expect(onExpire).not.toHaveBeenCalled();
        // The backstop still retires the event exactly once.
        act((): void => {
            vi.advanceTimersByTime(1400);
        });
        expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('announces only when opted in', (): void => {
        const silent: { container: HTMLElement; unmount: () => void } = render(
            <FloatingText events={EVENTS} />,
        );
        expect(silent.container.querySelector('[aria-live="polite"]')).toBeNull();
        silent.unmount();

        const spoken: { container: HTMLElement } = render(
            <FloatingText events={EVENTS} announce={true} />,
        );
        const announcer: Element | null = spoken.container.querySelector(
            '[aria-live="polite"]',
        );
        expect(announcer).not.toBeNull();
        expect(announcer?.textContent).toBe('CRIT 340');
    });
});
