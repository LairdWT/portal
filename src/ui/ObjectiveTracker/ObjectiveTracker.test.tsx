import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ObjectiveTracker } from './ObjectiveTracker';
import { EObjectiveState, type Objective } from './ObjectiveTracker.types';

const OBJECTIVES: readonly Objective[] = [
    { id: 'reach', label: 'Reach the relay' },
    {
        id: 'cells',
        label: 'Recover power cells',
        state: EObjectiveState.Active,
        count: 3,
        total: 5,
    },
    {
        id: 'silence',
        label: 'Silence the battery',
        state: EObjectiveState.Complete,
    },
    {
        id: 'convoy',
        label: 'Protect the convoy',
        state: EObjectiveState.Failed,
    },
    {
        id: 'intel',
        label: 'Gather intel',
        optional: true,
    },
];

describe('ObjectiveTracker', (): void => {
    it('renders the labelled list with one item per objective', (): void => {
        render(<ObjectiveTracker label="Objectives" objectives={OBJECTIVES} />);
        expect(
            screen.getByRole('list', { name: 'Objectives' }),
        ).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(5);
        expect(
            screen.getByRole('heading', { name: 'Objectives' }),
        ).toBeInTheDocument();
    });

    it('speaks state and optionality as text suffixes', (): void => {
        render(<ObjectiveTracker label="Objectives" objectives={OBJECTIVES} />);
        // The suffix lives in a nested sr-only span, so assert against each
        // item's full text content (the default matcher reads only direct
        // text nodes).
        const items: readonly string[] = screen
            .getAllByRole('listitem')
            .map((item: HTMLElement): string => item.textContent);
        expect(items).toContain('Silence the battery (complete)');
        expect(items).toContain('Protect the convoy (failed)');
        expect(items).toContain('Gather intel (optional)');
        // An active required objective carries no suffix.
        expect(items).toContain('Reach the relay');
    });

    it('marks item state and draws the progress chip', (): void => {
        const view: { container: HTMLElement } = render(
            <ObjectiveTracker label="Objectives" objectives={OBJECTIVES} />,
        );
        expect(
            view.container.querySelectorAll('li[data-state="complete"]'),
        ).toHaveLength(1);
        expect(
            view.container.querySelectorAll('li[data-state="failed"]'),
        ).toHaveLength(1);
        expect(
            view.container.querySelectorAll('li[data-optional="true"]'),
        ).toHaveLength(1);
        expect(screen.getByText('3 / 5')).toBeInTheDocument();
    });
});
