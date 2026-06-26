import { render, screen } from '@testing-library/react';
import { type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { EUiStatus } from '../tone';
import { EmptyState } from './EmptyState';
import styles from './EmptyState.module.css';
import { EEmptyStateRole } from './EmptyState.types';

function Marker(): ReactElement {
    return <svg data-testid="empty-icon" />;
}

describe('EmptyState', (): void => {
    it('renders the title and description as text', (): void => {
        render(
            <EmptyState
                title="No results"
                description="Nothing matches the current filters yet."
            />,
        );

        expect(screen.getByText('No results')).toBeInTheDocument();
        expect(
            screen.getByText('Nothing matches the current filters yet.'),
        ).toBeInTheDocument();
    });

    it('renders the title as a heading at the requested level', (): void => {
        render(<EmptyState title="No results" headingLevel={3} />);

        const heading: HTMLElement = screen.getByRole('heading', { level: 3 });
        expect(heading).toHaveTextContent('No results');
    });

    it('renders the title at heading level four', (): void => {
        render(<EmptyState title="No results" headingLevel={4} />);

        const heading: HTMLElement = screen.getByRole('heading', { level: 4 });
        expect(heading).toHaveTextContent('No results');
    });

    it('defaults to a status live region labelled by the title', (): void => {
        render(<EmptyState title="No results" />);

        const root: HTMLElement = screen.getByRole('status', {
            name: 'No results',
        });
        expect(root).toBeInTheDocument();
    });

    it('renders a region landmark when requested', (): void => {
        render(
            <EmptyState title="No notifications" role={EEmptyStateRole.Region} />,
        );

        const root: HTMLElement = screen.getByRole('region', {
            name: 'No notifications',
        });
        expect(root).toBeInTheDocument();
    });

    it('renders the icon slot hidden from assistive technology', (): void => {
        render(<EmptyState title="No results" icon={<Marker />} />);

        const iconClass: string | undefined = styles.icon;
        expect(iconClass).toBeDefined();

        const icon: HTMLElement = screen.getByTestId('empty-icon');
        const wrapper: HTMLElement | null = icon.closest(`.${iconClass ?? ''}`);
        expect(wrapper).not.toBeNull();
        expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders the action slot', (): void => {
        render(
            <EmptyState
                title="No projects yet"
                action={<button type="button">Create project</button>}
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Create project' }),
        ).toBeInTheDocument();
    });

    it('omits optional slots when not supplied', (): void => {
        render(<EmptyState title="No results" />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('empty-icon')).not.toBeInTheDocument();
    });

    it('applies the tone style to the root', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(<EmptyState title="No results" tone={toneColor} />);

        const root: HTMLElement = screen.getByRole('status', {
            name: 'No results',
        });
        expect(root.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('surfaces the status as a data attribute', (): void => {
        render(<EmptyState title="Failed to load" status={EUiStatus.Danger} />);

        const root: HTMLElement = screen.getByRole('status', {
            name: 'Failed to load',
        });
        expect(root).toHaveAttribute('data-status', EUiStatus.Danger);
    });
});
