// Focus-trap hook for modal containers (Dialog, and the Popover when it runs in a
// modal mode). While active, it moves focus into the container, keeps Tab and
// Shift+Tab cycling within it, and on release restores focus to the element that
// was focused before activation. The keydown listener is removed on cleanup, so a
// deactivated or unmounted trap leaves no global handler behind. Stacked traps
// coordinate through focusTrapLayers: only the topmost active trap enforces
// containment, so a modal opened above another (ConfirmDialog over Dialog) owns
// Tab alone instead of the two traps bouncing focus between their containers;
// when it releases, the trap beneath resumes.

import { type RefObject, useEffect } from 'react';

import { focusTrapLayers, type OverlayLayer } from './overlayLayers';

export type UseFocusTrapOptions = Readonly<{
    // Whether the trap is engaged. Pass the modal's open state.
    active: boolean;
    // The element whose focusable descendants are trapped. Give it tabindex={-1}
    // so it can receive focus when it has no focusable children.
    containerRef: RefObject<HTMLElement | null>;
    // Optional element to focus first on activation; defaults to the first
    // focusable descendant, then the container itself.
    initialFocusRef?: RefObject<HTMLElement | null>;
    // Restore focus to the previously focused element on release (default true).
    restoreFocus?: boolean;
}>;

// Tabbable selector. Disabled controls are excluded by the :not() guards and an
// explicit tabindex of -1 is excluded so programmatically focusable-only nodes
// stay out of the cycle.
const FOCUSABLE_SELECTOR: string = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function collectFocusable(container: HTMLElement): readonly HTMLElement[] {
    const nodes: NodeListOf<HTMLElement> =
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    return Array.from(nodes).filter(
        (node: HTMLElement): boolean => !node.hasAttribute('hidden'),
    );
}

export function useFocusTrap(options: UseFocusTrapOptions): void {
    const {
        active,
        containerRef,
        initialFocusRef,
        restoreFocus = true,
    }: UseFocusTrapOptions = options;

    useEffect((): (() => void) | undefined => {
        if (!active) {
            return undefined;
        }
        const container: HTMLElement | null = containerRef.current;
        if (container === null) {
            return undefined;
        }

        const previouslyFocused: Element | null = document.activeElement;
        const initialTarget: HTMLElement =
            initialFocusRef?.current ?? collectFocusable(container)[0] ?? container;
        initialTarget.focus();

        const layer: OverlayLayer = focusTrapLayers.register();

        function handleKeyDown(event: KeyboardEvent): void {
            if (event.key !== 'Tab') {
                return;
            }
            if (!layer.isTop()) {
                return;
            }
            const node: HTMLElement | null = containerRef.current;
            if (node === null) {
                return;
            }
            const focusable: readonly HTMLElement[] = collectFocusable(node);
            if (focusable.length === 0) {
                event.preventDefault();
                node.focus();
                return;
            }
            const first: HTMLElement | undefined = focusable[0];
            const last: HTMLElement | undefined = focusable[focusable.length - 1];
            if (first === undefined || last === undefined) {
                return;
            }
            const current: Element | null = document.activeElement;
            const outside: boolean = current === null || !node.contains(current);
            if (event.shiftKey) {
                if (current === first || outside) {
                    event.preventDefault();
                    last.focus();
                }
                return;
            }
            if (current === last || outside) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener('keydown', handleKeyDown, true);
        return (): void => {
            layer.release();
            document.removeEventListener('keydown', handleKeyDown, true);
            if (restoreFocus && previouslyFocused instanceof HTMLElement) {
                previouslyFocused.focus();
            }
        };
    }, [active, containerRef, initialFocusRef, restoreFocus]);
}
