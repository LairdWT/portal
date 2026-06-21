import { type ReactElement, useCallback, useState } from 'react';

import {
    type ControlSurfaceReadout,
    ControlSurface,
    EInputValueType,
    type InputSignal,
} from '@laird-wt/portal';

// Live readouts derived from the most recent signal of each value type. The
// example keeps a small immutable map keyed by descriptor id so the embedded
// HudPanel reflects real-time movement and action magnitudes.
type ReadoutMap = Readonly<Record<string, ControlSurfaceReadout>>;

function magnitudeForSignal(signal: InputSignal): number {
    const value: InputSignal['value'] = signal.value;

    switch (value.valueType) {
        case EInputValueType.Axis2D: {
            const distance: number = Math.hypot(value.axis.x, value.axis.y);
            return Math.min(distance, 1);
        }
        case EInputValueType.Digital: {
            return value.pressed ? 1 : 0;
        }
        case EInputValueType.Scalar: {
            return value.scalar;
        }
    }
}

export function App(): ReactElement {
    const [readoutMap, setReadoutMap]: [
        ReadoutMap,
        (next: (previous: ReadoutMap) => ReadoutMap) => void,
    ] = useState<ReadoutMap>({});

    const handleSignal: (signal: InputSignal) => void = useCallback(
        (signal: InputSignal): void => {
            // eslint-disable-next-line no-console
            console.log('portal signal', signal);

            const nextReadout: ControlSurfaceReadout = {
                id: signal.descriptor.id,
                label: signal.descriptor.label,
                value01: magnitudeForSignal(signal),
            };

            setReadoutMap((previous: ReadoutMap): ReadoutMap => ({
                ...previous,
                [nextReadout.id]: nextReadout,
            }));
        },
        [],
    );

    const readouts: readonly ControlSurfaceReadout[] =
        Object.values(readoutMap);

    return (
        <ControlSurface
            onSignal={handleSignal}
            leftLabel="Movement"
            primaryLabel="A"
            secondaryLabel="B"
            readouts={readouts}
        />
    );
}
