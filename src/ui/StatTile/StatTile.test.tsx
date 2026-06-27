import { render, type RenderResult, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EUiStatus } from '../tone';
import { StatTile } from './StatTile';
import styles from './StatTile.module.css';
import { EStatTileEmphasis, EStatTrend } from './StatTile.types';

describe('StatTile', (): void => {
    it('renders the label, value, unit, and delta text', (): void => {
        render(
            <StatTile
                label="Throughput"
                value="1,024"
                unit="ops/s"
                delta={{ value: '12%', trend: EStatTrend.Up }}
            />,
        );

        expect(screen.getByText('Throughput')).toBeInTheDocument();
        expect(screen.getByText('1,024')).toBeInTheDocument();
        expect(screen.getByText('ops/s')).toBeInTheDocument();
        expect(screen.getByText('12%')).toBeInTheDocument();
    });

    it('exposes the composed accessible name as one group', (): void => {
        render(
            <StatTile
                label="Throughput"
                value="1,024"
                unit="ops/s"
                delta={{ value: '12%', trend: EStatTrend.Up }}
            />,
        );

        expect(
            screen.getByRole('group', {
                name: 'Throughput 1,024 ops/s, up 12%',
            }),
        ).toBeInTheDocument();
    });

    it('applies tabular-nums via the value class', (): void => {
        render(<StatTile label="Throughput" value="1,024" />);

        const valueClass: string | undefined = styles.value;
        expect(valueClass).toBeDefined();

        const valueElement: HTMLElement = screen.getByText('1,024');
        expect(valueElement).toHaveClass(valueClass ?? '');
    });

    it('defaults to the hero emphasis and reflects an explicit emphasis', (): void => {
        const view: RenderResult = render(
            <StatTile label="Throughput" value="1,024" />,
        );

        expect(
            screen.getByRole('group', { name: 'Throughput 1,024' }),
        ).toHaveAttribute('data-emphasis', EStatTileEmphasis.Hero);

        view.rerender(
            <StatTile
                label="Throughput"
                value="1,024"
                emphasis={EStatTileEmphasis.Metric}
            />,
        );

        expect(
            screen.getByRole('group', { name: 'Throughput 1,024' }),
        ).toHaveAttribute('data-emphasis', EStatTileEmphasis.Metric);
    });

    it('surfaces the status as a data attribute through the tone scope', (): void => {
        render(<StatTile label="Hull" value={0} status={EUiStatus.Danger} />);

        expect(screen.getByRole('group', { name: 'Hull 0' })).toHaveAttribute(
            'data-status',
            EUiStatus.Danger,
        );
    });

    it('applies the tone style to the root group', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(<StatTile label="Hull" value={3} tone={toneColor} />);

        const group: HTMLElement = screen.getByRole('group', { name: 'Hull 3' });
        expect(group.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('marks the directional caret decorative and carries the trend', (): void => {
        const view: RenderResult = render(
            <StatTile
                label="Throughput"
                value="1,024"
                delta={{ value: '12%', trend: EStatTrend.Up }}
            />,
        );

        const delta: Element | null = view.container.querySelector(
            `[data-trend="${EStatTrend.Up}"]`,
        );
        expect(delta).not.toBeNull();

        const caret: Element | null =
            delta?.querySelector('[aria-hidden="true"]') ?? null;
        expect(caret).not.toBeNull();
    });

    it('announces a downward trend word in the accessible name', (): void => {
        render(
            <StatTile
                label="Latency"
                value="5"
                unit="ms"
                delta={{ value: '5 ms', trend: EStatTrend.Down }}
            />,
        );

        expect(
            screen.getByRole('group', { name: /down 5 ms/ }),
        ).toBeInTheDocument();
    });

    it('announces a flat trend as "no change" in the accessible name', (): void => {
        render(
            <StatTile
                label="Latency"
                value="5"
                unit="ms"
                delta={{ value: '0 ms', trend: EStatTrend.Flat }}
            />,
        );

        expect(
            screen.getByRole('group', { name: /no change 0 ms/ }),
        ).toBeInTheDocument();
    });

    it('composes the name without a unit when none is supplied with a delta', (): void => {
        render(
            <StatTile
                label="Kills"
                value="9"
                delta={{ value: '3', trend: EStatTrend.Up }}
            />,
        );

        expect(
            screen.getByRole('group', { name: 'Kills 9, up 3' }),
        ).toBeInTheDocument();
    });

    it('renders the hero accent rule only for the hero emphasis', (): void => {
        const view: RenderResult = render(
            <StatTile
                label="Throughput"
                value="1,024"
                emphasis={EStatTileEmphasis.Hero}
            />,
        );

        expect(
            view.container.querySelector(`.${styles.accentRule ?? ''}`),
        ).not.toBeNull();

        view.rerender(
            <StatTile
                label="Throughput"
                value="1,024"
                emphasis={EStatTileEmphasis.Metric}
            />,
        );

        expect(
            view.container.querySelector(`.${styles.accentRule ?? ''}`),
        ).toBeNull();
    });

    it('is not interactive', (): void => {
        render(<StatTile label="Throughput" value="1,024" />);

        const group: HTMLElement = screen.getByRole('group', {
            name: 'Throughput 1,024',
        });
        expect(group).not.toHaveAttribute('tabindex');
        expect(screen.queryByRole('button')).toBeNull();
    });
});
