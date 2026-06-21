import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { Axis2D } from '../../input';
import { EEnabledState } from '../../state/state';
import { Thumbpad } from './Thumbpad';

const PAD_LABEL: string = 'Movement';
const ACTIVE_POINTER_ID: number = 7;

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
