import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { Link } from './Link';

describe('Link', (): void => {
    it('renders a plain themed anchor', (): void => {
        render(<Link href="/docs">Documentation</Link>);
        const anchor: HTMLElement = screen.getByRole('link', {
            name: 'Documentation',
        });
        expect(anchor).toHaveAttribute('href', '/docs');
        expect(anchor).not.toHaveAttribute('target');
    });

    it('hardens external links and draws the outward mark', (): void => {
        const view: { container: HTMLElement } = render(
            <Link href="https://example.com" external>
                Example
            </Link>,
        );
        const anchor: HTMLElement = screen.getByRole('link', { name: 'Example' });
        expect(anchor).toHaveAttribute('target', '_blank');
        expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
        expect(view.container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });

    it('fires onClick and forwards download', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onClick: Mock = vi.fn();
        render(
            <Link href="/report.csv" download="report.csv" onClick={onClick}>
                Report
            </Link>,
        );
        const anchor: HTMLElement = screen.getByRole('link', { name: 'Report' });
        expect(anchor).toHaveAttribute('download', 'report.csv');
        await user.click(anchor);
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
