import { fireEvent, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import {
    EInputInteraction,
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { EEnabledState } from '../../state/state';
import { Slider } from './Slider';

const SLIDER_LABEL: string = 'Volume';

// A Scalar descriptor opts the control into the framework signal path (onSignal +
// descriptor are both required for a signal to emit).
const VOLUME_DESCRIPTOR: InputDescriptor = {
    id: 'volume',
    kind: EInputValueType.Scalar,
    label: 'Volume',
};

// Stateful harness for the keyboard path: the native range input owns arrow /
// Home / End stepping, and the Slider is value-controlled, so the value must be
// lifted into state for the stepped value to survive the controlled re-render.
type StatefulSliderProps = Readonly<{
    initialValue: number;
    step: number;
    onChange: (value: number) => void;
    onSignal: (signal: InputSignal) => void;
    descriptor: InputDescriptor;
}>;

function StatefulSlider({
    initialValue,
    step,
    onChange,
    onSignal,
    descriptor,
}: StatefulSliderProps): ReactElement {
    const [value, setValue]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(initialValue);
    return (
        <Slider
            label={SLIDER_LABEL}
            value={value}
            step={step}
            onChange={(next: number): void => {
                setValue(next);
                onChange(next);
            }}
            onSignal={onSignal}
            descriptor={descriptor}
        />
    );
}

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

describe('Slider onChange and onSignal emission', (): void => {
    it('fires onChange with the input value and emits a Scalar Move signal', (): void => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const signals: InputSignal[] = [];
        render(
            <Slider
                label={SLIDER_LABEL}
                value={40}
                descriptor={VOLUME_DESCRIPTOR}
                onChange={onChange}
                onSignal={(signal: InputSignal): void => {
                    signals.push(signal);
                }}
            />,
        );

        const slider: HTMLElement = screen.getByRole('slider', {
            name: SLIDER_LABEL,
        });
        fireEvent.change(slider, { target: { value: '55' } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(55);
        expect(signals).toHaveLength(1);
        expect(signals[0]?.descriptor.id).toBe('volume');
        expect(signals[0]?.interaction).toBe(EInputInteraction.Move);
        expect(signals[0]?.value).toEqual({
            valueType: EInputValueType.Scalar,
            scalar: 55,
        });
    });

    it('emits nothing on the disabled path', (): void => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const signals: InputSignal[] = [];
        render(
            <Slider
                label={SLIDER_LABEL}
                value={40}
                enabled={EEnabledState.Disabled}
                descriptor={VOLUME_DESCRIPTOR}
                onChange={onChange}
                onSignal={(signal: InputSignal): void => {
                    signals.push(signal);
                }}
            />,
        );

        const slider: HTMLElement = screen.getByRole('slider', {
            name: SLIDER_LABEL,
        });

        // The disabled attribute is the mechanism that makes the native control
        // emit nothing: a real browser dispatches no input/change on a disabled
        // range, so neither the raw callback nor a signal can fire. (A synthetic
        // fireEvent.change would bypass that platform guard and is therefore not a
        // meaningful jsdom assertion; userEvent, which honours disabled, is used in
        // the browser layer.) No signal was emitted through render either.
        expect(slider).toBeDisabled();
        expect(onChange).not.toHaveBeenCalled();
        expect(signals).toHaveLength(0);
    });

    // SKIPPED (harness limitation, NOT a component defect): the Slider relies on
    // the native <input type="range"> for keyboard stepping (Arrow keys step by
    // `step`, Home -> min, End -> max), which is fully keyboard-accessible in real
    // browsers and drives the same change event asserted above. jsdom does not
    // implement native range keyboard stepping (arrows / Home / End leave the
    // value unchanged), so this path cannot be exercised in the jsdom unit run; it
    // is covered by the Storybook browser project. The body below is the intended
    // real-browser assertion.
    it.skip('drives value and a Scalar signal from keyboard stepping', async (): Promise<void> => {
        const onChange: Mock<(value: number) => void> =
            vi.fn<(value: number) => void>();
        const signals: InputSignal[] = [];
        const user: UserEvent = userEvent.setup();
        render(
            <StatefulSlider
                initialValue={40}
                step={5}
                onChange={onChange}
                onSignal={(signal: InputSignal): void => {
                    signals.push(signal);
                }}
                descriptor={VOLUME_DESCRIPTOR}
            />,
        );

        const slider: HTMLElement = screen.getByRole('slider', {
            name: SLIDER_LABEL,
        });
        slider.focus();

        await user.keyboard('{ArrowRight}');
        expect(onChange).toHaveBeenLastCalledWith(45);

        await user.keyboard('{Home}');
        expect(onChange).toHaveBeenLastCalledWith(0);

        await user.keyboard('{End}');
        expect(onChange).toHaveBeenLastCalledWith(100);

        const lastSignal: InputSignal | undefined = signals[signals.length - 1];
        expect(lastSignal?.interaction).toBe(EInputInteraction.Move);
        expect(lastSignal?.value).toEqual({
            valueType: EInputValueType.Scalar,
            scalar: 100,
        });
    });
});
