import type { ReactElement } from 'react';

import styles from './Layout.module.css';
import {
    ELayoutGap,
    EStackAlign,
    EStackDirection,
    EStackJustify,
    type StackProps,
} from './Layout.types';

// The one-axis flow primitive. All presentation rides data-* attributes; the
// component owns no surface of its own.
export function Stack({
    children,
    direction,
    gap,
    align,
    justify,
    wrap,
}: StackProps): ReactElement {
    return (
        <div
            className={styles.stack}
            data-direction={direction ?? EStackDirection.Column}
            data-gap={gap ?? ELayoutGap.Md}
            data-align={align ?? EStackAlign.Stretch}
            data-justify={justify ?? EStackJustify.Start}
            data-wrap={wrap === true ? 'true' : 'false'}
        >
            {children}
        </div>
    );
}
