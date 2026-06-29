import { type ReactElement, useCallback, useState } from 'react';

import {
    type ControlSurfaceReadout,
    ControlSurface,
    EInputValueType,
    type InputSignal,
} from '@laird-wt/portal';

import { FIXTURES } from './fixtures/registry';
import { SecretFieldDemo } from './SecretFieldDemo';

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

// The default application tree (ControlSurface + SecretFieldDemo) rendered when
// no `?fixture=` query selects a behavior fixture. Extracted from App so the
// signal-handling hooks always run unconditionally (rules-of-hooks) while App
// itself only branches on the query param.
function DefaultApp(): ReactElement {
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
        <>
            <ControlSurface
                onSignal={handleSignal}
                leftLabel="Movement"
                primaryLabel="A"
                secondaryLabel="B"
                readouts={readouts}
            />
            <section aria-label="Secret field demo">
                <SecretFieldDemo />
            </section>
        </>
    );
}

// Query-param fixture router (zero new dependency): App reads `?fixture=<key>` and
// renders the matching behavior fixture, falling through to the default app tree
// for an absent or unknown key so the two existing layout specs keep passing. The
// branch is hook-free (DefaultApp and each fixture own their own hooks), so the
// conditional return never trips rules-of-hooks.
export function App(): ReactElement {
    const fixtureKey: string | null = new URLSearchParams(
        window.location.search,
    ).get('fixture');
    const Fixture: (() => ReactElement) | undefined =
        fixtureKey !== null ? FIXTURES[fixtureKey] : undefined;
    if (Fixture !== undefined) {
        return <Fixture />;
    }
    return <DefaultApp />;
}
