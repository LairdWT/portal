import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EUiStatus } from '../tone';
import { Banner } from './Banner';
import { EBannerKind } from './Banner.types';

describe('Banner', (): void => {
    it('renders the message content', (): void => {
        render(<Banner kind={EBannerKind.Info}>Sync complete</Banner>);

        expect(screen.getByText('Sync complete')).toBeInTheDocument();
    });

    it('uses role="status" for low-severity kinds', (): void => {
        render(<Banner kind={EBannerKind.Info}>Heads up</Banner>);

        const banner: HTMLElement = screen.getByRole('status');
        expect(banner).toHaveAttribute('data-kind', EBannerKind.Info);
        expect(banner).toHaveAttribute('data-status', EUiStatus.None);
    });

    it('uses role="alert" for the danger kind', (): void => {
        render(<Banner kind={EBannerKind.Danger}>Hull breach</Banner>);

        const banner: HTMLElement = screen.getByRole('alert');
        expect(banner).toHaveAttribute('data-kind', EBannerKind.Danger);
        expect(banner).toHaveAttribute('data-status', EUiStatus.Danger);
    });

    it('maps the success kind to the success status', (): void => {
        render(<Banner kind={EBannerKind.Success}>Saved</Banner>);

        const banner: HTMLElement = screen.getByRole('status');
        expect(banner).toHaveAttribute('data-kind', EBannerKind.Success);
        expect(banner).toHaveAttribute('data-status', EUiStatus.Success);
    });

    it('maps the warning kind to the no-status seed', (): void => {
        render(<Banner kind={EBannerKind.Warning}>Careful</Banner>);

        const banner: HTMLElement = screen.getByRole('status');
        expect(banner).toHaveAttribute('data-kind', EBannerKind.Warning);
        expect(banner).toHaveAttribute('data-status', EUiStatus.None);
    });

    it('applies the tone style to the root', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(
            <Banner kind={EBannerKind.Info} tone={toneColor}>
                Toned
            </Banner>,
        );

        const banner: HTMLElement = screen.getByRole('status');
        expect(banner.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('renders the icon slot when provided', (): void => {
        render(
            <Banner kind={EBannerKind.Info} icon={<span data-testid="mark" />}>
                With icon
            </Banner>,
        );

        expect(screen.getByTestId('mark')).toBeInTheDocument();
    });

    it('renders no dismiss button without onDismiss', (): void => {
        render(<Banner kind={EBannerKind.Info}>No close</Banner>);

        expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    });

    it('exposes a dismiss button labelled Dismiss and fires onDismiss', async (): Promise<void> => {
        const onDismiss: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Banner kind={EBannerKind.Warning} onDismiss={onDismiss}>
                Dismiss me
            </Banner>,
        );

        const close: HTMLElement = screen.getByRole('button', { name: 'Dismiss' });
        await user.click(close);

        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('activates the dismiss button by keyboard', async (): Promise<void> => {
        const onDismiss: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Banner kind={EBannerKind.Info} onDismiss={onDismiss}>
                Keyboard
            </Banner>,
        );

        const close: HTMLElement = screen.getByRole('button', { name: 'Dismiss' });
        close.focus();
        await user.keyboard('{Enter}');

        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
