import type {
    KeyboardEvent as ReactKeyboardEvent,
    ReactElement,
    RefObject,
} from 'react';
import { useCallback, useRef } from 'react';

import type { Axis2D, InputSource } from '../../input';
import { clampToUnitCircle, EInputInteraction } from '../../input';
import { useInputSource } from '../../react/hooks/useInputSource';
import { useRelativePointerControl } from '../../react/hooks/useRelativePointerControl';
import { EEnabledState } from '../../state/state';
import styles from './Thumbpad.module.css';
import { type ThumbpadProps } from './Thumbpad.types';

const PAD_X_PROPERTY: string = '--portal-pad-x';
const PAD_Y_PROPERTY: string = '--portal-pad-y';

// Fixed delta magnitude applied per keyboard arrow nudge.
const KEYBOARD_STEP: number = 0.1;

// Resolve an arrow key to a single relative delta step. Non-arrow keys yield
// null so the caller ignores them. Local to this component: the Thumbpad keyboard
// surface owns its own mapping and exposes no shared enum (no barrel coupling).
function arrowKeyToDelta(key: string): Axis2D | null {
    switch (key) {
        case 'ArrowUp':
            return { x: 0, y: -KEYBOARD_STEP };
        case 'ArrowDown':
            return { x: 0, y: KEYBOARD_STEP };
        case 'ArrowLeft':
            return { x: -KEYBOARD_STEP, y: 0 };
        case 'ArrowRight':
            return { x: KEYBOARD_STEP, y: 0 };
        default:
            return null;
    }
}

export function Thumbpad({
    label,
    enabled = EEnabledState.Enabled,
    onDelta,
    onSignal,
    descriptor,
}: ThumbpadProps): ReactElement {
    const hostRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
        null,
    );
    // Accumulated, unit-circle-clamped visual offset. The control reports raw
    // relative deltas, but the parallax layers travel under the finger like an
    // absolute pad, so the visual integrates the deltas and eases home on release.
    const visualOffsetRef: RefObject<Axis2D> = useRef<Axis2D>({ x: 0, y: 0 });
    const isDisabled: boolean = enabled === EEnabledState.Disabled;

    const inputSource: InputSource | null = useInputSource(descriptor, onSignal);

    // Write the transient parallax offset onto the HOST element so both stacked
    // layers inherit --portal-pad-x / --portal-pad-y.
    const showHostOffset: (offset: Axis2D) => void = useCallback(
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

    const restHostOffset: () => void = useCallback((): void => {
        visualOffsetRef.current = { x: 0, y: 0 };
        const host: HTMLDivElement | null = hostRef.current;
        if (host === null) {
            return;
        }
        host.style.setProperty(PAD_X_PROPERTY, '0');
        host.style.setProperty(PAD_Y_PROPERTY, '0');
    }, []);

    const handleDelta: (delta: Axis2D) => void = useCallback(
        (delta: Axis2D): void => {
            // Integrate the incremental delta into the clamped visual offset so
            // the parallax layers travel under the finger; the emitted signal
            // stays a raw relative delta.
            const accumulated: Axis2D = clampToUnitCircle({
                x: visualOffsetRef.current.x + delta.x,
                y: visualOffsetRef.current.y + delta.y,
            });
            visualOffsetRef.current = accumulated;
            showHostOffset(accumulated);
            onDelta?.(delta);
            if (inputSource !== null) {
                inputSource.emitAxis2D(
                    delta,
                    EInputInteraction.Move,
                    performance.now(),
                );
            }
        },
        [showHostOffset, onDelta, inputSource],
    );

    const handleActiveChange: (active: boolean) => void = useCallback(
        (active: boolean): void => {
            if (!active) {
                restHostOffset();
            }
        },
        [restHostOffset],
    );

    const {
        ref: boundRef,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
    }: ReturnType<
        typeof useRelativePointerControl<HTMLDivElement>
    > = useRelativePointerControl<HTMLDivElement>({
        onDelta: handleDelta,
        disabled: isDisabled,
        onActiveChange: handleActiveChange,
    });

    // Sync the hook's ref and the component's hostRef to the same node so the
    // parallax custom properties are written on the element the hook measures.
    const setHostNode: (node: HTMLDivElement | null) => void = useCallback(
        (node: HTMLDivElement | null): void => {
            boundRef.current = node;
            hostRef.current = node;
        },
        [boundRef],
    );

    function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
        if (isDisabled) {
            return;
        }
        const delta: Axis2D | null = arrowKeyToDelta(event.key);
        if (delta === null) {
            return;
        }
        event.preventDefault();
        handleDelta(delta);
    }

    function handleKeyUp(event: ReactKeyboardEvent<HTMLDivElement>): void {
        if (isDisabled) {
            return;
        }
        const delta: Axis2D | null = arrowKeyToDelta(event.key);
        if (delta === null) {
            return;
        }
        event.preventDefault();
        restHostOffset();
    }

    function handleBlur(): void {
        restHostOffset();
    }

    return (
        <div
            ref={setHostNode}
            className={styles.base}
            role="application"
            aria-label={label}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0}
            data-enabled={enabled}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onBlur={handleBlur}
        >
            <div className={styles.thumbShadow} aria-hidden="true" />
            <div className={styles.thumb} aria-hidden="true" />
        </div>
    );
}
