import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { Chip } from './Chip';

describe('Chip', (): void => {
    it('renders the label content as text', (): void => {
        render(<Chip label="Crimson">Crimson</Chip>);

        expect(screen.getByText('Crimson')).toBeInTheDocument();
    });

    it('renders no remove button when not removable', (): void => {
        render(<Chip label="Crimson">Crimson</Chip>);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('exposes a remove button named after the label', (): void => {
        const onRemove: Mock<() => void> = vi.fn<() => void>();
        render(
            <Chip label="Crimson" onRemove={onRemove}>
                Crimson
            </Chip>,
        );

        expect(
            screen.getByRole('button', { name: 'Remove Crimson' }),
        ).toBeInTheDocument();
    });

    it('calls onRemove when the remove button is clicked', async (): Promise<void> => {
        const onRemove: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Chip label="Crimson" onRemove={onRemove}>
                Crimson
            </Chip>,
        );

        await user.click(screen.getByRole('button', { name: 'Remove Crimson' }));

        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('activates the remove button on Enter and Space', async (): Promise<void> => {
        const onRemove: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Chip label="Crimson" onRemove={onRemove}>
                Crimson
            </Chip>,
        );

        screen.getByRole('button', { name: 'Remove Crimson' }).focus();
        await user.keyboard('{Enter}');
        await user.keyboard(' ');

        expect(onRemove).toHaveBeenCalledTimes(2);
    });

    it('exposes the labelled chip as a group', (): void => {
        render(<Chip label="Crimson">Crimson</Chip>);

        expect(screen.getByRole('group', { name: 'Crimson' })).toBeInTheDocument();
    });

    it('keeps the chip container non-focusable (removal is via the button)', (): void => {
        const onRemove: Mock<() => void> = vi.fn<() => void>();
        render(
            <Chip label="Crimson" onRemove={onRemove}>
                Crimson
            </Chip>,
        );

        expect(screen.getByLabelText('Crimson')).not.toHaveAttribute('tabindex');
    });

    it('reports the idle state through data-state by default', (): void => {
        render(<Chip label="Crimson">Crimson</Chip>);

        expect(screen.getByLabelText('Crimson')).toHaveAttribute(
            'data-state',
            'idle',
        );
    });

    it('reports the selected state through data-state', (): void => {
        render(
            <Chip label="Crimson" selected>
                Crimson
            </Chip>,
        );

        expect(screen.getByLabelText('Crimson')).toHaveAttribute(
            'data-state',
            'selected',
        );
    });

    it('applies the tone style to the root', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(
            <Chip label="Crimson" tone={toneColor}>
                Crimson
            </Chip>,
        );

        const chip: HTMLElement = screen.getByLabelText('Crimson');
        expect(chip.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('surfaces the status as a data attribute', (): void => {
        render(
            <Chip label="Expired" status={EUiStatus.Danger}>
                Expired
            </Chip>,
        );

        expect(screen.getByLabelText('Expired')).toHaveAttribute(
            'data-status',
            EUiStatus.Danger,
        );
    });

    it('disables removal when disabled', async (): Promise<void> => {
        const onRemove: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Chip
                label="Crimson"
                onRemove={onRemove}
                enabled={EEnabledState.Disabled}
            >
                Crimson
            </Chip>,
        );

        const removeButton: HTMLElement = screen.getByRole('button', {
            name: 'Remove Crimson',
        });
        expect(removeButton).toBeDisabled();

        await user.click(removeButton);
        screen.getByLabelText('Crimson').focus();
        await user.keyboard('{Backspace}');

        expect(onRemove).not.toHaveBeenCalled();
    });
});
