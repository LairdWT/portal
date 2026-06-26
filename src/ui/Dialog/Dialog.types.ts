import { type ReactNode, type RefObject } from 'react';

import { type ESecretAutocomplete } from '../SecretField/SecretField.types';
import { type EUiStatus, type Toned } from '../tone';

// Size of the dialog panel. The kebab-case values double as the data-size
// attribute the CSS keys off to cap the inline size; every size stays capped to
// the dynamic viewport so the panel never overflows the screen.
export const EDialogSize: {
    readonly Sm: 'sm';
    readonly Md: 'md';
    readonly Lg: 'lg';
} = {
    Sm: 'sm',
    Md: 'md',
    Lg: 'lg',
};
export type EDialogSize = (typeof EDialogSize)[keyof typeof EDialogSize];

// Props for the base Dialog: a modal surface built directly on the shared focus
// trap, dismissal, scroll-lock, and overlay-root primitives (not on Popover,
// since a modal is viewport-centered with a backdrop, aria-modal, and scroll
// lock rather than anchored and positioned).
//
// The dialog is controlled: `open` drives visibility and `onClose` is invoked on
// every dismissal request (Escape, backdrop pointer, or a composed action). `title`
// is required - it is the accessible name (aria-labelledby). `description`, when
// set, becomes aria-describedby. `size` caps the panel width. `closeOnEscape` and
// `closeOnBackdrop` (both default true) gate the two ambient dismissals.
// `initialFocusRef` overrides the first focus target inside the trap. `status`
// and `tone` flow through the shared tone scope.
export type DialogProps = Readonly<{
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    description?: string;
    size?: EDialogSize;
    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;
    initialFocusRef?: RefObject<HTMLElement | null>;
    status?: EUiStatus;
}> &
    Toned;

// Props for ConfirmDialog: the message-box composition over Dialog. `message` is
// the body. `onConfirm` fires on the primary action; `onCancel`, when provided,
// adds a Cancel action (the two-button confirm form) - omit it for a single
// acknowledge button. `confirmLabel` / `cancelLabel` default to 'OK' / 'Cancel'.
// `status` (e.g. Danger for a destructive confirm) colors the confirm action
// through the tone scope; `icon` is an optional decorative leading mark.
export type ConfirmDialogProps = Readonly<{
    open: boolean;
    onClose: () => void;
    title: string;
    message: ReactNode;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    status?: EUiStatus;
    icon?: ReactNode;
}> &
    Toned;

// Opt-in masked-prompt options for PromptDialog. The presence of this object is
// the discriminant that swaps the prompt's TextField for a SecretField; its
// REQUIRED `autoComplete` makes a half-built secret prompt unrepresentable (a
// masked prompt cannot be requested without choosing current/new-password). The
// reveal/conceal/caps strings forward to the field for i18n.
export type SecretPromptOptions = Readonly<{
    autoComplete: ESecretAutocomplete;
    revealLabel?: string;
    concealLabel?: string;
    capsLockWarning?: string;
}>;

// Props for PromptDialog: the input-dialog composition over Dialog and the
// existing TextField. The field is controlled (`value` in, `onValueChange` out).
// `onSubmit` fires with the current value on OK or Enter; `onCancel`, when
// provided, adds a Cancel action. `submitLabel` / `cancelLabel` default to
// 'OK' / 'Cancel'. `placeholder` forwards to the field. `secret`, when set, renders
// the prompt as a masked SecretField instead of a TextField; the common text
// prompt is unchanged when it is omitted.
export type PromptDialogProps = Readonly<{
    open: boolean;
    onClose: () => void;
    title: string;
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    onSubmit: (value: string) => void;
    onCancel?: () => void;
    submitLabel?: string;
    cancelLabel?: string;
    placeholder?: string;
    secret?: SecretPromptOptions;
}> &
    Toned;
