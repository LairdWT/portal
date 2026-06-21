import type { Dispatch, ReactElement, RefObject, SetStateAction } from 'react';
import { useCallback, useRef, useState } from 'react';

import type { Axis2D, InputSource } from '../../input';
import { clampToUnitCircle, EInputInteraction } from '../../input';
import { useInputSource } from '../../react/hooks/useInputSource';
import { usePointerControl } from '../../react/hooks/usePointerControl';
import { EEnabledState } from '../../state/state';
import styles from './Joystick.module.css';
import { type JoystickProps } from './Joystick.types';

const PAD_X_PROPERTY: string = '--portal-pad-x';
const PAD_Y_PROPERTY: string = '--portal-pad-y';
const PAD_MAGNITUDE_PROPERTY: string = '--portal-pad-magnitude';

export function Joystick({
    label,
    deadZone = 0.15,
    enabled = EEnabledState.Enabled,
    onAxisChange,
    onSignal,
    descriptor,
}: JoystickProps): ReactElement {
    const thumbRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const thumbShadowRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const axisXInputRef: RefObject<HTMLInputElement | null> =
        useRef<HTMLInputElement | null>(null);
    const axisYInputRef: RefObject<HTMLInputElement | null> =
        useRef<HTMLInputElement | null>(null);
    const isDisabled: boolean = enabled === EEnabledState.Disabled;
    const [isActive, setIsActive]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);

    const inputSource: InputSource | null = useInputSource(descriptor, onSignal);

    // Write the axis to both parallax layers (each applies its own travel
    // multiplier in CSS) and the magnitude ring, then emit.
    const handleValue: (axis: Axis2D) => void = useCallback(
        (axis: Axis2D): void => {
            const magnitude: number = Math.hypot(axis.x, axis.y);
            const thumb: HTMLDivElement | null = thumbRef.current;
            if (thumb !== null) {
                thumb.style.setProperty(PAD_X_PROPERTY, String(axis.x));
                thumb.style.setProperty(PAD_Y_PROPERTY, String(axis.y));
                thumb.style.setProperty(PAD_MAGNITUDE_PROPERTY, String(magnitude));
            }
            const thumbShadow: HTMLDivElement | null = thumbShadowRef.current;
            if (thumbShadow !== null) {
                thumbShadow.style.setProperty(PAD_X_PROPERTY, String(axis.x));
                thumbShadow.style.setProperty(PAD_Y_PROPERTY, String(axis.y));
                thumbShadow.style.setProperty(
                    PAD_MAGNITUDE_PROPERTY,
                    String(magnitude),
                );
            }
            onAxisChange?.(axis);
            if (inputSource !== null) {
                inputSource.emitAxis2D(
                    axis,
                    EInputInteraction.Move,
                    performance.now(),
                );
            }
        },
        [onAxisChange, inputSource],
    );

    const {
        ref,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
    }: ReturnType<typeof usePointerControl<HTMLDivElement>> =
        usePointerControl<HTMLDivElement>({
            onValue: handleValue,
            deadZone,
            disabled: isDisabled,
            onActiveChange: setIsActive,
        });

    // Read both uncontrolled sliders and rebuild the axis, clamped to the unit
    // circle so the keyboard path cannot exceed the pointer path's magnitude.
    // Reading refs (not state) keeps high-frequency arrow input off the render
    // path.
    const handleAxisInput: () => void = useCallback((): void => {
        const axisXInput: HTMLInputElement | null = axisXInputRef.current;
        const axisYInput: HTMLInputElement | null = axisYInputRef.current;
        if (axisXInput === null || axisYInput === null) {
            return;
        }
        const axis: Axis2D = clampToUnitCircle({
            x: axisXInput.valueAsNumber,
            y: axisYInput.valueAsNumber,
        });
        handleValue(axis);
    }, [handleValue]);

    return (
        <div
            ref={ref}
            className={styles.base}
            role="group"
            aria-label={label}
            aria-disabled={isDisabled}
            data-enabled={enabled}
            data-active={isActive ? 'true' : 'false'}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
        >
            <div
                ref={thumbShadowRef}
                className={styles.thumbShadow}
                aria-hidden="true"
            />
            <div ref={thumbRef} className={styles.thumb} aria-hidden="true" />
            <input
                ref={axisXInputRef}
                className={styles.axisInput}
                type="range"
                min={-1}
                max={1}
                step={0.1}
                defaultValue={0}
                disabled={isDisabled}
                aria-label={`${label} horizontal axis`}
                onChange={(): void => {
                    handleAxisInput();
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
                aria-label={`${label} vertical axis`}
                onChange={(): void => {
                    handleAxisInput();
                }}
            />
        </div>
    );
}
