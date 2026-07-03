import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Reticle } from './Reticle';
import { EReticleVariant } from './Reticle.types';

describe('Reticle', (): void => {
    it('renders a purely decorative presentation glyph', (): void => {
        const view: { container: HTMLElement } = render(<Reticle />);
        const root: Element | null = view.container.querySelector(
            '[role="presentation"]',
        );
        expect(root).not.toBeNull();
        expect(root?.getAttribute('aria-hidden')).toBe('true');
        expect(root?.getAttribute('data-variant')).toBe('cross');
    });

    it('draws the parts of each variant', (): void => {
        const cross: { container: HTMLElement; unmount: () => void } = render(
            <Reticle variant={EReticleVariant.Cross} />,
        );
        expect(cross.container.querySelectorAll('[data-position]')).toHaveLength(4);
        cross.unmount();

        const brackets: { container: HTMLElement; unmount: () => void } = render(
            <Reticle variant={EReticleVariant.Brackets} />,
        );
        expect(brackets.container.querySelectorAll('[data-corner]')).toHaveLength(
            4,
        );
        brackets.unmount();

        const circle: { container: HTMLElement } = render(
            <Reticle variant={EReticleVariant.Circle} />,
        );
        expect(circle.container.querySelectorAll('span').length).toBeGreaterThan(2);
    });

    it('clamps the spread into the custom property', (): void => {
        const view: { container: HTMLElement; rerender: (ui: never) => void } =
            render(<Reticle spreadPx={6} />);
        const root: HTMLElement | null = view.container.querySelector(
            '[role="presentation"]',
        );
        expect(root?.style.getPropertyValue('--portal-reticle-spread')).toBe('6px');

        const negative: { container: HTMLElement } = render(
            <Reticle spreadPx={-10} />,
        );
        const negativeRoot: HTMLElement | null = negative.container.querySelector(
            '[role="presentation"]',
        );
        expect(
            negativeRoot?.style.getPropertyValue('--portal-reticle-spread'),
        ).toBe('0px');
    });

    it('mounts the hit flash only for positive tokens', (): void => {
        const idle: { container: HTMLElement; unmount: () => void } = render(
            <Reticle />,
        );
        // Cross arms (4) + dot = 5 spans at rest.
        expect(idle.container.querySelectorAll('span')).toHaveLength(6);
        idle.unmount();

        const hit: { container: HTMLElement } = render(<Reticle hitToken={2} />);
        expect(hit.container.querySelectorAll('span')).toHaveLength(7);
    });
});
