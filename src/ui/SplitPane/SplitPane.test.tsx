// Behavior tests for SplitPane (render, ARIA, keyboard, pointer drag, clamp,
// disabled, tone). The pointer-drag path drives usePointerDrag through the
// component; the hook also has its own unit test. axe coverage is delivered by
// the stories under the addon-a11y story gate (Select/Toast/Accordion rely on
// the same gate), not jest-axe here.

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { SplitPane } from './SplitPane';
import { ESplitOrientation } from './SplitPane.types';

const LABEL: string = 'Resize panels';

// jsdom implements neither pointer capture nor layout, so the separator's
// capture methods are stubbed and the frame rect is mocked for the drag math.
function primeSeparator(separator: HTMLElement): void {
    separator.setPointerCapture = vi.fn<(pointerId: number) => void>();
    separator.releasePointerCapture = vi.fn<(pointerId: number) => void>();
    separator.hasPointerCapture = vi.fn<(pointerId: number) => boolean>(
        (): boolean => false,
    );
}

function mockFrameRect(width: number, height: number): void {
    const frame: HTMLElement = screen.getByRole('group');
    frame.getBoundingClientRect = vi.fn<() => DOMRect>(
        (): DOMRect => new DOMRect(0, 0, width, height),
    );
}

describe('SplitPane', (): void => {
    it('renders both pane bodies and a separator', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.5}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        expect(screen.getByText('PRIMARY')).toBeInTheDocument();
        expect(screen.getByText('SECONDARY')).toBeInTheDocument();
        expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('exposes aria-orientation vertical for a horizontal split', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.5}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        expect(screen.getByRole('separator')).toHaveAttribute(
            'aria-orientation',
            'vertical',
        );
    });

    it('exposes aria-orientation horizontal for a vertical split', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                orientation={ESplitOrientation.Vertical}
                fraction={0.5}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        expect(screen.getByRole('separator')).toHaveAttribute(
            'aria-orientation',
            'horizontal',
        );
    });

    it('carries the fraction and bounds as integer-percent ARIA values', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.42}
                minFraction={0.2}
                maxFraction={0.8}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        const separator: HTMLElement = screen.getByRole('separator');
        expect(separator).toHaveAttribute('aria-valuenow', '42');
        expect(separator).toHaveAttribute('aria-valuemin', '20');
        expect(separator).toHaveAttribute('aria-valuemax', '80');
    });

    it('ties aria-controls to the primary pane id', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.5}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        const separator: HTMLElement = screen.getByRole('separator');
        const controls: string | null = separator.getAttribute('aria-controls');
        expect(controls).not.toBeNull();
        expect(screen.getByText('PRIMARY').id).toBe(controls);
    });

    it('names the separator through label', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.5}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        expect(screen.getByRole('separator', { name: LABEL })).toBeInTheDocument();
    });

    it('names the separator through labelledBy', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <>
                <span id="split-heading">Resize the inspector</span>
                <SplitPane
                    labelledBy="split-heading"
                    fraction={0.5}
                    onFractionChange={onFractionChange}
                    primary="PRIMARY"
                    secondary="SECONDARY"
                />
            </>,
        );

        const separator: HTMLElement = screen.getByRole('separator', {
            name: 'Resize the inspector',
        });
        expect(separator).toHaveAttribute('aria-labelledby', 'split-heading');
        expect(separator).not.toHaveAttribute('aria-label');
    });

    it('steps the fraction on the main-axis arrows (horizontal)', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.5}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        const separator: HTMLElement = screen.getByRole('separator');
        fireEvent.keyDown(separator, { key: 'ArrowRight' });
        expect(onFractionChange.mock.calls[0]?.[0]).toBeCloseTo(0.52);

        fireEvent.keyDown(separator, { key: 'ArrowLeft' });
        expect(onFractionChange.mock.calls[1]?.[0]).toBeCloseTo(0.48);
    });

    it('steps the fraction on the main-axis arrows (vertical)', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                orientation={ESplitOrientation.Vertical}
                fraction={0.5}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        const separator: HTMLElement = screen.getByRole('separator');
        fireEvent.keyDown(separator, { key: 'ArrowDown' });
        expect(onFractionChange.mock.calls[0]?.[0]).toBeCloseTo(0.52);

        fireEvent.keyDown(separator, { key: 'ArrowUp' });
        expect(onFractionChange.mock.calls[1]?.[0]).toBeCloseTo(0.48);
    });

    it('jumps to the bounds on Home and End', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.5}
                minFraction={0.15}
                maxFraction={0.85}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        const separator: HTMLElement = screen.getByRole('separator');
        fireEvent.keyDown(separator, { key: 'Home' });
        expect(onFractionChange).toHaveBeenLastCalledWith(0.15);

        fireEvent.keyDown(separator, { key: 'End' });
        expect(onFractionChange).toHaveBeenLastCalledWith(0.85);
    });

    it('uses the 10x step on PageUp and PageDown', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.5}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        const separator: HTMLElement = screen.getByRole('separator');
        fireEvent.keyDown(separator, { key: 'PageUp' });
        expect(onFractionChange.mock.calls[0]?.[0]).toBeCloseTo(0.7);

        fireEvent.keyDown(separator, { key: 'PageDown' });
        expect(onFractionChange.mock.calls[1]?.[0]).toBeCloseTo(0.3);
    });

    it('ignores the cross-axis arrows', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.5}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        const separator: HTMLElement = screen.getByRole('separator');
        fireEvent.keyDown(separator, { key: 'ArrowUp' });
        fireEvent.keyDown(separator, { key: 'ArrowDown' });
        expect(onFractionChange).not.toHaveBeenCalled();
    });

    it('does not emit when a keyboard step would not move the clamped value', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.9}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        const separator: HTMLElement = screen.getByRole('separator');
        fireEvent.keyDown(separator, { key: 'ArrowRight' });
        expect(onFractionChange).not.toHaveBeenCalled();
    });

    it('clamps an out-of-range incoming fraction for render and ARIA', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={1.5}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        // Clamped to the default maxFraction 0.9 -> 90 percent.
        expect(screen.getByRole('separator')).toHaveAttribute(
            'aria-valuenow',
            '90',
        );
    });

    it('resizes on pointer drag and derives the fraction from the container', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.5}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        const separator: HTMLElement = screen.getByRole('separator');
        primeSeparator(separator);
        mockFrameRect(200, 100);

        fireEvent.pointerDown(separator, {
            pointerId: 1,
            button: 0,
            clientX: 100,
            clientY: 50,
        });
        fireEvent.pointerMove(separator, {
            pointerId: 1,
            clientX: 150,
            clientY: 50,
        });

        // offset 150 / width 200 = 0.75.
        expect(onFractionChange).toHaveBeenLastCalledWith(0.75);

        fireEvent.pointerUp(separator, { pointerId: 1 });
        onFractionChange.mockClear();

        // After the gesture ends a stray move must not resize.
        fireEvent.pointerMove(separator, {
            pointerId: 1,
            clientX: 180,
            clientY: 50,
        });
        expect(onFractionChange).not.toHaveBeenCalled();
    });

    it('ends a drag on pointercancel with no stuck state', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.5}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        const separator: HTMLElement = screen.getByRole('separator');
        primeSeparator(separator);
        mockFrameRect(200, 100);

        fireEvent.pointerDown(separator, {
            pointerId: 1,
            button: 0,
            clientX: 100,
            clientY: 50,
        });
        fireEvent.pointerCancel(separator, { pointerId: 1 });
        onFractionChange.mockClear();

        fireEvent.pointerMove(separator, {
            pointerId: 1,
            clientX: 150,
            clientY: 50,
        });
        expect(onFractionChange).not.toHaveBeenCalled();
    });

    it('disables the divider: no tab stop, aria-disabled, inert interactions', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                fraction={0.5}
                enabled={EEnabledState.Disabled}
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        const separator: HTMLElement = screen.getByRole('separator');
        expect(separator).not.toHaveAttribute('tabindex');
        expect(separator).toHaveAttribute('aria-disabled', 'true');

        primeSeparator(separator);
        mockFrameRect(200, 100);
        fireEvent.keyDown(separator, { key: 'ArrowRight' });
        fireEvent.pointerDown(separator, {
            pointerId: 1,
            button: 0,
            clientX: 100,
            clientY: 50,
        });
        fireEvent.pointerMove(separator, {
            pointerId: 1,
            clientX: 150,
            clientY: 50,
        });
        expect(onFractionChange).not.toHaveBeenCalled();
    });

    it('applies the tone seed and the data attributes to the frame', (): void => {
        const onFractionChange: Mock<(fraction: number) => void> =
            vi.fn<(fraction: number) => void>();
        render(
            <SplitPane
                label={LABEL}
                orientation={ESplitOrientation.Vertical}
                fraction={0.5}
                tone="oklch(0.7 0.18 25)"
                onFractionChange={onFractionChange}
                primary="PRIMARY"
                secondary="SECONDARY"
            />,
        );

        const frame: HTMLElement = screen.getByRole('group');
        expect(frame.style.getPropertyValue('--portal-tone')).toBe(
            'oklch(0.7 0.18 25)',
        );
        expect(frame).toHaveAttribute('data-orientation', 'vertical');
        expect(frame).toHaveAttribute('data-enabled', 'enabled');
        expect(frame).toHaveAttribute('data-status', 'none');
    });
});
