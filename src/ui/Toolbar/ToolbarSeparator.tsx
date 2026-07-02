import type { ReactElement } from 'react';

import styles from './Toolbar.module.css';

// A drawn rule between toolbar clusters. Perpendicular to the strip, so it
// reports the opposite orientation to the toolbar's own.
export function ToolbarSeparator(): ReactElement {
    return (
        <div
            role="separator"
            aria-orientation="vertical"
            className={styles.separator}
        />
    );
}
