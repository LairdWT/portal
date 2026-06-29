import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ReadoutPanel } from './ReadoutPanel';
import { type Readout } from './ReadoutPanel.types';

const readouts: readonly Readout[] = [
    { id: 'energy', label: 'Energy', value: 7 },
    { id: 'shield', label: 'Shield', value: 42 },
    { id: 'phase', label: 'Phase', value: 'combat' },
];

describe('ReadoutPanel', (): void => {
    it('renders every readout label and value as text', (): void => {
        render(<ReadoutPanel label="Ship status" readouts={readouts} />);

        expect(screen.getByText('Energy')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('Shield')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Phase')).toBeInTheDocument();
        expect(screen.getByText('combat')).toBeInTheDocument();
    });

    it('exposes the group with the panel label', (): void => {
        render(<ReadoutPanel label="Ship status" readouts={readouts} />);

        const group: HTMLElement = screen.getByRole('group', {
            name: 'Ship status',
        });
        expect(group).toBeInTheDocument();
    });

    it('renders numeric values as real text, not a progressbar', (): void => {
        render(<ReadoutPanel label="Ship status" readouts={readouts} />);

        const numericValue: HTMLElement = screen.getByText('42');
        expect(numericValue).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('applies the panel-level tone to the root group', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(
            <ReadoutPanel
                label="Ship status"
                readouts={readouts}
                tone={toneColor}
            />,
        );

        const group: HTMLElement = screen.getByRole('group', {
            name: 'Ship status',
        });
        expect(group.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('applies a per-readout tone independently of the panel', (): void => {
        const rowTone: string = 'rgb(0, 128, 255)';
        const tonedReadouts: readonly Readout[] = [
            { id: 'energy', label: 'Energy', value: 7, tone: rowTone },
            { id: 'shield', label: 'Shield', value: 42 },
        ];
        render(<ReadoutPanel label="Ship status" readouts={tonedReadouts} />);

        const group: HTMLElement = screen.getByRole('group', {
            name: 'Ship status',
        });
        const tonedLabel: HTMLElement = within(group).getByText('Energy');
        const tonedRow: HTMLElement | null = tonedLabel.closest('div');
        expect(tonedRow).not.toBeNull();
        expect(tonedRow?.style.getPropertyValue('--portal-tone')).toBe(rowTone);

        const plainLabel: HTMLElement = within(group).getByText('Shield');
        const plainRow: HTMLElement | null = plainLabel.closest('div');
        expect(plainRow).not.toBeNull();
        expect(plainRow?.style.getPropertyValue('--portal-tone')).toBe('');
    });
});
