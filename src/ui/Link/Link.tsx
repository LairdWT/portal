import type { ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Link.module.css';
import type { LinkProps } from './Link.types';

// The themed anchor. External links open hardened in a new tab and carry a
// drawn outward chevron (decorative; "opens in a new tab" readers infer from
// target, and the visible mark is the sighted counterpart).
export function Link({
    href,
    children,
    external,
    download,
    id,
    onClick,
    tone,
}: LinkProps): ReactElement {
    const isExternal: boolean = external === true;
    const className: string = [toneStyles.toneScope, styles.link]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    return (
        <a
            {...(id !== undefined ? { id } : {})}
            className={className}
            style={toneProperties(tone)}
            href={href}
            {...(isExternal
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            {...(download !== undefined ? { download } : {})}
            onClick={onClick}
        >
            {children}
            {isExternal ? (
                <span className={styles.externalMark} aria-hidden="true" />
            ) : null}
        </a>
    );
}
