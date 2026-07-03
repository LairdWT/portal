import { type ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './ObjectiveTracker.module.css';
import {
    EObjectiveState,
    type Objective,
    type ObjectiveTrackerProps,
} from './ObjectiveTracker.types';

// The spoken state suffix appended to each objective's list item.
function stateSuffix(state: EObjectiveState, optional: boolean): string {
    const parts: string[] = [];
    if (optional) {
        parts.push('optional');
    }
    if (state !== EObjectiveState.Active) {
        parts.push(state);
    }
    if (parts.length === 0) {
        return '';
    }
    return ` (${parts.join(', ')})`;
}

// The ObjectiveTracker: the quest-list HUD panel. Plain list semantics -
// each objective is one item whose glyph (diamond / check / cross) is
// decorative shape-first state, echoed by the status colors and SPOKEN via
// a plain text suffix; completed items strike through, failed and optional
// items dim. The consumer owns all state transitions.
export function ObjectiveTracker({
    label,
    objectives,
    tone,
}: ObjectiveTrackerProps): ReactElement {
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <section
            className={className}
            style={toneProperties(tone)}
            aria-label={label}
        >
            <h3 className={styles.heading}>{label}</h3>
            <ul className={styles.list} aria-label={label}>
                {objectives.map((objective: Objective): ReactElement => {
                    const state: EObjectiveState =
                        objective.state ?? EObjectiveState.Active;
                    const optional: boolean = objective.optional === true;
                    const hasCount: boolean =
                        objective.count !== undefined &&
                        objective.total !== undefined;
                    return (
                        <li
                            key={objective.id}
                            className={styles.item}
                            data-state={state}
                            data-optional={optional ? 'true' : undefined}
                        >
                            <span
                                className={styles.glyph}
                                data-state={state}
                                aria-hidden="true"
                            />
                            <span className={styles.text}>
                                {objective.label}
                                <span className={styles.srOnly}>
                                    {stateSuffix(state, optional)}
                                </span>
                            </span>
                            {hasCount ? (
                                <span className={styles.count}>
                                    {`${String(objective.count)} / ${String(objective.total)}`}
                                </span>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
