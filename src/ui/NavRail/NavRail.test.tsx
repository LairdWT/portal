import {
    fireEvent,
    render,
    type RenderResult,
    screen,
} from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { NavRail } from './NavRail';
import { type NavRailItem } from './NavRail.types';

const ITEMS: readonly NavRailItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'fleet', label: 'Fleet' },
    { id: 'research', label: 'Research' },
];

const LINK_ITEMS: readonly NavRailItem[] = [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'docs', label: 'Docs', href: '#docs' },
];

// Every render passes an accessible name: the AccessibleName union makes a
// nameless nav landmark a compile error, so the suite always supplies a name
// (label here, with a dedicated labelledBy variant test below).
const NAV_LABEL: string = 'Primary navigation';

describe('NavRail', (): void => {
    it('renders a navigation landmark with the accessible name', (): void => {
        render(<NavRail items={ITEMS} active="fleet" label={NAV_LABEL} />);

        expect(
            screen.getByRole('navigation', { name: NAV_LABEL }),
        ).toBeInTheDocument();
    });

    it('wires label to aria-label on the nav landmark', (): void => {
        render(<NavRail items={ITEMS} active="fleet" label={NAV_LABEL} />);

        expect(screen.getByRole('navigation')).toHaveAttribute(
            'aria-label',
            NAV_LABEL,
        );
    });

    it('names the landmark through labelledBy when provided', (): void => {
        render(
            <>
                <span id="rail-heading">Sections</span>
                <NavRail items={ITEMS} active="fleet" labelledBy="rail-heading" />
            </>,
        );

        const nav: HTMLElement = screen.getByRole('navigation', {
            name: 'Sections',
        });
        expect(nav).toHaveAttribute('aria-labelledby', 'rail-heading');
        expect(nav).not.toHaveAttribute('aria-label');
    });

    it('renders one interactive button per entry', (): void => {
        render(<NavRail items={ITEMS} active="fleet" label={NAV_LABEL} />);

        expect(screen.getAllByRole('button')).toHaveLength(ITEMS.length);
    });

    it('marks the active item with aria-current=page and no others', (): void => {
        render(<NavRail items={ITEMS} active="fleet" label={NAV_LABEL} />);

        expect(screen.getByRole('button', { name: 'Fleet' })).toHaveAttribute(
            'aria-current',
            'page',
        );
        expect(
            screen.getByRole('button', { name: 'Overview' }),
        ).not.toHaveAttribute('aria-current');
    });

    it('leaves every item unmarked when the active id matches no entry', (): void => {
        render(<NavRail items={ITEMS} active="missing" label={NAV_LABEL} />);

        expect(
            screen.queryByRole('button', { current: 'page' }),
        ).not.toBeInTheDocument();
    });

    it('applies a vertical roving tabindex with the active item focusable', (): void => {
        render(<NavRail items={ITEMS} active="fleet" label={NAV_LABEL} />);

        expect(screen.getByRole('button', { name: 'Fleet' })).toHaveAttribute(
            'tabindex',
            '0',
        );
        expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
        expect(screen.getByRole('button', { name: 'Research' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
    });

    it('falls back the roving tab stop to the first item when active matches nothing', (): void => {
        render(<NavRail items={ITEMS} active="missing" label={NAV_LABEL} />);

        expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute(
            'tabindex',
            '0',
        );
    });

    it('reflects selection through the data-state attribute', (): void => {
        render(<NavRail items={ITEMS} active="fleet" label={NAV_LABEL} />);

        expect(screen.getByRole('button', { name: 'Fleet' })).toHaveAttribute(
            'data-state',
            'active',
        );
        expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute(
            'data-state',
            'idle',
        );
    });

    it('moves focus to the next item on ArrowDown without activating', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NavRail
                items={ITEMS}
                active="overview"
                label={NAV_LABEL}
                onChange={onChange}
            />,
        );

        screen.getByRole('button', { name: 'Overview' }).focus();
        await user.keyboard('{ArrowDown}');

        expect(screen.getByRole('button', { name: 'Fleet' })).toHaveFocus();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('wraps focus to the last item on ArrowUp from the first', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<NavRail items={ITEMS} active="overview" label={NAV_LABEL} />);

        screen.getByRole('button', { name: 'Overview' }).focus();
        await user.keyboard('{ArrowUp}');

        expect(screen.getByRole('button', { name: 'Research' })).toHaveFocus();
    });

    it('moves focus to the first and last item on Home and End without activating', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NavRail
                items={ITEMS}
                active="fleet"
                label={NAV_LABEL}
                onChange={onChange}
            />,
        );

        screen.getByRole('button', { name: 'Fleet' }).focus();
        await user.keyboard('{End}');
        expect(screen.getByRole('button', { name: 'Research' })).toHaveFocus();

        await user.keyboard('{Home}');
        expect(screen.getByRole('button', { name: 'Overview' })).toHaveFocus();

        expect(onChange).not.toHaveBeenCalled();
    });

    it('activates the focused button on Enter', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NavRail
                items={ITEMS}
                active="fleet"
                label={NAV_LABEL}
                onChange={onChange}
            />,
        );

        screen.getByRole('button', { name: 'Research' }).focus();
        await user.keyboard('{Enter}');

        expect(onChange).toHaveBeenCalledWith('research');
    });

    it('activates the focused button on Space', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NavRail
                items={ITEMS}
                active="fleet"
                label={NAV_LABEL}
                onChange={onChange}
            />,
        );

        screen.getByRole('button', { name: 'Research' }).focus();
        await user.keyboard(' ');

        expect(onChange).toHaveBeenCalledWith('research');
    });

    it('calls onChange with the id when a button item is clicked', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NavRail
                items={ITEMS}
                active="overview"
                label={NAV_LABEL}
                onChange={onChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Fleet' }));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('fleet');
    });

    it('renders an href item as a link that navigates natively without onChange', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NavRail
                items={LINK_ITEMS}
                active="docs"
                label={NAV_LABEL}
                onChange={onChange}
            />,
        );

        const docs: HTMLElement = screen.getByRole('link', { name: 'Docs' });
        expect(docs).toHaveAttribute('href', '#docs');
        expect(docs).toHaveAttribute('aria-current', 'page');

        await user.click(docs);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('renders every item disabled and ignores clicks when the rail is disabled', async (): Promise<void> => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <NavRail
                items={ITEMS}
                active="fleet"
                label={NAV_LABEL}
                onChange={onChange}
                enabled={EEnabledState.Disabled}
            />,
        );

        const buttons: readonly HTMLElement[] = screen.getAllByRole('button');
        expect(buttons).toHaveLength(ITEMS.length);
        buttons.forEach((button: HTMLElement): void => {
            expect(button).toBeDisabled();
        });

        await user.click(screen.getByRole('button', { name: 'Fleet' }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('applies the tone seed custom property to the nav root', (): void => {
        const tone: string = 'rgb(255, 0, 0)';
        render(
            <NavRail items={ITEMS} active="fleet" label={NAV_LABEL} tone={tone} />,
        );

        const nav: HTMLElement = screen.getByRole('navigation', {
            name: NAV_LABEL,
        });
        expect(nav.style.getPropertyValue('--portal-tone')).toBe(tone);
    });

    it('moves the roving tab stop to follow a controlled active change', (): void => {
        const view: RenderResult = render(
            <NavRail items={ITEMS} active="overview" label={NAV_LABEL} />,
        );

        expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute(
            'tabindex',
            '0',
        );

        view.rerender(
            <NavRail items={ITEMS} active="research" label={NAV_LABEL} />,
        );

        expect(screen.getByRole('button', { name: 'Research' })).toHaveAttribute(
            'tabindex',
            '0',
        );
        expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
    });

    it('renders the bare nav landmark with no buttons for an empty item set', (): void => {
        render(<NavRail items={[]} active="none" label={NAV_LABEL} />);

        const nav: HTMLElement = screen.getByRole('navigation', {
            name: NAV_LABEL,
        });
        expect(nav).toBeInTheDocument();
        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('wraps an item icon in an aria-hidden decorative slot', (): void => {
        const iconItems: readonly NavRailItem[] = [
            {
                id: 'overview',
                label: 'Overview',
                icon: <span data-testid="rail-icon">icon</span>,
            },
        ];
        render(<NavRail items={iconItems} active="overview" label={NAV_LABEL} />);

        const icon: HTMLElement = screen.getByTestId('rail-icon');
        const wrapper: HTMLElement | null = icon.parentElement;
        expect(wrapper).not.toBeNull();
        expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders an item badge slot', (): void => {
        const badgeItems: readonly NavRailItem[] = [
            {
                id: 'fleet',
                label: 'Fleet',
                badge: <span data-testid="rail-badge">3</span>,
            },
        ];
        render(<NavRail items={badgeItems} active="fleet" label={NAV_LABEL} />);

        const badge: HTMLElement = screen.getByTestId('rail-badge');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent('3');
    });

    it('renders link items as disabled buttons when the rail is disabled', (): void => {
        render(
            <NavRail
                items={LINK_ITEMS}
                active="docs"
                label={NAV_LABEL}
                enabled={EEnabledState.Disabled}
            />,
        );

        expect(screen.queryByRole('link')).toBeNull();
        const buttons: readonly HTMLElement[] = screen.getAllByRole('button');
        expect(buttons).toHaveLength(LINK_ITEMS.length);
        buttons.forEach((button: HTMLElement): void => {
            expect(button).toBeDisabled();
        });
    });

    it('does not activate or preventDefault on Enter for a link item', (): void => {
        const onChange: Mock<(id: string) => void> = vi.fn<(id: string) => void>();
        render(
            <NavRail
                items={LINK_ITEMS}
                active="docs"
                label={NAV_LABEL}
                onChange={onChange}
            />,
        );

        const docs: HTMLElement = screen.getByRole('link', { name: 'Docs' });
        docs.focus();
        // fireEvent returns false when a handler called preventDefault; a link must
        // let the native anchor navigate on Enter, so it stays true.
        const notPrevented: boolean = fireEvent.keyDown(docs, { key: 'Enter' });

        expect(notPrevented).toBe(true);
        expect(onChange).not.toHaveBeenCalled();
    });
});
