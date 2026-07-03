import {
    fireEvent,
    render,
    type RenderResult,
    screen,
} from '@testing-library/react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { Dial } from './Dial';

type ChangeCallback = (value: number) => void;
type CaptureCallback = (pointerId: number) => void;

// jsdom implements no pointer capture and no layout: stub the capture trio
// and a fixed square rect on the knob so the angular math sees a real center
// (the usePointerDrag.test pattern). The real-pixel twist is covered by the
// Playwright probe.
function installPointerStubs(element: HTMLElement, rect: DOMRect): void {
    element.setPointerCapture = vi.fn<CaptureCallback>();
    element.releasePointerCapture = vi.fn<CaptureCallback>();
    element.hasPointerCapture = vi.fn<(pointerId: number) => boolean>(
        (): boolean => true,
    );
    element.getBoundingClientRect = (): DOMRect => rect;
}

const KNOB_RECT: DOMRect = new DOMRect(0, 0, 100, 100);

describe('Dial', (): void => {
    it('renders the named slider with derived bounds', (): void => {
        render(<Dial label="Gain" value={35} />);
        const knob: HTMLElement = screen.getByRole('slider', { name: 'Gain' });
        expect(knob).toHaveAttribute('aria-valuemin', '0');
        expect(knob).toHaveAttribute('aria-valuemax', '100');
        expect(knob).toHaveAttribute('aria-valuenow', '35');
        expect(knob).toHaveAttribute('tabindex', '0');
    });

    it('reads a non-finite value as the floor', (): void => {
        render(<Dial label="Gain" value={Number.NaN} min={10} />);
        expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '10');
    });

    it('speaks the formatted value', (): void => {
        render(
            <Dial
                label="Gain"
                value={35}
                formatValueText={(value: number): string => `${String(value)} dB`}
            />,
        );
        expect(screen.getByRole('slider')).toHaveAttribute(
            'aria-valuetext',
            '35 dB',
        );
    });

    it('steps from the keyboard on both axes plus paging and jumps', (): void => {
        const handleChange: Mock<ChangeCallback> = vi.fn<ChangeCallback>();
        render(<Dial label="Gain" value={50} onChange={handleChange} />);
        const knob: HTMLElement = screen.getByRole('slider');
        fireEvent.keyDown(knob, { key: 'ArrowUp' });
        expect(handleChange).toHaveBeenLastCalledWith(51);
        fireEvent.keyDown(knob, { key: 'ArrowRight' });
        expect(handleChange).toHaveBeenLastCalledWith(51);
        fireEvent.keyDown(knob, { key: 'ArrowDown' });
        expect(handleChange).toHaveBeenLastCalledWith(49);
        fireEvent.keyDown(knob, { key: 'ArrowLeft' });
        expect(handleChange).toHaveBeenLastCalledWith(49);
        fireEvent.keyDown(knob, { key: 'PageUp' });
        expect(handleChange).toHaveBeenLastCalledWith(60);
        fireEvent.keyDown(knob, { key: 'PageDown' });
        expect(handleChange).toHaveBeenLastCalledWith(40);
        fireEvent.keyDown(knob, { key: 'Home' });
        expect(handleChange).toHaveBeenLastCalledWith(0);
        fireEvent.keyDown(knob, { key: 'End' });
        expect(handleChange).toHaveBeenLastCalledWith(100);
    });

    it('does not emit past the bounds', (): void => {
        const handleChange: Mock<ChangeCallback> = vi.fn<ChangeCallback>();
        render(<Dial label="Gain" value={100} onChange={handleChange} />);
        fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowUp' });
        expect(handleChange).not.toHaveBeenCalled();
    });

    it('ignores the keyboard and leaves the tab order when disabled', (): void => {
        const handleChange: Mock<ChangeCallback> = vi.fn<ChangeCallback>();
        render(
            <Dial
                label="Gain"
                value={50}
                onChange={handleChange}
                enabled={EEnabledState.Disabled}
            />,
        );
        const knob: HTMLElement = screen.getByRole('slider');
        expect(knob).toHaveAttribute('tabindex', '-1');
        expect(knob).toHaveAttribute('aria-disabled', 'true');
        fireEvent.keyDown(knob, { key: 'ArrowUp' });
        expect(handleChange).not.toHaveBeenCalled();
    });

    it('twists relatively: a quarter-sweep drag adds a third of the span', (): void => {
        const handleChange: Mock<ChangeCallback> = vi.fn<ChangeCallback>();
        render(<Dial label="Gain" value={0} onChange={handleChange} />);
        const knob: HTMLElement = screen.getByRole('slider');
        installPointerStubs(knob, KNOB_RECT);
        // Grab at 12 o'clock (angle 0) - the grab itself moves nothing.
        fireEvent.pointerDown(knob, {
            button: 0,
            pointerId: 1,
            clientX: 50,
            clientY: 10,
        });
        expect(handleChange).not.toHaveBeenCalled();
        // Twist to 3 o'clock (angle 90): +90 of the 270 sweep = +33.33 -> 33.
        fireEvent.pointerMove(knob, { pointerId: 1, clientX: 90, clientY: 50 });
        expect(handleChange).toHaveBeenLastCalledWith(33);
    });

    it('settles onto the nearest detent on release', (): void => {
        const handleChange: Mock<ChangeCallback> = vi.fn<ChangeCallback>();
        render(
            <Dial
                label="Gain"
                value={0}
                onChange={handleChange}
                detents={[0, 50, 100]}
            />,
        );
        const knob: HTMLElement = screen.getByRole('slider');
        installPointerStubs(knob, KNOB_RECT);
        fireEvent.pointerDown(knob, {
            button: 0,
            pointerId: 1,
            clientX: 50,
            clientY: 10,
        });
        fireEvent.pointerMove(knob, { pointerId: 1, clientX: 90, clientY: 50 });
        fireEvent.pointerUp(knob, { pointerId: 1, clientX: 90, clientY: 50 });
        // The live twist reached 33.33; the release settles to the 50 detent.
        expect(handleChange).toHaveBeenLastCalledWith(50);
    });
});

describe('Dial value readout and direct entry', (): void => {
    it('renders the formatted readout by default and hides it on showValue false', (): void => {
        const { rerender }: RenderResult = render(
            <Dial
                label="Gain"
                value={35}
                formatValueText={(value: number): string => `${String(value)} dB`}
            />,
        );
        expect(screen.getByText('35 dB')).toBeInTheDocument();
        rerender(<Dial label="Gain" value={35} showValue={false} />);
        expect(screen.queryByText('35')).not.toBeInTheDocument();
    });

    it('commits a typed value on Enter, clamped and quantized', (): void => {
        const handleChange: Mock<ChangeCallback> = vi.fn<ChangeCallback>();
        render(
            <Dial
                label="Gain"
                value={50}
                step={5}
                editable
                onChange={handleChange}
            />,
        );
        const entry: HTMLElement = screen.getByRole('textbox', {
            name: 'Gain value',
        });
        fireEvent.focus(entry);
        fireEvent.change(entry, { target: { value: '63' } });
        fireEvent.keyDown(entry, { key: 'Enter' });
        expect(handleChange).toHaveBeenLastCalledWith(65);
        handleChange.mockClear();
        fireEvent.focus(entry);
        fireEvent.change(entry, { target: { value: '900' } });
        fireEvent.keyDown(entry, { key: 'Enter' });
        expect(handleChange).toHaveBeenLastCalledWith(100);
    });

    it('commits on blur, reverts on Escape, and ignores a non-numeric draft', (): void => {
        const handleChange: Mock<ChangeCallback> = vi.fn<ChangeCallback>();
        render(<Dial label="Gain" value={50} editable onChange={handleChange} />);
        const entry: HTMLElement = screen.getByRole('textbox', {
            name: 'Gain value',
        });
        fireEvent.focus(entry);
        fireEvent.change(entry, { target: { value: '72' } });
        fireEvent.blur(entry);
        expect(handleChange).toHaveBeenLastCalledWith(72);
        handleChange.mockClear();
        fireEvent.focus(entry);
        fireEvent.change(entry, { target: { value: '81' } });
        fireEvent.keyDown(entry, { key: 'Escape' });
        expect(handleChange).not.toHaveBeenCalled();
        expect(entry).toHaveValue('50');
        fireEvent.focus(entry);
        fireEvent.change(entry, { target: { value: 'full power' } });
        fireEvent.blur(entry);
        expect(handleChange).not.toHaveBeenCalled();
    });

    it('falls back to the plain readout while disabled even when editable', (): void => {
        render(
            <Dial
                label="Gain"
                value={35}
                editable
                enabled={EEnabledState.Disabled}
            />,
        );
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.getByText('35')).toBeInTheDocument();
    });
});
