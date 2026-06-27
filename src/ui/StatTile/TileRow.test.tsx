import { render, type RenderResult, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatTile } from './StatTile';
import { TileRow } from './TileRow';

describe('TileRow', (): void => {
    it('renders its StatTile children', (): void => {
        render(
            <TileRow label="Metrics">
                <StatTile label="Energy" value={7} />
                <StatTile label="Shield" value={42} />
            </TileRow>,
        );

        expect(screen.getByText('Energy')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('Shield')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('exposes a named group when given a label', (): void => {
        render(
            <TileRow label="Metrics">
                <StatTile label="Energy" value={7} />
            </TileRow>,
        );

        expect(screen.getByRole('group', { name: 'Metrics' })).toBeInTheDocument();
    });

    it('is a presentational layout without a label', (): void => {
        const view: RenderResult = render(
            <TileRow>
                <span>Loose child</span>
            </TileRow>,
        );

        const row: Element | null = view.container.querySelector('[data-columns]');
        expect(row).not.toBeNull();
        expect(row).not.toHaveAttribute('role');
        expect(screen.queryByRole('group')).toBeNull();
        expect(screen.getByText('Loose child')).toBeInTheDocument();
    });

    it('reflects a fixed column count', (): void => {
        render(
            <TileRow label="Fixed" columns={4}>
                <StatTile label="Energy" value={7} />
            </TileRow>,
        );

        const row: HTMLElement = screen.getByRole('group', { name: 'Fixed' });
        expect(row).toHaveAttribute('data-columns', 'fixed');
        expect(row.style.getPropertyValue('--portal-tile-columns')).toBe('4');
    });

    it('defaults to an auto-fit grid when columns is omitted', (): void => {
        render(
            <TileRow label="Auto">
                <StatTile label="Energy" value={7} />
            </TileRow>,
        );

        const row: HTMLElement = screen.getByRole('group', { name: 'Auto' });
        expect(row).toHaveAttribute('data-columns', 'auto');
        expect(row.style.getPropertyValue('--portal-tile-columns')).toBe('');
    });

    it('falls back to the auto-fit grid for a non-positive-integer column count', (): void => {
        render(
            <TileRow label="Invalid" columns={0}>
                <StatTile label="Energy" value={7} />
            </TileRow>,
        );

        const row: HTMLElement = screen.getByRole('group', { name: 'Invalid' });
        expect(row).toHaveAttribute('data-columns', 'auto');
        expect(row.style.getPropertyValue('--portal-tile-columns')).toBe('');
    });

    it('renders an empty strip with no tiles', (): void => {
        const view: RenderResult = render(<TileRow>{[]}</TileRow>);

        const row: Element | null = view.container.querySelector('[data-columns]');
        expect(row).not.toBeNull();
        expect(row?.childElementCount).toBe(0);
    });
});
