import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
    type Axis2D,
    EInputInteraction,
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { EEnabledState } from '../../state/state';
import { Joystick } from './Joystick';

const PAD_LABEL: string = 'Movement';
const ACTIVE_POINTER_ID: number = 7;

// An Axis2D descriptor opts the stick into the framework signal path.
const STICK_DESCRIPTOR: InputDescriptor = {
    id: 'stick',
    kind: EInputValueType.Axis2D,
    label: 'Movement stick',
};

// The pad surface is the first child of the labelled group.
function getSurface(): Element {
    const group: HTMLElement = screen.getByRole('group', { name: PAD_LABEL });
    const surface: Element | null = group.firstElementChild;
    if (surface === null) {
        throw new Error('Expected a pointer surface element.');
    }
    return surface;
}

// Narrow a signal to its Axis2D value and return the vector magnitude.
function axisMagnitude(signal: InputSignal | undefined): number {
    if (signal === undefined) {
        throw new Error('Expected an emitted signal.');
    }
    if (signal.value.valueType !== EInputValueType.Axis2D) {
        throw new Error('Expected an Axis2D value.');
    }
    return Math.hypot(signal.value.axis.x, signal.value.axis.y);
}

const PAD_RECT: DOMRect = {
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    left: 0,
    top: 0,
    right: 200,
    bottom: 200,
    toJSON: (): Record<string, never> => ({}),
};

function definePointerCaptureStubs(): void {
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
        configurable: true,
        value: (): void => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
        configurable: true,
        value: (): void => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
        configurable: true,
        value: (): boolean => true,
    });
}

function removePointerCaptureStubs(): void {
    delete (HTMLElement.prototype as Partial<HTMLElement>).setPointerCapture;
    delete (HTMLElement.prototype as Partial<HTMLElement>).releasePointerCapture;
    delete (HTMLElement.prototype as Partial<HTMLElement>).hasPointerCapture;
}

beforeEach((): void => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
        (): DOMRect => PAD_RECT,
    );
    definePointerCaptureStubs();
});

afterEach((): void => {
    vi.restoreAllMocks();
    removePointerCaptureStubs();
});

describe('Joystick', () => {
    it('reports an absolute axis on pointer down, then recentres on up', () => {
        const onAxisChange: Mock<(axis: Axis2D) => void> =
            vi.fn<(axis: Axis2D) => void>();
        render(
            <Joystick label={PAD_LABEL} deadZone={0} onAxisChange={onAxisChange} />,
        );

        const group: HTMLElement = screen.getByRole('group', {
            name: PAD_LABEL,
        });
        const surface: Element | null = group.firstElementChild;
        if (surface === null) {
            throw new Error('Expected a pointer surface element.');
        }

        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 100,
        });
        const downAxis: Axis2D | undefined = onAxisChange.mock.lastCall?.[0];
        expect(downAxis?.x).toBeGreaterThan(0);

        fireEvent.pointerUp(surface, { pointerId: ACTIVE_POINTER_ID });
        const resetAxis: Axis2D | undefined = onAxisChange.mock.lastCall?.[0];
        expect(resetAxis).toEqual({ x: 0, y: 0 });
    });

    it('changes the axis when an axis slider value changes', () => {
        const onAxisChange: Mock<(axis: Axis2D) => void> =
            vi.fn<(axis: Axis2D) => void>();
        render(<Joystick label={PAD_LABEL} onAxisChange={onAxisChange} />);

        const horizontal: HTMLInputElement = screen.getByLabelText(
            `${PAD_LABEL} horizontal axis`,
        );

        fireEvent.change(horizontal, { target: { value: '0.5' } });

        const axis: Axis2D | undefined = onAxisChange.mock.lastCall?.[0];
        expect(axis?.x).toBeCloseTo(0.5);
        expect(axis?.y).toBeCloseTo(0);
    });

    it('disables both axis sliders when disabled', () => {
        render(<Joystick label={PAD_LABEL} enabled={EEnabledState.Disabled} />);

        const horizontal: HTMLInputElement = screen.getByLabelText(
            `${PAD_LABEL} horizontal axis`,
        );
        const vertical: HTMLInputElement = screen.getByLabelText(
            `${PAD_LABEL} vertical axis`,
        );

        expect(horizontal).toBeDisabled();
        expect(vertical).toBeDisabled();
    });

    it('shows focus within the group when an axis slider is focused', () => {
        render(<Joystick label={PAD_LABEL} />);

        const group: HTMLElement = screen.getByRole('group', { name: PAD_LABEL });
        const horizontal: HTMLInputElement = screen.getByLabelText(
            `${PAD_LABEL} horizontal axis`,
        );

        horizontal.focus();
        expect(group).toContainElement(horizontal);
        expect(document.activeElement).toBe(horizontal);
    });
});

describe('Joystick onSignal emission', () => {
    it('emits Axis2D Move signals through a pointer gesture and a neutral Move on release', () => {
        const signals: InputSignal[] = [];
        render(
            <Joystick
                label={PAD_LABEL}
                deadZone={0}
                descriptor={STICK_DESCRIPTOR}
                onSignal={(signal: InputSignal): void => {
                    signals.push(signal);
                }}
            />,
        );
        const surface: Element = getSurface();

        // Right-edge centre resolves to a full +x axis.
        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 100,
        });
        // Half-way to the right edge resolves to +x 0.5.
        fireEvent.pointerMove(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 150,
            clientY: 100,
        });
        // Release springs the absolute stick back to centre (a neutral Move).
        fireEvent.pointerUp(surface, { pointerId: ACTIVE_POINTER_ID });

        expect(signals).toHaveLength(3);
        for (const signal of signals) {
            expect(signal.interaction).toBe(EInputInteraction.Move);
            expect(signal.value.valueType).toBe(EInputValueType.Axis2D);
            expect(signal.descriptor.id).toBe('stick');
        }
        expect(signals[0]?.value).toEqual({
            valueType: EInputValueType.Axis2D,
            axis: { x: 1, y: 0 },
        });
        expect(signals[1]?.value).toEqual({
            valueType: EInputValueType.Axis2D,
            axis: { x: 0.5, y: 0 },
        });
        expect(signals[2]?.value).toEqual({
            valueType: EInputValueType.Axis2D,
            axis: { x: 0, y: 0 },
        });
    });

    it('dead-zones and unit-clamps the emitted axis', () => {
        const signals: InputSignal[] = [];
        render(
            <Joystick
                label={PAD_LABEL}
                deadZone={0.2}
                descriptor={STICK_DESCRIPTOR}
                onSignal={(signal: InputSignal): void => {
                    signals.push(signal);
                }}
            />,
        );
        const surface: Element = getSurface();

        // Raw magnitude 0.75 is rescaled through the 0.2 dead zone to
        // (0.75 - 0.2) / 0.8 = 0.6875, strictly less than the raw input.
        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 175,
            clientY: 100,
        });
        // The top-right corner is raw magnitude sqrt(2); the spine clamps it to the
        // unit circle before the dead zone, so the emitted magnitude is 1.
        fireEvent.pointerMove(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 0,
        });
        fireEvent.pointerUp(surface, { pointerId: ACTIVE_POINTER_ID });

        expect(axisMagnitude(signals[0])).toBeCloseTo(0.6875);
        expect(axisMagnitude(signals[1])).toBeCloseTo(1);
    });
});
