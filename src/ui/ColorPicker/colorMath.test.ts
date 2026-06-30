import { describe, expect, it } from 'vitest';

import {
    type ChannelParseResult,
    type ColorParseResult,
    EColorParseError,
    formatHexColor,
    type HsvColor,
    hsvToRgb,
    parseChannelInput,
    parseHexColor,
    type RgbaBytes,
    rgbToHsv,
} from './colorMath';

describe('parseHexColor', (): void => {
    it('parses a 6-digit hex without a prefix, defaulting alpha to opaque', (): void => {
        const result: ColorParseResult = parseHexColor('102030');
        expect(result).toEqual({
            ok: true,
            value: { r: 16, g: 32, b: 48, a: 255 },
        });
    });

    it('parses a 6-digit hex with a leading hash', (): void => {
        const result: ColorParseResult = parseHexColor('#FF8800');
        expect(result).toEqual({
            ok: true,
            value: { r: 255, g: 136, b: 0, a: 255 },
        });
    });

    it('parses an 8-digit hex with an explicit alpha byte', (): void => {
        const result: ColorParseResult = parseHexColor('#FF000080');
        expect(result).toEqual({
            ok: true,
            value: { r: 255, g: 0, b: 0, a: 128 },
        });
    });

    it('accepts mixed-case hex digits', (): void => {
        const result: ColorParseResult = parseHexColor('#aAbBcC');
        expect(result).toEqual({
            ok: true,
            value: { r: 170, g: 187, b: 204, a: 255 },
        });
    });

    it('expands 3-digit shorthand by doubling each nibble', (): void => {
        const result: ColorParseResult = parseHexColor('#FFF');
        expect(result).toEqual({
            ok: true,
            value: { r: 255, g: 255, b: 255, a: 255 },
        });
    });

    it('expands 4-digit shorthand including the alpha nibble', (): void => {
        const result: ColorParseResult = parseHexColor('#abcd');
        expect(result).toEqual({
            ok: true,
            value: { r: 170, g: 187, b: 204, a: 221 },
        });
    });

    it('rejects genuinely invalid lengths (5/7/9) with InvalidLength', (): void => {
        for (const text of ['ABCDE', '#ABCDEFA', '#ABCDEFABC']) {
            const result: ColorParseResult = parseHexColor(text);
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error).toBe(EColorParseError.InvalidLength);
            }
        }
    });

    it('rejects a non-hex digit with InvalidDigits', (): void => {
        const result: ColorParseResult = parseHexColor('#GG0011');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBe(EColorParseError.InvalidDigits);
        }
    });
});

describe('parseChannelInput', (): void => {
    it('accepts an in-range integer', (): void => {
        const result: ChannelParseResult = parseChannelInput('128', 0, 255);
        expect(result).toEqual({ ok: true, value: 128 });
    });

    it('trims surrounding whitespace before parsing', (): void => {
        const result: ChannelParseResult = parseChannelInput('  42 ', 0, 255);
        expect(result).toEqual({ ok: true, value: 42 });
    });

    it('clamps a value above the maximum to the maximum', (): void => {
        const result: ChannelParseResult = parseChannelInput('999', 0, 255);
        expect(result).toEqual({ ok: true, value: 255 });
    });

    it('clamps using the supplied channel bound', (): void => {
        const result: ChannelParseResult = parseChannelInput('500', 0, 360);
        expect(result).toEqual({ ok: true, value: 360 });
    });

    it('rejects a non-numeric string', (): void => {
        const result: ChannelParseResult = parseChannelInput('abc', 0, 255);
        expect(result).toEqual({ ok: false });
    });

    it('rejects an empty string', (): void => {
        const result: ChannelParseResult = parseChannelInput('', 0, 255);
        expect(result).toEqual({ ok: false });
    });

    it('rejects a non-integer numeric string', (): void => {
        const result: ChannelParseResult = parseChannelInput('1.5', 0, 255);
        expect(result).toEqual({ ok: false });
    });
});

describe('formatHexColor', (): void => {
    it('uppercases and zero-pads, omitting alpha when the flag is false', (): void => {
        const rgba: RgbaBytes = { r: 0, g: 16, b: 255, a: 128 };
        expect(formatHexColor(rgba, false)).toBe('#0010FF');
    });

    it('appends the alpha byte when the flag is true', (): void => {
        const rgba: RgbaBytes = { r: 255, g: 0, b: 0, a: 128 };
        expect(formatHexColor(rgba, true)).toBe('#FF000080');
    });

    it('clamps out-of-range channel bytes before formatting', (): void => {
        const rgba: RgbaBytes = { r: 300, g: -20, b: 255, a: 255 };
        expect(formatHexColor(rgba, false)).toBe('#FF00FF');
    });
});

describe('rgbToHsv / hsvToRgb', (): void => {
    it('round-trips representative colors within tolerance', (): void => {
        const samples: readonly RgbaBytes[] = [
            { r: 255, g: 0, b: 0, a: 255 },
            { r: 0, g: 255, b: 0, a: 255 },
            { r: 0, g: 0, b: 255, a: 255 },
            { r: 95, g: 109, b: 172, a: 255 },
            { r: 216, g: 162, b: 74, a: 255 },
            { r: 18, g: 21, b: 35, a: 255 },
        ];
        for (const sample of samples) {
            const back: RgbaBytes = hsvToRgb(rgbToHsv(sample), sample.a);
            expect(Math.abs(back.r - sample.r)).toBeLessThanOrEqual(3);
            expect(Math.abs(back.g - sample.g)).toBeLessThanOrEqual(3);
            expect(Math.abs(back.b - sample.b)).toBeLessThanOrEqual(3);
            expect(back.a).toBe(sample.a);
        }
    });

    it('maps pure red to hue 0, full saturation and value', (): void => {
        const hsv: HsvColor = rgbToHsv({ r: 255, g: 0, b: 0, a: 255 });
        expect(hsv).toEqual({ h: 0, s: 100, v: 100 });
    });

    it('resets hue to 0 for a grey color (documented parity caveat)', (): void => {
        const hsv: HsvColor = rgbToHsv({ r: 128, g: 128, b: 128, a: 255 });
        expect(hsv.h).toBe(0);
        expect(hsv.s).toBe(0);
    });

    it('rotates hue 120 degrees from red to green', (): void => {
        const green: RgbaBytes = hsvToRgb({ h: 120, s: 100, v: 100 }, 255);
        expect(green).toEqual({ r: 0, g: 255, b: 0, a: 255 });
    });

    it('clamps an out-of-range hue and percent inputs', (): void => {
        const clamped: RgbaBytes = hsvToRgb({ h: 720, s: 250, v: -10 }, 400);
        expect(clamped).toEqual({ r: 0, g: 0, b: 0, a: 255 });
    });
});
