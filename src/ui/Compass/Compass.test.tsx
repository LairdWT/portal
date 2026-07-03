import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Compass } from './Compass';

describe('Compass', (): void => {
    it('speaks the labelled heading readout', (): void => {
        // 73 degrees sits past the 67.5 midpoint, so the cardinal reads E.
        render(<Compass label="Bearing" heading={73} />);
        expect(
            screen.getByRole('img', { name: 'Bearing: heading 073 E' }),
        ).toBeInTheDocument();
        expect(screen.getByText('073 E')).toBeInTheDocument();
        expect(screen.getByText('Bearing')).toBeInTheDocument();
    });

    it('normalizes the heading and honors a custom format', (): void => {
        render(
            <Compass
                label="Bearing"
                heading={-90}
                formatHeading={(degrees: number): string =>
                    `${String(degrees)} degrees`
                }
            />,
        );
        expect(
            screen.getByRole('img', { name: 'Bearing: heading 270 degrees' }),
        ).toBeInTheDocument();
    });

    it('windows the rose ticks around the heading', (): void => {
        const view: { container: HTMLElement } = render(
            <Compass label="Bearing" heading={90} />,
        );
        // 90-degree span at step 15 = 7 ticks; majors NE / E / SE visible.
        expect(view.container.querySelectorAll('[data-major]')).toHaveLength(3);
        expect(screen.getByText('E')).toBeInTheDocument();
        expect(screen.getByText('NE')).toBeInTheDocument();
        expect(screen.getByText('SE')).toBeInTheDocument();
        // The heading tick sits dead center.
        const east: HTMLElement = screen.getByText('E');
        expect(east.parentElement?.style.left).toBe('50%');
    });

    it('wraps the tape across the north seam', (): void => {
        render(<Compass label="Bearing" heading={0} />);
        expect(screen.getByText('N')).toBeInTheDocument();
        expect(screen.getByText('NW')).toBeInTheDocument();
        expect(screen.getByText('NE')).toBeInTheDocument();
    });
});
