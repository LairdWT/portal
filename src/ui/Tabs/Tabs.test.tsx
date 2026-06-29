import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { Tabs } from './Tabs';
import { type TabItem } from './Tabs.types';

const ITEMS: readonly TabItem[] = [
    { id: 'hand', label: 'Hand' },
    { id: 'deck', label: 'Deck' },
    { id: 'discard', label: 'Discard' },
];

// Tabs is a named role (tablist) and now requires an accessible name; the tests
// supply it through `label`.
const LABEL: string = 'Card zones';

describe('Tabs', (): void => {
    it('renders one tab per item by role', (): void => {
        render(<Tabs items={ITEMS} label={LABEL} value="hand" />);

        const tabs: readonly HTMLElement[] = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(ITEMS.length);
    });

    it('names the tablist from label and accepts labelledBy', (): void => {
        const { unmount }: { unmount: () => void } = render(
            <Tabs items={ITEMS} label={LABEL} value="hand" />,
        );
        expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', LABEL);
        unmount();

        render(
            <div>
                <span id="tabs-heading">Card zones</span>
                <Tabs items={ITEMS} labelledBy="tabs-heading" value="hand" />
            </div>,
        );
        expect(screen.getByRole('tablist')).toHaveAttribute(
            'aria-labelledby',
            'tabs-heading',
        );
    });

    it('emits a stable per-tab id and wires aria-controls from item.controls', (): void => {
        const PANEL_ITEMS: readonly TabItem[] = [
            { id: 'hand', label: 'Hand', controls: 'hand-panel' },
            { id: 'deck', label: 'Deck' },
        ];
        render(<Tabs items={PANEL_ITEMS} label={LABEL} value="hand" />);

        const handTab: HTMLElement = screen.getByRole('tab', { name: 'Hand' });
        expect(handTab.id).not.toBe('');
        expect(handTab.id).toContain('hand');
        expect(handTab).toHaveAttribute('aria-controls', 'hand-panel');
        // A tab with no controls omits aria-controls entirely.
        expect(screen.getByRole('tab', { name: 'Deck' })).not.toHaveAttribute(
            'aria-controls',
        );
    });

    it('tracks the controlled value through aria-selected', (): void => {
        render(<Tabs items={ITEMS} label={LABEL} value="deck" />);

        const selected: HTMLElement = screen.getByRole('tab', {
            name: 'Deck',
            selected: true,
        });
        expect(selected).toBeInTheDocument();
        expect(
            screen.getByRole('tab', { name: 'Hand', selected: false }),
        ).toBeInTheDocument();
    });

    it('applies roving tabindex with the selected tab focusable', (): void => {
        render(<Tabs items={ITEMS} label={LABEL} value="deck" />);

        expect(screen.getByRole('tab', { name: 'Deck' })).toHaveAttribute(
            'tabindex',
            '0',
        );
        expect(screen.getByRole('tab', { name: 'Hand' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
        expect(screen.getByRole('tab', { name: 'Discard' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
    });

    it('calls onChange with the id on click', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Tabs items={ITEMS} label={LABEL} value="hand" onChange={onChange} />,
        );

        await user.click(screen.getByRole('tab', { name: 'Deck' }));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('deck');
    });

    it('selects the next tab on ArrowRight', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Tabs items={ITEMS} label={LABEL} value="hand" onChange={onChange} />,
        );

        const firstTab: HTMLElement = screen.getByRole('tab', { name: 'Hand' });
        firstTab.focus();
        await user.keyboard('{ArrowRight}');

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('deck');
    });

    it('wraps to the first tab on ArrowRight from the last', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Tabs
                items={ITEMS}
                label={LABEL}
                value="discard"
                onChange={onChange}
            />,
        );

        screen.getByRole('tab', { name: 'Discard' }).focus();
        await user.keyboard('{ArrowRight}');

        expect(onChange).toHaveBeenCalledWith('hand');
    });

    it('jumps to the first and last tab on Home and End', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Tabs items={ITEMS} label={LABEL} value="deck" onChange={onChange} />,
        );

        const selected: HTMLElement = screen.getByRole('tab', { name: 'Deck' });
        selected.focus();
        await user.keyboard('{End}');
        expect(onChange).toHaveBeenLastCalledWith('discard');

        await user.keyboard('{Home}');
        expect(onChange).toHaveBeenLastCalledWith('hand');
    });

    it('does not change when disabled', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Tabs
                items={ITEMS}
                label={LABEL}
                value="hand"
                onChange={onChange}
                enabled={EEnabledState.Disabled}
            />,
        );

        const deckTab: HTMLElement = screen.getByRole('tab', { name: 'Deck' });
        expect(deckTab).toBeDisabled();

        await user.click(deckTab);
        expect(onChange).not.toHaveBeenCalled();
    });
});
