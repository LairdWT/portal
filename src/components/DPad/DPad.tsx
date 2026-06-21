import type {
    Dispatch,
    FocusEvent as ReactFocusEvent,
    KeyboardEvent as ReactKeyboardEvent,
    ReactElement,
    RefObject,
    SetStateAction,
} from 'react';
import { useCallback, useRef, useState } from 'react';

import type { Axis2D } from '../../input';
import { EInputInteraction } from '../../input';
import { type EmitBinding, useEmitBinding } from '../../react/hooks/useEmitBinding';
import { usePointerControl } from '../../react/hooks/usePointerControl';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import styles from './DPad.module.css';
import { type DPadProps, EDpadDirection, EDpadMode } from './DPad.types';

// Radial dead-band below which the pointer is treated as centred and resolves
// to None. The pointer hook already rescales magnitude through this dead zone,
// so any non-zero magnitude indicates an intended direction.
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
        default:
            return direction;
    }
}

// Resolve a dead-zoned axis to a discrete direction for the active mode.
function resolveDirection(axis: Axis2D, mode: EDpadMode): EDpadDirection {
    const magnitude: number = Math.hypot(axis.x, axis.y);
    if (magnitude <= POINTER_DEAD_ZONE) {
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
    mode = EDpadMode.EightWay,
    enabled,
    onDirectionChange,
    onSignal,
    descriptor,
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

    const commitDirection: (next: EDpadDirection) => void = useCallback(
        (next: EDpadDirection): void => {
            if (directionRef.current === next) {
                return;
            }
            directionRef.current = next;
            setDirection(next);
            onDirectionChange?.(next);
            const pressed: boolean = next !== EDpadDirection.None;
            const interaction: EInputInteraction = pressed
                ? EInputInteraction.Press
                : EInputInteraction.Release;
            emitDigital(pressed, interaction);
        },
        [onDirectionChange, emitDigital],
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
            {children.map(
                (childDirection: EDpadDirection): ReactElement => (
                    <button
                        key={childDirection}
                        type="button"
                        className={styles.segment}
                        aria-label={DIRECTION_LABELS[childDirection]}
                        aria-pressed={direction === childDirection}
                        disabled={isDisabled}
                        data-segment={childDirection}
                        data-active={direction === childDirection}
                        onKeyDown={handleChildKeyDown}
                        onKeyUp={handleChildKeyUp}
                    />
                ),
            )}
        </div>
    );
}
