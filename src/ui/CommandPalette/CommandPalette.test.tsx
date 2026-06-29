import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { CommandPalette } from './CommandPalette';
import { type Command, ECommandFilterMode } from './CommandPalette.types';

afterEach((): void => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
});

const FLAT_COMMANDS: readonly Command[] = [
    { id: 'one', label: 'Alpha' },
    { id: 'two', label: 'Bravo' },
    { id: 'three', label: 'Charlie' },
];

const RICH_COMMANDS: readonly Command[] = [
    { id: 'file.new', label: 'New File', shortcut: 'Ctrl N', group: 'File' },
    { id: 'file.open', label: 'Open File', group: 'File' },
    { id: 'file.save', label: 'Save', group: 'File' },
    { id: 'edit.find', label: 'Find in File', group: 'Edit' },
    { id: 'view.zoom', label: 'Zoom In', group: 'View' },
];

const DISABLED_COMMANDS: readonly Command[] = [
    { id: 'on-1', label: 'Enabled One' },
    { id: 'off-1', label: 'Disabled One', enabled: EEnabledState.Disabled },
    { id: 'on-2', label: 'Enabled Two' },
];

function makeLargeCorpus(count: number): readonly Command[] {
    const out: Command[] = [];
    for (let index: number = 0; index < count; index += 1) {
        out.push({ id: `cmd-${String(index)}`, label: `Command ${String(index)}` });
    }
    return out;
}

type HarnessProps = Readonly<{
    initialOpen?: boolean;
    initialQuery?: string;
    commands?: readonly Command[];
    recentCommandIds?: readonly string[];
    filterMode?: ECommandFilterMode;
    enabled?: EEnabledState;
    tone?: string;
    label?: string;
    onSelect?: (commandId: string) => void;
    onClose?: () => void;
    onQueryChange?: (query: string) => void;
}>;

function Harness(props: HarnessProps): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(props.initialOpen ?? true);
    const [query, setQuery]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.initialQuery ?? '');

    return (
        <>
            <button type="button">outside</button>
            <CommandPalette
                open={open}
                onClose={(): void => {
                    props.onClose?.();
                    setOpen(false);
                }}
                commands={props.commands ?? FLAT_COMMANDS}
                query={query}
                onQueryChange={(next: string): void => {
                    props.onQueryChange?.(next);
                    setQuery(next);
                }}
                onSelect={(commandId: string): void => {
                    props.onSelect?.(commandId);
                    setOpen(false);
                }}
                label={props.label ?? 'Commands'}
                {...(props.recentCommandIds !== undefined
                    ? { recentCommandIds: props.recentCommandIds }
                    : {})}
                {...(props.filterMode !== undefined
                    ? { filterMode: props.filterMode }
                    : {})}
                {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
                {...(props.tone !== undefined ? { tone: props.tone } : {})}
            />
        </>
    );
}

describe('CommandPalette', (): void => {
    it('renders nothing when closed', (): void => {
        render(<Harness initialOpen={false} />);
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renders a named modal dialog and auto-focuses the combobox', (): void => {
        render(<Harness />);
        const dialog: HTMLElement = screen.getByRole('dialog', {
            name: 'Commands',
        });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        const combobox: HTMLElement = screen.getByRole('combobox');
        expect(combobox).toHaveFocus();
    });

    it('exposes the combobox-with-listbox ARIA wiring', (): void => {
        render(<Harness />);
        const combobox: HTMLElement = screen.getByRole('combobox');
        const listbox: HTMLElement = screen.getByRole('listbox');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        expect(combobox).toHaveAttribute('aria-autocomplete', 'list');
        expect(combobox.getAttribute('aria-controls')).toBe(listbox.id);
    });

    it('filters the rendered options as the query changes (fuzzy default)', async (): Promise<void> => {
        const onQueryChange: Mock<(query: string) => void> =
            vi.fn<(query: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Harness commands={RICH_COMMANDS} onQueryChange={onQueryChange} />);

        await user.type(screen.getByRole('combobox'), 'fin');

        expect(onQueryChange).toHaveBeenCalled();
        expect(
            screen.getByRole('option', { name: 'Find in File' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Zoom In' })).toBeNull();
    });

    it('reproduces Helicon substring parity (label or id match)', (): void => {
        render(
            <Harness
                commands={RICH_COMMANDS}
                filterMode={ECommandFilterMode.Substring}
                initialQuery="file"
            />,
        );
        // "Save" matches via its id (file.save), reproducing matches_query.
        expect(screen.getByRole('option', { name: 'Save' })).toBeInTheDocument();
    });

    it('rejects a non-substring fuzzy query in Substring mode', (): void => {
        render(
            <Harness
                commands={RICH_COMMANDS}
                filterMode={ECommandFilterMode.Substring}
                initialQuery="nf"
            />,
        );
        expect(screen.queryByRole('option')).toBeNull();
        expect(screen.getByText('No matching commands.')).toBeInTheDocument();
    });

    it('moves the activedescendant cursor and activates with Enter', async (): Promise<void> => {
        const onSelect: Mock<(commandId: string) => void> =
            vi.fn<(commandId: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Harness onSelect={onSelect} />);

        const combobox: HTMLElement = screen.getByRole('combobox');
        const first: HTMLElement = screen.getByRole('option', { name: 'Alpha' });
        expect(combobox.getAttribute('aria-activedescendant')).toBe(first.id);

        await user.keyboard('{ArrowDown}');
        const second: HTMLElement = screen.getByRole('option', { name: 'Bravo' });
        expect(combobox.getAttribute('aria-activedescendant')).toBe(second.id);

        await user.keyboard('{Enter}');
        expect(onSelect).toHaveBeenCalledWith('two');
    });

    it('jumps to the first and last option with Home and End', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness />);
        const combobox: HTMLElement = screen.getByRole('combobox');

        await user.keyboard('{End}');
        expect(combobox.getAttribute('aria-activedescendant')).toBe(
            screen.getByRole('option', { name: 'Charlie' }).id,
        );

        await user.keyboard('{Home}');
        expect(combobox.getAttribute('aria-activedescendant')).toBe(
            screen.getByRole('option', { name: 'Alpha' }).id,
        );
    });

    it('calls onClose on Escape and on an outside pointer press', async (): Promise<void> => {
        const onClose: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(<Harness onClose={onClose} />);

        await user.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('dismisses on an outside (backdrop) pointer press', async (): Promise<void> => {
        const onClose: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(<Harness onClose={onClose} />);

        await user.click(screen.getByRole('button', { name: 'outside' }));
        await waitFor((): void => {
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('activates an enabled option on pointer down but ignores a disabled one', (): void => {
        const onSelect: Mock<(commandId: string) => void> =
            vi.fn<(commandId: string) => void>();
        render(<Harness commands={DISABLED_COMMANDS} onSelect={onSelect} />);

        const disabledRow: HTMLElement = screen.getByRole('option', {
            name: 'Disabled One',
        });
        expect(disabledRow).toHaveAttribute('aria-disabled', 'true');
        fireEvent.pointerDown(disabledRow, { button: 0 });
        expect(onSelect).not.toHaveBeenCalled();

        const enabledRow: HTMLElement = screen.getByRole('option', {
            name: 'Enabled One',
        });
        fireEvent.pointerDown(enabledRow, { button: 0 });
        expect(onSelect).toHaveBeenCalledWith('on-1');
    });

    it('skips disabled rows when moving the cursor', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness commands={DISABLED_COMMANDS} />);
        const combobox: HTMLElement = screen.getByRole('combobox');

        // From the first enabled option, ArrowDown lands on the next ENABLED
        // option (skipping the disabled middle row).
        await user.keyboard('{ArrowDown}');
        expect(combobox.getAttribute('aria-activedescendant')).toBe(
            screen.getByRole('option', { name: 'Enabled Two' }).id,
        );
    });

    it('renders group headers and a Recent group at the empty query', (): void => {
        render(
            <Harness commands={RICH_COMMANDS} recentCommandIds={['edit.find']} />,
        );
        const recentHeader: HTMLElement = screen.getByText('Recent');
        expect(recentHeader).toHaveAttribute('role', 'presentation');
        expect(screen.getByText('File')).toHaveAttribute('role', 'presentation');
    });

    it('windows a large corpus to far fewer option nodes than commands', (): void => {
        render(<Harness commands={makeLargeCorpus(5000)} />);
        const options: readonly HTMLElement[] = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
        expect(options.length).toBeLessThan(5000);
    });

    it('shows the empty-corpus placeholder', (): void => {
        render(<Harness commands={[]} />);
        expect(screen.getByText('No commands.')).toBeInTheDocument();
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('disables the whole palette when enabled is Disabled', (): void => {
        render(<Harness enabled={EEnabledState.Disabled} />);
        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('applies the tone custom property to the panel', (): void => {
        render(<Harness tone="oklch(0.7 0.18 25)" />);
        const dialog: HTMLElement = screen.getByRole('dialog');
        expect(dialog.style.getPropertyValue('--portal-tone')).toBe(
            'oklch(0.7 0.18 25)',
        );
    });

    // axe coverage for this component is provided by the Storybook a11y gate
    // (the CommandPalette stories run under addon-a11y in pnpm test:run), per the
    // repo convention shared with Dialog and List.
});
