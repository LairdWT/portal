import type { InputDescriptor, InputSignal } from '../../input';
import type { EEnabledState } from '../../state/state';

// Which corners are beveled, the rest squircled. Maps onto the four-value CSS
// corner-shape order (top-left, top-right, bottom-right, bottom-left). The two
// diagonal options let adjacent buttons in a grid interlock; None squircles all
// four corners.
export const EBevelCorners: {
    readonly TopLeftBottomRight: 'top-left-bottom-right';
    readonly None: 'none';
    readonly TopRightBottomLeft: 'top-right-bottom-left';
} = {
    TopLeftBottomRight: 'top-left-bottom-right',
    None: 'none',
    TopRightBottomLeft: 'top-right-bottom-left',
};
export type EBevelCorners = (typeof EBevelCorners)[keyof typeof EBevelCorners];

// Props for the ActionButton control: a labelled digital action button skinned
// with corner-shape squircle/bevel corners over the shared useDigitalPress
// behavior. `bevelCorners` selects which diagonal is beveled so a grid of
// buttons interlocks. When both `onSignal` and `descriptor` are supplied a typed
// Digital InputSignal is emitted on press and release alongside the raw
// `onPress` and `onRelease` callbacks. `enabled` is an enum; the DOM disabled
// state is derived from it.
export type ActionButtonProps = Readonly<{
    label: string;
    bevelCorners?: EBevelCorners;
    enabled?: EEnabledState;
    onPress?: () => void;
    onRelease?: () => void;
    onSignal?: (signal: InputSignal) => void;
    descriptor?: InputDescriptor;
}>;
