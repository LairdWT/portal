import { render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { Breadcrumb, defaultOverflowLabel } from './Breadcrumb';
import { type BreadcrumbItem } from './Breadcrumb.types';

type NavigateHandler = (id: string, index: number) => void;

const ITEMS: readonly BreadcrumbItem[] = [
    { id: 'home', label: 'Home' },
    { id: 'reports', label: 'Reports' },
    { id: 'q3', label: 'Q3' },
];

const LONG_ITEMS: readonly BreadcrumbItem[] = [
    { id: 'root', label: 'Root' },
    { id: 'alpha', label: 'Alpha' },
    { id: 'bravo', label: 'Bravo' },
    { id: 'charlie', label: 'Charlie' },
    { id: 'delta', label: 'Delta' },
    { id: 'echo', label: 'Echo' },
    { id: 'leaf', label: 'Leaf' },
];

describe('Breadcrumb', (): void => {
    it('renders the navigation landmark, ordered list, and ancestor buttons', (): void => {
        render(<Breadcrumb items={ITEMS} onNavigate={vi.fn<NavigateHandler>()} />);

        expect(
            screen.getByRole('navigation', { name: 'Breadcrumb' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('list')).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(ITEMS.length);
        expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Reports' })).toBeInTheDocument();
    });

    it('overrides the landmark name with a custom label', (): void => {
        render(
            <Breadcrumb
                items={ITEMS}
                onNavigate={vi.fn<NavigateHandler>()}
                label="Folder path"
            />,
        );

        expect(
            screen.getByRole('navigation', { name: 'Folder path' }),
        ).toBeInTheDocument();
    });

    it('renders the last crumb as the inert current node', (): void => {
        render(<Breadcrumb items={ITEMS} onNavigate={vi.fn<NavigateHandler>()} />);

        const current: HTMLElement = screen.getByText('Q3');
        expect(current).toHaveAttribute('aria-current', 'page');
        expect(current).toHaveAttribute('data-state', 'current');
        expect(current.tagName).toBe('SPAN');
        expect(screen.queryByRole('button', { name: 'Q3' })).toBeNull();
    });

    it('fires the item handler before the aggregate handler with id and index', async (): Promise<void> => {
        const order: string[] = [];
        const itemNav: Mock<() => void> = vi.fn<() => void>((): void => {
            order.push('item');
        });
        const aggregate: Mock<NavigateHandler> = vi.fn<NavigateHandler>(
            (): void => {
                order.push('aggregate');
            },
        );
        const items: readonly BreadcrumbItem[] = [
            { id: 'home', label: 'Home', onNavigate: itemNav },
            { id: 'reports', label: 'Reports' },
            { id: 'q3', label: 'Q3' },
        ];
        const user: UserEvent = userEvent.setup();
        render(<Breadcrumb items={items} onNavigate={aggregate} />);

        await user.click(screen.getByRole('button', { name: 'Home' }));

        expect(itemNav).toHaveBeenCalledTimes(1);
        expect(aggregate).toHaveBeenCalledTimes(1);
        expect(aggregate).toHaveBeenCalledWith('home', 0);
        expect(order).toEqual(['item', 'aggregate']);
    });

    it('renders an ancestor without a handler as inert text, not a button', (): void => {
        render(
            <Breadcrumb
                items={[
                    { id: 'alpha', label: 'Alpha' },
                    { id: 'beta', label: 'Beta' },
                ]}
            />,
        );

        expect(screen.queryByRole('button')).toBeNull();
        const alpha: HTMLElement = screen.getByText('Alpha');
        expect(alpha.tagName).toBe('SPAN');
        expect(alpha).toHaveAttribute('data-state', 'link');
        expect(screen.getByText('Beta')).toHaveAttribute('aria-current', 'page');
    });

    it('renders decorative separators that are aria-hidden and not list items', (): void => {
        render(<Breadcrumb items={ITEMS} onNavigate={vi.fn<NavigateHandler>()} />);

        const nav: HTMLElement = screen.getByRole('navigation');
        const separators: NodeListOf<Element> = nav.querySelectorAll(
            '[aria-hidden="true"]',
        );
        expect(separators).toHaveLength(ITEMS.length - 1);
        expect(screen.getAllByRole('listitem')).toHaveLength(ITEMS.length);
        expect(within(nav).queryByText('>')).toBeNull();
    });

    it('activates an ancestor with Enter and Space and keeps the current node out of tab order', async (): Promise<void> => {
        const aggregate: Mock<NavigateHandler> = vi.fn<NavigateHandler>();
        const user: UserEvent = userEvent.setup();
        render(<Breadcrumb items={ITEMS} onNavigate={aggregate} />);

        await user.tab();
        const firstCrumb: HTMLElement = screen.getByRole('button', {
            name: 'Home',
        });
        expect(firstCrumb).toHaveFocus();

        await user.keyboard('{Enter}');
        await user.keyboard(' ');
        expect(aggregate).toHaveBeenCalledTimes(2);
        expect(aggregate).toHaveBeenNthCalledWith(1, 'home', 0);

        expect(screen.getByText('Q3').tabIndex).toBe(-1);
    });

    it('disables every crumb and the overflow trigger and fires nothing', async (): Promise<void> => {
        const aggregate: Mock<NavigateHandler> = vi.fn<NavigateHandler>();
        const user: UserEvent = userEvent.setup();
        render(
            <Breadcrumb
                items={LONG_ITEMS}
                onNavigate={aggregate}
                maxVisible={4}
                enabled={EEnabledState.Disabled}
            />,
        );

        const buttons: HTMLElement[] = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
        buttons.forEach((button: HTMLElement): void => {
            expect(button).toBeDisabled();
        });

        await user.click(screen.getByRole('button', { name: 'Root' }));
        expect(aggregate).not.toHaveBeenCalled();
    });

    it('applies the tone seed and status through the scope', (): void => {
        render(
            <Breadcrumb
                items={ITEMS}
                onNavigate={vi.fn<NavigateHandler>()}
                tone="oklch(0.7 0.15 240)"
                status={EUiStatus.Danger}
            />,
        );

        const nav: HTMLElement = screen.getByRole('navigation');
        expect(nav.style.getPropertyValue('--portal-tone')).toBe(
            'oklch(0.7 0.15 240)',
        );
        expect(nav).toHaveAttribute('data-status', 'danger');
    });

    it('collapses the middle and exposes the overflow trigger when maxVisible is set', (): void => {
        render(
            <Breadcrumb
                items={LONG_ITEMS}
                onNavigate={vi.fn<NavigateHandler>()}
                maxVisible={4}
            />,
        );

        expect(screen.getByRole('button', { name: 'Root' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delta' })).toBeInTheDocument();
        expect(screen.getByText('Leaf')).toHaveAttribute('aria-current', 'page');
        expect(screen.queryByText('Alpha')).toBeNull();
        expect(screen.queryByText('Bravo')).toBeNull();
        expect(screen.queryByText('Charlie')).toBeNull();

        const trigger: HTMLElement = screen.getByRole('button', {
            name: defaultOverflowLabel(3),
        });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toHaveAttribute('aria-controls');
    });

    it('opens the overflow panel, navigates a hidden crumb, and closes', async (): Promise<void> => {
        const aggregate: Mock<NavigateHandler> = vi.fn<NavigateHandler>();
        const user: UserEvent = userEvent.setup();
        render(
            <Breadcrumb items={LONG_ITEMS} onNavigate={aggregate} maxVisible={4} />,
        );

        const trigger: HTMLElement = screen.getByRole('button', {
            name: defaultOverflowLabel(3),
        });
        await user.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        const group: HTMLElement = screen.getByRole('group');
        expect(
            within(group).getByRole('button', { name: 'Bravo' }),
        ).toBeInTheDocument();
        expect(
            within(group).getByRole('button', { name: 'Charlie' }),
        ).toBeInTheDocument();

        await user.click(within(group).getByRole('button', { name: 'Alpha' }));
        expect(aggregate).toHaveBeenCalledWith('alpha', 1);
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('group')).toBeNull();
    });

    it('opens the overflow from the keyboard, moves focus into the panel, and activates an item', async (): Promise<void> => {
        const aggregate: Mock<NavigateHandler> = vi.fn<NavigateHandler>();
        const user: UserEvent = userEvent.setup();
        render(
            <Breadcrumb items={LONG_ITEMS} onNavigate={aggregate} maxVisible={4} />,
        );

        const trigger: HTMLElement = screen.getByRole('button', {
            name: defaultOverflowLabel(3),
        });
        trigger.focus();
        await user.keyboard('{Enter}');

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        const group: HTMLElement = screen.getByRole('group');
        const firstHidden: HTMLElement = within(group).getByRole('button', {
            name: 'Alpha',
        });
        expect(firstHidden).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(aggregate).toHaveBeenCalledWith('alpha', 1);
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('group')).toBeNull();
    });

    it('dismisses the open overflow with Escape', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <Breadcrumb
                items={LONG_ITEMS}
                onNavigate={vi.fn<NavigateHandler>()}
                maxVisible={4}
            />,
        );

        const trigger: HTMLElement = screen.getByRole('button', {
            name: defaultOverflowLabel(3),
        });
        await user.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        await user.keyboard('{Escape}');

        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('group')).toBeNull();
    });

    it('renders the landmark and an empty list for empty items', (): void => {
        render(<Breadcrumb items={[]} />);

        expect(
            screen.getByRole('navigation', { name: 'Breadcrumb' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('list')).toBeInTheDocument();
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });
});
