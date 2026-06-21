import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { CTA } from './CTA';
import { ECtaSize, ECtaVariant } from './CTA.types';

const CTA_LABEL: string = 'Confirm';

describe('CTA', (): void => {
    it('renders a native button with its label', (): void => {
        render(<CTA>{CTA_LABEL}</CTA>);

        const button: HTMLElement = screen.getByRole('button', {
            name: CTA_LABEL,
        });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('type', 'button');
    });

    it('falls back to the label string for content and aria-label', (): void => {
        render(<CTA label={CTA_LABEL} />);

        const button: HTMLElement = screen.getByRole('button', {
            name: CTA_LABEL,
        });
        expect(button).toHaveTextContent(CTA_LABEL);
        expect(button).toHaveAttribute('aria-label', CTA_LABEL);
    });

    it('calls onClick when enabled', async (): Promise<void> => {
        const onClick: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(<CTA onClick={onClick}>{CTA_LABEL}</CTA>);

        await user.click(screen.getByRole('button', { name: CTA_LABEL }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async (): Promise<void> => {
        const onClick: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <CTA enabled={EEnabledState.Disabled} onClick={onClick}>
                {CTA_LABEL}
            </CTA>,
        );

        const button: HTMLElement = screen.getByRole('button', {
            name: CTA_LABEL,
        });
        expect(button).toBeDisabled();

        await user.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('applies the variant, size, enabled, and status data attributes', (): void => {
        render(
            <CTA
                variant={ECtaVariant.Secondary}
                size={ECtaSize.Lg}
                status={EUiStatus.Danger}
            >
                {CTA_LABEL}
            </CTA>,
        );

        const button: HTMLElement = screen.getByRole('button', {
            name: CTA_LABEL,
        });
        expect(button).toHaveAttribute('data-variant', ECtaVariant.Secondary);
        expect(button).toHaveAttribute('data-size', ECtaSize.Lg);
        expect(button).toHaveAttribute('data-enabled', EEnabledState.Enabled);
        expect(button).toHaveAttribute('data-status', EUiStatus.Danger);
    });

    it('forwards the requested button type', (): void => {
        render(
            <CTA type="submit" label={CTA_LABEL}>
                {CTA_LABEL}
            </CTA>,
        );

        expect(screen.getByRole('button', { name: CTA_LABEL })).toHaveAttribute(
            'type',
            'submit',
        );
    });
});
