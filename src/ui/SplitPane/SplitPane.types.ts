import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type AccessibleName } from '../accessibleName';
import { type EUiStatus, type Toned } from '../tone';

// SplitPane. A controlled, two-pane resizable split with a draggable,
// keyboard-operable divider, for the generic UI layer. It mirrors Helicon's
// split_pane: the consumer owns the split position as a `fraction` (the primary
// pane's share of the main axis, 0..1) and SplitPane writes the next CLAMPED
// value back through `onFractionChange` while the divider is dragged or
// keyboard-resized. SplitPane owns no pane content - the two regions are
// interface-forwarded ReactNode slots (`primary`, `secondary`).
//
// A11y: the divider is a WAI-ARIA APG Window Splitter (role="separator" with
// aria-orientation, aria-valuenow/min/max as integer percents, aria-controls to
// the primary pane). It is a named role, so an AccessibleName (label XOR
// labelledBy) is REQUIRED - a nameless splitter is a compile error. Keyboard:
// the main-axis arrows step by `keyboardStep`, PageUp/PageDown by 10x, Home/End
// jump to the bounds; the cross-axis arrows are ignored. The visible seam is
// thin but the separator's cross-axis hit area meets the 3rem touch floor.

// Split axis. E-prefixed annotated const object (enums-as-language banned).
// Horizontal => side-by-side panes with a VERTICAL divider that moves along the
// inline axis (aria-orientation="vertical"). Vertical => stacked panes with a
// HORIZONTAL divider moving along the block axis (aria-orientation="horizontal").
// The string value doubles as the data-orientation attribute the CSS reads.
export const ESplitOrientation: {
    readonly Horizontal: 'horizontal';
    readonly Vertical: 'vertical';
} = {
    Horizontal: 'horizontal',
    Vertical: 'vertical',
};
export type ESplitOrientation =
    (typeof ESplitOrientation)[keyof typeof ESplitOrientation];

// Props for the controlled SplitPane. Both orientations share the identical
// prop set (the only difference is which axis `fraction` runs along), so a
// single Readonly props type with an `orientation` enum is correct - a
// discriminated union would duplicate every field with no impossible-state to
// forbid.
export type SplitPaneProps = Readonly<
    {
        // Which way the panes stack / the divider runs. Default Horizontal.
        orientation?: ESplitOrientation;
        // The PRIMARY (inline-start / block-start) pane's share of the main
        // axis, 0..1. Controlled (Helicon's caller-owned fraction). Clamped to
        // [minFraction, maxFraction] for render, ARIA, and the track sizing; the
        // prop itself is never written back - the control only EMITS clamped
        // values, matching NumberStepper.
        fraction: number;
        // Reports the next CLAMPED fraction on drag or keyboard resize.
        onFractionChange: (fraction: number) => void;
        // Fraction bounds. Defaults 0.1 / 0.9 EXACTLY mirror Helicon
        // MIN_FRACTION / MAX_FRACTION.
        minFraction?: number;
        maxFraction?: number;
        // Optional absolute per-pane minimums as CSS length/token strings (e.g.
        // 'var(--portal-space-8)'). Intersected with the fraction clamp through
        // an inline minmax() track so a pane never collapses below a usable size
        // on a small container. Passed through to CSS, never parsed in JS.
        minPrimarySize?: string;
        minSecondarySize?: string;
        // Keyboard step per Arrow press, in fraction units. Default 0.02 (2%);
        // PageUp/PageDown use 10x. Mirrors a slider's stepped resize.
        keyboardStep?: number;
        // Interface-forwarded pane bodies. SplitPane owns no pane content.
        primary: ReactNode;
        secondary: ReactNode;
        // Enabled state enum, resolved through useResolvedEnabled. A disabled
        // splitter renders both panes but the divider is non-interactive and out
        // of the tab order.
        enabled?: EEnabledState;
        // Universal status routed through the tone scope (data-status). Defaults
        // to EUiStatus.None.
        status?: EUiStatus;
    } & AccessibleName
> &
    Toned;
