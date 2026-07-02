import { render, screen, waitFor } from '@testing-library/react';
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
