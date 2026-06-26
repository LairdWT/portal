import { type ReactElement, type ReactNode, useId } from 'react';

import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Section.module.css';
import { type SectionHeadingLevel, type SectionProps } from './Section.types';

// Render the title at the configured heading level. The level is constrained to
// 2 | 3 | 4 | 5 | 6 by the prop type, so the switch is exhaustive and avoids
// dangerous string interpolation into a tag name.
function renderHeading(
    level: SectionHeadingLevel,
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
        case 5:
            return (
                <h5 id={headingId} className={styles.title}>
                    {title}
                </h5>
            );
        case 6:
            return (
                <h6 id={headingId} className={styles.title}>
                    {title}
                </h6>
            );
    }
}

export function Section({
    title,
    headingLevel = 2,
    actions,
    status = EUiStatus.None,
    children,
    tone,
}: SectionProps): ReactElement {
    // The title gets a stable id so the <section> can label itself with it,
    // exposing a region landmark named by the grouping title. useId is called
    // unconditionally; title is required so the wiring is always present.
    const headingId: string = useId();
    const hasActions: boolean = actions !== undefined;
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    return (
        <section
            className={className}
            style={toneProperties(tone)}
            data-status={status}
            aria-labelledby={headingId}
        >
            <div className={styles.header}>
                <span className={styles.accent} aria-hidden="true" />
                {renderHeading(headingLevel, headingId, title)}
                {hasActions ? (
                    <div className={styles.actions}>{actions}</div>
                ) : null}
            </div>
            <div className={styles.body}>{children}</div>
        </section>
    );
}
