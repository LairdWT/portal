import { describe, expect, it } from 'vitest';

import {
    EInputInteraction,
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from './InputContract';
import {
    type FInputWirePayload,
    isValueForType,
    toWireInput,
} from './InputWireCodec';

const digitalDescriptor: InputDescriptor = {
    id: 'fire',
    kind: EInputValueType.Digital,
    label: 'Fire',
};

describe('InputWireCodec', (): void => {
    it('narrows a signal to its wire payload and keeps the timestamp', (): void => {
        const signal: InputSignal = {
            descriptor: digitalDescriptor,
            value: { valueType: EInputValueType.Digital, pressed: true },
            interaction: EInputInteraction.Press,
            timeStampMs: 123,
        };

        const payload: FInputWirePayload = toWireInput(signal);

        expect(payload).toEqual({
            inputId: 'fire',
            interaction: EInputInteraction.Press,
            value: { valueType: EInputValueType.Digital, pressed: true },
            timeStampMs: 123,
        });
    });

    it('matches a value against the descriptor kind', (): void => {
        expect(
            isValueForType(EInputValueType.Digital, {
                valueType: EInputValueType.Digital,
                pressed: true,
            }),
        ).toBe(true);
        expect(
            isValueForType(EInputValueType.Digital, {
                valueType: EInputValueType.Axis2D,
                axis: { x: 0, y: 0 },
            }),
        ).toBe(false);
    });

    it('throws when the value does not match the descriptor kind', (): void => {
        const mismatched: InputSignal = {
            descriptor: digitalDescriptor,
            value: { valueType: EInputValueType.Axis2D, axis: { x: 0, y: 0 } },
            interaction: EInputInteraction.Move,
            timeStampMs: 0,
        };

        expect((): FInputWirePayload => toWireInput(mismatched)).toThrow();
    });
});
