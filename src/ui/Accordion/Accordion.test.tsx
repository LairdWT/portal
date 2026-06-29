import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { Accordion } from './Accordion';
import { type AccordionItem, EAccordionMode } from './Accordion.types';

// axe coverage for this component is delivered by the Storybook addon-a11y story
// gate (Accordion.stories.tsx) under pnpm test:run, matching the repo precedent
// (Select/Toast/Tooltip); this file asserts the render shape, ARIA wiring,
// keyboard moves, inert collapsed panels, the two modes, disabled, and tone.

const ITEMS: readonly AccordionItem[] = [
    { id: 'overview', title: 'Overview', content: 'Overview body' },
    { id: 'telemetry', title: 'Telemetry', content: 'Telemetry body' },
    { id: 'diagnostics', title: 'Diagnostics', content: 'Diagnostics body' },
];

type SingleSpy = Mock<(id: string | null) => void>;
type MultipleSpy = Mock<(ids: ReadonlySet<string>) => void>;

function panelFor(name: string): HTMLElement {
    const header: HTMLElement = screen.getByRole('button', { name });
    const id: string | null = header.getAttribute('aria-controls');
    const panel: HTMLElement | null =
        id === null ? null : document.getElementById(id);
    if (panel === null) {
        throw new Error(`no panel for ${name}`);
    }
    return panel;
}

describe('Accordion', (): void => {
    it('renders one header button per item, each the only child of a heading', (): void => {
        render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                expandedId="overview"
                onExpandedChange={vi.fn()}
            />,
        );

        const buttons: readonly HTMLElement[] = screen.getAllByRole('button');
        expect(buttons).toHaveLength(ITEMS.length);

        const headings: readonly HTMLElement[] = screen.getAllByRole('heading', {
            level: 3,
        });
        expect(headings).toHaveLength(ITEMS.length);
        headings.forEach((heading: HTMLElement): void => {
            expect(heading.childElementCount).toBe(1);
            expect(heading.firstElementChild?.tagName).toBe('BUTTON');
        });
    });

    it('renders the headings at the configured headingLevel', (): void => {
        render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                headingLevel={2}
                expandedId="overview"
                onExpandedChange={vi.fn()}
            />,
        );

        expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(
            ITEMS.length,
        );
    });

    it('reflects the single expanded id through aria-expanded', (): void => {
        render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                expandedId="telemetry"
                onExpandedChange={vi.fn()}
            />,
        );

        expect(screen.getByRole('button', { name: 'Telemetry' })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
        expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute(
            'aria-expanded',
            'false',
        );
    });

    it('reflects multiple expanded ids through aria-expanded', (): void => {
        render(
            <Accordion
                mode={EAccordionMode.Multiple}
                items={ITEMS}
                expandedIds={new Set<string>(['overview', 'diagnostics'])}
                onExpandedChange={vi.fn()}
            />,
        );

        expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
        expect(screen.getByRole('button', { name: 'Diagnostics' })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
        expect(screen.getByRole('button', { name: 'Telemetry' })).toHaveAttribute(
            'aria-expanded',
            'false',
        );
    });

    it('wires aria-controls to a region labelled by its header', (): void => {
        render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                expandedId="overview"
                onExpandedChange={vi.fn()}
            />,
        );

        const header: HTMLElement = screen.getByRole('button', {
            name: 'Overview',
        });
        const panel: HTMLElement = panelFor('Overview');
        expect(header.getAttribute('aria-controls')).toBe(panel.id);
        expect(panel).toHaveAttribute('role', 'region');
        expect(panel.getAttribute('aria-labelledby')).toBe(header.id);
    });

    it('marks collapsed panels inert and expanded panels not inert', (): void => {
        render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                expandedId="overview"
                onExpandedChange={vi.fn()}
            />,
        );

        expect(panelFor('Overview')).not.toHaveAttribute('inert');
        expect(panelFor('Telemetry')).toHaveAttribute('inert');
    });

    it('single mode: clicking a collapsed header reports its id', async (): Promise<void> => {
        const onExpandedChange: SingleSpy = vi.fn<(id: string | null) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                expandedId="overview"
                onExpandedChange={onExpandedChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Telemetry' }));

        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        expect(onExpandedChange).toHaveBeenCalledWith('telemetry');
    });

    it('single mode: clicking the open header collapses it by default', async (): Promise<void> => {
        const onExpandedChange: SingleSpy = vi.fn<(id: string | null) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                expandedId="overview"
                onExpandedChange={onExpandedChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Overview' }));

        expect(onExpandedChange).toHaveBeenCalledWith(null);
    });

    it('single mode: a non-collapsible open header is a no-op', async (): Promise<void> => {
        const onExpandedChange: SingleSpy = vi.fn<(id: string | null) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                expandedId="overview"
                collapsible={false}
                onExpandedChange={onExpandedChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Overview' }));

        expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it('multiple mode: clicking a collapsed header appends its id', async (): Promise<void> => {
        const onExpandedChange: MultipleSpy =
            vi.fn<(ids: ReadonlySet<string>) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Accordion
                mode={EAccordionMode.Multiple}
                items={ITEMS}
                expandedIds={new Set<string>(['overview'])}
                onExpandedChange={onExpandedChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Diagnostics' }));

        expect(onExpandedChange).toHaveBeenCalledWith(
            new Set<string>(['overview', 'diagnostics']),
        );
    });

    it('multiple mode: clicking an expanded header removes its id', async (): Promise<void> => {
        const onExpandedChange: MultipleSpy =
            vi.fn<(ids: ReadonlySet<string>) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Accordion
                mode={EAccordionMode.Multiple}
                items={ITEMS}
                expandedIds={new Set<string>(['overview', 'diagnostics'])}
                onExpandedChange={onExpandedChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Overview' }));

        expect(onExpandedChange).toHaveBeenCalledWith(
            new Set<string>(['diagnostics']),
        );
    });

    it('moves focus across headers with Arrow, Home, and End keys', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                expandedId="overview"
                onExpandedChange={vi.fn()}
            />,
        );

        const first: HTMLElement = screen.getByRole('button', { name: 'Overview' });
        const second: HTMLElement = screen.getByRole('button', {
            name: 'Telemetry',
        });
        const last: HTMLElement = screen.getByRole('button', {
            name: 'Diagnostics',
        });

        first.focus();
        await user.keyboard('{ArrowDown}');
        expect(second).toHaveFocus();

        await user.keyboard('{ArrowUp}');
        expect(first).toHaveFocus();

        await user.keyboard('{ArrowUp}');
        expect(last).toHaveFocus();

        await user.keyboard('{ArrowDown}');
        expect(first).toHaveFocus();

        await user.keyboard('{End}');
        expect(last).toHaveFocus();

        await user.keyboard('{Home}');
        expect(first).toHaveFocus();
    });

    it('toggles the focused header with Enter and Space', async (): Promise<void> => {
        const onExpandedChange: SingleSpy = vi.fn<(id: string | null) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                expandedId="overview"
                onExpandedChange={onExpandedChange}
            />,
        );

        const telemetry: HTMLElement = screen.getByRole('button', {
            name: 'Telemetry',
        });
        telemetry.focus();
        await user.keyboard('{Enter}');
        expect(onExpandedChange).toHaveBeenLastCalledWith('telemetry');

        await user.keyboard(' ');
        expect(onExpandedChange).toHaveBeenLastCalledWith('telemetry');
        expect(onExpandedChange).toHaveBeenCalledTimes(2);
    });

    it('disables every header and ignores activation when disabled', async (): Promise<void> => {
        const onExpandedChange: SingleSpy = vi.fn<(id: string | null) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                expandedId="overview"
                enabled={EEnabledState.Disabled}
                onExpandedChange={onExpandedChange}
            />,
        );

        const buttons: readonly HTMLElement[] = screen.getAllByRole('button');
        buttons.forEach((button: HTMLElement): void => {
            expect(button).toBeDisabled();
        });

        await user.click(screen.getByRole('button', { name: 'Telemetry' }));
        expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it('routes the danger status onto the root', (): void => {
        const { container }: { container: HTMLElement } = render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                expandedId="overview"
                status={EUiStatus.Danger}
                onExpandedChange={vi.fn()}
            />,
        );

        const root: HTMLElement = container.firstElementChild as HTMLElement;
        expect(root).toHaveAttribute('data-status', 'danger');
    });

    it('sets the tone custom property on the root when toned', (): void => {
        const { container }: { container: HTMLElement } = render(
            <Accordion
                mode={EAccordionMode.Single}
                items={ITEMS}
                expandedId="overview"
                tone="oklch(0.7 0.18 25)"
                onExpandedChange={vi.fn()}
            />,
        );

        const root: HTMLElement = container.firstElementChild as HTMLElement;
        expect(root.style.getPropertyValue('--portal-tone')).toBe(
            'oklch(0.7 0.18 25)',
        );
    });
});
