import type { EEnabledState } from '../../state/state';

// The active cap layer. The kebab values double as the data-layer attribute
// the CSS keys off.
export const EKeyboardLayer: {
    readonly Base: 'base';
    readonly Shift: 'shift';
    readonly Symbol: 'symbol';
} = {
    Base: 'base',
    Shift: 'shift',
    Symbol: 'symbol',
};
export type EKeyboardLayer = (typeof EKeyboardLayer)[keyof typeof EKeyboardLayer];

// What a key does. Input keys emit their active-layer label through onKey;
// Space emits a literal space; Shift/Symbol toggle layers (Shift is one-shot:
// it drops back to Base after the next emitted character); everything else
// reports through onAction. Control and Alt LATCH visually (aria-pressed
// toggles on each press) but the keyboard owns no chord semantics - the HOST
// decides what a latched modifier means and when to consume it.
export const EKeyAction: {
    readonly Input: 'input';
    readonly Shift: 'shift';
    readonly Symbol: 'symbol';
    readonly Backspace: 'backspace';
    readonly Enter: 'enter';
    readonly Space: 'space';
    readonly Escape: 'escape';
    readonly Tab: 'tab';
    readonly Control: 'control';
    readonly Alt: 'alt';
    readonly ArrowLeft: 'arrow-left';
    readonly ArrowRight: 'arrow-right';
    readonly ArrowUp: 'arrow-up';
    readonly ArrowDown: 'arrow-down';
} = {
    Input: 'input',
    Shift: 'shift',
    Symbol: 'symbol',
    Backspace: 'backspace',
    Enter: 'enter',
    Space: 'space',
    Escape: 'escape',
    Tab: 'tab',
    Control: 'control',
    Alt: 'alt',
    ArrowLeft: 'arrow-left',
    ArrowRight: 'arrow-right',
    ArrowUp: 'arrow-up',
    ArrowDown: 'arrow-down',
};
export type EKeyAction = (typeof EKeyAction)[keyof typeof EKeyAction];

// A token-drawn cap glyph (the no-typed-glyphs rule: directional marks are
// drawn triangles, never ASCII arrows). A key with a glyph names itself for
// assistive tech through srLabel.
export const EKeyGlyph: {
    readonly ArrowLeft: 'arrow-left';
    readonly ArrowRight: 'arrow-right';
    readonly ArrowUp: 'arrow-up';
    readonly ArrowDown: 'arrow-down';
} = {
    ArrowLeft: 'arrow-left',
    ArrowRight: 'arrow-right',
    ArrowUp: 'arrow-up',
    ArrowDown: 'arrow-down',
};
export type EKeyGlyph = (typeof EKeyGlyph)[keyof typeof EKeyGlyph];

// One key cap. `labels` maps layers to cap text; a missing layer falls back
// to the base label (letters keep their base caps on the symbol layer).
// `widthUnits` is the key's flex share of its row (default 1). A `glyph`
// replaces the text cap with a token-drawn mark; `srLabel` then carries the
// accessible name (required with a glyph, optional to override a text cap).
export type VirtualKeyDef = Readonly<{
    id: string;
    action?: EKeyAction | undefined;
    labels: Readonly<Partial<Record<EKeyboardLayer, string>>>;
    widthUnits?: number | undefined;
    glyph?: EKeyGlyph | undefined;
    srLabel?: string | undefined;
}>;

export type VirtualKeyboardRow = readonly VirtualKeyDef[];

// Props for the VirtualKeyboard: a data-driven on-screen key matrix of
// machined key faces. Text commits through `onKey` (pointer presses commit
// on pointerdown for game feel; keyboard activation commits through the
// synthesized click); Backspace/Enter report through `onAction`. Rows
// default to the exported QWERTY_ROWS.
export type VirtualKeyboardProps = Readonly<{
    label: string;
    rows?: readonly VirtualKeyboardRow[] | undefined;
    onKey: (text: string) => void;
    onAction?: ((action: EKeyAction) => void) | undefined;
    enabled?: EEnabledState | undefined;
}>;
