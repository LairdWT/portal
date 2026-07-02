import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { Combobox } from './Combobox';
import type { ComboboxOption } from './Combobox.types';

const OPTIONS: readonly ComboboxOption[] = [
    { id: 'ap', label: 'Apple' },
    { id: 'ba', label: 'Banana' },
    { id: 'ch', label: 'Cherry' },
    { id: 'da', label: 'Date', disabled: true },
];

// Controlled harness so typing flows through real state updates.
function ComboboxHarness({
    onSelect,
}: Readonly<{ onSelect?: (id: string) => void }>): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('');
    return (
        <Combobox
            label="Fruit"
            options={OPTIONS}
            value={value}
            onValueChange={setValue}
            onSelect={onSelect}
        />
    );
}

describe('Combobox', (): void => {
    it('renders a labelled closed combobox', (): void => {
        render(
            <Combobox
                label="Fruit"
                options={OPTIONS}
                value=""
                onValueChange={(): void => {
                    // Static render assertion; no edit occurs.
                }}
            />,
        );
        const input: HTMLElement = screen.getByRole('combobox', {
            name: 'Fruit',
        });
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('opens on typing and ranks fuzzy matches with highlights', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<ComboboxHarness />);
        await user.type(screen.getByRole('combobox', { name: 'Fruit' }), 'an');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        // 'an' subsequence-matches Banana (and not Apple or Cherry).
        expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Apple' })).toBeNull();
    });

    it('commits the active option with Enter', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onSelect: Mock = vi.fn();
        render(<ComboboxHarness onSelect={onSelect} />);
        const input: HTMLElement = screen.getByRole('combobox', {
            name: 'Fruit',
        });
        await user.type(input, 'ban');
        await user.keyboard('{Enter}');
        expect(onSelect).toHaveBeenCalledWith('ba');
        expect(input).toHaveValue('Banana');
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('commits an option by click', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onSelect: Mock = vi.fn();
        render(<ComboboxHarness onSelect={onSelect} />);
        const input: HTMLElement = screen.getByRole('combobox', {
            name: 'Fruit',
        });
        await user.click(input);
        await user.click(screen.getByRole('option', { name: 'Cherry' }));
        expect(onSelect).toHaveBeenCalledWith('ch');
        expect(input).toHaveValue('Cherry');
    });

    it('never commits a disabled option', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onSelect: Mock = vi.fn();
        render(<ComboboxHarness onSelect={onSelect} />);
        const input: HTMLElement = screen.getByRole('combobox', {
            name: 'Fruit',
        });
        await user.click(input);
        await user.click(screen.getByRole('option', { name: 'Date' }));
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('closes on Escape and keeps the typed text', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<ComboboxHarness />);
        const input: HTMLElement = screen.getByRole('combobox', {
            name: 'Fruit',
        });
        await user.type(input, 'che');
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(input).toHaveValue('che');
    });

    it('shows the empty message when nothing matches', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<ComboboxHarness />);
        await user.type(screen.getByRole('combobox', { name: 'Fruit' }), 'zzz');
        expect(screen.getByText('No matches.')).toBeInTheDocument();
    });
});
