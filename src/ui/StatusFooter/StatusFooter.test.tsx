import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EUiStatus } from '../tone';
import { StatusFooter } from './StatusFooter';
import styles from './StatusFooter.module.css';
import {
    EFooterLiveness,
    EFooterRegion,
    EFooterStatus,
} from './StatusFooter.types';

// axe coverage is delivered by StatusFooter.stories.tsx under the addon-a11y
// story gate (the repo convention - Banner / Drawer / Select rely on the same
// gate), not jest-axe here. These tests cover the status->badge mapping, the
// landmark/region role, the live-region wiring, and slot rendering.

describe('StatusFooter', (): void => {
    it('renders the default bracket label for each status', (): void => {
        const cases: readonly (readonly [EFooterStatus, string])[] = [
            [EFooterStatus.Ok, '[STATUS: OK]'],
            [EFooterStatus.Warning, '[STATUS: WARN]'],
            [EFooterStatus.Error, '[STATUS: ERROR]'],
            [EFooterStatus.Idle, '[STATUS: IDLE]'],
        ];
        for (const [status, expected] of cases) {
            const { unmount }: { unmount: () => void } = render(
                <StatusFooter status={status} label="App status" />,
            );
            expect(screen.getByText(expected)).toBeInTheDocument();
            unmount();
        }
    });

    it('lets badgeText override the default bracket label', (): void => {
        render(
            <StatusFooter
                status={EFooterStatus.Ok}
                badgeText="[LINK: ONLINE]"
                label="App status"
            />,
        );

        expect(screen.getByText('[LINK: ONLINE]')).toBeInTheDocument();
        expect(screen.queryByText('[STATUS: OK]')).toBeNull();
    });

    it('carries the raw status as data-footer-status (the color signal)', (): void => {
        render(<StatusFooter status={EFooterStatus.Warning} label="App status" />);

        const footer: HTMLElement = screen.getByRole('contentinfo');
        expect(footer).toHaveAttribute('data-footer-status', EFooterStatus.Warning);
    });

    it('maps the footer status onto the universal status for the tone scope', (): void => {
        const cases: readonly (readonly [EFooterStatus, EUiStatus])[] = [
            [EFooterStatus.Ok, EUiStatus.Success],
            [EFooterStatus.Error, EUiStatus.Danger],
            [EFooterStatus.Warning, EUiStatus.None],
            [EFooterStatus.Idle, EUiStatus.None],
        ];
        for (const [status, expected] of cases) {
            const { unmount }: { unmount: () => void } = render(
                <StatusFooter status={status} label="App status" />,
            );
            expect(screen.getByRole('contentinfo')).toHaveAttribute(
                'data-status',
                expected,
            );
            unmount();
        }
    });

    it('exposes a contentinfo landmark named by label by default', (): void => {
        render(<StatusFooter status={EFooterStatus.Ok} label="App status" />);

        expect(
            screen.getByRole('contentinfo', { name: 'App status' }),
        ).toBeInTheDocument();
    });

    it('names the landmark via labelledBy', (): void => {
        render(
            <>
                <span id="footer-name">Session status</span>
                <StatusFooter status={EFooterStatus.Ok} labelledBy="footer-name" />
            </>,
        );

        expect(
            screen.getByRole('contentinfo', { name: 'Session status' }),
        ).toBeInTheDocument();
    });

    it('exposes role=status for the Status region', (): void => {
        render(
            <StatusFooter
                status={EFooterStatus.Ok}
                region={EFooterRegion.Status}
                label="App status"
            />,
        );

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.queryByRole('contentinfo')).toBeNull();
    });

    it('exposes no landmark role for the None region', (): void => {
        render(
            <StatusFooter
                status={EFooterStatus.Ok}
                region={EFooterRegion.None}
                label="App status"
            />,
        );

        expect(screen.queryByRole('contentinfo')).toBeNull();
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('defaults the live region to polite with aria-atomic', (): void => {
        render(<StatusFooter status={EFooterStatus.Ok} label="App status" />);

        const footer: HTMLElement = screen.getByRole('contentinfo');
        expect(footer).toHaveAttribute('aria-live', EFooterLiveness.Polite);
        expect(footer).toHaveAttribute('aria-atomic', 'true');
    });

    it('elevates the Error status to an assertive live region', (): void => {
        render(<StatusFooter status={EFooterStatus.Error} label="App status" />);

        expect(screen.getByRole('contentinfo')).toHaveAttribute(
            'aria-live',
            EFooterLiveness.Assertive,
        );
    });

    it('honors an explicit liveness override', (): void => {
        render(
            <StatusFooter
                status={EFooterStatus.Error}
                liveness={EFooterLiveness.Polite}
                label="App status"
            />,
        );

        expect(screen.getByRole('contentinfo')).toHaveAttribute(
            'aria-live',
            EFooterLiveness.Polite,
        );
    });

    it('suppresses the live region when liveness is Off', (): void => {
        render(
            <StatusFooter
                status={EFooterStatus.Ok}
                liveness={EFooterLiveness.Off}
                label="App status"
            />,
        );

        const footer: HTMLElement = screen.getByRole('contentinfo');
        expect(footer).not.toHaveAttribute('aria-live');
        expect(footer).not.toHaveAttribute('aria-atomic');
    });

    it('renders the message node when provided', (): void => {
        render(
            <StatusFooter
                status={EFooterStatus.Ok}
                message="All systems nominal"
                label="App status"
            />,
        );

        expect(screen.getByText('All systems nominal')).toBeInTheDocument();
    });

    it('renders the end node when provided', (): void => {
        render(
            <StatusFooter
                status={EFooterStatus.Ok}
                end={<span data-testid="stamp">v0.10.1</span>}
                label="App status"
            />,
        );

        expect(screen.getByTestId('stamp')).toBeInTheDocument();
    });

    it('renders neither message nor end when both are absent', (): void => {
        render(<StatusFooter status={EFooterStatus.Ok} label="App status" />);

        const footer: HTMLElement = screen.getByRole('contentinfo');
        const messageClass: string | undefined = styles.message;
        const endClass: string | undefined = styles.end;
        expect(footer.querySelector(`.${messageClass ?? 'message'}`)).toBeNull();
        expect(footer.querySelector(`.${endClass ?? 'end'}`)).toBeNull();
    });

    it('renders the decorative dot as aria-hidden by default', (): void => {
        render(<StatusFooter status={EFooterStatus.Ok} label="App status" />);

        const footer: HTMLElement = screen.getByRole('contentinfo');
        const dotClass: string | undefined = styles.dot;
        const dot: Element | null = footer.querySelector(`.${dotClass ?? 'dot'}`);
        expect(dot).not.toBeNull();
        expect(dot).toHaveAttribute('aria-hidden', 'true');
    });

    it('omits the dot when showDot is false', (): void => {
        render(
            <StatusFooter
                status={EFooterStatus.Ok}
                showDot={false}
                label="App status"
            />,
        );

        const footer: HTMLElement = screen.getByRole('contentinfo');
        const dotClass: string | undefined = styles.dot;
        expect(footer.querySelector(`.${dotClass ?? 'dot'}`)).toBeNull();
    });

    it('applies the tone style to the root', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(
            <StatusFooter
                status={EFooterStatus.Ok}
                tone={toneColor}
                label="App status"
            />,
        );

        const footer: HTMLElement = screen.getByRole('contentinfo');
        expect(footer.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });
});
