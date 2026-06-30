import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HudPanel } from './HudPanel';
import { type HudReadout } from './HudPanel.types';

const PANEL_LABEL: string = 'Status readouts';

const READOUTS: readonly HudReadout[] = [
    { id: 'health', label: 'Health', value01: 0.82 },
    { id: 'shield', label: 'Shield', value01: 0.45 },
    { id: 'boost', label: 'Boost', value01: 0.12 },
];

describe('HudPanel', (): void => {
    it('exposes a labelled readout group', (): void => {
        render(<HudPanel label={PANEL_LABEL} readouts={READOUTS} />);

        expect(
            screen.getByRole('group', { name: PANEL_LABEL }),
        ).toBeInTheDocument();
    });

    it('renders each readout label and its rounded fill percent as text', (): void => {
        render(<HudPanel label={PANEL_LABEL} readouts={READOUTS} />);

        expect(screen.getByText('Health')).toBeInTheDocument();
        expect(screen.getByText('Shield')).toBeInTheDocument();
        expect(screen.getByText('Boost')).toBeInTheDocument();
        expect(screen.getByText('82%')).toBeInTheDocument();
        expect(screen.getByText('45%')).toBeInTheDocument();
        expect(screen.getByText('12%')).toBeInTheDocument();
    });

    it('clamps out-of-range and non-numeric values to the 0..100% band', (): void => {
        const edgeReadouts: readonly HudReadout[] = [
            { id: 'empty', label: 'Empty', value01: 0 },
            { id: 'full', label: 'Full', value01: 1 },
            { id: 'over', label: 'Over', value01: 1.6 },
            { id: 'under', label: 'Under', value01: -0.4 },
            { id: 'nan', label: 'Unknown', value01: Number.NaN },
        ];
        render(<HudPanel label={PANEL_LABEL} readouts={edgeReadouts} />);

        // 0, NaN, and the under-range value all clamp to 0%.
        expect(screen.getAllByText('0%')).toHaveLength(3);
        // 1 and the over-range value both clamp to 100%.
        expect(screen.getAllByText('100%')).toHaveLength(2);
    });

    it('marks the decorative fill track as hidden from assistive tech', (): void => {
        const { container }: { container: HTMLElement } = render(
            <HudPanel
                label={PANEL_LABEL}
                readouts={[{ id: 'health', label: 'Health', value01: 0.5 }]}
            />,
        );

        const hiddenTracks: NodeListOf<Element> = container.querySelectorAll(
            '[aria-hidden="true"]',
        );
        expect(hiddenTracks).toHaveLength(1);
    });

    it('renders an empty group when there are no readouts', (): void => {
        render(<HudPanel label={PANEL_LABEL} readouts={[]} />);

        expect(
            screen.getByRole('group', { name: PANEL_LABEL }),
        ).toBeInTheDocument();
        expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    });
});
