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
// safe-area-aware, full-height controller layout. An optional full-bleed
// background sits behind the controls; a HudPanel band spans the top; an
// optional extras strip sits below it; the movement region anchors the
// bottom-inline-start corner; and a two-by-two ActionButton grid anchors the
// bottom-inline-end corner. Each region accepts an optional ReactNode slot.
//
// Composition model:
//   - Supply a slot (backgroundSlot / hudSlot / extrasSlot / movementSlot /
//     primarySlot / secondarySlot / tertiarySlot / quaternarySlot / startSlot /
//     selectSlot) to render
//     your own node in that region. A consumer-supplied control owns its own
//     InputDescriptor and onSignal wiring; ControlSurface renders it verbatim
//     and forwards nothing to it. Supply exactly one node per action slot: each
//     action slot occupies a single grid cell.
//   - Omit a slot to fall back to the zero-config default preset control for
//     that region (HudPanel / Joystick / four ActionButtons labelled A, B, X,
//     Y / start and select BevelButtons). The default controls receive the
//     shell-level `onSignal` sink and descriptors whose ids are namespaced by
//     `instanceId` so two un-configured ControlSurface instances never emit
//     colliding signal ids.
//   - `backgroundSlot` and `extrasSlot` have no default; omit them for the plain
//     solid surface and no extras strip. ControlSurface itself imports no 3D
//     stack, so a backdrop such as a ShaderSurface is supplied by the consumer.
//
// `instanceId` namespaces the default preset descriptor ids as
// `${instanceId}.move`, `.primary`, `.secondary`, `.tertiary`, `.quaternary`,
// `.start`, `.select`.
// When omitted it defaults to a stable React useId() value, so the default
// preset is collision-safe with no configuration. The `*Label`, `readouts`, and
// `onSignal` props apply only to the default preset controls and are ignored for
// any region whose slot is supplied.
export type ControlSurfaceProps = Readonly<{
    onSignal?: (signal: InputSignal) => void;
    instanceId?: string;
    leftLabel?: string;
    primaryLabel?: string;
    secondaryLabel?: string;
    tertiaryLabel?: string;
    quaternaryLabel?: string;
    startLabel?: string;
    selectLabel?: string;
    readouts?: readonly ControlSurfaceReadout[];
    backgroundSlot?: ReactNode;
    hudSlot?: ReactNode;
    extrasSlot?: ReactNode;
    movementSlot?: ReactNode;
    primarySlot?: ReactNode;
    secondarySlot?: ReactNode;
    tertiarySlot?: ReactNode;
    quaternarySlot?: ReactNode;
    startSlot?: ReactNode;
    selectSlot?: ReactNode;
}>;

// Spread fragment used to forward the optional signal sink to embedded controls.
// Kept empty when no sink is supplied so an explicit `undefined` is never passed
// to a control prop under exactOptionalPropertyTypes.
export type SignalForwardProps = Readonly<{
    onSignal?: (signal: InputSignal) => void;
}>;

// Per-instance descriptor set for the default preset, built from a resolved
// instance id so two un-configured ControlSurface instances emit distinct
// signal ids rather than colliding on a shared module constant.
export type DefaultPresetDescriptors = Readonly<{
    move: InputDescriptor;
    primary: InputDescriptor;
    secondary: InputDescriptor;
    tertiary: InputDescriptor;
    quaternary: InputDescriptor;
    start: InputDescriptor;
    select: InputDescriptor;
}>;
