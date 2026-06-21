// Factory for a small input producer.
//
// No React imports. The producer builds InputSignal values from a fixed
// descriptor and forwards them to an emit callback. It never reads the clock:
// the caller supplies timeStampMs explicitly or wires a timeProvider so the
// time source stays injectable and testable.

import type {
    Axis2D,
    EInputInteraction,
    InputDescriptor,
    InputSignal,
    InputValue,
} from './InputContract';
import { EInputValueType } from './InputContract';
import type { TimeProvider } from './TimeProvider';

// Sink for produced signals.
export type EmitInputSignal = (signal: InputSignal) => void;

// Producer returned by the factory. Each method builds a typed InputValue and
// emits a complete InputSignal. timeStampMs may be passed per call; when omitted
// the configured timeProvider is consulted, and when no provider exists the
// timestamp defaults to 0 so the path stays deterministic and explicit.
export type InputSource = Readonly<{
    descriptor: InputDescriptor;
    emitAxis2D: (
        axis: Axis2D,
        interaction: EInputInteraction,
        timeStampMs?: number,
    ) => void;
    emitDigital: (
        pressed: boolean,
        interaction: EInputInteraction,
        timeStampMs?: number,
    ) => void;
    emitScalar: (
        scalar: number,
        interaction: EInputInteraction,
        timeStampMs?: number,
    ) => void;
}>;

export type CreateInputSourceOptions = Readonly<{
    descriptor: InputDescriptor;
    emit: EmitInputSignal;
    timeProvider?: TimeProvider;
}>;

export function createInputSource(options: CreateInputSourceOptions): InputSource {
    const { descriptor, emit, timeProvider }: CreateInputSourceOptions = options;

    function resolveTimeStamp(timeStampMs: number | undefined): number {
        if (timeStampMs !== undefined) {
            return timeStampMs;
        }
        if (timeProvider !== undefined) {
            return timeProvider();
        }
        return 0;
    }

    function dispatch(
        value: InputValue,
        interaction: EInputInteraction,
        timeStampMs: number | undefined,
    ): void {
        const signal: InputSignal = {
            descriptor,
            value,
            interaction,
            timeStampMs: resolveTimeStamp(timeStampMs),
        };
        emit(signal);
    }

    return {
        descriptor,
        emitAxis2D(
            axis: Axis2D,
            interaction: EInputInteraction,
            timeStampMs?: number,
        ): void {
            dispatch(
                { valueType: EInputValueType.Axis2D, axis },
                interaction,
                timeStampMs,
            );
        },
        emitDigital(
            pressed: boolean,
            interaction: EInputInteraction,
            timeStampMs?: number,
        ): void {
            dispatch(
                { valueType: EInputValueType.Digital, pressed },
                interaction,
                timeStampMs,
            );
        },
        emitScalar(
            scalar: number,
            interaction: EInputInteraction,
            timeStampMs?: number,
        ): void {
            dispatch(
                { valueType: EInputValueType.Scalar, scalar },
                interaction,
                timeStampMs,
            );
        },
    };
}
