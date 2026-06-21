import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { createElement } from 'react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { SelectionProvider } from '../../react/SelectionProvider';
import { EEnabledState } from '../../state/state';
import { SelectableTile } from './SelectableTile';
import { ESelectionState } from './SelectableTile.types';

const TILE_ID: string = 'unit-7';
const TILE_LABEL: string = 'Select unit 7';

describe('SelectableTile', (): void => {
    it('reflects the Selected state through aria-pressed', (): void => {
        render(
            <SelectableTile
                id={TILE_ID}
                state={ESelectionState.Selected}
                selectionLabel={TILE_LABEL}
            >
                Unit 7
            </SelectableTile>,
        );

        const tile: HTMLElement = screen.getByRole('button', {
            name: TILE_LABEL,
            pressed: true,
        });
        expect(tile).toBeInTheDocument();
    });

    it('is not pressed in the Default state', (): void => {
        render(
            <SelectableTile id={TILE_ID} selectionLabel={TILE_LABEL}>
                Unit 7
            </SelectableTile>,
        );

        const tile: HTMLElement = screen.getByRole('button', {
            name: TILE_LABEL,
            pressed: false,
        });
        expect(tile).toBeInTheDocument();
    });

    it('calls the explicit onSelect on click', async (): Promise<void> => {
        const onSelect: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <SelectableTile
                id={TILE_ID}
                selectionLabel={TILE_LABEL}
                onSelect={onSelect}
            >
                Unit 7
            </SelectableTile>,
        );

        await user.click(screen.getByRole('button', { name: TILE_LABEL }));

        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('falls back to the ambient SelectionContext onSelect with the id', async (): Promise<void> => {
        const onSelect: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            createElement(SelectionProvider, {
                onSelect,
                children: createElement(SelectableTile, {
                    id: TILE_ID,
                    selectionLabel: TILE_LABEL,
                    children: 'Unit 7',
                }),
            }),
        );

        await user.click(screen.getByRole('button', { name: TILE_LABEL }));

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(TILE_ID);
    });

    it('does not select when disabled', async (): Promise<void> => {
        const onSelect: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <SelectableTile
                id={TILE_ID}
                selectionLabel={TILE_LABEL}
                enabled={EEnabledState.Disabled}
                onSelect={onSelect}
            >
                Unit 7
            </SelectableTile>,
        );

        const tile: HTMLElement = screen.getByRole('button', {
            name: TILE_LABEL,
        });
        expect(tile).toBeDisabled();

        await user.click(tile);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('exposes a non-color targetable cue as accessible text', (): void => {
        render(
            <SelectableTile
                id={TILE_ID}
                state={ESelectionState.Targetable}
                selectionLabel={TILE_LABEL}
            >
                Unit 7
            </SelectableTile>,
        );

        const tile: HTMLElement = screen.getByRole('button', {
            name: TILE_LABEL,
        });
        expect(tile).toHaveAccessibleDescription('Targetable');
        expect(tile).toHaveAttribute('data-state', 'targetable');
    });
});
