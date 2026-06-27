import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { EUiStatus } from '../tone';
import toneStyles from '../tone.module.css';
import { BarChart } from './BarChart';
import styles from './Chart.module.css';
import {
    type ChartLegendItem,
    type ChartRankedEntry,
    type ChartSegment,
    EChartA11yDetail,
} from './Chart.types';
import { LegendRow } from './LegendRow';
import { RankedBars } from './RankedBars';
import { RatioBar } from './RatioBar';
import { StackedBar } from './StackedBar';

const TONE_COLOR: string = 'rgb(255, 0, 0)';

const RANKED: readonly ChartRankedEntry[] = [
    { label: 'Strike', value: 42 },
    { label: 'Block', value: 31 },
    { label: 'Dash', value: 18 },
];

const LEGEND: readonly ChartLegendItem[] = [
    { label: 'Fire', value: 8 },
    { label: 'Water', value: 5 },
];

const SEGMENTS: readonly ChartSegment[] = [
    { label: 'Hand', value: 5 },
    { label: 'Deck', value: 12 },
    { label: 'Discard', value: 3 },
];

// Assert every positional/size attribute on a shape is a finite number, so no
// divide-by-zero or empty series ever emits a NaN attribute.
function expectFiniteShape(shape: Element): void {
    for (const name of ['x', 'y', 'width', 'height']) {
        const raw: string | null = shape.getAttribute(name);
        expect(raw).not.toBeNull();
        expect(Number.isFinite(Number(raw))).toBe(true);
    }
}

afterEach((): void => {
    document.body.innerHTML = '';
});

describe('BarChart', (): void => {
    it('renders one bar per value', (): void => {
        const { container }: { container: HTMLElement } = render(
            <BarChart label="DPS" values={[1, 2, 3]} />,
        );

        const bars: NodeListOf<Element> = container.querySelectorAll(
            `rect.${styles.bar ?? ''}`,
        );
        expect(bars).toHaveLength(3);
    });

    it('exposes a role=img with a summary naming the peak', (): void => {
        render(<BarChart label="DPS" values={[4, 9, 6]} />);

        const chart: HTMLElement = screen.getByRole('img', { name: /peak 9/ });
        expect(chart).toHaveAccessibleName(/DPS/);
    });

    it('applies the tone style to the root', (): void => {
        const { container }: { container: HTMLElement } = render(
            <BarChart label="DPS" values={[1, 2]} tone={TONE_COLOR} />,
        );

        const root: HTMLElement | null = container.querySelector('figure');
        expect(root).not.toBeNull();
        expect(root?.style.getPropertyValue('--portal-tone')).toBe(TONE_COLOR);
    });

    it('surfaces the status as a data attribute', (): void => {
        const { container }: { container: HTMLElement } = render(
            <BarChart label="DPS" values={[1]} status={EUiStatus.Danger} />,
        );

        const root: HTMLElement | null = container.querySelector('figure');
        expect(root).toHaveAttribute('data-status', EUiStatus.Danger);
    });

    it('renders the empty placeholder and no chart for an empty series', (): void => {
        render(<BarChart label="DPS" values={[]} emptyLabel="No samples" />);

        expect(screen.getByText('No samples')).toBeInTheDocument();
        expect(screen.queryByRole('img')).toBeNull();
    });

    it('emits only finite shape attributes for an all-zero series', (): void => {
        const { container }: { container: HTMLElement } = render(
            <BarChart label="DPS" values={[0, 0, 0]} />,
        );

        const bars: NodeListOf<Element> = container.querySelectorAll(
            `rect.${styles.bar ?? ''}`,
        );
        expect(bars).toHaveLength(3);
        bars.forEach((bar: Element): void => {
            expectFiniteShape(bar);
        });
    });

    it('omits the data table by default and renders it when detail is Table', (): void => {
        const { unmount }: { unmount: () => void } = render(
            <BarChart label="DPS" values={[1, 2]} />,
        );
        expect(screen.queryByRole('table')).toBeNull();
        unmount();

        render(
            <BarChart
                label="DPS"
                values={[1, 2]}
                detail={EChartA11yDetail.Table}
            />,
        );
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('emits only finite shape attributes for a non-finite series', (): void => {
        const { container }: { container: HTMLElement } = render(
            <BarChart
                label="DPS"
                values={[1, Number.POSITIVE_INFINITY, Number.NaN, 3]}
            />,
        );

        const bars: NodeListOf<Element> = container.querySelectorAll(
            `rect.${styles.bar ?? ''}`,
        );
        expect(bars).toHaveLength(4);
        bars.forEach((bar: Element): void => {
            expectFiniteShape(bar);
        });
    });

    it('uses the summary override as the accessible name', (): void => {
        render(
            <BarChart
                label="DPS"
                values={[1, 2, 3]}
                summary="Custom DPS summary"
            />,
        );

        expect(
            screen.getByRole('img', { name: 'Custom DPS summary' }),
        ).toBeInTheDocument();
    });
});

describe('StackedBar', (): void => {
    it('renders one segment per slice', (): void => {
        const { container }: { container: HTMLElement } = render(
            <StackedBar label="Zones" segments={SEGMENTS} />,
        );

        const slices: NodeListOf<Element> = container.querySelectorAll(
            `rect.${styles.segment ?? ''}`,
        );
        expect(slices).toHaveLength(3);
    });

    it('exposes a role=img summary with the slice share', (): void => {
        render(
            <StackedBar
                label="Zones"
                segments={[
                    { label: 'A', value: 1 },
                    { label: 'B', value: 1 },
                ]}
            />,
        );

        expect(screen.getByRole('img', { name: /50%/ })).toBeInTheDocument();
    });

    it('sets --portal-tone on the nested scope wrapper of a toned slice', (): void => {
        const { container }: { container: HTMLElement } = render(
            <StackedBar
                label="Zones"
                segments={[{ label: 'A', value: 1, tone: TONE_COLOR }]}
            />,
        );

        const wrapper: HTMLElement | null = container.querySelector(
            `g.${toneStyles.toneScope ?? ''}`,
        );
        expect(wrapper).not.toBeNull();
        expect(wrapper?.style.getPropertyValue('--portal-tone')).toBe(TONE_COLOR);
    });

    it('clamps a negative slice to zero width', (): void => {
        const { container }: { container: HTMLElement } = render(
            <StackedBar
                label="Zones"
                segments={[
                    { label: 'A', value: -5 },
                    { label: 'B', value: 10 },
                ]}
            />,
        );

        const slices: NodeListOf<Element> = container.querySelectorAll(
            `rect.${styles.segment ?? ''}`,
        );
        expect(Number(slices[0]?.getAttribute('width'))).toBe(0);
        expect(Number(slices[1]?.getAttribute('width'))).toBe(100);
    });

    it('renders the empty placeholder when the total is not positive', (): void => {
        render(
            <StackedBar
                label="Zones"
                segments={[
                    { label: 'A', value: 0 },
                    { label: 'B', value: 0 },
                ]}
                emptyLabel="No segments"
            />,
        );

        expect(screen.getByText('No segments')).toBeInTheDocument();
        expect(screen.queryByRole('img')).toBeNull();
    });

    it('emits only finite shape attributes for a non-finite slice', (): void => {
        const { container }: { container: HTMLElement } = render(
            <StackedBar
                label="Zones"
                segments={[
                    { label: 'A', value: 5 },
                    { label: 'B', value: Number.POSITIVE_INFINITY },
                    { label: 'C', value: Number.NaN },
                ]}
            />,
        );

        const slices: NodeListOf<Element> = container.querySelectorAll(
            `rect.${styles.segment ?? ''}`,
        );
        expect(slices.length).toBeGreaterThan(0);
        slices.forEach((slice: Element): void => {
            expectFiniteShape(slice);
        });
    });

    it('renders the screen-reader data table by default', (): void => {
        render(<StackedBar label="Zones" segments={SEGMENTS} />);

        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('draws a divider between each adjacent slice', (): void => {
        const { container }: { container: HTMLElement } = render(
            <StackedBar label="Zones" segments={SEGMENTS} />,
        );

        const dividers: NodeListOf<Element> = container.querySelectorAll(
            `line.${styles.divider ?? ''}`,
        );
        expect(dividers).toHaveLength(SEGMENTS.length - 1);
    });
});

describe('RatioBar', (): void => {
    it('exposes a role=img summary with the percent', (): void => {
        render(<RatioBar label="Hull" value={1} max={4} />);

        expect(screen.getByRole('img', { name: /25%/ })).toBeInTheDocument();
    });

    it('clamps a value above max to a full fill', (): void => {
        const { container }: { container: HTMLElement } = render(
            <RatioBar label="Hull" value={150} max={100} />,
        );

        const fill: Element | null = container.querySelector(
            `rect.${styles.gaugeFill ?? ''}`,
        );
        expect(Number(fill?.getAttribute('width'))).toBe(100);
    });

    it('renders an empty fill for a negative value', (): void => {
        const { container }: { container: HTMLElement } = render(
            <RatioBar label="Hull" value={-5} max={100} />,
        );

        const fill: Element | null = container.querySelector(
            `rect.${styles.gaugeFill ?? ''}`,
        );
        expect(Number(fill?.getAttribute('width'))).toBe(0);
    });

    it('renders an empty fill when max is not positive', (): void => {
        const { container }: { container: HTMLElement } = render(
            <RatioBar label="Hull" value={5} max={0} />,
        );

        const fill: Element | null = container.querySelector(
            `rect.${styles.gaugeFill ?? ''}`,
        );
        expect(Number(fill?.getAttribute('width'))).toBe(0);
    });

    it('applies tone and status to the root', (): void => {
        const { container }: { container: HTMLElement } = render(
            <RatioBar
                label="Hull"
                value={3}
                max={10}
                tone={TONE_COLOR}
                status={EUiStatus.Danger}
            />,
        );

        const root: HTMLElement | null = container.querySelector('figure');
        expect(root?.style.getPropertyValue('--portal-tone')).toBe(TONE_COLOR);
        expect(root).toHaveAttribute('data-status', EUiStatus.Danger);
    });

    it('renders an empty fill for a non-finite value', (): void => {
        const { container }: { container: HTMLElement } = render(
            <RatioBar label="Hull" value={Number.NaN} max={100} />,
        );

        const fill: Element | null = container.querySelector(
            `rect.${styles.gaugeFill ?? ''}`,
        );
        expect(fill).not.toBeNull();
        if (fill !== null) {
            expectFiniteShape(fill);
        }
        expect(Number(fill?.getAttribute('width'))).toBe(0);
    });

    it('renders an empty fill for an infinite value', (): void => {
        const { container }: { container: HTMLElement } = render(
            <RatioBar label="Hull" value={Number.POSITIVE_INFINITY} max={100} />,
        );

        const fill: Element | null = container.querySelector(
            `rect.${styles.gaugeFill ?? ''}`,
        );
        expect(Number(fill?.getAttribute('width'))).toBe(0);
    });
});

describe('RankedBars', (): void => {
    it('renders one focusable row per entry', (): void => {
        render(<RankedBars entries={RANKED} />);

        expect(screen.getAllByRole('button')).toHaveLength(RANKED.length);
    });

    it('scales each gauge fill to the widest value', (): void => {
        const { container }: { container: HTMLElement } = render(
            <RankedBars
                entries={[
                    { label: 'A', value: 10 },
                    { label: 'B', value: 5 },
                ]}
            />,
        );

        const fills: NodeListOf<Element> = container.querySelectorAll(
            `rect.${styles.gaugeFill ?? ''}`,
        );
        expect(Number(fills[0]?.getAttribute('width'))).toBe(100);
        expect(Number(fills[1]?.getAttribute('width'))).toBe(50);
    });

    it('renders the empty placeholder and no rows for an empty list', (): void => {
        render(<RankedBars entries={[]} emptyLabel="No actions" />);

        expect(screen.getByText('No actions')).toBeInTheDocument();
        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('shows a row tooltip on focus, not hover-only', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<RankedBars entries={RANKED} />);

        await user.tab();

        expect(await screen.findByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByText('Strike: 42')).toBeInTheDocument();
    });
});

describe('LegendRow', (): void => {
    it('renders one entry per item with its value as text', (): void => {
        render(<LegendRow items={LEGEND} />);

        expect(screen.getAllByRole('button')).toHaveLength(LEGEND.length);
        expect(screen.getByText('Fire')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('sets --portal-tone on a per-item toned entry', (): void => {
        render(
            <LegendRow items={[{ label: 'Fire', value: 8, tone: TONE_COLOR }]} />,
        );

        const entry: HTMLElement = screen.getByRole('button');
        expect(entry.style.getPropertyValue('--portal-tone')).toBe(TONE_COLOR);
    });

    it('shows an entry tooltip on focus, not hover-only', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<LegendRow items={LEGEND} />);

        await user.tab();

        expect(await screen.findByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByText('Fire: 8')).toBeInTheDocument();
    });
});
