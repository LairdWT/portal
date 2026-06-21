import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { Axis2D } from '../../input';
import { EEnabledState } from '../../state/state';
import { Joystick } from './Joystick';

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
