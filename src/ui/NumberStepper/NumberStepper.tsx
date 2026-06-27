import {
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    useId,
    useRef,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import { applyStep, clampToRange, normalizeStep } from './NumberStepper.logic';
import styles from './NumberStepper.module.css';
import { EStepDirection, type NumberStepperProps } from './NumberStepper.types';

export function NumberStepper({
    label,
    value,
    onChange,
    min,
    max,
    step,
    pageStep,
    enabled,
    status,
    formatValue,
    decrementLabel,
    incrementLabel,
    id,
    tone,
}: NumberStepperProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;

    // Documented read-only mode: an omitted onChange means the value can never
    // change. Express that in the markup - aria-readonly on the spinbutton and the
    // step keys rendered non-operable - rather than presenting fully-operable-
    // looking controls that silently no-op.
    const isReadOnly: boolean = onChange === undefined;

    // Unbounded steppers default to the safe-integer range so the saturating
    // clamp matches Helicon's i64 saturating intent; aria-valuemin/max stay off
    // unless the caller passes a finite bound (see render).
    const resolvedMin: number = min ?? Number.MIN_SAFE_INTEGER;
    const resolvedMax: number = max ?? Number.MAX_SAFE_INTEGER;
    const stepAmount: number = normalizeStep(step ?? 1);
    const pageAmount: number = normalizeStep(pageStep ?? stepAmount * 10);

    // The displayed value is the controlled prop clamped for render and ARIA. The
    // prop is never written back: the control only ever EMITS clamped values, so a
    // consumer is expected to pass an in-range value (no self-correcting effect,
    // no setState churn).
    const displayedValue: number = clampToRange(value, resolvedMin, resolvedMax);
    const canDecrement: boolean = displayedValue > resolvedMin;
    const canIncrement: boolean = displayedValue < resolvedMax;
    const valueText: string =
        formatValue?.(displayedValue) ?? String(displayedValue);

    // useId is called unconditionally (rules of hooks); the caller id wins when
    // present, matching the TextField/Panel id pattern.
    const generatedId: string = useId();
    const spinId: string = id ?? generatedId;
    const decLabel: string = decrementLabel ?? `Decrease ${label}`;
    const incLabel: string = incrementLabel ?? `Increase ${label}`;

    // A handle to the spinbutton so a click that drives a key to its bound (which
    // disables that key) can move focus here, keeping the keyboard path alive. No
    // listener/effect/timer is involved, so there is nothing to clean up.
    const spinRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
        null,
    );

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    // Single commit funnel: never mutates the value, drops a no-op (Helicon
    // returns changed=false on a frame that does not move), and stays silent when
    // disabled.
    function commit(next: number): void {
        if (isDisabled) {
            return;
        }
        if (next === displayedValue) {
            return;
        }
        onChange?.(next);
    }

    // Drive one step. `retainFocus` is set on the pointer path: when a click
    // reaches the bound the just-pressed key disables and would drop focus, so
    // focus moves to the spinbutton. The keyboard path already holds focus there.
    function requestStep(
        direction: EStepDirection,
        delta: number,
        retainFocus: boolean,
    ): void {
        if (isDisabled) {
            return;
        }
        const canStep: boolean =
            direction === EStepDirection.Increment ? canIncrement : canDecrement;
        if (!canStep) {
            return;
        }
        const next: number = applyStep(
            displayedValue,
            direction,
            delta,
            resolvedMin,
            resolvedMax,
        );
        if (retainFocus) {
            const bound: number =
                direction === EStepDirection.Increment ? resolvedMax : resolvedMin;
            if (next === bound) {
                spinRef.current?.focus();
            }
        }
        commit(next);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        if (isDisabled) {
            return;
        }
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                requestStep(EStepDirection.Increment, stepAmount, false);
                return;
            case 'ArrowDown':
                event.preventDefault();
                requestStep(EStepDirection.Decrement, stepAmount, false);
                return;
            case 'PageUp':
                event.preventDefault();
                requestStep(EStepDirection.Increment, pageAmount, false);
                return;
            case 'PageDown':
                event.preventDefault();
                requestStep(EStepDirection.Decrement, pageAmount, false);
                return;
            case 'Home':
                if (min === undefined) {
                    return;
                }
                event.preventDefault();
                commit(resolvedMin);
                return;
            case 'End':
                if (max === undefined) {
                    return;
                }
                event.preventDefault();
                commit(resolvedMax);
                return;
            default:
                return;
        }
    }

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-status={status ?? EUiStatus.None}
            data-enabled={resolvedEnabled}
        >
            <button
                type="button"
                className={styles.key}
                data-control={EStepDirection.Decrement}
                aria-label={decLabel}
                disabled={isDisabled || isReadOnly || !canDecrement}
                onClick={(): void => {
                    requestStep(EStepDirection.Decrement, stepAmount, true);
                }}
            >
                <span className={styles.glyph} aria-hidden="true">
                    [-]
                </span>
            </button>

            <div
                ref={spinRef}
                id={spinId}
                className={styles.value}
                role="spinbutton"
                tabIndex={isDisabled ? -1 : 0}
                aria-label={label}
                aria-valuenow={displayedValue}
                data-enabled={resolvedEnabled}
                {...(formatValue !== undefined
                    ? { 'aria-valuetext': valueText }
                    : {})}
                {...(min !== undefined ? { 'aria-valuemin': resolvedMin } : {})}
                {...(max !== undefined ? { 'aria-valuemax': resolvedMax } : {})}
                {...(isReadOnly ? { 'aria-readonly': true } : {})}
                {...(isDisabled ? { 'aria-disabled': true } : {})}
                onKeyDown={handleKeyDown}
            >
                {valueText}
            </div>

            <button
                type="button"
                className={styles.key}
                data-control={EStepDirection.Increment}
                aria-label={incLabel}
                disabled={isDisabled || isReadOnly || !canIncrement}
                onClick={(): void => {
                    requestStep(EStepDirection.Increment, stepAmount, true);
                }}
            >
                <span className={styles.glyph} aria-hidden="true">
                    [+]
                </span>
            </button>
        </div>
    );
}
