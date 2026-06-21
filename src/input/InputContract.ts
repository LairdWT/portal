// Framework-agnostic input taxonomy for the Portal controller library.
//
// This module names no game actions. It describes inputs by the shape of their
// value, the interaction that produced them, and the value itself. Meaning
// (fire, jump, steer, ...) is bound by the consumer in game context.
//
// No React imports. No DOM globals. Pure data contracts.

// Value shape an input carries.
export const EInputValueType: {
    readonly Axis2D: 'axis2d';
    readonly Digital: 'digital';
    readonly Scalar: 'scalar';
} = {
    Axis2D: 'axis2d',
    Digital: 'digital',
    Scalar: 'scalar',
};
export type EInputValueType =
    (typeof EInputValueType)[keyof typeof EInputValueType];

// Interaction that produced a signal.
export const EInputInteraction: {
    readonly Press: 'press';
    readonly Release: 'release';
    readonly Move: 'move';
    readonly Cancel: 'cancel';
} = {
    Press: 'press',
    Release: 'release',
    Move: 'move',
    Cancel: 'cancel',
};
export type EInputInteraction =
    (typeof EInputInteraction)[keyof typeof EInputInteraction];

// Two-dimensional axis value with a center origin. Absolute surfaces (e.g. the
// Joystick) keep components within the unit circle once dead-zoned and clamped
// by the spine. Relative surfaces (e.g. the Thumbpad) reuse this shape to carry
// an incremental, unbounded delta between samples, so the unit-circle bound does
// not apply to those.
export type Axis2D = Readonly<{
    x: number;
    y: number;
}>;

// Discriminated union of input values keyed by valueType.
export type InputValue =
    | {
          readonly valueType: typeof EInputValueType.Axis2D;
          readonly axis: Axis2D;
      }
    | {
          readonly valueType: typeof EInputValueType.Digital;
          readonly pressed: boolean;
      }
    | {
          readonly valueType: typeof EInputValueType.Scalar;
          readonly scalar: number;
      };

// Static description of an input surface. `id` is an opaque identifier the
// consumer defines; the contract never enumerates concrete game actions.
export type InputDescriptor = Readonly<{
    id: string;
    kind: EInputValueType;
    label: string;
}>;

// Runtime event emitted when an input changes. Carries the descriptor, the
// current value, the interaction, and a caller-supplied timestamp in
// milliseconds. A transport serializes it for the wire boundary.
export type InputSignal = Readonly<{
    descriptor: InputDescriptor;
    value: InputValue;
    interaction: EInputInteraction;
    timeStampMs: number;
}>;
