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
// it drops back to Base after the next emitted character); Backspace and
// Enter report through onAction.
export const EKeyAction: {
    readonly Input: 'input';
    readonly Shift: 'shift';
    readonly Symbol: 'symbol';
    readonly Backspace: 'backspace';
    readonly Enter: 'enter';
    readonly Space: 'space';
} = {
    Input: 'input',
    Shift: 'shift',
    Symbol: 'symbol',
    Backspace: 'backspace',
    Enter: 'enter',
    Space: 'space',
};
export type EKeyAction = (typeof EKeyAction)[keyof typeof EKeyAction];

// One key cap. `labels` maps layers to cap text; a missing layer falls back
// to the base label (v1 keeps letters visible on the symbol layer).
// `widthUnits` is the key's flex share of its row (default 1).
export type VirtualKeyDef = Readonly<{
    id: string;
    action?: EKeyAction | undefined;
    labels: Readonly<Partial<Record<EKeyboardLayer, string>>>;
    widthUnits?: number | undefined;
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
