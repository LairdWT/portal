import type { ReactElement } from 'react';

import styles from './Toolbar.module.css';
import type { ToolbarGroupProps } from './Toolbar.types';

// A labelled cluster inside the Toolbar strip. Purely grouping semantics;
// the parent toolbar's roving tab stop reaches straight through it.
export function ToolbarGroup({ label, children }: ToolbarGroupProps): ReactElement {
    return (
        <div
            role="group"
            {...(label !== undefined ? { 'aria-label': label } : {})}
            className={styles.group}
        >
            {children}
        </div>
    );
}
