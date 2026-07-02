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
import { Thumbpad } from './Thumbpad';

const PAD_LABEL: string = 'Movement';
const ACTIVE_POINTER_ID: number = 7;

// An Axis2D descriptor opts the look surface into the framework signal path.
const LOOK_DESCRIPTOR: InputDescriptor = {
    id: 'look',
    kind: EInputValueType.Axis2D,
    label: 'Look',
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

// jsdom does not define the pointer-capture methods; the pointer hook calls
// them on down and up. Define no-op stubs as configurable own properties so
// they can be removed after the suite.
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

// jsdom returns a zero rect by default, which would collapse every axis to the
// centre; spy on getBoundingClientRect so the pointer spine resolves a real
// vector.
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

describe('Thumbpad', () => {
    it('reports incremental pointer deltas and emits nothing on gesture end', () => {
        const onDelta: Mock<(delta: Axis2D) => void> =
            vi.fn<(delta: Axis2D) => void>();
        render(<Thumbpad label={PAD_LABEL} onDelta={onDelta} />);

        const group: HTMLElement = screen.getByRole('group', {
            name: PAD_LABEL,
        });
        const surface: Element | null = group.firstElementChild;
        if (surface === null) {
            throw new Error('Expected a pointer surface element.');
        }

        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 100,
            clientY: 100,
        });
        // No delta on down; the first sample only seeds the origin.
        expect(onDelta).not.toHaveBeenCalled();

        fireEvent.pointerMove(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 150,
            clientY: 100,
        });
        const firstDelta: Axis2D | undefined = onDelta.mock.lastCall?.[0];
        // Rect is 200 wide, half-width 100; a 50px move yields delta x = 0.5.
        expect(firstDelta?.x).toBeCloseTo(0.5);
        expect(firstDelta?.y).toBeCloseTo(0);

        fireEvent.pointerMove(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 100,
        });
        // Delta is relative to the PREVIOUS sample (150), not the origin.
        const secondDelta: Axis2D | undefined = onDelta.mock.lastCall?.[0];
        expect(secondDelta?.x).toBeCloseTo(0.5);

        const callsBeforeUp: number = onDelta.mock.calls.length;
        fireEvent.pointerUp(surface, { pointerId: ACTIVE_POINTER_ID });
        // A relative surface emits no reset value on gesture end.
        expect(onDelta.mock.calls.length).toBe(callsBeforeUp);
    });

    it('emits a relative delta when an axis slider value changes', () => {
        const onDelta: Mock<(delta: Axis2D) => void> =
            vi.fn<(delta: Axis2D) => void>();
        render(<Thumbpad label={PAD_LABEL} onDelta={onDelta} />);

        const horizontal: HTMLInputElement = screen.getByLabelText(
            `${PAD_LABEL} horizontal look`,
        );
        const vertical: HTMLInputElement = screen.getByLabelText(
            `${PAD_LABEL} vertical look`,
        );

        fireEvent.change(horizontal, { target: { value: '0.1' } });
        const firstDelta: Axis2D | undefined = onDelta.mock.lastCall?.[0];
        expect(firstDelta?.x).toBeCloseTo(0.1);
        expect(firstDelta?.y).toBeCloseTo(0);

        // Moving the other slider reports the delta from the previous offset.
        fireEvent.change(vertical, { target: { value: '-0.1' } });
        const secondDelta: Axis2D | undefined = onDelta.mock.lastCall?.[0];
        expect(secondDelta?.x).toBeCloseTo(0);
        expect(secondDelta?.y).toBeCloseTo(-0.1);
    });

    it('disables both axis sliders when disabled', () => {
        render(<Thumbpad label={PAD_LABEL} enabled={EEnabledState.Disabled} />);

        const horizontal: HTMLInputElement = screen.getByLabelText(
            `${PAD_LABEL} horizontal look`,
        );
        const vertical: HTMLInputElement = screen.getByLabelText(
            `${PAD_LABEL} vertical look`,
        );

        expect(horizontal).toBeDisabled();
        expect(vertical).toBeDisabled();
    });
});

describe('Thumbpad onSignal emission', () => {
    it('emits an Axis2D Move delta per pointer move and nothing on gesture end', () => {
        const signals: InputSignal[] = [];
        render(
            <Thumbpad
                label={PAD_LABEL}
                descriptor={LOOK_DESCRIPTOR}
                onSignal={(signal: InputSignal): void => {
                    signals.push(signal);
                }}
            />,
        );
        const surface: Element = getSurface();

        // Pointer down only seeds the origin; a relative surface emits no delta.
        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 100,
            clientY: 100,
        });
        expect(signals).toHaveLength(0);

        // A 50px move on the 200px-wide pad is a +x delta of 0.5.
        fireEvent.pointerMove(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 150,
            clientY: 100,
        });
        // The next delta is relative to the PREVIOUS sample (150), not the origin.
        fireEvent.pointerMove(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 100,
        });

        expect(signals).toHaveLength(2);
        for (const signal of signals) {
            expect(signal.interaction).toBe(EInputInteraction.Move);
            expect(signal.value.valueType).toBe(EInputValueType.Axis2D);
            expect(signal.descriptor.id).toBe('look');
        }
        expect(signals[0]?.value).toEqual({
            valueType: EInputValueType.Axis2D,
            axis: { x: 0.5, y: 0 },
        });
        expect(signals[1]?.value).toEqual({
            valueType: EInputValueType.Axis2D,
            axis: { x: 0.5, y: 0 },
        });

        // A relative surface has no origin to spring back to, so gesture end emits
        // no neutral/reset signal.
        const countBeforeEnd: number = signals.length;
        fireEvent.pointerUp(surface, { pointerId: ACTIVE_POINTER_ID });
        expect(signals).toHaveLength(countBeforeEnd);
    });
});
