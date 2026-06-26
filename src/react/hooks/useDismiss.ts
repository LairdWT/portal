// Outside-click + Escape dismissal hook for overlay surfaces (Popover, Menu,
// Select, Tooltip, Dialog). While enabled, a pointerdown that lands outside every
// "inside" ref, or an Escape keypress, invokes onDismiss. The inside refs are the
// panel plus its trigger/anchor, so interacting with the trigger or the panel
// never self-dismisses. Both document listeners are removed on cleanup and the
// hook re-subscribes only when the enabled flag flips, reading the latest options
// through a ref so a changing callback or ref set never churns the subscription.

import { type RefObject, useEffect, useRef } from 'react';

export type UseDismissOptions = Readonly<{
    // Whether the listeners are active. Defaults to true; pass the overlay's open
    // state so a closed overlay attaches nothing.
    enabled?: boolean;
    // Called when an outside pointerdown or an Escape keypress requests dismissal.
    onDismiss: () => void;
    // Elements considered "inside". A pointerdown within any of them is ignored.
    refs: readonly RefObject<HTMLElement | null>[];
    // Toggle the outside-pointer trigger (default on).
    outsidePointer?: boolean;
    // Toggle the Escape-key trigger (default on).
    escapeKey?: boolean;
}>;

export function useDismiss(options: UseDismissOptions): void {
    const { enabled = true }: UseDismissOptions = options;

    // Hold the latest options so the document handlers always read fresh refs and
    // a fresh onDismiss without forcing the subscription effect to re-bind each
    // render. The ref is refreshed in an effect (not during render).
    const latestRef: RefObject<UseDismissOptions> =
        useRef<UseDismissOptions>(options);
    useEffect((): void => {
        latestRef.current = options;
    });

    useEffect((): (() => void) | undefined => {
        if (!enabled) {
            return undefined;
        }
        if (typeof document === 'undefined') {
            return undefined;
        }

        function isInsideAny(target: EventTarget | null): boolean {
            if (!(target instanceof Node)) {
                return false;
            }
            return latestRef.current.refs.some(
                (ref: RefObject<HTMLElement | null>): boolean => {
                    const element: HTMLElement | null = ref.current;
                    return element?.contains(target) ?? false;
                },
            );
        }

        function handlePointerDown(event: PointerEvent): void {
            if (latestRef.current.outsidePointer === false) {
                return;
            }
            if (isInsideAny(event.target)) {
                return;
            }
            latestRef.current.onDismiss();
        }

        function handleKeyDown(event: KeyboardEvent): void {
            if (latestRef.current.escapeKey === false) {
                return;
            }
            if (event.key !== 'Escape') {
                return;
            }
            latestRef.current.onDismiss();
        }

        // Capture phase for pointerdown so the outside check runs before any inner
        // handler can stop propagation; keydown stays on the bubble phase.
        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener('keydown', handleKeyDown);
        return (): void => {
            document.removeEventListener('pointerdown', handlePointerDown, true);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled]);
}
