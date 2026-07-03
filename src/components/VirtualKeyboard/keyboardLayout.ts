// The default QWERTY layout for VirtualKeyboard: pure data, React-free.
// Letters carry base/shift caps (the symbol layer falls back to the base
// letter); the digit row swaps to its shifted punctuation on the symbol
// layer; the punctuation row carries the fuller symbol set (backtick/tilde,
// brackets, braces, pipe, backslash, quotes, angle pairs); the control row
// adds Esc/Tab and the latching Ctrl/Alt modifiers plus drawn arrow keys.

import {
    EKeyAction,
    EKeyGlyph,
    type VirtualKeyboardRow,
    type VirtualKeyDef,
} from './VirtualKeyboard.types';

function letterKey(base: string): VirtualKeyDef {
    return {
        id: base,
        labels: { base, shift: base.toUpperCase() },
    };
}

function digitKey(base: string, symbol: string): VirtualKeyDef {
    return {
        id: base,
        labels: { base, symbol },
    };
}

// A punctuation key: base cap plus its shifted sibling (the symbol layer
// mirrors shift here, so SYM also surfaces the full set).
function punctuationKey(id: string, base: string, shift: string): VirtualKeyDef {
    return {
        id,
        labels: { base, shift, symbol: shift },
    };
}

const DIGIT_ROW: VirtualKeyboardRow = [
    digitKey('1', '!'),
    digitKey('2', '@'),
    digitKey('3', '#'),
    digitKey('4', '$'),
    digitKey('5', '%'),
    digitKey('6', '^'),
    digitKey('7', '&'),
    digitKey('8', '*'),
    digitKey('9', '('),
    digitKey('0', ')'),
];

// The fuller symbol set the review asked for: backtick/tilde, dash/underscore,
// equals/plus, brackets/braces, backslash/pipe, semicolon/colon, quotes, and
// the comma/period/slash angle-pair trio.
const PUNCTUATION_ROW: VirtualKeyboardRow = [
    punctuationKey('backtick', '`', '~'),
    punctuationKey('minus', '-', '_'),
    punctuationKey('equals', '=', '+'),
    punctuationKey('bracket-open', '[', '{'),
    punctuationKey('bracket-close', ']', '}'),
    punctuationKey('backslash', '\\', '|'),
    punctuationKey('semicolon', ';', ':'),
    punctuationKey('quote', "'", '"'),
    punctuationKey('comma', ',', '<'),
    punctuationKey('period', '.', '>'),
    punctuationKey('slash', '/', '?'),
];

// Esc/Tab, the LATCHING Ctrl/Alt modifiers (the host owns chord semantics),
// and the drawn arrow cluster.
const CONTROL_ROW: VirtualKeyboardRow = [
    {
        id: 'escape',
        action: EKeyAction.Escape,
        labels: { base: 'ESC' },
        widthUnits: 1.25,
    },
    {
        id: 'tab',
        action: EKeyAction.Tab,
        labels: { base: 'TAB' },
        widthUnits: 1.25,
    },
    {
        id: 'control',
        action: EKeyAction.Control,
        labels: { base: 'CTRL' },
        widthUnits: 1.25,
    },
    {
        id: 'alt',
        action: EKeyAction.Alt,
        labels: { base: 'ALT' },
        widthUnits: 1.25,
    },
    {
        id: 'arrow-left',
        action: EKeyAction.ArrowLeft,
        labels: {},
        glyph: EKeyGlyph.ArrowLeft,
        srLabel: 'Arrow left',
    },
    {
        id: 'arrow-up',
        action: EKeyAction.ArrowUp,
        labels: {},
        glyph: EKeyGlyph.ArrowUp,
        srLabel: 'Arrow up',
    },
    {
        id: 'arrow-down',
        action: EKeyAction.ArrowDown,
        labels: {},
        glyph: EKeyGlyph.ArrowDown,
        srLabel: 'Arrow down',
    },
    {
        id: 'arrow-right',
        action: EKeyAction.ArrowRight,
        labels: {},
        glyph: EKeyGlyph.ArrowRight,
        srLabel: 'Arrow right',
    },
];

export const QWERTY_ROWS: readonly VirtualKeyboardRow[] = [
    CONTROL_ROW,
    DIGIT_ROW,
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(letterKey),
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(letterKey),
    PUNCTUATION_ROW,
    [
        {
            id: 'shift',
            action: EKeyAction.Shift,
            labels: { base: 'SHIFT' },
            widthUnits: 1.5,
        },
        ...['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(letterKey),
        {
            id: 'backspace',
            action: EKeyAction.Backspace,
            labels: { base: 'DEL' },
            widthUnits: 1.5,
        },
    ],
    [
        {
            id: 'symbol',
            action: EKeyAction.Symbol,
            labels: { base: 'SYM', symbol: 'ABC' },
            widthUnits: 1.5,
        },
        {
            id: 'space',
            action: EKeyAction.Space,
            labels: { base: 'SPACE' },
            widthUnits: 5,
        },
        {
            id: 'enter',
            action: EKeyAction.Enter,
            labels: { base: 'ENTER' },
            widthUnits: 2,
        },
    ],
];
