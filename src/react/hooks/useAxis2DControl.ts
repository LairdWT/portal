// Reusable two-dimensional axis control seam. Composes the pure pointer hooks
// (absolute position via usePointerControl, or per-sample delta via
// useRelativePointerControl) with the clock-bound emit surface so any axis
// control shares one wiring instead of re-implementing pointer plumbing and
// InputSignal emission. The hook owns no axis state in React: each sample is
// forwarded to the caller's onVector (which performs the control's own visual
// work) and emitted as a Move InputSignal carrying the same raw vector. The
// returned binding is referentially stable across renders whose inputs are
// unchanged, and emitAxis2D is exposed so non-pointer paths (keyboard sliders)
// emit through the same seam.
//
// Both pointer hooks are called every render to satisfy the Rules of Hooks; only
// the binding selected by `mode` is wired to the DOM, so the other stays inert.

import {
    type PointerEvent as ReactPointerEvent,
    type RefObject,
    useCallback,
    useMemo,
} from 'react';

import {
    type Axis2D,
    EInputInteraction,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { type EmitBinding, useEmitBinding } from './useEmitBinding';
import {
    type PointerControlBinding,
    type PointerControlOptions,
    usePointerControl,
} from './usePointerControl';
import {
    type RelativePointerControlBinding,
    type RelativePointerControlOptions,
    useRelativePointerControl,
} from './useRelativePointerControl';

// Which pointer surface drives the axis: an absolute pad that reports a centered
// position and springs back to center on release (Joystick), or a relative pad
// that reports unbounded per-sample deltas with no fixed origin (Thumbpad).
export const EAxis2DSource: {
    readonly Absolute: 'absolute';
    readonly Relative: 'relative';
} = {
    Absolute: 'absolute',
    Relative: 'relative',
};
export type EAxis2DSource = (typeof EAxis2DSource)[keyof typeof EAxis2DSource];

export type Axis2DControlOptions = Readonly<{
    mode: EAxis2DSource;
    // The control's own per-sample work (CSS parallax, offset integration,
    // public onAxisChange/onDelta callback). Receives the raw pointer vector.
    onVector: (vector: Axis2D) => void;
    descriptor?: InputDescriptor | undefined;
    onSignal?: ((signal: InputSignal) => void) | undefined;
    deadZone?: number | undefined;
    disabled?: boolean | undefined;
    onActiveChange?: ((active: boolean) => void) | undefined;
}>;

export type Axis2DControlBinding<ElementType extends HTMLElement> = Readonly<{
    ref: RefObject<ElementType | null>;
    onPointerDown: (event: ReactPointerEvent<ElementType>) => void;
    onPointerMove: (event: ReactPointerEvent<ElementType>) => void;
    onPointerUp: (event: ReactPointerEvent<ElementType>) => void;
    onPointerCancel: (event: ReactPointerEvent<ElementType>) => void;
    emitAxis2D: (axis: Axis2D) => void;
}>;

export function useAxis2DControl<ElementType extends HTMLElement>(
    options: Axis2DControlOptions,
): Axis2DControlBinding<ElementType> {
    const {
        mode,
        onVector,
        descriptor,
        onSignal,
        deadZone = 0,
        disabled = false,
        onActiveChange,
    }: Axis2DControlOptions = options;

    const { emitAxis2D }: EmitBinding = useEmitBinding(descriptor, onSignal);

    const emitMove: (axis: Axis2D) => void = useCallback(
        (axis: Axis2D): void => {
            emitAxis2D(axis, EInputInteraction.Move);
        },
        [emitAxis2D],
    );

    const handleVector: (vector: Axis2D) => void = useCallback(
        (vector: Axis2D): void => {
            onVector(vector);
            emitMove(vector);
        },
        [onVector, emitMove],
    );

    const absoluteOptions: PointerControlOptions =
        onActiveChange === undefined
            ? { onValue: handleVector, deadZone, disabled }
            : { onValue: handleVector, deadZone, disabled, onActiveChange };

    const relativeOptions: RelativePointerControlOptions =
        onActiveChange === undefined
            ? { onDelta: handleVector, disabled }
            : { onDelta: handleVector, disabled, onActiveChange };

    const absoluteBinding: PointerControlBinding<ElementType> =
        usePointerControl<ElementType>(absoluteOptions);
    const relativeBinding: RelativePointerControlBinding<ElementType> =
        useRelativePointerControl<ElementType>(relativeOptions);

    const pointerBinding: PointerControlBinding<ElementType> =
        mode === EAxis2DSource.Relative ? relativeBinding : absoluteBinding;

    const {
        ref,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
    }: PointerControlBinding<ElementType> = pointerBinding;

    return useMemo<Axis2DControlBinding<ElementType>>(
        (): Axis2DControlBinding<ElementType> => ({
            ref,
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel,
            emitAxis2D: emitMove,
        }),
        [ref, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, emitMove],
    );
}
