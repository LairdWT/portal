import type { Dispatch, ReactElement, RefObject, SetStateAction } from 'react';
import { useCallback, useRef, useState } from 'react';

import { type Axis2D, clampToUnitCircle } from '../../input';
import {
    type Axis2DControlBinding,
    EAxis2DSource,
    useAxis2DControl,
} from '../../react/hooks/useAxis2DControl';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import styles from './Joystick.module.css';
import { type JoystickProps } from './Joystick.types';

const PAD_X_PROPERTY: string = '--portal-pad-x';
const PAD_Y_PROPERTY: string = '--portal-pad-y';
const PAD_MAGNITUDE_PROPERTY: string = '--portal-pad-magnitude';

const AXIS_VALUE_FRACTION_DIGITS: number = 2;

function formatAxisValueText(orientation: string, value: number): string {
    return `${orientation} ${value.toFixed(AXIS_VALUE_FRACTION_DIGITS)}`;
}

export function Joystick({
    label,
    deadZone = 0.15,
    enabled,
    onAxisChange,
    onSignal,
    descriptor,
}: JoystickProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const thumbRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const thumbShadowRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const axisXInputRef: RefObject<HTMLInputElement | null> =
        useRef<HTMLInputElement | null>(null);
    const axisYInputRef: RefObject<HTMLInputElement | null> =
        useRef<HTMLInputElement | null>(null);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const [isActive, setIsActive]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);

    // Write the axis to both parallax layers (each applies its own travel
    // multiplier in CSS) and the magnitude ring. Emission is owned by the axis
    // control seam, which calls this visual write and then emits the same vector.
    const applyAxis: (axis: Axis2D) => void = useCallback(
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
            // Announce the current axis components to assistive tech. The axis is
            // already clamped to the unit circle by both emitting paths, so these
            // are the same values pushed to the visual layers. Written
            // imperatively to keep high-frequency input off the render path.
            const axisXInput: HTMLInputElement | null = axisXInputRef.current;
            if (axisXInput !== null) {
                axisXInput.setAttribute(
                    'aria-valuetext',
                    formatAxisValueText('horizontal', axis.x),
                );
            }
            const axisYInput: HTMLInputElement | null = axisYInputRef.current;
            if (axisYInput !== null) {
                axisYInput.setAttribute(
                    'aria-valuetext',
                    formatAxisValueText('vertical', axis.y),
                );
            }
            onAxisChange?.(axis);
        },
        [onAxisChange],
    );

    const {
        ref,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        emitAxis2D,
    }: Axis2DControlBinding<HTMLDivElement> = useAxis2DControl<HTMLDivElement>({
        mode: EAxis2DSource.Absolute,
        onVector: applyAxis,
        descriptor,
        onSignal,
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
        applyAxis(axis);
        emitAxis2D(axis);
    }, [applyAxis, emitAxis2D]);

    return (
        <div
            className={styles.base}
            role="group"
            aria-label={label}
            aria-disabled={isDisabled}
            data-enabled={resolvedEnabled}
            data-active={isActive ? 'true' : 'false'}
        >
            <div
                ref={ref}
                className={styles.surface}
                role="presentation"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            />
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
                aria-valuetext={formatAxisValueText('horizontal', 0)}
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
                aria-valuetext={formatAxisValueText('vertical', 0)}
                onChange={(): void => {
                    handleAxisInput();
                }}
            />
        </div>
    );
}
