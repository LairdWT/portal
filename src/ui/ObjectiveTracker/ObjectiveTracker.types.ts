import { type Toned } from '../tone';

// Objective lifecycle state. The kebab values double as the data-state
// attribute; each state ALSO draws a distinct glyph (active diamond,
// complete check, failed cross) so meaning never rides color alone, and a
// spoken suffix carries it to assistive tech.
export const EObjectiveState: {
    readonly Active: 'active';
    readonly Complete: 'complete';
    readonly Failed: 'failed';
} = {
    Active: 'active',
    Complete: 'complete',
    Failed: 'failed',
};
export type EObjectiveState =
    (typeof EObjectiveState)[keyof typeof EObjectiveState];

// One tracked objective. `count`/`total` render the "3 / 5" progress chip
// (provide both or neither); `optional` marks the side objective (dimmer,
// suffixed "optional").
export type Objective = Readonly<{
    id: string;
    label: string;
    state?: EObjectiveState | undefined;
    count?: number | undefined;
    total?: number | undefined;
    optional?: boolean | undefined;
}>;

// Props for the ObjectiveTracker: the quest/objective HUD list. The
// consumer owns the objective states; the tracker only draws them (list
// semantics, one item per objective, states spoken as suffixes).
export type ObjectiveTrackerProps = Readonly<{
    /**
     * Heading above the list; also the list's accessible name.
     */
    label: string;
    objectives: readonly Objective[];
}> &
    Toned;
