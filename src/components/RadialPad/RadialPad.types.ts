import type { InputDescriptor, InputSignal } from '../../input';
import type { EEnabledState } from '../../state/state';
import type {
    ERadialAction,
    RadialItem,
    RadialSides,
} from '../../ui/Radial/Radial.types';

// Props for the RadialPad controller - the Tier-1 (brushed-metal) game-input
// sibling of the generic RadialMenu. Same open/close radial geometry, but each
// section and center action is a momentary controller input: on activation it
// emits a Digital InputSignal pulse (Press then Release) when both `descriptor`
// and `onSignal` (or a ControllerProvider onSignal) are wired, with the target's
// key appended to the descriptor id (e.g. `${descriptor.id}.section-0`,
// `${descriptor.id}.confirm`), so a consumer reconstructs which target fired from
// the id alone - the same id-suffix convention DPad uses per direction. The raw
// onSelect / onCenterAction callbacks fire regardless of signal wiring. Cancel
// also closes. `sections` reuses the shared RadialItem shape (id + label + icon).
export type RadialPadProps = Readonly<{
    open: boolean;
    onClose: () => void;
    label: string;
    sections: readonly RadialItem[];
    sides?: RadialSides;
    centerActions?: readonly ERadialAction[];
    onSelect?: (id: string, index: number) => void;
    onCenterAction?: (action: ERadialAction) => void;
    onSignal?: (signal: InputSignal) => void;
    descriptor?: InputDescriptor;
    enabled?: EEnabledState;
    tone?: string | undefined;
}>;
