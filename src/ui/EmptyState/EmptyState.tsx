import { type ReactElement, type ReactNode, useId } from 'react';

import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './EmptyState.module.css';
import {
    EEmptyStateRole,
    type EmptyStateHeadingLevel,
    type EmptyStateProps,
} from './EmptyState.types';

// Render the title at the configured heading level. The level is constrained to
// 2 | 3 | 4 by the prop type, so the switch is exhaustive and avoids dangerous
// string interpolation into a tag name.
function renderHeading(
    level: EmptyStateHeadingLevel,
    headingId: string,
    title: ReactNode,
): ReactElement {
    switch (level) {
        case 2:
            return (
                <h2 id={headingId} className={styles.title}>
                    {title}
                </h2>
            );
        case 3:
            return (
                <h3 id={headingId} className={styles.title}>
                    {title}
                </h3>
            );
        case 4:
            return (
                <h4 id={headingId} className={styles.title}>
                    {title}
                </h4>
            );
    }
}

export function EmptyState({
    title,
    description,
    icon,
    action,
    headingLevel = 2,
    role = EEmptyStateRole.Status,
    status = EUiStatus.None,
    tone,
}: EmptyStateProps): ReactElement {
    // A stable id lets the root label itself with the title via aria-labelledby,
    // which gives a region landmark its required accessible name.
    const headingId: string = useId();
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    const hasIcon: boolean = icon !== undefined;
    const hasDescription: boolean = description !== undefined;
    const hasAction: boolean = action !== undefined;

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            role={role}
            data-status={status}
            aria-labelledby={headingId}
        >
            {hasIcon ? (
                <span className={styles.icon} aria-hidden="true">
                    {icon}
                </span>
            ) : null}
            {renderHeading(headingLevel, headingId, title)}
            {hasDescription ? (
                <p className={styles.description}>{description}</p>
            ) : null}
            {hasAction ? <div className={styles.action}>{action}</div> : null}
        </div>
    );
}
