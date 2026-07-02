import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EUiStatus } from '../tone';
import { Timeline } from './Timeline';

describe('Timeline', (): void => {
    it('renders a labelled feed with titles, times, and descriptions', (): void => {
        render(
            <Timeline
                label="Mission log"
                items={[
                    {
                        id: 'a',
                        title: 'Departure confirmed',
                        time: '08:12',
                        description: 'All hands aboard.',
                    },
                    { id: 'b', title: 'Contact lost', status: EUiStatus.Danger },
                ]}
            />,
        );
        const feed: HTMLElement = screen.getByRole('list', {
            name: 'Mission log',
        });
        expect(feed).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(screen.getByText('Departure confirmed')).toBeInTheDocument();
        expect(screen.getByText('08:12')).toBeInTheDocument();
        expect(screen.getByText('All hands aboard.')).toBeInTheDocument();
    });

    it('carries the status onto the row for the tone override', (): void => {
        render(
            <Timeline
                label="Mission log"
                items={[
                    { id: 'b', title: 'Contact lost', status: EUiStatus.Danger },
                ]}
            />,
        );
        expect(screen.getByRole('listitem').getAttribute('data-status')).toBe(
            'danger',
        );
    });
});
