import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useId,
    useState,
} from 'react';

import { Slider } from '../../components/Slider/Slider';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { type EEnabledState } from '../../state/state';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { type UiSegmentItem } from '../SegmentedControl/SegmentedControl.types';
import { TextField } from '../TextField/TextField';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import {
    type ColorParseResult,
    EColorParseError,
    formatHexColor,
    type HsvColor,
    hsvToRgb,
    parseHexColor,
    type RgbaBytes,
    rgbToHsv,
} from './colorMath';
import styles from './ColorPicker.module.css';
import { type ColorPickerProps, EColorMode } from './ColorPicker.types';

// The neutral fallback rendered when an incoming `value` cannot be parsed. The
// parent owns prop correctness; the first valid edit emits a normalized hex.
const FALLBACK_RGBA: RgbaBytes = { r: 0, g: 0, b: 0, a: 255 };
const OPAQUE_BYTE: number = 255;
const PERCENT_MAX: number = 100;
const HUE_MAX: number = 360;

// The only custom property that carries the current color into CSS (the swatch
// fill). It is the live color, not a secret.
const SWATCH_PROPERTY: string = '--portal-color-picker-swatch';

// The fixed RGB/HSV/Hex mode set for the radiogroup. The ids are the EColorMode
// values, so the reported id maps straight back through resolveMode.
const MODE_ITEMS: readonly UiSegmentItem[] = [
    { id: EColorMode.Rgb, label: 'RGB' },
    { id: EColorMode.Hsv, label: 'HSV' },
    { id: EColorMode.Hex, label: 'Hex' },
];

function formatByte(value: number): string {
    return String(value);
}

function formatPercent(value: number): string {
    return `${String(value)}%`;
}

function formatDegrees(value: number): string {
    return `${String(value)} deg`;
}

// Narrow an opaque segment id back to a known mode without an `as` cast: an
// unknown id resolves to undefined and is ignored by the caller.
function resolveMode(id: string): EColorMode | undefined {
    switch (id) {
        case EColorMode.Rgb:
            return EColorMode.Rgb;
        case EColorMode.Hsv:
            return EColorMode.Hsv;
        case EColorMode.Hex:
            return EColorMode.Hex;
        default:
            return undefined;
    }
}

function describeHexError(error: EColorParseError): string {
    switch (error) {
        case EColorParseError.InvalidLength:
            return 'Enter 6 or 8 hex digits.';
        case EColorParseError.InvalidDigits:
            return 'Use only the digits 0-9 and A-F.';
    }
}

export function ColorPicker({
    label,
    value,
    onChange,
    alpha,
    defaultMode,
    id,
    enabled,
    tone,
}: ColorPickerProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const useAlpha: boolean = alpha === true;

    // A generated id backs the label association when the caller omits one, so the
    // group is always programmatically named by its rendered title.
    const fallbackId: string = useId();
    const rootId: string = id ?? fallbackId;
    const titleId: string = `${rootId}-title`;

    // Local presentation state only - never the color value, which is parent
    // owned. `hexDraft` is the hex field's free-typing buffer: null shows the
    // canonical hex of `value`; non-null means the user is editing (possibly
    // transiently invalid).
    const [mode, setMode]: [EColorMode, Dispatch<SetStateAction<EColorMode>>] =
        useState<EColorMode>(defaultMode ?? EColorMode.Rgb);
    const [hexDraft, setHexDraft]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(null);

    // Derived once per render (pure): channel bytes, the HSV view, and the
    // canonical serialization. An unparseable value renders the neutral fallback.
    const parsed: ColorParseResult = parseHexColor(value);
    const rgba: RgbaBytes = parsed.ok ? parsed.value : FALLBACK_RGBA;
    const hsv: HsvColor = rgbToHsv(rgba);
    const canonicalHex: string = formatHexColor(rgba, useAlpha);
    const alphaPercent: number = Math.round((rgba.a / OPAQUE_BYTE) * PERCENT_MAX);

    // The hex error is derived from the current draft, never stored, so it clears
    // automatically when the draft becomes valid or is reset on blur.
    const hexParse: ColorParseResult | null =
        hexDraft === null ? null : parseHexColor(hexDraft);
    const hexError: string | undefined =
        hexParse !== null && !hexParse.ok
            ? describeHexError(hexParse.error)
            : undefined;

    const swatchLabel: string = useAlpha
        ? `Selected color, hex ${canonicalHex}, alpha ${String(alphaPercent)} percent`
        : `Selected color, hex ${canonicalHex}`;

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    const swatchStyle: CSSProperties = { [SWATCH_PROPERTY]: canonicalHex };

    function emit(next: RgbaBytes): void {
        onChange?.(formatHexColor(next, useAlpha));
    }

    function emitHsv(next: HsvColor): void {
        emit(hsvToRgb(next, rgba.a));
    }

    function handleRed(next: number): void {
        emit({ ...rgba, r: next });
    }

    function handleGreen(next: number): void {
        emit({ ...rgba, g: next });
    }

    function handleBlue(next: number): void {
        emit({ ...rgba, b: next });
    }

    function handleAlpha(nextPercent: number): void {
        const nextAlpha: number = Math.round(
            (nextPercent / PERCENT_MAX) * OPAQUE_BYTE,
        );
        emit({ ...rgba, a: nextAlpha });
    }

    function handleHue(next: number): void {
        emitHsv({ ...hsv, h: next });
    }

    function handleSaturation(next: number): void {
        emitHsv({ ...hsv, s: next });
    }

    function handleValue(next: number): void {
        emitHsv({ ...hsv, v: next });
    }

    function handleModeChange(nextId: string): void {
        const nextMode: EColorMode | undefined = resolveMode(nextId);
        if (nextMode === undefined) {
            return;
        }
        setMode(nextMode);
    }

    // Reject bad input safely: always update the draft, but only emit a normalized
    // value when the draft parses. An invalid draft leaves the controlled value
    // untouched and surfaces the derived error.
    function handleHexInput(next: string): void {
        setHexDraft(next);
        const result: ColorParseResult = parseHexColor(next);
        if (!result.ok) {
            return;
        }
        onChange?.(formatHexColor(result.value, useAlpha));
    }

    // Blur bubbles from the field to the wrapper; resetting the draft re-syncs the
    // input to the canonical hex of `value`, discarding an unparseable draft.
    function handleHexBlur(): void {
        setHexDraft(null);
    }

    function renderChannels(): ReactElement {
        switch (mode) {
            case EColorMode.Rgb:
                return (
                    <>
                        <Slider
                            label="Red"
                            value={rgba.r}
                            min={0}
                            max={OPAQUE_BYTE}
                            step={1}
                            enabled={resolvedEnabled}
                            onChange={handleRed}
                            formatValueText={formatByte}
                        />
                        <Slider
                            label="Green"
                            value={rgba.g}
                            min={0}
                            max={OPAQUE_BYTE}
                            step={1}
                            enabled={resolvedEnabled}
                            onChange={handleGreen}
                            formatValueText={formatByte}
                        />
                        <Slider
                            label="Blue"
                            value={rgba.b}
                            min={0}
                            max={OPAQUE_BYTE}
                            step={1}
                            enabled={resolvedEnabled}
                            onChange={handleBlue}
                            formatValueText={formatByte}
                        />
                        {useAlpha ? (
                            <Slider
                                label="Alpha"
                                value={alphaPercent}
                                min={0}
                                max={PERCENT_MAX}
                                step={1}
                                enabled={resolvedEnabled}
                                onChange={handleAlpha}
                                formatValueText={formatPercent}
                            />
                        ) : null}
                    </>
                );
            case EColorMode.Hsv:
                return (
                    <>
                        <Slider
                            label="Hue"
                            value={hsv.h}
                            min={0}
                            max={HUE_MAX}
                            step={1}
                            enabled={resolvedEnabled}
                            onChange={handleHue}
                            formatValueText={formatDegrees}
                        />
                        <Slider
                            label="Saturation"
                            value={hsv.s}
                            min={0}
                            max={PERCENT_MAX}
                            step={1}
                            enabled={resolvedEnabled}
                            onChange={handleSaturation}
                            formatValueText={formatPercent}
                        />
                        <Slider
                            label="Value"
                            value={hsv.v}
                            min={0}
                            max={PERCENT_MAX}
                            step={1}
                            enabled={resolvedEnabled}
                            onChange={handleValue}
                            formatValueText={formatPercent}
                        />
                        {useAlpha ? (
                            <Slider
                                label="Alpha"
                                value={alphaPercent}
                                min={0}
                                max={PERCENT_MAX}
                                step={1}
                                enabled={resolvedEnabled}
                                onChange={handleAlpha}
                                formatValueText={formatPercent}
                            />
                        ) : null}
                    </>
                );
            case EColorMode.Hex:
                return (
                    <div className={styles.hexField} onBlur={handleHexBlur}>
                        <TextField
                            label="Hex"
                            value={hexDraft ?? canonicalHex}
                            onValueChange={handleHexInput}
                            enabled={resolvedEnabled}
                            tone={tone}
                            {...(hexError !== undefined ? { error: hexError } : {})}
                        />
                    </div>
                );
        }
    }

    return (
        <div
            role="group"
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
            data-mode={mode}
            aria-labelledby={titleId}
        >
            <div className={styles.header}>
                <span id={titleId} className={styles.title}>
                    {label}
                </span>
                <div className={styles.swatchFrame}>
                    <div
                        role="img"
                        aria-label={swatchLabel}
                        className={styles.swatch}
                        style={swatchStyle}
                    />
                </div>
            </div>
            <SegmentedControl
                items={MODE_ITEMS}
                value={mode}
                onChange={handleModeChange}
                label="Color mode"
                enabled={resolvedEnabled}
                tone={tone}
            />
            <div className={styles.channels}>{renderChannels()}</div>
        </div>
    );
}
