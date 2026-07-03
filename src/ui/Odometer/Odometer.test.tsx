import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Odometer } from './Odometer';

function columnDigits(container: HTMLElement): readonly string[] {
    return Array.from(container.querySelectorAll('[data-digit]')).map(
        (column: Element): string => column.getAttribute('data-digit') ?? '',
    );
}

describe('Odometer', (): void => {
    it('speaks the labelled value and hides the reels', (): void => {
        const view: { container: HTMLElement } = render(
            <Odometer label="Ammo" value={42} />,
        );
        expect(screen.getByRole('img', { name: 'Ammo: 42' })).toBeInTheDocument();
        expect(view.container.querySelector('[aria-hidden="true"]')).not.toBeNull();
        expect(columnDigits(view.container)).toEqual(['4', '2']);
    });

    it('zero-pads to minDigits but speaks the true value', (): void => {
        const view: { container: HTMLElement } = render(
            <Odometer label="Score" value={7} minDigits={3} />,
        );
        expect(screen.getByRole('img', { name: 'Score: 7' })).toBeInTheDocument();
        expect(columnDigits(view.container)).toEqual(['0', '0', '7']);
    });

    it('drives each reel through the digit custom property', (): void => {
        const view: { container: HTMLElement } = render(
            <Odometer label="Ammo" value={95} />,
        );
        const columns: readonly Element[] = Array.from(
            view.container.querySelectorAll('[data-digit]'),
        );
        expect(
            columns.map((column: Element): string =>
                column instanceof HTMLElement
                    ? column.style.getPropertyValue('--portal-odometer-digit')
                    : '',
            ),
        ).toEqual(['9', '5']);
    });

    it('keeps reel identity when the count gains a digit', (): void => {
        const view: {
            container: HTMLElement;
            rerender: (ui: Parameters<typeof render>[0]) => void;
        } = render(<Odometer label="Score" value={99} />);
        const onesBefore: Element | null = view.container.querySelector(
            '[data-digit]:last-child',
        );
        view.rerender(<Odometer label="Score" value={100} />);
        const onesAfter: Element | null = view.container.querySelector(
            '[data-digit]:last-child',
        );
        expect(columnDigits(view.container)).toEqual(['1', '0', '0']);
        // Place-keyed columns: the ones reel is the same DOM node.
        expect(onesAfter).toBe(onesBefore);
    });

    it('clamps garbage values to zero', (): void => {
        render(<Odometer label="Ammo" value={-5} />);
        expect(screen.getByRole('img', { name: 'Ammo: 0' })).toBeInTheDocument();
    });

    it('announces only when opted in', (): void => {
        const silent: { container: HTMLElement; unmount: () => void } = render(
            <Odometer label="Ammo" value={12} />,
        );
        expect(silent.container.querySelector('[aria-live]')).toBeNull();
        silent.unmount();
        const spoken: { container: HTMLElement } = render(
            <Odometer label="Ammo" value={12} announce={true} />,
        );
        expect(
            spoken.container.querySelector('[aria-live="polite"]')?.textContent,
        ).toBe('Ammo: 12');
    });
});
