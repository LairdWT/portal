import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EUiStatus } from '../tone';
import { Gauge } from './Gauge';

describe('Gauge', (): void => {
    it('renders the caption and the named meter with derived bounds', (): void => {
        render(<Gauge label="Reactor output" value={62} />);
        expect(screen.getByText('Reactor output')).toBeInTheDocument();
        const meter: HTMLElement = screen.getByRole('meter', {
            name: 'Reactor output',
        });
        expect(meter).toHaveAttribute('aria-valuemin', '0');
        expect(meter).toHaveAttribute('aria-valuemax', '100');
        expect(meter).toHaveAttribute('aria-valuenow', '62');
    });

    it('clamps the value into the bounds', (): void => {
        render(<Gauge label="Reactor output" value={250} />);
        expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100');
    });

    it('reads a non-finite value as the floor', (): void => {
        render(<Gauge label="Reactor output" value={Number.NaN} min={10} />);
        expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '10');
    });

    it('drives the fill custom property from the clamped fraction', (): void => {
        const view: { container: HTMLElement } = render(
            <Gauge label="Reactor output" value={62} />,
        );
        const figure: HTMLElement | null = view.container.querySelector('figure');
        expect(figure).not.toBeNull();
        expect(figure?.style.getPropertyValue('--portal-gauge-fill')).toBe('0.62');
    });

    it('appends units to the readout and the spoken value', (): void => {
        render(<Gauge label="Reactor output" value={62} units="MW" />);
        const meter: HTMLElement = screen.getByRole('meter');
        expect(meter).toHaveAttribute('aria-valuetext', '62 MW');
        expect(screen.getByText('MW')).toBeInTheDocument();
    });

    it('formats the readout through formatValue', (): void => {
        render(
            <Gauge
                label="Shield integrity"
                value={0.62}
                min={0}
                max={1}
                formatValue={(value: number): string =>
                    `${String(Math.round(value * 100))}%`
                }
            />,
        );
        const meter: HTMLElement = screen.getByRole('meter');
        expect(meter).toHaveAttribute('aria-valuenow', '0.62');
        expect(meter).toHaveAttribute('aria-valuetext', '62%');
        expect(screen.getByText('62%')).toBeInTheDocument();
    });

    it('draws status bands and skips degenerate spans', (): void => {
        const view: { container: HTMLElement } = render(
            <Gauge
                label="Reactor output"
                value={88}
                bands={[
                    { from: 80, to: 100, status: EUiStatus.Danger },
                    { from: 20, to: 20 },
                ]}
            />,
        );
        const paths: NodeListOf<Element> = view.container.querySelectorAll('path');
        // Track + fill + the one non-degenerate band.
        expect(paths).toHaveLength(3);
        expect(
            view.container.querySelector('path[data-status="danger"]'),
        ).not.toBeNull();
    });

    it('normalizes an inverted band span', (): void => {
        const view: { container: HTMLElement } = render(
            <Gauge
                label="Reactor output"
                value={10}
                bands={[{ from: 100, to: 80, status: EUiStatus.Success }]}
            />,
        );
        expect(
            view.container.querySelector('path[data-status="success"]'),
        ).not.toBeNull();
    });
});
