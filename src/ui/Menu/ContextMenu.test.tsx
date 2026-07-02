import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { type ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { EEnabledState } from '../../state/state';
import { ContextMenu } from './ContextMenu';
import { EMenuNodeKind, type MenuNode } from './Menu.types';

const CONTEXT_ITEMS: readonly MenuNode[] = [
    { kind: EMenuNodeKind.Action, id: 'edit', label: 'Edit' },
    { kind: EMenuNodeKind.Action, id: 'remove', label: 'Remove' },
];

afterEach((): void => {
    document.body.innerHTML = '';
});

type ContextHarnessProps = Readonly<{
    items?: readonly MenuNode[];
    enabled?: EEnabledState;
    onSelect?: (id: string) => void;
}>;

// The trigger is a focusable button rather than a plain div so the keyboard
// affordances (Shift+F10 / ContextMenu key are read off the focused element) and
// the focus-return contract can be exercised against a real activeElement.
function ContextHarness(props: ContextHarnessProps): ReactElement {
    return (
        <ContextMenu
            items={props.items ?? CONTEXT_ITEMS}
            label="Region"
            onSelect={(id: string): void => {
                props.onSelect?.(id);
            }}
            {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
        >
            <button type="button" data-testid="trigger">
                Region
            </button>
        </ContextMenu>
    );
}

describe('ContextMenu', (): void => {
    it('opens on Shift+F10 with focus on the first item', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<ContextHarness />);
        const trigger: HTMLElement = screen.getByTestId('trigger');
        trigger.focus();

        await user.keyboard('{Shift>}{F10}{/Shift}');

        expect(
            await screen.findByRole('menu', { name: 'Region' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    });

    it('opens on the ContextMenu key with focus on the first item', async (): Promise<void> => {
        render(<ContextHarness />);
        const trigger: HTMLElement = screen.getByTestId('trigger');
        trigger.focus();

        fireEvent.keyDown(trigger, { key: 'ContextMenu' });

        expect(
            await screen.findByRole('menu', { name: 'Region' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    });

    // ContextMenu captures the opener at open time and feeds it to
    // MenuSurface's onCloseFocusAnchor (mirroring MenuBar's focusActiveButton),
    // because Popover's own restore effect runs after the MenuList auto-focus
    // has already moved focus into the menu and would snapshot a menu item
    // that is detached by close time.
    it('returns focus to the trigger when Escape closes a keyboard-opened menu', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<ContextHarness />);
        const trigger: HTMLElement = screen.getByTestId('trigger');
        trigger.focus();

        await user.keyboard('{Shift>}{F10}{/Shift}');
        await screen.findByRole('menu', { name: 'Region' });

        await user.keyboard('{Escape}');

        await waitFor((): void => {
            expect(screen.queryByRole('menu', { name: 'Region' })).toBeNull();
        });
        expect(trigger).toHaveFocus();
    });

    it('focuses the first item when opened by the contextmenu pointer event', async (): Promise<void> => {
        render(<ContextHarness />);

        fireEvent.contextMenu(screen.getByTestId('trigger'), {
            clientX: 40,
            clientY: 60,
        });

        expect(
            await screen.findByRole('menu', { name: 'Region' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    });

    it('does not open on Shift+F10 while disabled', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<ContextHarness enabled={EEnabledState.Disabled} />);
        const trigger: HTMLElement = screen.getByTestId('trigger');
        trigger.focus();

        await user.keyboard('{Shift>}{F10}{/Shift}');

        expect(screen.queryByRole('menu', { name: 'Region' })).toBeNull();
    });
});
