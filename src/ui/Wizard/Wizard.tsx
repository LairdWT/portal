import type { ReactElement } from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { CTA } from '../CTA/CTA';
import { ECtaVariant } from '../CTA/CTA.types';
import { StepTrack } from '../StepTrack/StepTrack';
import type { Step } from '../StepTrack/StepTrack.types';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Wizard.module.css';
import type { WizardProps, WizardStep } from './Wizard.types';

// The interactive multi-step container: StepTrack shows the phases, the
// panel presents the current step's content (remounted per step so the
// entrance replays), and the footer's Back / Next-or-Finish keys request
// controlled navigation.
export function Wizard({
    label,
    steps,
    currentId,
    onStepChange,
    onFinish,
    canAdvance,
    backLabel,
    nextLabel,
    finishLabel,
    enabled,
    tone,
}: WizardProps): ReactElement | null {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;

    const currentIndex: number = steps.findIndex(
        (step: WizardStep): boolean => step.id === currentId,
    );
    if (steps.length === 0 || currentIndex < 0) {
        // An unknown current step is a wiring error; render nothing rather
        // than an empty shell pretending to be a step.
        return null;
    }
    const current: WizardStep | undefined = steps[currentIndex];
    if (current === undefined) {
        return null;
    }
    const isFirst: boolean = currentIndex === 0;
    const isLast: boolean = currentIndex === steps.length - 1;
    const advanceAllowed: boolean = canAdvance !== false && !isDisabled;

    const trackSteps: readonly Step[] = steps.map(
        (step: WizardStep): Step => ({ id: step.id, label: step.label }),
    );

    function handleBack(): void {
        const previous: WizardStep | undefined = steps[currentIndex - 1];
        if (previous === undefined) {
            return;
        }
        onStepChange(previous.id);
    }

    function handleForward(): void {
        if (isLast) {
            onFinish?.();
            return;
        }
        const next: WizardStep | undefined = steps[currentIndex + 1];
        if (next === undefined) {
            return;
        }
        onStepChange(next.id);
    }

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <section
            className={className}
            style={toneProperties(tone)}
            aria-label={label}
            data-enabled={resolvedEnabled}
        >
            <StepTrack steps={trackSteps} currentId={currentId} tone={tone} />
            {/* Remount per step so the panel entrance replays. */}
            <div key={current.id} className={styles.panel} role="group">
                {current.content}
            </div>
            <div className={styles.footer}>
                <CTA
                    label={backLabel ?? 'Back'}
                    variant={ECtaVariant.Secondary}
                    enabled={
                        isFirst || isDisabled
                            ? EEnabledState.Disabled
                            : EEnabledState.Enabled
                    }
                    onClick={handleBack}
                />
                <CTA
                    label={
                        isLast ? (finishLabel ?? 'Finish') : (nextLabel ?? 'Next')
                    }
                    enabled={
                        advanceAllowed
                            ? EEnabledState.Enabled
                            : EEnabledState.Disabled
                    }
                    onClick={handleForward}
                />
            </div>
        </section>
    );
}
