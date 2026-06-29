import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StepTrack } from './StepTrack';
import { EStepState, type Step } from './StepTrack.types';

const PHASES: readonly Step[] = [
    { id: 'draw', label: 'Draw' },
    { id: 'main', label: 'Main' },
    { id: 'combat', label: 'Combat' },
    { id: 'end', label: 'End' },
];

// Resolve a step's <li> by its visible label without relying on a non-null
// assertion: the label is queried within each list item and the matching item
// returned, defaulting to null so a miss surfaces as a failed assertion.
function findStepItem(label: string): HTMLElement | null {
    const items: readonly HTMLElement[] = screen.getAllByRole('listitem');
    for (const item of items) {
        if (within(item).queryByText(label) !== null) {
            return item;
        }
    }
    return null;
}

describe('StepTrack', (): void => {
    it('renders the steps in order', (): void => {
        render(<StepTrack steps={PHASES} currentId="draw" />);

        const items: readonly HTMLElement[] = screen.getAllByRole('listitem');
        const labels: readonly string[] = items.map(
            (item: HTMLElement): string => item.textContent,
        );
        expect(labels).toEqual(['Draw', 'Main', 'Combat', 'End']);
    });

    it('marks the current step with aria-current="step"', (): void => {
        render(<StepTrack steps={PHASES} currentId="combat" />);

        const current: HTMLElement | null = findStepItem('Combat');
        expect(current).not.toBeNull();
        expect(current).toHaveAttribute('aria-current', 'step');
        expect(current).toHaveAttribute('data-state', EStepState.Current);
    });

    it('marks only one step as current', (): void => {
        render(<StepTrack steps={PHASES} currentId="main" />);

        const items: readonly HTMLElement[] = screen.getAllByRole('listitem');
        const currentItems: readonly HTMLElement[] = items.filter(
            (item: HTMLElement): boolean =>
                item.getAttribute('aria-current') === 'step',
        );
        expect(currentItems).toHaveLength(1);

        const onlyCurrent: HTMLElement | undefined = currentItems[0];
        expect(onlyCurrent).toBeDefined();
        expect(
            within(onlyCurrent ?? document.body).getByText('Main'),
        ).toBeInTheDocument();
    });

    it('assigns past state to steps before the current step', (): void => {
        render(<StepTrack steps={PHASES} currentId="combat" />);

        const draw: HTMLElement | null = findStepItem('Draw');
        const main: HTMLElement | null = findStepItem('Main');
        expect(draw).toHaveAttribute('data-state', EStepState.Past);
        expect(main).toHaveAttribute('data-state', EStepState.Past);
        expect(draw).not.toHaveAttribute('aria-current');
    });

    it('assigns future state to steps after the current step', (): void => {
        render(<StepTrack steps={PHASES} currentId="main" />);

        const combat: HTMLElement | null = findStepItem('Combat');
        const end: HTMLElement | null = findStepItem('End');
        expect(combat).toHaveAttribute('data-state', EStepState.Future);
        expect(end).toHaveAttribute('data-state', EStepState.Future);
        expect(combat).not.toHaveAttribute('aria-current');
    });

    it('applies the tone style to the root list', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(<StepTrack steps={PHASES} currentId="draw" tone={toneColor} />);

        const list: HTMLElement = screen.getByRole('list');
        expect(list.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });
});
