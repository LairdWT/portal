import {
    fireEvent,
    render,
    type RenderResult,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { ERadialAction, type RadialItem } from './Radial.types';
import { RadialMenu } from './RadialMenu';

const ITEMS: readonly RadialItem[] = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Bravo' },
    { id: 'c', label: 'Charlie' },
    { id: 'd', label: 'Delta' },
    { id: 'e', label: 'Echo' },
    { id: 'f', label: 'Foxtrot' },
    { id: 'g', label: 'Golf' },
    { id: 'h', label: 'Hotel' },
];

function noop(): void {
    // Intentionally empty: a stand-in handler where the call is not asserted.
}

// jsdom has no AnimationEvent constructor, so fireEvent.animationEnd drops
// the animationName; build a plain bubbling event and pin the name on it.
function fireAnimationEnd(target: HTMLElement, animationName: string): void {
    const event: Event = new Event('animationend', { bubbles: true });
    Object.defineProperty(event, 'animationName', { value: animationName });
    fireEvent(target, event);
}

afterEach((): void => {
    document.body.innerHTML = '';
});

describe('RadialMenu', (): void => {
    it('renders nothing while closed', (): void => {
        render(
            <RadialMenu
                open={false}
                onClose={noop}
                label="Actions"
                items={ITEMS}
                onSelect={noop}
            />,
        );
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renders a labelled modal with one section button per side', (): void => {
        render(
            <RadialMenu
                open
                onClose={noop}
                label="Actions"
                items={ITEMS}
                onSelect={noop}
                sides={4}
            />,
        );
        const dialog: HTMLElement = screen.getByRole('dialog', {
            name: 'Actions',
        });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delta' })).toBeInTheDocument();
        // The 5th item is beyond a 4-sided ring, so it is not rendered.
        expect(screen.queryByRole('button', { name: 'Echo' })).toBeNull();
    });

    it('selects a section by id and closes by default', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onSelect: Mock = vi.fn();
        const onClose: Mock = vi.fn();
        render(
            <RadialMenu
                open
                onClose={onClose}
                label="Actions"
                items={ITEMS}
                onSelect={onSelect}
                sides={4}
            />,
        );
        await user.click(screen.getByRole('button', { name: 'Bravo' }));
        expect(onSelect).toHaveBeenCalledWith('b');
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('keeps open on select when closeOnSelect is false', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onClose: Mock = vi.fn();
        render(
            <RadialMenu
                open
                onClose={onClose}
                label="Actions"
                items={ITEMS}
                onSelect={noop}
                sides={4}
                closeOnSelect={false}
            />,
        );
        await user.click(screen.getByRole('button', { name: 'Alpha' }));
        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders only the requested center actions in the hub', (): void => {
        render(
            <RadialMenu
                open
                onClose={noop}
                label="Actions"
                items={ITEMS}
                onSelect={noop}
                centerActions={[ERadialAction.Confirm, ERadialAction.Cancel]}
            />,
        );
        expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    });

    it('fires onCenterAction and closes when cancel is pressed', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onCenterAction: Mock = vi.fn();
        const onClose: Mock = vi.fn();
        render(
            <RadialMenu
                open
                onClose={onClose}
                label="Actions"
                items={ITEMS}
                onSelect={noop}
                centerActions={[ERadialAction.Confirm, ERadialAction.Cancel]}
                onCenterAction={onCenterAction}
            />,
        );
        await user.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onCenterAction).toHaveBeenCalledWith(ERadialAction.Cancel);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('collapses through a closing state and unmounts when the exit animation ends', (): void => {
        const view: RenderResult = render(
            <RadialMenu
                open
                onClose={noop}
                label="Actions"
                items={ITEMS}
                onSelect={noop}
                sides={4}
            />,
        );
        const dialog: HTMLElement = screen.getByRole('dialog', {
            name: 'Actions',
        });
        expect(dialog.getAttribute('data-state')).toBe('open');

        view.rerender(
            <RadialMenu
                open={false}
                onClose={noop}
                label="Actions"
                items={ITEMS}
                onSelect={noop}
                sides={4}
            />,
        );
        // Still mounted: the wedges play the inward collapse first.
        expect(dialog.getAttribute('data-state')).toBe('closing');

        // An unrelated animation (e.g. a re-run entrance) must not unmount it.
        fireAnimationEnd(dialog, 'portal-radial-section-in');
        expect(screen.getByRole('dialog', { name: 'Actions' })).toBe(dialog);

        // The exit animation ending settles the surface to closed. CSS
        // modules scope the keyframe name, so the component matches by
        // inclusion; the scoped name always contains the raw one.
        fireAnimationEnd(dialog, 'portal-radial-section-out');
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renders an icon-only section as a glyph key named by its label', (): void => {
        const iconItems: readonly RadialItem[] = [
            {
                id: 'a',
                label: 'Alpha',
                icon: <span data-testid="alpha-icon" />,
                iconOnly: true,
            },
            // No icon supplied: iconOnly is ignored so the wedge never
            // renders empty.
            { id: 'b', label: 'Bravo', iconOnly: true },
            { id: 'c', label: 'Charlie' },
            { id: 'd', label: 'Delta' },
        ];
        render(
            <RadialMenu
                open
                onClose={noop}
                label="Actions"
                items={iconItems}
                onSelect={noop}
                sides={4}
            />,
        );
        const alpha: HTMLElement = screen.getByRole('button', { name: 'Alpha' });
        expect(alpha.textContent).not.toContain('Alpha');
        expect(screen.getByTestId('alpha-icon')).toBeInTheDocument();
        const bravo: HTMLElement = screen.getByRole('button', { name: 'Bravo' });
        expect(bravo.textContent).toContain('Bravo');
    });

    it('marks the activated section so the collapse can flash it', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <RadialMenu
                open
                onClose={noop}
                label="Actions"
                items={ITEMS}
                onSelect={noop}
                sides={4}
            />,
        );
        const alpha: HTMLElement = screen.getByRole('button', { name: 'Alpha' });
        expect(alpha.getAttribute('data-activated')).toBeNull();
        await user.click(alpha);
        expect(alpha.getAttribute('data-activated')).toBe('true');
        // Only the activated target carries the marker.
        expect(
            screen
                .getByRole('button', { name: 'Bravo' })
                .getAttribute('data-activated'),
        ).toBeNull();
    });

    it('renders no hub buttons when no center actions are requested', (): void => {
        render(
            <RadialMenu
                open
                onClose={noop}
                label="Actions"
                items={ITEMS}
                onSelect={noop}
                sides={4}
            />,
        );
        // Only the four section wedges are interactive; the 0-action hub is a
        // non-interactive panel.
        expect(screen.getAllByRole('button')).toHaveLength(4);
        expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
    });

    it('dedupes repeated center actions', (): void => {
        render(
            <RadialMenu
                open
                onClose={noop}
                label="Actions"
                items={ITEMS}
                onSelect={noop}
                centerActions={[
                    ERadialAction.Confirm,
                    ERadialAction.Confirm,
                    ERadialAction.Cancel,
                ]}
            />,
        );
        expect(screen.getAllByRole('button', { name: 'Confirm' })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name: 'Cancel' })).toHaveLength(1);
    });

    it('pages items with the center next/previous actions, wrapping', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <RadialMenu
                open
                onClose={noop}
                label="Actions"
                items={ITEMS}
                onSelect={noop}
                sides={4}
                centerActions={[ERadialAction.Previous, ERadialAction.Next]}
            />,
        );
        // Page one: the first four items.
        expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Echo' })).toBeNull();

        await user.click(screen.getByRole('button', { name: 'Next' }));
        expect(screen.getByRole('button', { name: 'Echo' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Alpha' })).toBeNull();

        // Next from the last page wraps to page one.
        await user.click(screen.getByRole('button', { name: 'Next' }));
        expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();

        // Previous wraps backwards to the last page.
        await user.click(screen.getByRole('button', { name: 'Previous' }));
        expect(screen.getByRole('button', { name: 'Echo' })).toBeInTheDocument();
    });

    it('renders the collapsed collapsible form as a persistent hub toggle', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onOpen: Mock = vi.fn();
        render(
            <RadialMenu
                collapsible
                open={false}
                onOpen={onOpen}
                onClose={noop}
                label="Quick actions"
                items={ITEMS}
                onSelect={noop}
                sides={4}
                centerActions={[ERadialAction.Confirm]}
            />,
        );
        // Collapsed: no modal dialog and no wedges - just the named toggle.
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Alpha' })).toBeNull();
        const toggle: HTMLElement = screen.getByRole('button', {
            name: 'Quick actions',
        });
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        await user.click(toggle);
        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('expands the collapsible form into wedges around the action cells', (): void => {
        render(
            <RadialMenu
                collapsible
                open
                onOpen={noop}
                onClose={noop}
                label="Quick actions"
                items={ITEMS}
                onSelect={noop}
                sides={4}
                centerActions={[ERadialAction.Confirm]}
            />,
        );
        // Open with actions: wedges and cells, no toggle, and the surface is
        // a non-modal group (never a dialog).
        expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Quick actions' })).toBeNull();
        expect(
            screen.getByRole('group', { name: 'Quick actions' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('keeps the expanded toggle when no center actions are configured', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onClose: Mock = vi.fn();
        render(
            <RadialMenu
                collapsible
                open
                onOpen={noop}
                onClose={onClose}
                label="Quick actions"
                items={ITEMS}
                onSelect={noop}
                sides={4}
            />,
        );
        const toggle: HTMLElement = screen.getByRole('button', {
            name: 'Quick actions',
        });
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        await user.click(toggle);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('dismisses on the Escape key', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onClose: Mock = vi.fn();
        render(
            <RadialMenu
                open
                onClose={onClose}
                label="Actions"
                items={ITEMS}
                onSelect={noop}
            />,
        );
        await user.keyboard('{Escape}');
        await waitFor((): void => {
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
