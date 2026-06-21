import type { ReactElement, RefObject } from 'react';
import { useCallback, useRef } from 'react';

import { type Axis2D, clampToUnitCircle } from '../../input';
import {
    type Axis2DControlBinding,
    EAxis2DSource,
    useAxis2DControl,
} from '../../react/hooks/useAxis2DControl';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import styles from './Thumbpad.module.css';
import { type ThumbpadProps } from './Thumbpad.types';

const PAD_X_PROPERTY: string = '--portal-pad-x';
const PAD_Y_PROPERTY: string = '--portal-pad-y';

export function Thumbpad({
    label,
    enabled,
    onDelta,
    onSignal,
    descriptor,
}: ThumbpadProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const hostRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
        null,
    );
    const axisXInputRef: RefObject<HTMLInputElement | null> =
        useRef<HTMLInputElement | null>(null);
    const axisYInputRef: RefObject<HTMLInputElement | null> =
        useRef<HTMLInputElement | null>(null);
    // Accumulated, unit-circle-clamped look offset. Shared by the pointer path,
    // the keyboard sliders, and the parallax layers so all three stay in sync.
    const offsetRef: RefObject<Axis2D> = useRef<Axis2D>({ x: 0, y: 0 });
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;

    // Write the offset onto the HOST element so both stacked parallax layers
    // inherit --portal-pad-x / --portal-pad-y and translate at their own depth.
    const writeHostOffset: (offset: Axis2D) => void = useCallback(
        (offset: Axis2D): void => {
            const host: HTMLDivElement | null = hostRef.current;
            if (host === null) {
                return;
            }
            host.style.setProperty(PAD_X_PROPERTY, String(offset.x));
            host.style.setProperty(PAD_Y_PROPERTY, String(offset.y));
        },
        [],
    );

    const syncSliders: (offset: Axis2D) => void = useCallback(
        (offset: Axis2D): void => {
            const axisXInput: HTMLInputElement | null = axisXInputRef.current;
            if (axisXInput !== null) {
                axisXInput.value = String(offset.x);
                // Announce the current horizontal offset to assistive tech
                // imperatively, in the same ref-sync path, so no per-sample
                // React state or re-render is introduced.
                axisXInput.setAttribute(
                    'aria-valuetext',
                    `horizontal ${offset.x.toFixed(2)}`,
                );
            }
            const axisYInput: HTMLInputElement | null = axisYInputRef.current;
            if (axisYInput !== null) {
                axisYInput.value = String(offset.y);
                axisYInput.setAttribute(
                    'aria-valuetext',
                    `vertical ${offset.y.toFixed(2)}`,
                );
            }
        },
        [],
    );

    // Move the shared offset (parallax + sliders) to a new clamped position and
    // emit the relative delta that produced it.
    // Commit the visual offset and the public onDelta callback. Emission is
    // owned by the axis control seam: the pointer path emits via the hook after
    // onVector, and the keyboard path emits explicitly below.
    const commitOffset: (offset: Axis2D, delta: Axis2D) => void = useCallback(
        (offset: Axis2D, delta: Axis2D): void => {
            offsetRef.current = offset;
            writeHostOffset(offset);
            onDelta?.(delta);
        },
        [writeHostOffset, onDelta],
    );

    // Pointer path: the hook reports a raw per-sample delta. Integrate it into the
    // clamped offset, keep the sliders in sync for assistive tech, and emit the
    // raw delta.
    const handlePointerDelta: (delta: Axis2D) => void = useCallback(
        (delta: Axis2D): void => {
            const offset: Axis2D = clampToUnitCircle({
                x: offsetRef.current.x + delta.x,
                y: offsetRef.current.y + delta.y,
            });
            syncSliders(offset);
            commitOffset(offset, delta);
        },
        [syncSliders, commitOffset],
    );

    const resetOffset: () => void = useCallback((): void => {
        offsetRef.current = { x: 0, y: 0 };
        writeHostOffset({ x: 0, y: 0 });
        syncSliders({ x: 0, y: 0 });
    }, [writeHostOffset, syncSliders]);

    const handleActiveChange: (active: boolean) => void = useCallback(
        (active: boolean): void => {
            if (!active) {
                resetOffset();
            }
        },
        [resetOffset],
    );

    const {
        ref: boundRef,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        emitAxis2D,
    }: Axis2DControlBinding<HTMLDivElement> = useAxis2DControl<HTMLDivElement>({
        mode: EAxis2DSource.Relative,
        onVector: handlePointerDelta,
        descriptor,
        onSignal,
        disabled: isDisabled,
        onActiveChange: handleActiveChange,
    });

    // Keyboard / assistive-tech path: a slider arrow change sets a new absolute
    // offset; emit the relative delta from the previous offset. Reading the slider
    // values keeps this off React state.
    const handleSliderInput: () => void = useCallback((): void => {
        const axisXInput: HTMLInputElement | null = axisXInputRef.current;
        const axisYInput: HTMLInputElement | null = axisYInputRef.current;
        if (axisXInput === null || axisYInput === null) {
            return;
        }
        const offset: Axis2D = clampToUnitCircle({
            x: axisXInput.valueAsNumber,
            y: axisYInput.valueAsNumber,
        });
        const delta: Axis2D = {
            x: offset.x - offsetRef.current.x,
            y: offset.y - offsetRef.current.y,
        };
        // If the clamp pulled a corner back to the unit circle, re-sync the
        // sliders so their announced value matches the actual offset.
        if (
            offset.x !== axisXInput.valueAsNumber ||
            offset.y !== axisYInput.valueAsNumber
        ) {
            syncSliders(offset);
        }
        commitOffset(offset, delta);
        emitAxis2D(delta);
    }, [syncSliders, commitOffset, emitAxis2D]);

    return (
        <div
            ref={hostRef}
            className={styles.base}
            role="group"
            aria-label={label}
            aria-disabled={isDisabled}
            data-enabled={resolvedEnabled}
        >
            <div
                ref={boundRef}
                className={styles.surface}
                role="presentation"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            />
            <div className={styles.thumbShadow} aria-hidden="true" />
            <div className={styles.thumb} aria-hidden="true" />
            <input
                ref={axisXInputRef}
                className={styles.axisInput}
                type="range"
                min={-1}
                max={1}
                step={0.1}
                defaultValue={0}
                disabled={isDisabled}
                aria-label={`${label} horizontal look`}
                onChange={(): void => {
                    handleSliderInput();
                }}
            />
            <input
                ref={axisYInputRef}
                className={styles.axisInput}
                type="range"
                min={-1}
                max={1}
                step={0.1}
                defaultValue={0}
                disabled={isDisabled}
                aria-label={`${label} vertical look`}
                onChange={(): void => {
                    handleSliderInput();
                }}
            />
        </div>
    );
}
