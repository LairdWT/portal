import { type ReactNode } from 'react';

import { type AccessibleName } from '../accessibleName';
import { type Toned } from '../tone';

// StatusFooter: a beveled machined-HUD bottom status strip for the generic UI
// layer, the React-DOM realization of Helicon `status_footer`. It pairs a status
// badge (inline-start), a one-line transient message (center, grows), and a
// caller-owned end block (inline-end: version stamp, build hash, scan indicator).
// It is a landmark / live-region wrapper that owns semantics (role, accessible
// name, aria-live) and the status->badge mapping, but owns NO segment shape: the
// `message` and `end` content are caller-supplied ReactNode (interface-forwarding,
// mirroring Helicon's `right_content: FnOnce(&mut Ui)` closure and
// `message: Option<&str>` slot). The three-slot strip layout is inlined here (NOT
// a shared cross-component primitive) so this build stays independent of TitleBar.

// Footer badge category. Mirrors Helicon FooterStatus exactly. The kebab-case
// value doubles as the data-footer-status attribute the CSS color map keys off.
// Distinct from EUiStatus (none/danger/success) because the footer carries the
// extra Warning and Idle categories Helicon defines; mapping to the universal
// status happens internally (resolveUniversalStatus in StatusFooter.tsx).
export const EFooterStatus: {
    readonly Ok: 'ok';
    readonly Warning: 'warning';
    readonly Error: 'error';
    readonly Idle: 'idle';
} = { Ok: 'ok', Warning: 'warning', Error: 'error', Idle: 'idle' };
export type EFooterStatus = (typeof EFooterStatus)[keyof typeof EFooterStatus];

// How the footer participates in the accessibility tree. Contentinfo (default) is
// the page footer landmark; Status is a standalone polite status region (not the
// page footer); None is presentational (nested inside another landmark, no role).
export const EFooterRegion: {
    readonly Contentinfo: 'contentinfo';
    readonly Status: 'status';
    readonly None: 'none';
} = { Contentinfo: 'contentinfo', Status: 'status', None: 'none' };
export type EFooterRegion = (typeof EFooterRegion)[keyof typeof EFooterRegion];

// Live-region politeness for the badge+message announcement. Default Polite; the
// Error status elevates to Assertive unless the caller overrides. Off suppresses
// announcements for a purely static footer.
export const EFooterLiveness: {
    readonly Off: 'off';
    readonly Polite: 'polite';
    readonly Assertive: 'assertive';
} = { Off: 'off', Polite: 'polite', Assertive: 'assertive' };
export type EFooterLiveness =
    (typeof EFooterLiveness)[keyof typeof EFooterLiveness];

// Props for the StatusFooter.
//
// `status` selects the badge category and drives the dot + strip border/glow
// color (never the AA-critical badge text - see StatusFooter.module.css).
// `badgeText` overrides the per-status bracket label; the badge COLOR still comes
// from `status`. `message` is the one-line transient status node (interface-
// forwarded; the footer owns no message shape). `end` is the inline-end block
// (version stamp, build hash, scan indicator), interface-forwarded mirroring
// Helicon right_content. `region` chooses the landmark/region role. `liveness`
// sets the announcement politeness (Error -> Assertive by default). `showDot`
// toggles the decorative leading dot. AccessibleName is REQUIRED so the
// contentinfo/status region always carries a name; Toned flows through the shared
// tone scope and overrides the per-status seed.
export type StatusFooterProps = Readonly<{
    status: EFooterStatus;
    badgeText?: string;
    message?: ReactNode;
    end?: ReactNode;
    region?: EFooterRegion;
    liveness?: EFooterLiveness;
    showDot?: boolean;
}> &
    AccessibleName &
    Toned;
