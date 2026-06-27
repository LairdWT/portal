import { type CSSProperties, type ReactElement } from 'react';

import styles from './TileRow.module.css';
import { type TileRowProps } from './TileRow.types';

// String-typed (not a string literal) so the computed key satisfies the
// CSSProperties type, matching the existing tone --portal-* inline-property
// pattern. The CSS reads it for the fixed-column grid template.
const COLUMNS_PROPERTY: string = '--portal-tile-columns';

// A fixed N-column grid is honored only for a valid positive integer. columns=0,
// a negative, a fraction, NaN, or Infinity would emit repeat(<invalid>, 1fr),
// which the browser drops - silently collapsing the strip to a single column.
// Negative-first: anything but a positive integer falls through to the auto-fit
// grid rather than failing silently.
function isFixedColumns(columns: number | undefined): columns is number {
    return columns !== undefined && Number.isInteger(columns) && columns > 0;
}

function columnsStyle(columns: number | undefined): CSSProperties | undefined {
    if (!isFixedColumns(columns)) {
        return undefined;
    }
    const style: CSSProperties = { [COLUMNS_PROPERTY]: String(columns) };
    return style;
}

export function TileRow({ children, columns, label }: TileRowProps): ReactElement {
    const style: CSSProperties | undefined = columnsStyle(columns);
    const columnsMode: 'auto' | 'fixed' = isFixedColumns(columns)
        ? 'fixed'
        : 'auto';
    // Named strip vs presentational layout: a group role only when a name exists,
    // so an empty group role with no accessible name is never emitted.
    if (label === undefined) {
        return (
            <div className={styles.row} style={style} data-columns={columnsMode}>
                {children}
            </div>
        );
    }
    return (
        <div
            className={styles.row}
            style={style}
            data-columns={columnsMode}
            role="group"
            aria-label={label}
        >
            {children}
        </div>
    );
}
