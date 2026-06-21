// End-to-end demonstration of the Unity-binding model: a control emits a typed
// signal, an injected TimeProvider stamps it, the wire codec narrows it to the
// payload Unity receives, and a data-driven registry resolves the input id to an
// action. Nothing here names a real game action; the binding profile is data the
// consumer supplies.

import {
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';

import { BevelButton } from '../components/BevelButton/BevelButton';
import {
    type BindingResolution,
    createRegistry,
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

const layoutStyle: { display: 'grid'; gap: string; maxInlineSize: string } = {
    display: 'grid',
    gap: '0.75rem',
    maxInlineSize: '32rem',
};

export function UnityBindingExample(): ReactElement {
    // The binding profile: pure data mapping an opaque input id to an action id.
    // A consumer would load this per player or per context and could rebind it
    // at runtime through the registry's immutable mutators.
    const registry: IInputBindingRegistry = useMemo<IInputBindingRegistry>(
        (): IInputBindingRegistry =>
            createRegistry([{ inputId: 'fire', actionId: 'weapon.primary' }]),
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

    const [lastPayload, setLastPayload]: [
        FInputWirePayload | null,
        Dispatch<SetStateAction<FInputWirePayload | null>>,
    ] = useState<FInputWirePayload | null>(null);

    const resolution: BindingResolution = useInputBinding(registry, 'fire');

    const handleSignal: (signal: InputSignal) => void = useCallback(
        (signal: InputSignal): void => {
            setLastPayload(toWireInput(signal));
        },
        [],
    );

    return (
        <div style={layoutStyle}>
            <p>
                Input <code>fire</code> resolves to action{' '}
                <code>{resolution.actionId ?? '(unbound)'}</code>.
            </p>
            <TimeProviderContext.Provider value={timeProvider}>
                <BevelButton descriptor={fireDescriptor} onSignal={handleSignal}>
                    Fire
                </BevelButton>
            </TimeProviderContext.Provider>
            <pre>
                {lastPayload === null
                    ? 'Press the control to emit a wire payload.'
                    : JSON.stringify(lastPayload, null, 2)}
            </pre>
        </div>
    );
}
