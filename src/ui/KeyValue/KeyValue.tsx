// KeyValue / PropertyGrid. A non-interactive, tone-able inspector grid that
// renders consumer-supplied `{ key, value }` pairs inside a role="group" wrapper
// around a semantic <dl>/<dt>/<dd> tree (mirrors ReadoutPanel's group-wrapped,
// a11y-clean structure, so the accessible name is reliably announced AND the
// dt/dd term/definition semantics are preserved). The group root carries the tone
// scope for the grid-level tone and exposes the value-overflow policy and status
// as data-* attributes the CSS keys off; each row carries its own tone scope so a
// per-row `tone` resolves independently. `value` is a ReactNode, so the grid
// forwards arbitrary content (icons, links, badges) and never owns data. A
// one-element `pairs` array is the single-row `key_value_row` case.
// Non-interactive: no focus target, no keyboard, no effects, no motion.

import { type ReactElement } from 'react';

import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './KeyValue.module.css';
import {
    EKeyValueOverflow,
    type KeyValuePair,
    type KeyValueProps,
} from './KeyValue.types';

export function KeyValue({
    label,
    pairs,
    overflow = EKeyValueOverflow.Wrap,
    status = EUiStatus.None,
    tone,
}: KeyValueProps): ReactElement {
    const rootClassName: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    const rowClassName: string = [toneStyles.toneScope, styles.row]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    // Mirror ReadoutPanel: a role="group" wrapper carries the reliably-announced
    // accessible name, the tone scope, and the data-* policy attributes, while the
    // inner <dl> stays an unlabeled definition list so the dt/dd term/definition
    // semantics are preserved. (aria-label on a bare <dl> is not dependably
    // surfaced by assistive tech.)
    return (
        <div
            className={rootClassName}
            style={toneProperties(tone)}
            role="group"
            aria-label={label}
            data-status={status}
            data-overflow={overflow}
        >
            <dl className={styles.list}>
                {pairs.map(
                    (pair: KeyValuePair): ReactElement => (
                        <div
                            key={pair.id}
                            className={rowClassName}
                            style={toneProperties(pair.tone)}
                        >
                            <dt className={styles.key}>{pair.key}</dt>
                            <dd className={styles.value}>{pair.value}</dd>
                        </div>
                    ),
                )}
            </dl>
        </div>
    );
}
