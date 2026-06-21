// Transport-agnostic delivery boundary for input signals.
//
// No React imports. The interface hides the carrier (in-memory, WebSocket,
// message channel, ...) behind send and subscribe. Only the in-memory
// implementation ships here; a network transport can be added later against the
// same contract.

import type { InputSignal } from '../InputContract';

export type InputSignalListener = (signal: InputSignal) => void;

// Unsubscribe handle returned by subscribe.
export type Unsubscribe = () => void;

export type InputTransport = {
    send(signal: InputSignal): void;
    subscribe(listener: InputSignalListener): Unsubscribe;
};

// In-memory transport. Fans each sent signal out to every current listener
// synchronously. Listeners are held in a Set so repeated subscriptions of the
// same function deduplicate and unsubscribe is exact.
export class LocalInputTransport implements InputTransport {
    private readonly listeners: Set<InputSignalListener> =
        new Set<InputSignalListener>();

    public send(signal: InputSignal): void {
        // Snapshot so a listener that subscribes or unsubscribes during dispatch
        // does not mutate the set mid-iteration.
        const snapshot: readonly InputSignalListener[] = [...this.listeners];
        for (const listener of snapshot) {
            listener(signal);
        }
    }

    public subscribe(listener: InputSignalListener): Unsubscribe {
        this.listeners.add(listener);
        return (): void => {
            this.listeners.delete(listener);
        };
    }

    public clear(): void {
        this.listeners.clear();
    }
}
