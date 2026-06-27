import { type ReactElement } from 'react';

import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './StatusFooter.module.css';
import {
    EFooterLiveness,
    EFooterRegion,
    EFooterStatus,
    type StatusFooterProps,
} from './StatusFooter.types';

// Default bracket badge labels per status, hoisted to module consts (the
// SearchBox CLEAR_LABEL / Banner DISMISS_LABEL precedent) so the component and
// its tests agree on the exact strings without duplicating the literals. The
// bracket string itself is the redundant, color-independent status signal.
const FOOTER_LABEL_OK: string = '[STATUS: OK]';
const FOOTER_LABEL_WARN: string = '[STATUS: WARN]';
const FOOTER_LABEL_ERROR: string = '[STATUS: ERROR]';
const FOOTER_LABEL_IDLE: string = '[STATUS: IDLE]';

// The resolved root role string, or undefined for a presentational footer. None
// renders no role so the strip can nest inside another landmark.
type FooterRole = 'contentinfo' | 'status' | undefined;

// Resolve the bracket label: the caller override wins, else the per-status const.
// Exhaustive switch with NO default so a new EFooterStatus member is a compile
// error rather than silently falling through to a wrong label.
function resolveBadgeLabel(status: EFooterStatus, badgeText?: string): string {
    if (badgeText !== undefined) {
        return badgeText;
    }
    switch (status) {
        case EFooterStatus.Ok:
            return FOOTER_LABEL_OK;
        case EFooterStatus.Warning:
            return FOOTER_LABEL_WARN;
        case EFooterStatus.Error:
            return FOOTER_LABEL_ERROR;
        case EFooterStatus.Idle:
            return FOOTER_LABEL_IDLE;
    }
}

// Map the footer status onto the universal status the tone scope reads: Ok ->
// Success, Error -> Danger; Warning and Idle carry no universal status (their
// seed comes from the data-footer-status selector). Exhaustive, NO default.
function resolveUniversalStatus(status: EFooterStatus): EUiStatus {
    switch (status) {
        case EFooterStatus.Ok:
            return EUiStatus.Success;
        case EFooterStatus.Error:
            return EUiStatus.Danger;
        case EFooterStatus.Warning:
        case EFooterStatus.Idle:
            return EUiStatus.None;
    }
}

// Resolve the announcement politeness: the explicit override wins, else Error
// elevates to Assertive and every other status is Polite.
function resolveLiveness(
    status: EFooterStatus,
    liveness?: EFooterLiveness,
): EFooterLiveness {
    if (liveness !== undefined) {
        return liveness;
    }
    if (status === EFooterStatus.Error) {
        return EFooterLiveness.Assertive;
    }
    return EFooterLiveness.Polite;
}

// Resolve the landmark/region role from the region. Exhaustive, NO default.
function resolveRole(region: EFooterRegion): FooterRole {
    switch (region) {
        case EFooterRegion.Contentinfo:
            return 'contentinfo';
        case EFooterRegion.Status:
            return 'status';
        case EFooterRegion.None:
            return undefined;
    }
}

export function StatusFooter({
    status,
    badgeText,
    message,
    end,
    region = EFooterRegion.Contentinfo,
    liveness,
    showDot = true,
    label,
    labelledBy,
    tone,
}: StatusFooterProps): ReactElement {
    const badgeLabel: string = resolveBadgeLabel(status, badgeText);
    const universalStatus: EUiStatus = resolveUniversalStatus(status);
    const resolvedLiveness: EFooterLiveness = resolveLiveness(status, liveness);
    const role: FooterRole = resolveRole(region);
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    // aria-live is applied to the strip root with aria-atomic so a status/message
    // change announces "[STATUS: ERROR] disk full" as one unit. Off emits an
    // explicit aria-live="off" rather than omitting it, because role="status" is
    // an implicit polite live region - omitting the attribute would NOT silence it.
    const liveProps: Readonly<Record<string, string>> =
        resolvedLiveness === EFooterLiveness.Off
            ? { 'aria-live': 'off' }
            : { 'aria-live': resolvedLiveness, 'aria-atomic': 'true' };

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-footer-status={status}
            data-status={universalStatus}
            {...(role !== undefined ? { role } : {})}
            {...(label !== undefined ? { 'aria-label': label } : {})}
            {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
            {...liveProps}
        >
            <span className={styles.badge}>
                {showDot ? (
                    <span className={styles.dot} aria-hidden="true" />
                ) : null}
                <span className={styles.label}>{badgeLabel}</span>
            </span>
            {message !== undefined ? (
                <span className={styles.message}>{message}</span>
            ) : null}
            {end !== undefined ? <span className={styles.end}>{end}</span> : null}
        </div>
    );
}
