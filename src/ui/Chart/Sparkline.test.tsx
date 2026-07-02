import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { linePoints } from './Chart.helpers';
import { LineChart } from './LineChart';
import { Sparkline } from './Sparkline';

describe('linePoints', (): void => {
    it('spans min..max across the viewBox and centers flat series', (): void => {
        expect(linePoints([0, 10])).toBe('0,100 100,0');
        expect(linePoints([5, 5, 5])).toBe('0,50 50,50 100,50');
        expect(linePoints([7])).toBe('50,50');
    });

    it('clamps non-finite samples to the series floor', (): void => {
        expect(linePoints([0, Number.POSITIVE_INFINITY, 10])).toBe(
            '0,100 50,100 100,0',
        );
    });
});

describe('Sparkline', (): void => {
    it('names the series through the role=img summary', (): void => {
        render(<Sparkline label="Hull integrity" values={[40, 80, 60]} />);
        expect(
            screen.getByRole('img', {
                name: 'Hull integrity: 3 samples, from 40 to 60',
            }),
        ).toBeInTheDocument();
    });

    it('renders the area wash only when filled', (): void => {
        const bare: { container: HTMLElement } = render(
            <Sparkline label="Trend" values={[1, 2]} />,
        );
        expect(bare.container.querySelector('polygon')).toBeNull();
        const filled: { container: HTMLElement } = render(
            <Sparkline label="Trend" values={[1, 2]} filled />,
        );
        expect(filled.container.querySelector('polygon')).not.toBeNull();
    });

    it('renders an empty named span without samples', (): void => {
        const view: { container: HTMLElement } = render(
            <Sparkline label="Trend" values={[]} />,
        );
        expect(
            screen.getByRole('img', { name: 'Trend: no samples' }),
        ).toBeInTheDocument();
        expect(view.container.querySelector('svg')).toBeNull();
    });
});

describe('LineChart', (): void => {
    it('renders the framed trend with a hidden data table by default', (): void => {
        render(<LineChart label="Reactor output" values={[10, 30, 20]} />);
        expect(screen.getByRole('img')).toHaveAccessibleName(
            'Reactor output: 3 values, range 10 to 30, latest 20',
        );
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Reactor output')).toBeInTheDocument();
    });

    it('renders the empty placeholder without samples', (): void => {
        render(
            <LineChart
                label="Reactor output"
                values={[]}
                emptyLabel="No telemetry."
            />,
        );
        expect(screen.getByText('No telemetry.')).toBeInTheDocument();
        expect(screen.queryByRole('img')).toBeNull();
    });
});
