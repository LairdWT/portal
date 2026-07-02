import type {
    CSSProperties,
    Dispatch,
    FocusEvent as ReactFocusEvent,
    KeyboardEvent as ReactKeyboardEvent,
    ReactElement,
    RefObject,
    SetStateAction,
} from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import type {
    Axis2D,
    InputDescriptor,
    InputSignal,
    InputSource,
    TimeProvider,
} from '../../input';
import { createInputSource, EInputInteraction } from '../../input';
import {
    type ControllerContextValue,
    useControllerContext,
} from '../../react/ControllerContext';
import { type EmitBinding, useEmitBinding } from '../../react/hooks/useEmitBinding';
import { usePointerControl } from '../../react/hooks/usePointerControl';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { useTimeProvider } from '../../react/TimeProviderContext';
import { EEnabledState } from '../../state/state';
import styles from './DPad.module.css';
import { type DPadProps, EDpadDirection, EDpadMode } from './DPad.types';
import {
    type DpadGeometry,
    dpadGeometry,
    type DpadKeyGeometry,
} from './dpadGeometry';

// The cross has one static shape; compute its clip polygons once.
const GEOMETRY: DpadGeometry = dpadGeometry();

// Per-key custom properties driving the CSS geometry (key silhouette, rim
// inset face, glyph anchor). String-typed so the computed keys satisfy the
// CSSProperties index signature - the RadialCore pattern.
const CLIP_PROPERTY: string = '--dpad-clip';
const FACE_CLIP_PROPERTY: string = '--dpad-face-clip';
const ANCHOR_X_PROPERTY: string = '--dpad-anchor-x';
const ANCHOR_Y_PROPERTY: string = '--dpad-anchor-y';

const CAP_STYLE: CSSProperties = {
    [CLIP_PROPERTY]: GEOMETRY.capClipPath,
    [FACE_CLIP_PROPERTY]: GEOMETRY.capFaceClipPath,
};

// Radial dead zone handed to usePointerControl, which rescales raw magnitude
// from [POINTER_DEAD_ZONE, 1] onto [0, 1] BEFORE any value reaches
// resolveDirection. The hook owns the dead-band, so resolveDirection must not
// re-apply it: re-checking magnitude against this constant would compound the
// two dead zones and swallow small-but-intended motion (a raw magnitude up to
// ~0.36 rescales to below 0.2 and would read as None).
const POINTER_DEAD_ZONE: number = 0.2;

// Octant index from a direction vector. The pad rectangle uses screen
// coordinates where positive y points down, so the angle is measured with the
// vertical axis inverted to make Up correspond to the top of the pad. The
// returned index counts eighths clockwise starting at Right (0).
function resolveOctant(axisX: number, axisY: number): number {
    const screenUpY: number = -axisY;
    const angleRadians: number = Math.atan2(screenUpY, axisX);
    const fullTurn: number = Math.PI * 2;
    const normalized: number = (angleRadians + fullTurn) % fullTurn;
    const eighth: number = fullTurn / 8;
    return Math.round(normalized / eighth) % 8;
}

// Map an octant index to an eight-way direction.
function octantToDirection(octant: number): EDpadDirection {
    switch (octant) {
        case 0:
            return EDpadDirection.Right;
        case 1:
            return EDpadDirection.UpRight;
        case 2:
            return EDpadDirection.Up;
        case 3:
            return EDpadDirection.UpLeft;
        case 4:
            return EDpadDirection.Left;
        case 5:
            return EDpadDirection.DownLeft;
        case 6:
            return EDpadDirection.Down;
        case 7:
            return EDpadDirection.DownRight;
        default:
            return EDpadDirection.None;
    }
}

// Collapse an eight-way direction onto the dominant cardinal for FourWay mode.
// The dominant axis is the one with the larger absolute component.
function collapseToCardinal(
    direction: EDpadDirection,
    axisX: number,
    axisY: number,
): EDpadDirection {
    switch (direction) {
        case EDpadDirection.UpLeft:
        case EDpadDirection.UpRight:
        case EDpadDirection.DownLeft:
        case EDpadDirection.DownRight: {
            const horizontalDominates: boolean = Math.abs(axisX) >= Math.abs(axisY);
            if (horizontalDominates) {
                return axisX >= 0 ? EDpadDirection.Right : EDpadDirection.Left;
            }
            return axisY <= 0 ? EDpadDirection.Up : EDpadDirection.Down;
        }
        case EDpadDirection.Up:
        case EDpadDirection.Down:
        case EDpadDirection.Left:
        case EDpadDirection.Right:
        case EDpadDirection.None:
            return direction;
    }
}

// Resolve a dead-zoned axis to a discrete direction for the active mode. The
// magnitude arriving here is already dead-zoned by usePointerControl, so any
// non-zero magnitude indicates an intended direction; only an exactly-centred
// (zero) vector resolves to None.
function resolveDirection(axis: Axis2D, mode: EDpadMode): EDpadDirection {
    const magnitude: number = Math.hypot(axis.x, axis.y);
    if (magnitude <= 0) {
        return EDpadDirection.None;
    }
    const octant: number = resolveOctant(axis.x, axis.y);
    const eightWay: EDpadDirection = octantToDirection(octant);
    switch (mode) {
        case EDpadMode.FourWay:
            return collapseToCardinal(eightWay, axis.x, axis.y);
        case EDpadMode.EightWay:
            return eightWay;
    }
}

// Operable directional children rendered inside the group. FourWay renders only
// the first four (cardinals); EightWay renders all eight. Order is deliberate so
// keyboard Tab traversal follows a predictable cardinal-then-diagonal sequence.
const CARDINAL_DIRECTIONS: readonly EDpadDirection[] = [
    EDpadDirection.Up,
    EDpadDirection.Down,
    EDpadDirection.Left,
    EDpadDirection.Right,
];

const DIAGONAL_DIRECTIONS: readonly EDpadDirection[] = [
    EDpadDirection.UpLeft,
    EDpadDirection.UpRight,
    EDpadDirection.DownLeft,
    EDpadDirection.DownRight,
];

// Every operable direction across both modes. The opt-in per-direction signal
// stream pre-builds one InputSource per member so a transition only looks the
// relevant source up rather than allocating on each change.
const ALL_DIRECTIONS: readonly EDpadDirection[] = [
    ...CARDINAL_DIRECTIONS,
    ...DIAGONAL_DIRECTIONS,
];

// Human-readable control name announced to assistive tech for each child button.
const DIRECTION_LABELS: Readonly<Record<EDpadDirection, string>> = {
    [EDpadDirection.None]: 'None',
    [EDpadDirection.Up]: 'Up',
    [EDpadDirection.Down]: 'Down',
    [EDpadDirection.Left]: 'Left',
    [EDpadDirection.Right]: 'Right',
    [EDpadDirection.UpLeft]: 'Up and left',
    [EDpadDirection.UpRight]: 'Up and right',
    [EDpadDirection.DownLeft]: 'Down and left',
    [EDpadDirection.DownRight]: 'Down and right',
};

// Resolve the operable child set for the active mode.
function operableDirections(mode: EDpadMode): readonly EDpadDirection[] {
    switch (mode) {
        case EDpadMode.FourWay:
            return CARDINAL_DIRECTIONS;
        case EDpadMode.EightWay:
            return [...CARDINAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS];
    }
}

// Keys that momentarily press a focused directional child. Space reports as ' '
// in modern browsers; 'Spacebar' is the legacy value some engines still emit.
function isActivationKey(key: string): boolean {
    switch (key) {
        case 'Enter':
        case ' ':
        case 'Spacebar':
            return true;
        default:
            return false;
    }
}

// Validate a child button's data-segment attribute back to a directional member,
// so a single delegated key handler can read the direction from the event target
// rather than allocating a per-button closure. Returns null for any value that
// is not an operable direction.
function parseDpadDirection(value: string | undefined): EDpadDirection | null {
    switch (value) {
        case EDpadDirection.Up:
            return EDpadDirection.Up;
        case EDpadDirection.Down:
            return EDpadDirection.Down;
        case EDpadDirection.Left:
            return EDpadDirection.Left;
        case EDpadDirection.Right:
            return EDpadDirection.Right;
        case EDpadDirection.UpLeft:
            return EDpadDirection.UpLeft;
        case EDpadDirection.UpRight:
            return EDpadDirection.UpRight;
        case EDpadDirection.DownLeft:
            return EDpadDirection.DownLeft;
        case EDpadDirection.DownRight:
            return EDpadDirection.DownRight;
        default:
            return null;
    }
}

export function DPad({
    label,
    mode = EDpadMode.FourWay,
    enabled,
    onDirectionChange,
    onSignal,
    descriptor,
    primaryButtonOnly = false,
    directionSignals = false,
}: DPadProps): ReactElement {
    const [direction, setDirection]: [
        EDpadDirection,
        Dispatch<SetStateAction<EDpadDirection>>,
    ] = useState<EDpadDirection>(EDpadDirection.None);
    const directionRef: RefObject<EDpadDirection> = useRef<EDpadDirection>(
        EDpadDirection.None,
    );
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;

    const { emitDigital }: EmitBinding = useEmitBinding(descriptor, onSignal);

    // Ambient wiring for the opt-in per-direction stream. These mirror the exact
    // inputs useInputSource reads (the context signal sink, the id namespace, and
    // the injected clock) so a per-direction id composes as
    // `${idNamespace}.${descriptor.id}.${direction}` - the same namespace the
    // default pad-level signal carries, with a lowercase direction suffix.
    const timeProvider: TimeProvider = useTimeProvider();
    const { onSignal: contextOnSignal, idNamespace }: ControllerContextValue =
        useControllerContext();
    const resolvedOnSignal: ((signal: InputSignal) => void) | undefined =
        onSignal ?? contextOnSignal;

    const directionSources: ReadonlyMap<EDpadDirection, InputSource> = useMemo<
        ReadonlyMap<EDpadDirection, InputSource>
    >((): ReadonlyMap<EDpadDirection, InputSource> => {
        const sources: Map<EDpadDirection, InputSource> = new Map<
            EDpadDirection,
            InputSource
        >();
        if (
            !directionSignals ||
            descriptor === undefined ||
            resolvedOnSignal === undefined
        ) {
            return sources;
        }
        const namespacedId: string =
            idNamespace === undefined
                ? descriptor.id
                : `${idNamespace}.${descriptor.id}`;
        for (const memberDirection of ALL_DIRECTIONS) {
            const memberDescriptor: InputDescriptor = {
                ...descriptor,
                id: `${namespacedId}.${memberDirection}`,
            };
            sources.set(
                memberDirection,
                createInputSource({
                    descriptor: memberDescriptor,
                    emit: resolvedOnSignal,
                    timeProvider,
                }),
            );
        }
        return sources;
    }, [directionSignals, descriptor, resolvedOnSignal, idNamespace, timeProvider]);

    // Emit one per-direction Digital signal. None never has a source (it is the
    // rest state, not an input), so the guard short-circuits it.
    const emitDirectionSignal: (
        direction: EDpadDirection,
        interaction: EInputInteraction,
    ) => void = useCallback(
        (direction: EDpadDirection, interaction: EInputInteraction): void => {
            const source: InputSource | undefined = directionSources.get(direction);
            if (source === undefined) {
                return;
            }
            source.emitDigital(
                interaction === EInputInteraction.Press,
                interaction,
            );
        },
        [directionSources],
    );

    const commitDirection: (next: EDpadDirection) => void = useCallback(
        (next: EDpadDirection): void => {
            const previous: EDpadDirection = directionRef.current;
            if (previous === next) {
                return;
            }
            directionRef.current = next;
            setDirection(next);
            onDirectionChange?.(next);
            // Opt-in stream: Release the direction we are leaving, then Press the
            // one we are entering, so the signal stream reconstructs the pad
            // state. Skip None on both edges (it is the rest state, not an input).
            if (directionSignals) {
                if (previous !== EDpadDirection.None) {
                    emitDirectionSignal(previous, EInputInteraction.Release);
                }
                if (next !== EDpadDirection.None) {
                    emitDirectionSignal(next, EInputInteraction.Press);
                }
                return;
            }
            // Default stream (byte-identical to 1.x): a single pad-level Digital
            // signal, pressed while a direction is held and released at None.
            const pressed: boolean = next !== EDpadDirection.None;
            const interaction: EInputInteraction = pressed
                ? EInputInteraction.Press
                : EInputInteraction.Release;
            emitDigital(pressed, interaction);
        },
        [onDirectionChange, emitDigital, directionSignals, emitDirectionSignal],
    );

    const handleValue: (axis: Axis2D) => void = useCallback(
        (axis: Axis2D): void => {
            commitDirection(resolveDirection(axis, mode));
        },
        [commitDirection, mode],
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
            deadZone: POINTER_DEAD_ZONE,
            disabled: isDisabled,
            primaryButtonOnly,
        });

    const handleChildKeyDown: (
        event: ReactKeyboardEvent<HTMLButtonElement>,
    ) => void = useCallback(
        (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
            if (isDisabled) {
                return;
            }
            if (!isActivationKey(event.key)) {
                return;
            }
            // Suppress the native button click that Space/Enter would synthesize
            // and the page scroll Space causes; this is a momentary hold.
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            const childDirection: EDpadDirection | null = parseDpadDirection(
                event.currentTarget.dataset.segment,
            );
            if (childDirection === null) {
                return;
            }
            commitDirection(childDirection);
        },
        [isDisabled, commitDirection],
    );

    const handleChildKeyUp: (event: ReactKeyboardEvent<HTMLButtonElement>) => void =
        useCallback(
            (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
                if (isDisabled) {
                    return;
                }
                if (!isActivationKey(event.key)) {
                    return;
                }
                event.preventDefault();
                const childDirection: EDpadDirection | null = parseDpadDirection(
                    event.currentTarget.dataset.segment,
                );
                if (childDirection === null) {
                    return;
                }
                if (directionRef.current !== childDirection) {
                    return;
                }
                commitDirection(EDpadDirection.None);
            },
            [isDisabled, commitDirection],
        );

    // Returning to None when focus leaves the whole group releases a held
    // direction. relatedTarget inside the group means focus only moved between
    // children, so the hold is preserved.
    const handleGroupBlur: (event: ReactFocusEvent<HTMLDivElement>) => void =
        useCallback(
            (event: ReactFocusEvent<HTMLDivElement>): void => {
                const nextFocus: EventTarget | null = event.relatedTarget;
                if (
                    nextFocus instanceof Node &&
                    event.currentTarget.contains(nextFocus)
                ) {
                    return;
                }
                commitDirection(EDpadDirection.None);
            },
            [commitDirection],
        );

    const children: readonly EDpadDirection[] = operableDirections(mode);

    return (
        <div
            role="group"
            className={styles.base}
            aria-label={label}
            data-enabled={resolvedEnabled}
            data-mode={mode}
            data-direction={direction}
            onBlur={handleGroupBlur}
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
            <span className={styles.cap} style={CAP_STYLE} aria-hidden="true" />
            {children.map((childDirection: EDpadDirection): ReactElement | null => {
                const key: DpadKeyGeometry | undefined =
                    GEOMETRY.keys[childDirection];
                if (key === undefined) {
                    // Unreachable: every operable direction has a key
                    // shape. Guarded so a geometry regression can never
                    // render an unclipped pad-sized button.
                    return null;
                }
                const keyStyle: CSSProperties = {
                    [CLIP_PROPERTY]: key.clipPath,
                    [FACE_CLIP_PROPERTY]: key.faceClipPath,
                    [ANCHOR_X_PROPERTY]: key.anchorX,
                    [ANCHOR_Y_PROPERTY]: key.anchorY,
                };
                return (
                    <button
                        key={childDirection}
                        type="button"
                        className={styles.segment}
                        style={keyStyle}
                        aria-label={DIRECTION_LABELS[childDirection]}
                        aria-pressed={direction === childDirection}
                        disabled={isDisabled}
                        data-segment={childDirection}
                        data-active={direction === childDirection}
                        onKeyDown={handleChildKeyDown}
                        onKeyUp={handleChildKeyUp}
                    />
                );
            })}
        </div>
    );
}
