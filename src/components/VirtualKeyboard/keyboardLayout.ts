// The default QWERTY layout for VirtualKeyboard: pure data, React-free.
// Letters carry base/shift caps (the symbol layer falls back to the base
// letter in v1); the digit row swaps to its shifted punctuation on the
// symbol layer.

import {
    EKeyAction,
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

export const QWERTY_ROWS: readonly VirtualKeyboardRow[] = [
    DIGIT_ROW,
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(letterKey),
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(letterKey),
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
