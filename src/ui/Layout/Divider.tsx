import type { ReactElement } from 'react';

import styles from './Layout.module.css';
import { type DividerProps, EDividerOrientation } from './Layout.types';

// A token-drawn separator rule. The labelled form centers its text between
// two rules; the semantics stay a plain separator either way.
export function Divider({ label, orientation }: DividerProps): ReactElement {
    const resolved: EDividerOrientation =
        orientation ?? EDividerOrientation.Horizontal;
    if (label === undefined || resolved === EDividerOrientation.Vertical) {
        return (
            <div
                role="separator"
                aria-orientation={resolved}
                className={styles.divider}
                data-orientation={resolved}
            />
        );
    }
    return (
        <div
            role="separator"
            aria-orientation={resolved}
            className={styles.labelledDivider}
        >
            <span className={styles.dividerRule} aria-hidden="true" />
            <span className={styles.dividerLabel}>{label}</span>
            <span className={styles.dividerRule} aria-hidden="true" />
        </div>
    );
}
