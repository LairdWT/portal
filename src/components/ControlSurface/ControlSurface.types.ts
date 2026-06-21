import type { ReactNode } from 'react';

import type { InputDescriptor, InputSignal } from '../../input';

// A single read-only readout forwarded to the embedded HudPanel. `value01` is a
// normalized magnitude the panel clamps to the 0..1 range before display.
export type ControlSurfaceReadout = Readonly<{
    id: string;
    label: string;
    value01: number;
}>;

// Props for the ControlSurface composite shell. ControlSurface is a
// safe-area-aware, full-height controller layout with four named regions: a
// HudPanel band across the top, a movement region (inline-start), and a primary
// and secondary action region (inline-end). Each region accepts an optional
// ReactNode slot.
//
// Composition model:
//   - Supply a slot (hudSlot / movementSlot / primarySlot / secondarySlot) to
//     render your own control in that region. A consumer-supplied control owns
//     its own InputDescriptor and onSignal wiring; ControlSurface renders it
//     verbatim and forwards nothing to it. Supply exactly one node per slot:
//     each action slot occupies a single grid cell, so a multi-child fragment
//     would distort the two-column actions layout.
//   - Omit a slot to fall back to the zero-config default preset control for
//     that region (HudPanel / Joystick / two ActionButtons). The default
//     controls receive the shell-level `onSignal` sink and descriptors whose
//     ids are namespaced by `instanceId` so two un-configured ControlSurface
//     instances never emit colliding signal ids.
//
// `instanceId` namespaces the default preset descriptor ids as
// `${instanceId}.move`, `${instanceId}.primary`, `${instanceId}.secondary`.
// When omitted it defaults to a stable React useId() value, so the default
// preset is collision-safe with no configuration. `leftLabel`, `primaryLabel`,
// `secondaryLabel`, `readouts`, and `onSignal` apply only to the default
// preset controls and are ignored for any region whose slot is supplied.
export type ControlSurfaceProps = Readonly<{
    onSignal?: (signal: InputSignal) => void;
    instanceId?: string;
    leftLabel?: string;
    primaryLabel?: string;
    secondaryLabel?: string;
    readouts?: readonly ControlSurfaceReadout[];
    hudSlot?: ReactNode;
    movementSlot?: ReactNode;
    primarySlot?: ReactNode;
    secondarySlot?: ReactNode;
}>;

// Spread fragment used to forward the optional signal sink to embedded controls.
// Kept empty when no sink is supplied so an explicit `undefined` is never passed
// to a control prop under exactOptionalPropertyTypes.
export type SignalForwardProps = Readonly<{
    onSignal?: (signal: InputSignal) => void;
}>;

// Per-instance descriptor triple for the default preset, built from a resolved
// instance id so two un-configured ControlSurface instances emit distinct
// signal ids rather than colliding on a shared module constant.
export type DefaultPresetDescriptors = Readonly<{
    move: InputDescriptor;
    primary: InputDescriptor;
    secondary: InputDescriptor;
}>;
