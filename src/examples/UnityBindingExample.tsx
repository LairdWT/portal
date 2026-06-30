// End-to-end demonstration of the Unity-binding model: a control emits a typed
// signal, an injected TimeProvider stamps it, the wire codec narrows it to the
// payload Unity receives, and a data-driven registry resolves the input id to an
// action. Nothing here names a real game action; the binding profile is data the
// consumer supplies. A BevelButton and an A/B/X/Y ActionButton grid all route
// through the same signal sink, so any press updates the wire-payload readout.

import {
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { ActionButton } from '../components/ActionButton/ActionButton';
import { EBevelCorners } from '../components/ActionButton/ActionButton.types';
import { BevelButton } from '../components/BevelButton/BevelButton';
import {
    type BindingResolution,
    createRegistry,
    EInputInteraction,
    EInputValueType,
    type FInputWirePayload,
    type IInputBindingRegistry,
    type InputDescriptor,
    type InputSignal,
    type TimeProvider,
    toWireInput,
} from '../input';
import { useInputBinding } from '../react/hooks/useInputBinding';
import { TimeProviderContext } from '../react/TimeProviderContext';

const fireDescriptor: InputDescriptor = {
    id: 'fire',
    kind: EInputValueType.Digital,
    label: 'Fire',
};

// One face button: its visible label, the descriptor it emits, and the bevel
// diagonal so the four buttons interlock in the grid.
type FaceButton = Readonly<{
    label: string;
    descriptor: InputDescriptor;
    bevelCorners: EBevelCorners;
}>;

const FACE_BUTTONS: readonly FaceButton[] = [
    {
        label: 'A',
        descriptor: { id: 'face.a', kind: EInputValueType.Digital, label: 'A' },
        bevelCorners: EBevelCorners.TopLeftBottomRight,
    },
    {
        label: 'B',
        descriptor: { id: 'face.b', kind: EInputValueType.Digital, label: 'B' },
        bevelCorners: EBevelCorners.TopRightBottomLeft,
    },
    {
        label: 'X',
        descriptor: { id: 'face.x', kind: EInputValueType.Digital, label: 'X' },
        bevelCorners: EBevelCorners.TopRightBottomLeft,
    },
    {
        label: 'Y',
        descriptor: { id: 'face.y', kind: EInputValueType.Digital, label: 'Y' },
        bevelCorners: EBevelCorners.TopLeftBottomRight,
    },
];

const layoutStyle: { display: 'grid'; gap: string; maxInlineSize: string } = {
    display: 'grid',
    gap: '0.75rem',
    maxInlineSize: '32rem',
};

const buttonGridStyle: {
    display: 'grid';
    gridTemplateColumns: string;
    gap: string;
    maxInlineSize: string;
} = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(3rem, 1fr))',
    gap: '0.5rem',
    maxInlineSize: '16rem',
};

export function UnityBindingExample(): ReactElement {
    // The binding profile: pure data mapping opaque input ids to action ids. A
    // consumer would load this per player or per context and could rebind it at
    // runtime through the registry's immutable mutators.
    const registry: IInputBindingRegistry = useMemo<IInputBindingRegistry>(
        (): IInputBindingRegistry =>
            createRegistry([
                { inputId: 'fire', actionId: 'weapon.primary' },
                { inputId: 'face.a', actionId: 'ui.confirm' },
                { inputId: 'face.b', actionId: 'ui.cancel' },
                { inputId: 'face.x', actionId: 'ui.menu' },
                { inputId: 'face.y', actionId: 'ui.special' },
            ]),
        [],
    );

    // A deterministic clock injected in place of performance.now. Each emit
    // advances it by a fixed step, so the timestamp on the wire payload is
    // visibly the injected value rather than wall-clock time.
    const tickRef: RefObject<number> = useRef<number>(0);
    const timeProvider: TimeProvider = useCallback((): number => {
        tickRef.current += 1000;
        return tickRef.current;
    }, []);

    const [history, setHistory]: [
        readonly FInputWirePayload[],
        Dispatch<SetStateAction<readonly FInputWirePayload[]>>,
    ] = useState<readonly FInputWirePayload[]>([]);

    const resolution: BindingResolution = useInputBinding(registry, 'fire');

    const handleSignal: (signal: InputSignal) => void = useCallback(
        (signal: InputSignal): void => {
            setHistory((prev: readonly FInputWirePayload[]) =>
                [toWireInput(signal), ...prev].slice(0, 8),
            );
        },
        [],
    );

    // Held is demonstrated example-locally: nothing emits Held on the wire today,
    // so a press that outlives the threshold synthesizes a Held payload through
    // the same signal sink. No wire semantics change.
    const HOLD_THRESHOLD_MS: number = 500;
    const holdTimerRef: RefObject<number | null> = useRef<number | null>(null);

    const emitHeld: (descriptor: InputDescriptor) => void = useCallback(
        (descriptor: InputDescriptor): void => {
            handleSignal({
                descriptor,
                value: { valueType: EInputValueType.Digital, pressed: true },
                interaction: EInputInteraction.Held,
                timeStampMs: timeProvider(),
            });
        },
        [handleSignal, timeProvider],
    );

    const startHold: (descriptor: InputDescriptor) => void = useCallback(
        (descriptor: InputDescriptor): void => {
            if (holdTimerRef.current !== null) {
                window.clearTimeout(holdTimerRef.current);
                holdTimerRef.current = null;
            }
            holdTimerRef.current = window.setTimeout((): void => {
                holdTimerRef.current = null;
                emitHeld(descriptor);
            }, HOLD_THRESHOLD_MS);
        },
        [emitHeld],
    );

    const clearHold: () => void = useCallback((): void => {
        if (holdTimerRef.current === null) {
            return;
        }
        window.clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
    }, []);

    useEffect((): (() => void) => {
        return (): void => {
            if (holdTimerRef.current === null) {
                return;
            }
            window.clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        };
    }, []);

    return (
        <div style={layoutStyle}>
            <p>
                Input <code>fire</code> resolves to action{' '}
                <code>{resolution.actionId ?? '(unbound)'}</code>.
            </p>
            <TimeProviderContext.Provider value={timeProvider}>
                <BevelButton
                    descriptor={fireDescriptor}
                    onSignal={handleSignal}
                    onPress={(): void => {
                        startHold(fireDescriptor);
                    }}
                    onRelease={clearHold}
                >
                    Fire
                </BevelButton>
                <div style={buttonGridStyle}>
                    {FACE_BUTTONS.map(
                        (face: FaceButton): ReactElement => (
                            <ActionButton
                                key={face.descriptor.id}
                                label={face.label}
                                bevelCorners={face.bevelCorners}
                                descriptor={face.descriptor}
                                onSignal={handleSignal}
                                onPress={(): void => {
                                    startHold(face.descriptor);
                                }}
                                onRelease={clearHold}
                            />
                        ),
                    )}
                </div>
            </TimeProviderContext.Provider>
            <pre>
                {history.length === 0
                    ? 'Press a control to emit a wire payload.'
                    : history
                          .map(
                              (payload: FInputWirePayload): string =>
                                  `${payload.interaction} @ ${String(payload.timeStampMs)}`,
                          )
                          .join('\n')}
            </pre>
        </div>
    );
}
