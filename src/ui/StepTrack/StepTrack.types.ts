import { type ReactNode } from 'react';

import { type Toned } from '../tone';

// Position of a step relative to the current step. Modeled as an E-prefixed
// const-object enum rather than a boolean pair so the three distinct
// presentation positions are a named member set. The kebab-case values double as
// the data-state attribute the CSS reads. Position is conveyed by list order and
// visible text first; the tone ramp only accents the current step, never the sole
// signal of progress.
export const EStepState: {
    readonly Past: 'past';
    readonly Current: 'current';
    readonly Future: 'future';
} = {
    Past: 'past',
    Current: 'current',
    Future: 'future',
};
export type EStepState = (typeof EStepState)[keyof typeof EStepState];

// A single step in the track. `id` is an opaque string the consumer supplies and
// matches against `currentId`; `label` is presentation content (string or node).
export type UiStep = Readonly<{
    id: string;
    label: ReactNode;
}>;

// Props for the StepTrack ordered phase indicator.
//
// The track is read-only: it renders an ordered list of steps with no buttons,
// no focus targets, and no callbacks. The step whose `id` equals `currentId`
// carries aria-current="step"; each step's position (past/current/future) is
// derived from its index relative to the current step and surfaced through the
// data-state attribute. `tone` is an opaque CSS color the consumer supplies that
// accents the current step's border, dot, and connector; the track never
// enumerates a palette.
export type StepTrackProps = Readonly<
    {
        steps: readonly UiStep[];
        currentId: string;
    } & Toned
>;
