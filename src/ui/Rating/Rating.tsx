import {
    type CSSProperties,
    type Dispatch,
    Fragment,
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Rating.module.css';
import {
    ERatingMarkState,
    type RatingInteractiveProps,
    type RatingProps,
    type RatingReadonlyProps,
} from './Rating.types';

// String-typed (not a string literal) so the computed key satisfies the
// CSSProperties type, matching the existing --portal-slider-fill / progress-fill
// pattern. The readonly partial pip exposes its fractional fill through it.
const FILL_PROPERTY: string = '--portal-rating-fill';

// Default per-mark accessible name ("3 of 5"), hoisted so it is a stable
// reference rather than re-created per render.
function defaultFormatMarkLabel(count: number, max: number): string {
    return `${String(count)} of ${String(max)}`;
}

// Default readonly value-text label ("Rated 3.5 of 5"), hoisted for the same
// reason.
function defaultFormatValueLabel(value: number, max: number): string {
    return `Rated ${String(value)} of ${String(max)}`;
}

// Normalize a requested mark count to a sane integer floor of 1 (mirrors
// Helicon's max, but the API clamps the degenerate max==0 up to 1 rather than
// rendering nothing).
function resolveMaxCount(max: number | undefined): number {
    return Math.max(1, Math.floor(max ?? 5));
}

// The ordered mark indices 0..count-1, so both modes iterate identically without
// an unused-array allocation pattern leaking into the JSX.
function markIndices(count: number): readonly number[] {
    return Array.from(
        { length: count },
        (_unused: unknown, index: number): number => index,
    );
}

// Resolve an interactive mark's presentation state. The committed run is ALWAYS
// the solid filled face, so the committed value stays visible while the control is
// focused (selection-follows-focus keeps the focused mark equal to the committed
// one). A preview is an ADDITIVE provisional overlay only ABOVE the committed run -
// the marks in (committedCount, previewCount] - so a genuinely higher provisional
// value reads as not-yet-committed without ever hiding the committed face.
// Interactive marks are whole-step only, so they are never Partial.
function resolveInteractiveState(
    count: number,
    committedCount: number,
    previewCount: number | null,
): ERatingMarkState {
    if (count <= committedCount) {
        return ERatingMarkState.Filled;
    }
    if (previewCount !== null && count <= previewCount) {
        return ERatingMarkState.Preview;
    }
    return ERatingMarkState.Empty;
}

// The interactive radiogroup: `max` real <button role="radio"> marks with roving
// tabindex, clamp-not-wrap keyboard, and a focus+pointer preview. Mirrors
// SegmentedControl's structure and logic; diverges on clamp semantics and the
// preview affordance.
function InteractiveRating({
    max,
    value,
    onChange,
    enabled,
    allowClear,
    renderMark,
    formatMarkLabel = defaultFormatMarkLabel,
    label,
    labelledBy,
    tone,
}: RatingInteractiveProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const maxCount: number = resolveMaxCount(max);
    // Interactive value is a whole step; round and clamp so a stray fractional or
    // out-of-range input never produces a half-checked radio.
    const committedCount: number = Math.min(
        Math.max(Math.round(value), 0),
        maxCount,
    );
    // The single roving-tabindex target: the selected mark, or mark 1 when unrated,
    // so keyboard focus always has a valid entry point.
    const rovingIndex: number = committedCount >= 1 ? committedCount - 1 : 0;
    const [previewCount, setPreviewCount]: [
        number | null,
        Dispatch<SetStateAction<number | null>>,
    ] = useState<number | null>(null);
    // A fixed-index ref array (refs.current[index] = el), pruned by an effect keyed
    // on maxCount so a shrinking mark set drops its trailing refs - the same shape
    // SegmentedControl uses, avoiding the per-call spread anti-pattern.
    const markRefs: RefObject<(HTMLButtonElement | null)[]> = useRef<
        (HTMLButtonElement | null)[]
    >([]);
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    useEffect((): void => {
        markRefs.current.length = maxCount;
    }, [maxCount]);

    // `allowToggleClear` is TRUE only on the direct-activation paths (click,
    // Enter, Space): re-activating the committed mark with allowClear reports 0.
    // Keyboard navigation (Arrow/Home/End) passes FALSE so a clamped value that
    // lands back on the committed count commits that value rather than wiping it -
    // the documented contract restricts toggle-clear to direct re-activation
    // (arrowing BELOW 1 still clears through the count===0 branch below).
    function select(count: number, allowToggleClear: boolean): void {
        switch (resolvedEnabled) {
            case EEnabledState.Disabled:
                return;
            case EEnabledState.Enabled: {
                const shouldClear: boolean =
                    allowToggleClear &&
                    allowClear === true &&
                    count !== 0 &&
                    count === committedCount;
                const next: number = shouldClear ? 0 : count;
                const focusIndex: number = Math.max(next - 1, 0);
                markRefs.current[focusIndex]?.focus();
                onChange?.(next);
                return;
            }
        }
    }

    function handleKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        focusedCount: number,
    ): void {
        if (resolvedEnabled === EEnabledState.Disabled) {
            return;
        }
        if (maxCount <= 0) {
            return;
        }

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowUp': {
                event.preventDefault();
                select(Math.min(focusedCount + 1, maxCount), false);
                return;
            }
            case 'ArrowLeft':
            case 'ArrowDown': {
                event.preventDefault();
                const floor: number = allowClear === true ? 0 : 1;
                select(Math.max(focusedCount - 1, floor), false);
                return;
            }
            case 'Home': {
                event.preventDefault();
                select(1, false);
                return;
            }
            case 'End': {
                event.preventDefault();
                select(maxCount, false);
                return;
            }
            case 'Enter':
            case ' ': {
                event.preventDefault();
                select(focusedCount, true);
                return;
            }
            default:
                return;
        }
    }

    // The preview is driven by BOTH pointer and keyboard focus, so a keyboard-only
    // user gets the identical affordance and the interaction is never hover-only.
    // It is purely visual: aria-checked still conveys the committed value, so
    // assistive-technology output stays quiet during preview.
    function setPreview(count: number): void {
        if (isDisabled) {
            return;
        }
        setPreviewCount(count);
    }

    function clearPreview(): void {
        setPreviewCount(null);
    }

    return (
        <div
            role="radiogroup"
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
            data-readonly="false"
            onPointerLeave={clearPreview}
            onBlur={clearPreview}
            {...(label !== undefined ? { 'aria-label': label } : {})}
            {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
        >
            {markIndices(maxCount).map((index: number): ReactElement => {
                const count: number = index + 1;
                const state: ERatingMarkState = resolveInteractiveState(
                    count,
                    committedCount,
                    previewCount,
                );
                // The headline machined active pip stays on the committed mark even
                // while previewing a higher provisional value, so the committed
                // active treatment is never suppressed by selection-follows-focus.
                const isActivePip: boolean =
                    committedCount >= 1 && count === committedCount;
                return (
                    <button
                        key={index}
                        ref={(element: HTMLButtonElement | null): void => {
                            markRefs.current[index] = element;
                        }}
                        type="button"
                        role="radio"
                        className={styles.mark}
                        aria-checked={count === committedCount}
                        aria-label={formatMarkLabel(count, maxCount)}
                        tabIndex={index === rovingIndex ? 0 : -1}
                        disabled={isDisabled}
                        data-state={state}
                        data-enabled={resolvedEnabled}
                        onClick={(): void => {
                            select(count, true);
                        }}
                        onKeyDown={(
                            event: KeyboardEvent<HTMLButtonElement>,
                        ): void => {
                            handleKeyDown(event, count);
                        }}
                        onPointerEnter={(): void => {
                            setPreview(count);
                        }}
                        onFocus={(): void => {
                            setPreview(count);
                        }}
                    >
                        {renderMark ? (
                            renderMark(state, index)
                        ) : (
                            <span
                                className={styles.pip}
                                data-state={state}
                                data-active={isActivePip ? 'true' : 'false'}
                                aria-hidden="true"
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// The readonly display: a non-interactive role="img" whose aria-label is the
// formatted value text. Mirrors StatPill's tone-only, no-focus, no-motion render
// shape. This is the half-step surface: a fractional value renders correctly via
// the clipped partial pip.
function ReadonlyRating({
    max,
    value,
    renderMark,
    formatValueLabel = defaultFormatValueLabel,
    tone,
}: RatingReadonlyProps): ReactElement {
    const maxCount: number = resolveMaxCount(max);
    const displayValue: number = Math.min(Math.max(value, 0), maxCount);
    const whole: number = Math.floor(displayValue);
    const fraction: number = displayValue - whole;
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <span
            role="img"
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-readonly="true"
            aria-label={formatValueLabel(displayValue, maxCount)}
        >
            {markIndices(maxCount).map((index: number): ReactElement => {
                const count: number = index + 1;
                let state: ERatingMarkState = ERatingMarkState.Empty;
                if (count <= whole) {
                    state = ERatingMarkState.Filled;
                } else if (index === whole && fraction > 0) {
                    state = ERatingMarkState.Partial;
                }
                if (renderMark) {
                    return (
                        <Fragment key={index}>{renderMark(state, index)}</Fragment>
                    );
                }
                const pipStyle: CSSProperties =
                    state === ERatingMarkState.Partial
                        ? { [FILL_PROPERTY]: String(fraction) }
                        : {};
                return (
                    <span
                        key={index}
                        className={styles.pip}
                        data-state={state}
                        style={pipStyle}
                        aria-hidden="true"
                    />
                );
            })}
        </span>
    );
}

// Branch on the readOnly discriminant with no silent fall-through: each mode is a
// dedicated component, so its hooks run unconditionally and the two prop shapes
// stay non-co-representable.
export function Rating(props: RatingProps): ReactElement {
    if (props.readOnly === true) {
        return <ReadonlyRating {...props} />;
    }
    return <InteractiveRating {...props} />;
}
