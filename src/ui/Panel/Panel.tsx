import {
    type CSSProperties,
    type ReactElement,
    type ReactNode,
    useId,
} from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Panel.module.css';
import {
    EPanelElevation,
    type PanelHeadingLevel,
    type PanelProps,
} from './Panel.types';

// Join the tone scope and a component class into a single class string. CSS
// module lookups are typed as possibly-undefined under noUncheckedIndexedAccess,
// so each segment is coalesced to keep the result a definite string.
function composeClassName(
    scope: string | undefined,
    local: string | undefined,
): string {
    return `${scope ?? ''} ${local ?? ''}`;
}

// Render the title at the configured heading level. The level is constrained to
// 2 | 3 | 4 by the prop type, so the switch is exhaustive and avoids dangerous
// string interpolation into a tag name.
function renderHeading(
    level: PanelHeadingLevel,
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

export function Panel({
    title,
    headingLevel = 2,
    elevation = EPanelElevation.Flat,
    landmark,
    children,
    tone,
}: PanelProps): ReactElement {
    // A title gets a stable id so the container can label itself with it. useId
    // is called unconditionally; the id is only wired when a title is present.
    const headingId: string = useId();
    const hasTitle: boolean = title !== undefined;

    // landmark defaults to a <section> landmark; only an explicit `false` opts
    // out to a plain <div> for nested panels.
    const isLandmark: boolean = landmark !== false;

    const rootStyle: CSSProperties = toneProperties(tone);
    const rootClassName: string = composeClassName(
        toneStyles.toneScope,
        styles.panel,
    );
    const labelledBy: string | undefined = hasTitle ? headingId : undefined;

    const heading: ReactElement | null = hasTitle
        ? renderHeading(headingLevel, headingId, title)
        : null;

    if (isLandmark) {
        return (
            <section
                className={rootClassName}
                style={rootStyle}
                data-elevation={elevation}
                aria-labelledby={labelledBy}
            >
                {heading}
                <div className={styles.body}>{children}</div>
            </section>
        );
    }

    return (
        <div
            className={rootClassName}
            style={rootStyle}
            data-elevation={elevation}
            aria-labelledby={labelledBy}
        >
            {heading}
            <div className={styles.body}>{children}</div>
        </div>
    );
}
