import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';

// Color editor display mode. Mirrors Helicon ColorEditMode (Rgb/Hsv/Hex). The
// lowercase values are exposed as the root data-mode attribute (a styling and
// test hook). Mode is presentation state only; it never changes the controlled
// color value.
export const EColorMode: {
    readonly Rgb: 'rgb';
    readonly Hsv: 'hsv';
    readonly Hex: 'hex';
} = {
    Rgb: 'rgb',
    Hsv: 'hsv',
    Hex: 'hex',
};
export type EColorMode = (typeof EColorMode)[keyof typeof EColorMode];

// Props for the ColorPicker: a controlled, domain-agnostic color editor.
//
// `value` is the controlled color as a hex string - `#RRGGBB` when `alpha` is
// false (default) and `#RRGGBBAA` when `alpha` is true. The component parses the
// value defensively (an unparseable value renders opaque black) and re-serializes
// the normalized uppercase hex on every edit through `onValueChange`. `alpha`
// enables
// the alpha channel, the 8-digit hex, and the swatch transparency checker.
// `defaultMode` is the initial editor mode (default Rgb); mode is local
// presentation state and never alters the value. `label` is the group's
// accessible name and renders as a bold HUD title. `id` falls back to a generated
// useId for the label association. `enabled` is an enum resolved through
// useResolvedEnabled and forwarded to every child control. `tone` flows through
// the shared tone scope (focus ring / accent), never a solid fill.
export type ColorPickerProps = Readonly<
    {
        label: string;
        value: string;
        onValueChange?: (value: string) => void;
        alpha?: boolean;
        defaultMode?: EColorMode;
        id?: string;
        enabled?: EEnabledState;
    } & Toned
>;
