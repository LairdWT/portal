import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Slider } from './Slider';

const SLIDER_LABEL: string = 'Volume';

describe('Slider', (): void => {
    it('renders no aria-valuetext when no formatter is supplied', (): void => {
        render(<Slider label={SLIDER_LABEL} value={40} />);

        const slider: HTMLElement = screen.getByRole('slider', {
            name: SLIDER_LABEL,
        });
        expect(slider).not.toHaveAttribute('aria-valuetext');
    });

    it('announces the formatted value text when a formatter is supplied', (): void => {
        const formatValueText: (value: number) => string = (
            value: number,
        ): string => `${String(value)} percent`;
        render(
            <Slider
                label={SLIDER_LABEL}
                value={40}
                formatValueText={formatValueText}
            />,
        );

        const slider: HTMLElement = screen.getByRole('slider', {
            name: SLIDER_LABEL,
        });
        expect(slider).toHaveAttribute('aria-valuetext', '40 percent');
    });
});
