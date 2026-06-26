import { type ReactElement } from 'react';

import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Banner.module.css';
import { type BannerProps, EBannerKind } from './Banner.types';

// The accessible name of the dismiss control. Hoisted to a module const (the
// same pattern SearchBox uses for CLEAR_LABEL) so the component and its tests
// agree on the exact label without duplicating the literal.
const DISMISS_LABEL: string = 'Dismiss';

// The live-region role per severity: the danger kind is assertive (role="alert")
// so it is announced immediately; the lower-severity kinds are polite
// (role="status"). Severity is never conveyed by color alone - the role and the
// message text carry it.
type BannerRole = 'status' | 'alert';

// Branch on the kind with an exhaustive switch and NO default, so a future kind
// is a compile error rather than silently defaulting to the polite role.
function resolveRole(kind: EBannerKind): BannerRole {
    switch (kind) {
        case EBannerKind.Danger:
            return 'alert';
        case EBannerKind.Info:
        case EBannerKind.Success:
        case EBannerKind.Warning:
            return 'status';
    }
}

// Map the kind onto the universal status the tone scope reads. success/danger
// swap the tone seed for the portal success/danger tokens; info/warning carry no
// universal status and take their seed from the data-kind selector instead.
function resolveStatus(kind: EBannerKind): EUiStatus {
    switch (kind) {
        case EBannerKind.Danger:
            return EUiStatus.Danger;
        case EBannerKind.Success:
            return EUiStatus.Success;
        case EBannerKind.Info:
        case EBannerKind.Warning:
            return EUiStatus.None;
    }
}

export function Banner({
    kind,
    children,
    icon,
    onDismiss,
    tone,
}: BannerProps): ReactElement {
    const role: BannerRole = resolveRole(kind);
    const status: EUiStatus = resolveStatus(kind);
    const className: string = [toneStyles.toneScope, styles.banner]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    function handleDismiss(): void {
        if (onDismiss === undefined) {
            return;
        }
        onDismiss();
    }

    return (
        <div
            role={role}
            className={className}
            style={toneProperties(tone)}
            data-kind={kind}
            data-status={status}
        >
            {icon !== undefined ? (
                <span className={styles.icon} aria-hidden="true">
                    {icon}
                </span>
            ) : null}
            <span className={styles.message}>{children}</span>
            {onDismiss !== undefined ? (
                <button
                    type="button"
                    className={styles.dismiss}
                    aria-label={DISMISS_LABEL}
                    onClick={handleDismiss}
                >
                    <span className={styles.dismissGlyph} aria-hidden="true" />
                </button>
            ) : null}
        </div>
    );
}
