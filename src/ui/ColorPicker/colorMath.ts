// Pure, React-free color math for the ColorPicker. This module is the only new
// logic in the component and is kept INTERNAL to the ColorPicker directory (not
// barrel-exported) to keep the public surface tight. Behavior mirrors Helicon's
// ColorEditState math (parse/format hex, rgb<->hsv) with the channel-clamping and
// length rules ported faithfully. Every function is total: parsing returns a
// discriminated result rather than throwing, so an invalid hex is a representable
// value, never an exception.

// Channel bytes 0..255 (r,g,b,a). The canonical in-memory color shape the sliders
// and the hex serializer share.
export type RgbaBytes = Readonly<{ r: number; g: number; b: number; a: number }>;

// HSV color: hue in degrees 0..360, saturation and value as percent 0..100.
export type HsvColor = Readonly<{ h: number; s: number; v: number }>;

// Parse failure kinds, mirroring Helicon ColorEditError (InvalidHexLength /
// InvalidHexDigits). Modeled as an E-prefixed annotated const-object enum.
export const EColorParseError: {
    readonly InvalidLength: 'invalid-length';
    readonly InvalidDigits: 'invalid-digits';
} = {
    InvalidLength: 'invalid-length',
    InvalidDigits: 'invalid-digits',
};
export type EColorParseError =
    (typeof EColorParseError)[keyof typeof EColorParseError];

// Discriminated-union parse result: a failure is unrepresentable as a thrown
// exception. Mirrors Helicon ColorEditResult.
export type ColorParseResult =
    | Readonly<{ ok: true; value: RgbaBytes }>
    | Readonly<{ ok: false; error: EColorParseError }>;

const OPAQUE_BYTE: number = 255;
const HEX_PATTERN: RegExp = /^[0-9a-fA-F]+$/;

function clamp(value: number, lower: number, upper: number): number {
    return Math.min(Math.max(value, lower), upper);
}

// Round and clamp an arbitrary number into a 0..255 channel byte. Out-of-range
// inputs are clamped, never rejected (Helicon set_channel clamps).
function clampByte(value: number): number {
    return clamp(Math.round(value), 0, OPAQUE_BYTE);
}

function toHexByte(value: number): string {
    return clampByte(value).toString(16).padStart(2, '0').toUpperCase();
}

function parseHexPair(body: string, index: number): number {
    return parseInt(body.slice(index, index + 2), 16);
}

// Parse a hex color string into channel bytes. Strips one optional leading '#'
// (Helicon strips COLOR_HEX_PREFIX), then accepts length 6 (RRGGBB, alpha
// defaults to opaque) or length 8 (RRGGBBAA). Shorthand #RGB / #RGBA is rejected
// to match Helicon (6/8 only). Total: never throws.
export function parseHexColor(text: string): ColorParseResult {
    const body: string = text.startsWith('#') ? text.slice(1) : text;
    if (body.length !== 6 && body.length !== 8) {
        return { ok: false, error: EColorParseError.InvalidLength };
    }
    if (!HEX_PATTERN.test(body)) {
        return { ok: false, error: EColorParseError.InvalidDigits };
    }
    const red: number = parseHexPair(body, 0);
    const green: number = parseHexPair(body, 2);
    const blue: number = parseHexPair(body, 4);
    const alpha: number = body.length === 8 ? parseHexPair(body, 6) : OPAQUE_BYTE;
    return { ok: true, value: { r: red, g: green, b: blue, a: alpha } };
}

// Serialize channel bytes to an uppercase, zero-padded hex string. The '#' prefix
// is the Portal/web addition (Helicon omits it). Emits '#RRGGBB' when alpha is
// false and '#RRGGBBAA' when true.
export function formatHexColor(rgba: RgbaBytes, alpha: boolean): string {
    const base: string = `#${toHexByte(rgba.r)}${toHexByte(rgba.g)}${toHexByte(rgba.b)}`;
    return alpha ? `${base}${toHexByte(rgba.a)}` : base;
}

// Convert channel bytes to HSV. Hue clamps to 0..360, saturation/value to 0..100.
// Documented parity caveat: a grey (zero-chroma) color has an undefined hue; this
// resets it to 0, exactly as Helicon's rgb_to_hsv derives it each frame. The
// alpha channel is intentionally dropped (HSV carries no alpha).
export function rgbToHsv(rgba: RgbaBytes): HsvColor {
    const red: number = clampByte(rgba.r) / OPAQUE_BYTE;
    const green: number = clampByte(rgba.g) / OPAQUE_BYTE;
    const blue: number = clampByte(rgba.b) / OPAQUE_BYTE;
    const max: number = Math.max(red, green, blue);
    const min: number = Math.min(red, green, blue);
    const delta: number = max - min;

    let hue: number = 0;
    if (delta !== 0) {
        if (max === red) {
            hue = 60 * (((green - blue) / delta) % 6);
        } else if (max === green) {
            hue = 60 * ((blue - red) / delta + 2);
        } else {
            hue = 60 * ((red - green) / delta + 4);
        }
    }
    if (hue < 0) {
        hue += 360;
    }

    const saturation: number = max === 0 ? 0 : (delta / max) * 100;
    const valuePercent: number = max * 100;

    return {
        h: clamp(Math.round(hue), 0, 360),
        s: clamp(Math.round(saturation), 0, 100),
        v: clamp(Math.round(valuePercent), 0, 100),
    };
}

// Convert HSV back to channel bytes, carrying a supplied alpha byte through
// unchanged. Inputs are clamped to their valid ranges before conversion.
export function hsvToRgb(hsv: HsvColor, alphaByte: number): RgbaBytes {
    const hue: number = clamp(hsv.h, 0, 360);
    const saturation: number = clamp(hsv.s, 0, 100) / 100;
    const valueLevel: number = clamp(hsv.v, 0, 100) / 100;

    const chroma: number = valueLevel * saturation;
    const huePrime: number = hue / 60;
    const secondary: number = chroma * (1 - Math.abs((huePrime % 2) - 1));
    const match: number = valueLevel - chroma;

    let red: number = 0;
    let green: number = 0;
    let blue: number = 0;
    if (huePrime < 1) {
        red = chroma;
        green = secondary;
    } else if (huePrime < 2) {
        red = secondary;
        green = chroma;
    } else if (huePrime < 3) {
        green = chroma;
        blue = secondary;
    } else if (huePrime < 4) {
        green = secondary;
        blue = chroma;
    } else if (huePrime < 5) {
        red = secondary;
        blue = chroma;
    } else {
        red = chroma;
        blue = secondary;
    }

    return {
        r: clampByte((red + match) * OPAQUE_BYTE),
        g: clampByte((green + match) * OPAQUE_BYTE),
        b: clampByte((blue + match) * OPAQUE_BYTE),
        a: clampByte(alphaByte),
    };
}
