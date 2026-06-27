import { render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ElementSize } from '../../react/hooks/useElementSize';
import { useElementSize } from '../../react/hooks/useElementSize';
import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { Marquee } from './Marquee';
import { EMarqueePlayState } from './Marquee.types';

vi.mock('../../react/hooks/useElementSize', () => ({
    useElementSize: vi.fn<(targetRef: unknown) => ElementSize>(),
}));

vi.mock('../../react/hooks/useReducedMotion', () => ({
    useReducedMotion: vi.fn<() => boolean>(),
}));

const mockUseElementSize: ReturnType<typeof vi.mocked<typeof useElementSize>> =
    vi.mocked(useElementSize);
const mockUseReducedMotion: ReturnType<typeof vi.mocked<typeof useReducedMotion>> =
    vi.mocked(useReducedMotion);

// Each render calls useElementSize three times in order: viewport (strip), the
// first copy, then the gap probe. The modulo cycle maps every render's calls to
// the configured sizes regardless of how many re-renders occur.
function mockSizes(strip: number, copy: number, gap: number): void {
    const widths: readonly number[] = [strip, copy, gap];
    let call: number = 0;
    mockUseElementSize.mockImplementation((): ElementSize => {
        const which: number = call % 3;
        call += 1;
        return { inlineSize: widths[which] ?? 0, blockSize: 0 };
    });
}

const OVERFLOW_TEXT: string = 'A very long status line that overflows the strip';

beforeEach((): void => {
    mockUseReducedMotion.mockReturnValue(false);
    // Default: nothing measured yet (jsdom has no layout) => static path.
    mockSizes(0, 0, 0);
});

afterEach((): void => {
    vi.clearAllMocks();
});

describe('Marquee', (): void => {
    it('renders the forwarded children and names the group via label', (): void => {
        render(<Marquee label="System status ticker">{OVERFLOW_TEXT}</Marquee>);

        expect(
            screen.getByRole('group', { name: 'System status ticker' }),
        ).toBeInTheDocument();
        expect(screen.getByText(OVERFLOW_TEXT)).toBeInTheDocument();
    });

    it('names the group via labelledBy', (): void => {
        render(
            <div>
                <span id="ticker-name">Live feed</span>
                <Marquee labelledBy="ticker-name">{OVERFLOW_TEXT}</Marquee>
            </div>,
        );

        expect(
            screen.getByRole('group', { name: 'Live feed' }),
        ).toBeInTheDocument();
    });

    it('animates overflowing content with an aria-hidden seamless clone', (): void => {
        mockSizes(100, 400, 24);
        render(<Marquee label="Ticker">{OVERFLOW_TEXT}</Marquee>);

        const group: HTMLElement = screen.getByRole('group');
        expect(group).toHaveAttribute('data-overflowing', 'true');

        const copies: readonly HTMLElement[] =
            within(group).getAllByText(OVERFLOW_TEXT);
        expect(copies).toHaveLength(2);
        const hidden: readonly HTMLElement[] = copies.filter(
            (node: HTMLElement): boolean =>
                node.getAttribute('aria-hidden') === 'true',
        );
        expect(hidden).toHaveLength(1);
        expect(group.style.getPropertyValue('--portal-marquee-duration')).not.toBe(
            '',
        );
    });

    it('renders a fitting line statically with no clone, button, or duration', (): void => {
        mockSizes(400, 100, 24);
        render(<Marquee label="Ticker">Short</Marquee>);

        const group: HTMLElement = screen.getByRole('group');
        expect(group).toHaveAttribute('data-overflowing', 'false');
        expect(within(group).getAllByText('Short')).toHaveLength(1);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(group.style.getPropertyValue('--portal-marquee-duration')).toBe('');
    });

    it('toggles the play state and reports it through onPlayStateChange', async (): Promise<void> => {
        mockSizes(100, 400, 24);
        const onPlayStateChange: ReturnType<
            typeof vi.fn<(state: EMarqueePlayState) => void>
        > = vi.fn<(state: EMarqueePlayState) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Marquee label="Ticker" onPlayStateChange={onPlayStateChange}>
                {OVERFLOW_TEXT}
            </Marquee>,
        );

        const button: HTMLElement = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-pressed', 'false');
        expect(button).toHaveAccessibleName('Pause ticker');

        await user.click(button);

        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(button).toHaveAccessibleName('Resume ticker');
        expect(screen.getByRole('group')).toHaveAttribute(
            'data-play-state',
            'paused',
        );
        expect(onPlayStateChange).toHaveBeenCalledTimes(1);
        expect(onPlayStateChange).toHaveBeenCalledWith(EMarqueePlayState.Paused);
    });

    it('starts paused when autoPlay is false', (): void => {
        mockSizes(100, 400, 24);
        render(
            <Marquee label="Ticker" autoPlay={false}>
                {OVERFLOW_TEXT}
            </Marquee>,
        );

        expect(screen.getByRole('group')).toHaveAttribute(
            'data-play-state',
            'paused',
        );
        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('treats a negative speed as no motion (static, no button)', (): void => {
        mockSizes(100, 400, 24);
        render(
            <Marquee label="Ticker" speed={-30}>
                {OVERFLOW_TEXT}
            </Marquee>,
        );

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        const group: HTMLElement = screen.getByRole('group');
        expect(group.style.getPropertyValue('--portal-marquee-duration')).toBe('');
    });

    it('falls back to a static focusable scroll strip under reduced motion', (): void => {
        mockUseReducedMotion.mockReturnValue(true);
        mockSizes(100, 400, 24);
        render(<Marquee label="Ticker">{OVERFLOW_TEXT}</Marquee>);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(
            within(screen.getByRole('group')).getAllByText(OVERFLOW_TEXT),
        ).toHaveLength(1);
        const viewport: HTMLElement | null = screen
            .getByRole('group')
            .querySelector('[data-scrollable="true"]');
        expect(viewport).not.toBeNull();
        expect(viewport).toHaveAttribute('tabindex', '0');
    });

    it('disables the control and does not toggle when disabled', async (): Promise<void> => {
        mockSizes(100, 400, 24);
        const onPlayStateChange: ReturnType<
            typeof vi.fn<(state: EMarqueePlayState) => void>
        > = vi.fn<(state: EMarqueePlayState) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Marquee
                label="Ticker"
                enabled={EEnabledState.Disabled}
                onPlayStateChange={onPlayStateChange}
            >
                {OVERFLOW_TEXT}
            </Marquee>,
        );

        const button: HTMLElement = screen.getByRole('button');
        expect(button).toBeDisabled();

        await user.click(button);
        expect(onPlayStateChange).not.toHaveBeenCalled();
        expect(screen.getByRole('group')).toHaveAttribute(
            'data-enabled',
            'disabled',
        );
    });

    it('exposes tone and status on the root', (): void => {
        render(
            <Marquee
                label="Ticker"
                tone="oklch(0.7 0.18 25)"
                status={EUiStatus.Danger}
            >
                {OVERFLOW_TEXT}
            </Marquee>,
        );

        const group: HTMLElement = screen.getByRole('group');
        expect(group.style.getPropertyValue('--portal-tone')).toBe(
            'oklch(0.7 0.18 25)',
        );
        expect(group).toHaveAttribute('data-status', 'danger');
    });
});
