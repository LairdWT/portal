import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import toneStyles from '../tone.module.css';
import { Scanlines } from './Scanlines';
import styles from './Scanlines.module.css';
import { EScanlineExtent, EScanlineFlicker } from './Scanlines.types';

// axe coverage is delivered by the stories (Scanlines.stories.tsx) under the
// addon-a11y story gate, consistent with the repo (Section/Select/Toast rely on
// the story gate rather than jest-axe here). The root is aria-hidden, so it is
// queried via its data-testid. This component has NO callback props, so there
// are no vi.fn() mocks to type. jsdom applies no CSS cascade, so the
// pointer-events:none and positioning contract is asserted via the class and
// data attributes rather than painted geometry.

describe('Scanlines', (): void => {
    afterEach((): void => {
        vi.restoreAllMocks();
    });

    it('renders a single aria-hidden root with no required props', (): void => {
        const container: HTMLElement = render(<Scanlines />).container;

        const root: HTMLElement = screen.getByTestId('scanlines');
        expect(container.childNodes).toHaveLength(1);
        expect(root).toHaveAttribute('aria-hidden', 'true');
    });

    it('carries the tone scope and overlay classes', (): void => {
        render(<Scanlines />);

        const root: HTMLElement = screen.getByTestId('scanlines');
        const rootClass: string | undefined = styles.root;
        const toneScopeClass: string | undefined = toneStyles.toneScope;
        if (rootClass === undefined) {
            throw new Error('Scanlines.module.css did not export a .root class');
        }
        if (toneScopeClass === undefined) {
            throw new Error('tone.module.css did not export a .toneScope class');
        }
        expect(root).toHaveClass(rootClass);
        expect(root).toHaveClass(toneScopeClass);
    });

    it('contributes no interactive role and is not focusable', (): void => {
        render(<Scanlines />);

        const root: HTMLElement = screen.getByTestId('scanlines');
        expect(root).not.toHaveAttribute('role');
        expect(root).not.toHaveAttribute('tabindex');
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('defaults the extent to contained', (): void => {
        render(<Scanlines />);

        expect(screen.getByTestId('scanlines')).toHaveAttribute(
            'data-extent',
            EScanlineExtent.Contained,
        );
    });

    it('reflects the fixed extent', (): void => {
        render(<Scanlines extent={EScanlineExtent.Fixed} />);

        expect(screen.getByTestId('scanlines')).toHaveAttribute(
            'data-extent',
            EScanlineExtent.Fixed,
        );
    });

    it('defaults the flicker to none', (): void => {
        render(<Scanlines />);

        expect(screen.getByTestId('scanlines')).toHaveAttribute(
            'data-flicker',
            EScanlineFlicker.None,
        );
    });

    it('reflects the subtle flicker', (): void => {
        render(<Scanlines flicker={EScanlineFlicker.Subtle} />);

        expect(screen.getByTestId('scanlines')).toHaveAttribute(
            'data-flicker',
            EScanlineFlicker.Subtle,
        );
    });

    it('applies the tone custom property when a tone is supplied', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(<Scanlines tone={toneColor} />);

        const root: HTMLElement = screen.getByTestId('scanlines');
        expect(root.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('sets no tone custom property when no tone is supplied', (): void => {
        render(<Scanlines />);

        const root: HTMLElement = screen.getByTestId('scanlines');
        expect(root.style.getPropertyValue('--portal-tone')).toBe('');
    });

    it('sets the pitch and alpha custom properties from props', (): void => {
        render(<Scanlines pitch="4px" opacity={0.2} />);

        const root: HTMLElement = screen.getByTestId('scanlines');
        expect(root.style.getPropertyValue('--portal-scanline-pitch')).toBe('4px');
        expect(root.style.getPropertyValue('--portal-scanline-alpha')).toBe('0.2');
    });

    it('sets neither pitch nor alpha when the props are omitted', (): void => {
        render(<Scanlines />);

        const root: HTMLElement = screen.getByTestId('scanlines');
        expect(root.style.getPropertyValue('--portal-scanline-pitch')).toBe('');
        expect(root.style.getPropertyValue('--portal-scanline-alpha')).toBe('');
    });

    it('renders without logging a console error', (): void => {
        const errorSpy: ReturnType<typeof vi.spyOn> = vi
            .spyOn(console, 'error')
            .mockImplementation((): void => undefined);

        render(<Scanlines />);

        expect(errorSpy).not.toHaveBeenCalled();
    });
});
