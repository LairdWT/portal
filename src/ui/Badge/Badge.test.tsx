import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EUiStatus } from '../tone';
import { Badge } from './Badge';
import styles from './Badge.module.css';
import { EBadgeKind } from './Badge.types';

describe('Badge', (): void => {
    it('renders a status badge with role status and its label text', (): void => {
        render(<Badge kind={EBadgeKind.Status} label="Online" />);

        const badge: HTMLElement = screen.getByRole('status');
        expect(badge).toHaveTextContent('Online');
        expect(badge).toHaveAttribute('data-kind', EBadgeKind.Status);
    });

    it('exposes the status label as the accessible name', (): void => {
        render(<Badge kind={EBadgeKind.Status} label="Idle" />);

        expect(screen.getByLabelText('Idle')).toBeInTheDocument();
    });

    it('omits the decorative dot when showDot is false', (): void => {
        render(<Badge kind={EBadgeKind.Status} label="Idle" showDot={false} />);

        const dotClass: string | undefined = styles.dot;
        expect(dotClass).toBeDefined();

        const badge: HTMLElement = screen.getByRole('status');
        expect(badge.querySelector(`.${dotClass ?? 'dot'}`)).toBeNull();
    });

    it('renders a count badge showing the numeric value', (): void => {
        render(<Badge kind={EBadgeKind.Count} count={12} />);

        expect(screen.getByText('12')).toBeInTheDocument();
        const badge: HTMLElement = screen.getByLabelText('12');
        expect(badge).toHaveAttribute('data-kind', EBadgeKind.Count);
    });

    it('clamps counts above the max to a max-plus string', (): void => {
        render(<Badge kind={EBadgeKind.Count} count={1280} max={99} />);

        expect(screen.getByText('99+')).toBeInTheDocument();
        expect(screen.queryByText('1280')).not.toBeInTheDocument();
    });

    it('combines the count and label into one accessible name', (): void => {
        render(<Badge kind={EBadgeKind.Count} count={3} label="notifications" />);

        expect(screen.getByLabelText('3 notifications')).toBeInTheDocument();
    });

    it('applies tabular-nums via the count class', (): void => {
        render(<Badge kind={EBadgeKind.Count} count={7} />);

        const countClass: string | undefined = styles.count;
        expect(countClass).toBeDefined();

        const countElement: HTMLElement = screen.getByText('7');
        expect(countElement).toHaveClass(countClass ?? '');
    });

    it('applies the tone style to the root', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(<Badge kind={EBadgeKind.Status} label="Hull" tone={toneColor} />);

        const badge: HTMLElement = screen.getByRole('status');
        expect(badge.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('surfaces the status as a data attribute', (): void => {
        render(
            <Badge
                kind={EBadgeKind.Status}
                label="Critical"
                status={EUiStatus.Danger}
            />,
        );

        const badge: HTMLElement = screen.getByRole('status');
        expect(badge).toHaveAttribute('data-status', EUiStatus.Danger);
    });
});
