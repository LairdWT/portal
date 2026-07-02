import type { ReactNode } from 'react';

import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';

// One wizard phase: the StepTrack label plus the panel content shown while
// the step is current.
export type WizardStep = Readonly<{
    id: string;
    label: ReactNode;
    content: ReactNode;
}>;

// Props for the Wizard: the interactive multi-step container over StepTrack.
// Navigation is CONTROLLED - `currentId` names the presented step and
// `onStepChange` receives Back/Next requests - so a consumer validates,
// skips, or blocks freely. `canAdvance` gates the forward key (default
// true); the final step's forward key becomes Finish and fires `onFinish`.
// Steps are linear by design: the track itself stays non-interactive.
export type WizardProps = Readonly<
    {
        label: string;
        steps: readonly WizardStep[];
        currentId: string;
        onStepChange: (id: string) => void;
        onFinish?: (() => void) | undefined;
        canAdvance?: boolean | undefined;
        backLabel?: string | undefined;
        nextLabel?: string | undefined;
        finishLabel?: string | undefined;
        enabled?: EEnabledState | undefined;
    } & Toned
>;
