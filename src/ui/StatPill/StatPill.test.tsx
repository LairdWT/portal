import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EUiStatus } from '../tone';
import { StatPill } from './StatPill';
import styles from './StatPill.module.css';

describe('StatPill', (): void => {
    it('renders the label and value as text', (): void => {
        render(<StatPill label="Energy" value={7} />);

        expect(screen.getByText('Energy')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('exposes a combined aria-label reading as one unit', (): void => {
        render(<StatPill label="Energy" value={7} />);

        expect(screen.getByLabelText('Energy 7')).toBeInTheDocument();
    });

    it('renders string values', (): void => {
        render(<StatPill label="Phase" value="combat" />);

        expect(screen.getByLabelText('Phase combat')).toBeInTheDocument();
        expect(screen.getByText('combat')).toBeInTheDocument();
    });

    it('applies tabular-nums via the value class', (): void => {
        render(<StatPill label="Energy" value={7} />);

        const valueClass: string | undefined = styles.value;
        expect(valueClass).toBeDefined();

        const valueElement: HTMLElement = screen.getByText('7');
        expect(valueElement).toHaveClass(valueClass ?? '');
    });

    it('applies the tone style to the root', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(<StatPill label="Hull" value={3} tone={toneColor} />);

        const pill: HTMLElement = screen.getByLabelText('Hull 3');
        expect(pill.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('surfaces the status as a data attribute', (): void => {
        render(<StatPill label="Hull" value={0} status={EUiStatus.Danger} />);

        const pill: HTMLElement = screen.getByLabelText('Hull 0');
        expect(pill).toHaveAttribute('data-status', EUiStatus.Danger);
    });
});
