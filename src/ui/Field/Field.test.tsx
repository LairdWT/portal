import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Field } from './Field';
import type { FieldControlProps } from './Field.types';

describe('Field', (): void => {
    it('associates the label with the wired control id', (): void => {
        render(
            <Field label="Callsign">
                {(control: FieldControlProps) => <input {...control} />}
            </Field>,
        );
        const input: HTMLElement = screen.getByLabelText('Callsign');
        expect(input.tagName).toBe('INPUT');
    });

    it('wires hint and error into aria-describedby and marks invalid', (): void => {
        render(
            <Field label="Callsign" hint="Three letters." error="Too short.">
                {(control: FieldControlProps) => <input {...control} />}
            </Field>,
        );
        const input: HTMLElement = screen.getByLabelText('Callsign');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('Three letters.')).toBeInTheDocument();
        expect(screen.getByText('Too short.')).toBeInTheDocument();
        const describedBy: string = input.getAttribute('aria-describedby') ?? '';
        const hintId: string = screen.getByText('Three letters.').id;
        const errorId: string = screen.getByText('Too short.').id;
        expect(describedBy).toContain(hintId);
        expect(describedBy).toContain(errorId);
    });

    it('passes no description wiring when neither hint nor error exists', (): void => {
        render(
            <Field label="Callsign">
                {(control: FieldControlProps) => <input {...control} />}
            </Field>,
        );
        const input: HTMLElement = screen.getByLabelText('Callsign');
        expect(input.getAttribute('aria-describedby')).toBeNull();
        expect(input.getAttribute('aria-invalid')).toBeNull();
    });

    it('marks the control required and renders the visible marker', (): void => {
        const view: { container: HTMLElement } = render(
            <Field label="Callsign" required>
                {(control: FieldControlProps) => <input {...control} />}
            </Field>,
        );
        const input: HTMLElement = screen.getByLabelText('Callsign');
        expect(input).toHaveAttribute('aria-required', 'true');
        expect(view.container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });

    it('honors a caller-supplied id', (): void => {
        render(
            <Field label="Callsign" id="callsign-input">
                {(control: FieldControlProps) => <input {...control} />}
            </Field>,
        );
        expect(screen.getByLabelText('Callsign').id).toBe('callsign-input');
    });
});
