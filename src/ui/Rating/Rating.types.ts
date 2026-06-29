import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type AccessibleName } from '../accessibleName';
import { type Toned } from '../tone';

// Public contract for the Rating component: a controlled, domain-agnostic rating
// with two mutually exclusive modes modeled as a discriminated union on the
// `readOnly` discriminant, so illegal states are unrepresentable - a readonly
// rating cannot carry `onChange`/`enabled`/`allowClear`/an AccessibleName, and an
// interactive one cannot be fractional.
//
//   - INTERACTIVE (default, `readOnly?: false`): a role="radiogroup" of `max`
//     real <button role="radio"> marks, one per whole step. Selection is reported
//     through the controlled `value` + `onChange` pair (the Tabs/SegmentedControl
//     Portal default). It reuses SegmentedControl's roving-tabindex + keyboard +
//     AccessibleName machinery, but CLAMPS at the ends instead of wrapping,
//     because a rating is an ordinal magnitude, not a cyclic selector. A
//     focus-and-pointer preview (never hover-only) previews the provisional value.
//   - READONLY (`readOnly: true`): a non-interactive role="img" whose aria-label
//     is the formatted value text. This is where HALF-STEP / fractional display
//     lives: `value` may be fractional and the straddling mark is fill-clipped.
//
// Deliberate Helicon divergences (Helicon `rating` is an immediate-mode
// Option<usize>): React controlled value/onChange; added keyboard; added a
// focus+pointer preview; added a readonly display mode and readonly half-step;
// tone-able fill via the shared tone scope; a required AccessibleName on the
// radiogroup; CSS-drawn beveled pips with an optional `renderMark` override;
// optional `allowClear`. Interactive half-step (a slider role) is intentionally
// NOT built in this batch (YAGNI; flagged as a consumer-need follow-up).

// Per-mark presentation state, surfaced to the optional `renderMark` callback and
// to CSS through the data-state attribute. Modeled as an E-prefixed annotated
// const-object enum (a bare `as const` is rejected by @typescript-eslint/typedef
// `variableDeclaration`). The kebab values double as the data-state attribute the
// CSS keys off. `Filled` is a solid bevel-faced pip; `Empty` is an outline-only
// bevel pip (so filled vs empty is distinguished by shape/fill, not color alone);
// `Partial` carries a fractional fill (readonly half-step) exposed to CSS via the
// --portal-rating-fill custom property; `Preview` is the focus/hover provisional
// fill.
export const ERatingMarkState: {
    readonly Filled: 'filled';
    readonly Partial: 'partial';
    readonly Preview: 'preview';
    readonly Empty: 'empty';
} = {
    Filled: 'filled',
    Partial: 'partial',
    Preview: 'preview',
    Empty: 'empty',
};
export type ERatingMarkState =
    (typeof ERatingMarkState)[keyof typeof ERatingMarkState];

// The interactive member. `readOnly` is the optional-false discriminant, so the
// interactive-only members are not co-representable with the readonly ones.
//
//   - `max` is the total mark count (default 5, clamped to a floor of 1).
//   - `value` is the filled count: an integer in 0..max (0 = unrated); clamped for
//     display (mirrors Helicon `value.min(max)`).
//   - `onChange` (optional) reports the new one-based filled count; a controlled
//     `value` with no `onChange` is a legitimate read-only display, matching the
//     RadioGroup/SegmentedControl/Tabs/NavRail roving-select family.
//   - `enabled` is resolved through useResolvedEnabled; each mark's native
//     disabled attribute derives from it.
//   - `allowClear` makes activating the currently-selected mark (or arrowing below
//     1) report 0; default false to match Helicon's 1..max.
//   - `renderMark` optionally overrides the default CSS-drawn beveled pip with
//     consumer glyph content.
//   - `formatMarkLabel` builds each mark's accessible name (default "{count} of
//     {max}").
//   - AccessibleName: the radiogroup is a named role, so EXACTLY ONE of `label`
//     (-> aria-label) or `labelledBy` (-> aria-labelledby) is required; a nameless
//     radiogroup is a compile error.
//   - `tone` flows through the shared tone scope and drives the fill ramp.
export type RatingInteractiveProps = Readonly<{
    readOnly?: false;
    max?: number;
    value: number;
    onChange?: (next: number) => void;
    enabled?: EEnabledState;
    allowClear?: boolean;
    renderMark?: (state: ERatingMarkState, index: number) => ReactNode;
    formatMarkLabel?: (count: number, max: number) => string;
}> &
    AccessibleName &
    Toned;

// The readonly member. A non-interactive display: no `onChange`, no `enabled`, no
// `allowClear`, no AccessibleName (the formatted value text IS the accessible
// name). `value` may be fractional; `formatValueLabel` builds the role="img"
// aria-label (default "Rated {value} of {max}").
export type RatingReadonlyProps = Readonly<{
    readOnly: true;
    max?: number;
    value: number;
    renderMark?: (state: ERatingMarkState, index: number) => ReactNode;
    formatValueLabel?: (value: number, max: number) => string;
}> &
    Toned;

// The public Rating props: a discriminated union on `readOnly`.
export type RatingProps = RatingInteractiveProps | RatingReadonlyProps;
