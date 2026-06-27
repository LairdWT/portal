import {
    type CSSProperties,
    type ReactElement,
    type ReactNode,
    useId,
} from 'react';

import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './TitleBar.module.css';
import {
    ETitleBarLandmark,
    type TitleBarHeadingLevel,
    type TitleBarProps,
} from './TitleBar.types';

// Join the tone scope and the root class into a single class string. CSS module
// lookups are typed as possibly-undefined under noUncheckedIndexedAccess, so each
// segment is coalesced to keep the result a definite string (Panel's idiom).
function composeClassName(
    scope: string | undefined,
    local: string | undefined,
): string {
    return `${scope ?? ''} ${local ?? ''}`;
}

// Render the title at the configured heading level. The level is constrained to
// 1..6 by the prop type, so the switch is exhaustive (every member, no default)
// and avoids dangerous string interpolation into a tag name (Panel's pattern).
function renderHeading(
    level: TitleBarHeadingLevel,
    headingId: string,
    title: ReactNode,
): ReactElement {
    switch (level) {
        case 1:
            return (
                <h1 id={headingId} className={styles.title}>
                    {title}
                </h1>
            );
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

export function TitleBar({
    title,
    headingLevel = 1,
    landmark = ETitleBarLandmark.Banner,
    leading,
    tagline,
    trailing,
    breadcrumb,
    separator = '::',
    status = EUiStatus.None,
    tone,
}: TitleBarProps): ReactElement {
    // The title heading carries a stable id so the Region landmark can name
    // itself with it. useId is called unconditionally; the id is only wired into
    // aria-labelledby when the landmark is Region.
    const headingId: string = useId();

    const hasLeading: boolean = leading !== undefined;
    const hasTagline: boolean = tagline !== undefined;
    const hasTrailing: boolean = trailing !== undefined;
    const hasBreadcrumb: boolean = breadcrumb !== undefined;
    // The decorative separator only appears between the title and a present
    // tagline, and only when not explicitly suppressed with '' (Helicon parity).
    const showSeparator: boolean = hasTagline && separator !== '';

    const rootStyle: CSSProperties = toneProperties(tone);
    const rootClassName: string = composeClassName(
        toneStyles.toneScope,
        styles.bar,
    );
    // aria-labelledby names the Region landmark by the title heading; Banner is
    // named by its content and None has no landmark, so neither wires it.
    const labelledBy: string | undefined =
        landmark === ETitleBarLandmark.Region ? headingId : undefined;

    const heading: ReactElement = renderHeading(headingLevel, headingId, title);

    const content: ReactNode = (
        <>
            <div className={styles.titleRow}>
                {hasLeading ? (
                    <div className={styles.leading}>{leading}</div>
                ) : null}
                {heading}
                {showSeparator ? (
                    <span className={styles.separator} aria-hidden="true">
                        {separator}
                    </span>
                ) : null}
                {hasTagline ? (
                    <span className={styles.tagline}>{tagline}</span>
                ) : null}
                {hasTrailing ? (
                    <div className={styles.trailing}>{trailing}</div>
                ) : null}
            </div>
            {hasBreadcrumb ? (
                <div className={styles.breadcrumbRow}>{breadcrumb}</div>
            ) : null}
        </>
    );

    // Landmark mapping is an exhaustive switch over the three members (no
    // default), so a new member is a compile error rather than a silent div.
    switch (landmark) {
        case ETitleBarLandmark.Banner:
            return (
                <header
                    className={rootClassName}
                    style={rootStyle}
                    data-landmark={landmark}
                    data-status={status}
                >
                    {content}
                </header>
            );
        case ETitleBarLandmark.Region:
            return (
                <section
                    className={rootClassName}
                    style={rootStyle}
                    data-landmark={landmark}
                    data-status={status}
                    aria-labelledby={labelledBy}
                >
                    {content}
                </section>
            );
        case ETitleBarLandmark.None:
            return (
                <div
                    className={rootClassName}
                    style={rootStyle}
                    data-landmark={landmark}
                    data-status={status}
                >
                    {content}
                </div>
            );
    }
}
