import type { CSSProperties, ReactElement } from 'react';

import styles from './Layout.module.css';
import { ELayoutGap, type GridProps } from './Layout.types';

const COLUMNS_PROPERTY: string = '--layout-columns';
const DEFAULT_COLUMNS: number = 2;
const MAX_COLUMNS: number = 12;

// The equal-track grid primitive. The clamped column count feeds
// repeat(var(--layout-columns), minmax(0, 1fr)) in the module.
export function Grid({ children, columns, gap }: GridProps): ReactElement {
    const requested: number = columns ?? DEFAULT_COLUMNS;
    const resolved: number = Number.isFinite(requested)
        ? Math.min(MAX_COLUMNS, Math.max(1, Math.trunc(requested)))
        : DEFAULT_COLUMNS;
    const style: CSSProperties = { [COLUMNS_PROPERTY]: resolved };
    return (
        <div className={styles.grid} style={style} data-gap={gap ?? ELayoutGap.Md}>
            {children}
        </div>
    );
}
