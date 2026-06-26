import { type ReactNode } from 'react';

import { type Toned } from '../tone';

// Banner: an inline alert strip for the generic UI layer. It presents a short
// message, an optional leading icon, and an optional dismiss control as a single
// region. Severity is modeled as EBannerKind; the kind drives the tone seed (so
// the accent/border/glow derive from the shared tone ramp, never a literal
// color) and the live-region role. Low-severity kinds (info/success/warning)
// render with role="status" (polite); the danger kind renders with role="alert"
// (assertive), so urgent content is announced immediately. The component is
// tone-able: a consumer-supplied tone overrides the per-kind default seed.

// Severity of the banner. Modeled as an E-prefixed const-object enum (enums as a
// language feature are banned). The kebab-case values double as the data-kind
// attribute the CSS keys off to set the per-kind tone seed and accent. info and
// warning carry the universal EUiStatus.None; success and danger map to the
// universal success/danger status the tone scope reads.
export const EBannerKind: {
    readonly Info: 'info';
    readonly Success: 'success';
    readonly Warning: 'warning';
    readonly Danger: 'danger';
} = {
    Info: 'info',
    Success: 'success',
    Warning: 'warning',
    Danger: 'danger',
};
export type EBannerKind = (typeof EBannerKind)[keyof typeof EBannerKind];

// Props for the Banner.
//
// `kind` selects the severity and drives both the tone seed and the live-region
// role. `children` is the renderable message content. `icon` is an optional
// leading decorative slot (rendered aria-hidden, since the role + message carry
// the meaning). When `onDismiss` is supplied the banner renders a real close
// button labelled "Dismiss" that invokes the callback; without it the banner is
// non-dismissible and carries no interactive control. `tone` flows through the
// shared tone scope and overrides the per-kind default seed.
export type BannerProps = Readonly<{
    kind: EBannerKind;
    children: ReactNode;
    icon?: ReactNode;
    onDismiss?: () => void;
}> &
    Toned;
