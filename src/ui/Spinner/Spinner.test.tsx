import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from './Spinner';
import { ESpinnerSize } from './Spinner.types';

describe('Spinner', (): void => {
    it('announces as a politely named status', (): void => {
        render(<Spinner />);
        expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    });

    it('honors a custom label and size', (): void => {
        render(<Spinner label="Syncing telemetry" size={ESpinnerSize.Lg} />);
        const status: HTMLElement = screen.getByRole('status', {
            name: 'Syncing telemetry',
        });
        expect(status.getAttribute('data-size')).toBe('lg');
    });
});
