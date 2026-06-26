import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EUiStatus } from '../tone';
import { Progress } from './Progress';
import { EProgressMode } from './Progress.types';

// Mutable reduced-motion flag the mocked hook reads, so a single test can flip
// the preference without touching window.matchMedia (and without an unknown
// cast). Hoisted so the vi.mock factory may reference it.
const reducedMotion: { value: boolean } = vi.hoisted((): { value: boolean } => ({
    value: false,
}));

vi.mock('../../react/hooks/useReducedMotion', () => ({
    useReducedMotion: (): boolean => reducedMotion.value,
}));

describe('Progress', (): void => {
    beforeEach((): void => {
        reducedMotion.value = false;
    });

    it('renders a determinate progressbar with the aria value range', (): void => {
        render(
            <Progress
                mode={EProgressMode.Determinate}
                label="Loading"
                value={0.6}
            />,
        );

        const bar: HTMLElement = screen.getByRole('progressbar', {
            name: 'Loading',
        });
        expect(bar).toHaveAttribute('aria-valuenow', '0.6');
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '1');
    });

    it('reports value against an explicit max', (): void => {
        render(
            <Progress
                mode={EProgressMode.Determinate}
                label="Upload"
                value={42}
                max={100}
            />,
        );

        const bar: HTMLElement = screen.getByRole('progressbar', {
            name: 'Upload',
        });
        expect(bar).toHaveAttribute('aria-valuenow', '42');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    it('exposes the clamped fill ratio as a custom property', (): void => {
        render(
            <Progress
                mode={EProgressMode.Determinate}
                label="Sync"
                value={150}
                max={100}
            />,
        );

        const bar: HTMLElement = screen.getByRole('progressbar', { name: 'Sync' });
        expect(bar).toHaveAttribute('aria-valuenow', '100');
        expect(bar.style.getPropertyValue('--portal-progress-fill')).toBe('1');
    });

    it('drives the fill ratio and value text for a mid-range value', (): void => {
        render(
            <Progress mode={EProgressMode.Determinate} label="Sync" value={0.6} />,
        );

        const bar: HTMLElement = screen.getByRole('progressbar', { name: 'Sync' });
        expect(bar.style.getPropertyValue('--portal-progress-fill')).toBe('0.6');
        expect(bar).toHaveAttribute('aria-valuetext', '60%');
    });

    it('reports a zero fill ratio when max is not positive', (): void => {
        render(
            <Progress
                mode={EProgressMode.Determinate}
                label="Sync"
                value={5}
                max={0}
            />,
        );

        const bar: HTMLElement = screen.getByRole('progressbar', { name: 'Sync' });
        expect(bar.style.getPropertyValue('--portal-progress-fill')).toBe('0');
        expect(bar).toHaveAttribute('aria-valuenow', '0');
    });

    it('applies the tone style to the root', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(
            <Progress
                mode={EProgressMode.Determinate}
                label="Hull"
                value={0.5}
                tone={toneColor}
            />,
        );

        const bar: HTMLElement = screen.getByRole('progressbar', { name: 'Hull' });
        expect(bar.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('surfaces the status as a data attribute', (): void => {
        render(
            <Progress
                mode={EProgressMode.Determinate}
                label="Hull"
                value={0.2}
                status={EUiStatus.Danger}
            />,
        );

        const bar: HTMLElement = screen.getByRole('progressbar', { name: 'Hull' });
        expect(bar).toHaveAttribute('data-status', EUiStatus.Danger);
    });

    it('renders an indeterminate progressbar without a value', (): void => {
        render(<Progress mode={EProgressMode.Indeterminate} label="Working" />);

        const bar: HTMLElement = screen.getByRole('progressbar', {
            name: 'Working',
        });
        expect(bar).toHaveAttribute('data-mode', EProgressMode.Indeterminate);
        expect(bar).not.toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('data-motion', 'animate');
    });

    it('holds the indeterminate indicator static under reduced motion', (): void => {
        reducedMotion.value = true;
        render(<Progress mode={EProgressMode.Indeterminate} label="Working" />);

        const bar: HTMLElement = screen.getByRole('progressbar', {
            name: 'Working',
        });
        expect(bar).toHaveAttribute('data-motion', 'static');
    });
});
