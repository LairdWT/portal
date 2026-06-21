// Wire-narrowing codec for the Unity boundary.
//
// No React imports. No DOM globals. A control surface emits a full InputSignal
// (it carries the whole descriptor so controller-side consumers can inspect it).
// Before the signal crosses a transport to the Unity client it is narrowed to
// FInputWirePayload: the descriptor collapses to its id, and the injected
// timestamp rides along so the client can order events and measure latency. The
// descriptor's interaction allow-list stays controller-side.

import type {
    EInputInteraction,
    EInputValueType,
    InputSignal,
    InputValue,
} from './InputContract';

// The minimal shape that crosses the wire to the Unity client. The Unity C#
// side mirrors this struct field-for-field.
export type FInputWirePayload = Readonly<{
    inputId: string;
    interaction: EInputInteraction;
    value: InputValue;
    timeStampMs: number;
}>;

// True when a value matches the type a descriptor declares. A control must not
// emit an Axis2D value for a Digital input; this predicate makes that invariant
// checkable at the wire boundary.
export function isValueForType(kind: EInputValueType, value: InputValue): boolean {
    return value.valueType === kind;
}

// Narrow a signal to its wire payload. Negative-first guard: a value that does
// not match the descriptor's declared kind is a programming error at the emit
// site, surfaced here rather than shipped to Unity as a malformed payload.
export function toWireInput(signal: InputSignal): FInputWirePayload {
    if (!isValueForType(signal.descriptor.kind, signal.value)) {
        throw new Error(
            `Input "${signal.descriptor.id}" expects ${signal.descriptor.kind} but received ${signal.value.valueType}.`,
        );
    }

    return {
        inputId: signal.descriptor.id,
        interaction: signal.interaction,
        value: signal.value,
        timeStampMs: signal.timeStampMs,
    };
}
