import type { ReactNode } from 'react';

import type { EEnabledState } from '../../state/state';
import type { EUiStatus, Toned } from '../tone';

// Visual variant of the click button. Values double as the data-variant
// attribute the CSS reads. Primary fills with the tone accent; Secondary is a
// transparent outline; Ghost is transparent with accent text on interaction;
// Danger uses the danger status surface.
export const ECtaVariant: {
    readonly Primary: 'primary';
    readonly Secondary: 'secondary';
    readonly Ghost: 'ghost';
    readonly Danger: 'danger';
} = {
    Primary: 'primary',
    Secondary: 'secondary',
    Ghost: 'ghost',
    Danger: 'danger',
};
export type ECtaVariant = (typeof ECtaVariant)[keyof typeof ECtaVariant];

// Size of the click button. Values double as the data-size attribute the CSS
// reads. All sizes keep the 48px minimum touch target; size scales padding and
// text only.
export const ECtaSize: {
    readonly Sm: 'sm';
    readonly Md: 'md';
    readonly Lg: 'lg';
} = {
    Sm: 'sm',
    Md: 'md',
    Lg: 'lg',
};
export type ECtaSize = (typeof ECtaSize)[keyof typeof ECtaSize];

// The native button type forwarded to the rendered element. Defaults to
// 'button' so the control never submits an enclosing form unless asked.
export type ECtaButtonType = 'button' | 'submit' | 'reset';

// Props for the CTA: the generic, domain-agnostic click button. This is the
// click primitive, separate from ActionButton/BevelButton (which emit input
// signals over a descriptor). The CTA carries no input coupling - its callback
// is a plain onClick. Label content comes from `children` when provided, else
// the `label` string (which also seeds aria-label for icon-only use). `enabled`
// is an enum resolved through useResolvedEnabled; the native disabled attribute
// derives from it. `tone` and `status` flow through the shared tone scope.
export type CTAProps = Readonly<
    {
        children?: ReactNode;
        label?: string;
        variant?: ECtaVariant;
        size?: ECtaSize;
        enabled?: EEnabledState;
        status?: EUiStatus;
        onClick?: () => void;
        type?: ECtaButtonType;
    } & Toned
>;
