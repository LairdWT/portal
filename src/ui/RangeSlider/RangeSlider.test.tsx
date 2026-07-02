import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { describe, expect, it } from 'vitest';

import { EEnabledState } from '../../state/state';
import { RangeSlider } from './RangeSlider';
import type { RangeSliderValue } from './RangeSlider.types';

// Controlled harness so keyboard edits flow through real state updates.
function RangeHarness({
    initial,
    min,
    max,
    step,
    formatValue,
}: Readonly<{
    initial: RangeSliderValue;
    min?: number;
    max?: number;
    step?: number;
    formatValue?: (value: number) => string;
}>): ReactElement {
    const [value, setValue]: [
        RangeSliderValue,
        Dispatch<SetStateAction<RangeSliderValue>>,
    ] = useState<RangeSliderValue>(initial);
    return (
        <RangeSlider
            label="Signal window"
            value={value}
            onValueChange={setValue}
            min={min}
            max={max}
            step={step}
            formatValue={formatValue}
        />
    );
}

describe('RangeSlider', (): void => {
    it('renders two named sliders with effective bounds', (): void => {
        render(
            <RangeSlider
                label="Signal window"
                value={{ lower: 20, upper: 80 }}
                onValueChange={(): void => {
                    // Static render assertion; no edit occurs.
                }}
            />,
        );
        const lower: HTMLElement = screen.getByRole('slider', {
            name: 'Minimum',
        });
        const upper: HTMLElement = screen.getByRole('slider', {
            name: 'Maximum',
        });
        expect(lower).toHaveAttribute('aria-valuenow', '20');
        expect(lower).toHaveAttribute('aria-valuemin', '0');
        // Each thumb's reachable bound is the sibling, not the track edge.
        expect(lower).toHaveAttribute('aria-valuemax', '80');
        expect(upper).toHaveAttribute('aria-valuemin', '20');
        expect(upper).toHaveAttribute('aria-valuemax', '100');
    });

    it('steps with the arrow keys and pages with PageUp/PageDown', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<RangeHarness initial={{ lower: 20, upper: 80 }} />);
        const lower: HTMLElement = screen.getByRole('slider', {
            name: 'Minimum',
        });
        lower.focus();
        await user.keyboard('{ArrowRight}');
        expect(lower).toHaveAttribute('aria-valuenow', '21');
        await user.keyboard('{ArrowDown}');
        expect(lower).toHaveAttribute('aria-valuenow', '20');
        await user.keyboard('{PageUp}');
        expect(lower).toHaveAttribute('aria-valuenow', '30');
    });

    it('clamps the thumbs against each other so the pair never crosses', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<RangeHarness initial={{ lower: 40, upper: 42 }} />);
        const lower: HTMLElement = screen.getByRole('slider', {
            name: 'Minimum',
        });
        lower.focus();
        // End takes the lower thumb to its effective max: the upper value.
        await user.keyboard('{End}');
        expect(lower).toHaveAttribute('aria-valuenow', '42');
        await user.keyboard('{ArrowRight}');
        expect(lower).toHaveAttribute('aria-valuenow', '42');
    });

    it('quantizes fractional steps without float artifacts', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <RangeHarness
                initial={{ lower: 0.2, upper: 0.8 }}
                min={0}
                max={1}
                step={0.1}
            />,
        );
        const lower: HTMLElement = screen.getByRole('slider', {
            name: 'Minimum',
        });
        lower.focus();
        await user.keyboard('{ArrowRight}');
        expect(lower).toHaveAttribute('aria-valuenow', '0.3');
    });

    it('feeds formatValue into aria-valuetext', (): void => {
        render(
            <RangeHarness
                initial={{ lower: 20, upper: 80 }}
                formatValue={(value: number): string => `${String(value)} %`}
            />,
        );
        expect(screen.getByRole('slider', { name: 'Minimum' })).toHaveAttribute(
            'aria-valuetext',
            '20 %',
        );
    });

    it('removes the thumbs from the tab order when disabled', (): void => {
        render(
            <RangeSlider
                label="Signal window"
                value={{ lower: 20, upper: 80 }}
                onValueChange={(): void => {
                    // Disabled: no edit can occur.
                }}
                enabled={EEnabledState.Disabled}
            />,
        );
        const lower: HTMLElement = screen.getByRole('slider', {
            name: 'Minimum',
        });
        expect(lower).toHaveAttribute('tabindex', '-1');
        expect(lower).toHaveAttribute('aria-disabled', 'true');
    });
});
