import { type ReactElement } from 'react';

import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './StepTrack.module.css';
import { EStepState, type Step, type StepTrackProps } from './StepTrack.types';

// Derive a step's position from its index relative to the current step's index.
// When the current step is not found (currentIndex === -1) every step reads as
// future, which keeps the track legible rather than silently mismarking state.
function resolveStepState(index: number, currentIndex: number): EStepState {
    if (currentIndex === -1) {
        return EStepState.Future;
    }
    if (index < currentIndex) {
        return EStepState.Past;
    }
    if (index === currentIndex) {
        return EStepState.Current;
    }
    return EStepState.Future;
}

// The visually-hidden status word announced per step so the past/current/future
// position is not conveyed by the tone color alone (WCAG 1.4.1). aria-current on
// the current step already exposes "current" to AT, but the past/future split is
// otherwise color-only, so every step carries its own word.
function resolveStatusWord(stepState: EStepState): string {
    switch (stepState) {
        case EStepState.Past:
            return 'completed';
        case EStepState.Current:
            return 'current';
        case EStepState.Future:
            return 'not started';
    }
}

export function StepTrack({
    steps,
    currentId,
    tone,
}: StepTrackProps): ReactElement {
    const currentIndex: number = steps.findIndex(
        (step: Step): boolean => step.id === currentId,
    );
    const className: string = [toneStyles.toneScope, styles.track]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <ol
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
        >
            {steps.map((step: Step, index: number): ReactElement => {
                const stepState: EStepState = resolveStepState(index, currentIndex);
                const isCurrent: boolean = stepState === EStepState.Current;
                const statusWord: string = resolveStatusWord(stepState);
                return (
                    <li
                        key={step.id}
                        className={styles.step}
                        data-state={stepState}
                        {...(isCurrent ? { 'aria-current': 'step' } : {})}
                    >
                        <span className={styles.marker} aria-hidden="true">
                            <span className={styles.dot} />
                        </span>
                        <span className={styles.label}>{step.label}</span>
                        <span className={styles.statusText}>{statusWord}</span>
                    </li>
                );
            })}
        </ol>
    );
}
