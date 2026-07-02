import { renderHook, type RenderHookResult } from '@testing-library/react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { useDismiss } from './useDismiss';

type RefLike = { current: HTMLElement | null };

afterEach((): void => {
    document.body.innerHTML = '';
});

function appendElement(tag: string): HTMLElement {
    const element: HTMLElement = document.createElement(tag);
    document.body.appendChild(element);
    return element;
}

function pointerDownOn(element: HTMLElement): void {
    element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
}

describe('useDismiss', (): void => {
    it('calls onDismiss on a pointerdown outside every inside ref', (): void => {
        const inside: HTMLElement = appendElement('div');
        const outside: HTMLElement = appendElement('button');
        const onDismiss: Mock<() => void> = vi.fn<() => void>();
        const ref: RefLike = { current: inside };

        renderHook((): void => {
            useDismiss({ enabled: true, onDismiss, refs: [ref] });
        });

        pointerDownOn(outside);
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('ignores a pointerdown inside an inside ref', (): void => {
        const inside: HTMLElement = appendElement('div');
        const child: HTMLElement = document.createElement('span');
        inside.appendChild(child);
        const onDismiss: Mock<() => void> = vi.fn<() => void>();
        const ref: RefLike = { current: inside };

        renderHook((): void => {
            useDismiss({ enabled: true, onDismiss, refs: [ref] });
        });

        pointerDownOn(child);
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it('calls onDismiss on the Escape key', (): void => {
        const inside: HTMLElement = appendElement('div');
        const onDismiss: Mock<() => void> = vi.fn<() => void>();
        const ref: RefLike = { current: inside };

        renderHook((): void => {
            useDismiss({ enabled: true, onDismiss, refs: [ref] });
        });

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not react to other keys', (): void => {
        const inside: HTMLElement = appendElement('div');
        const onDismiss: Mock<() => void> = vi.fn<() => void>();
        const ref: RefLike = { current: inside };

        renderHook((): void => {
            useDismiss({ enabled: true, onDismiss, refs: [ref] });
        });

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it('attaches no listeners when disabled', (): void => {
        const outside: HTMLElement = appendElement('button');
        const onDismiss: Mock<() => void> = vi.fn<() => void>();
        const ref: RefLike = { current: null };

        renderHook((): void => {
            useDismiss({ enabled: false, onDismiss, refs: [ref] });
        });

        pointerDownOn(outside);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it('removes its listeners on unmount', (): void => {
        const outside: HTMLElement = appendElement('button');
        const onDismiss: Mock<() => void> = vi.fn<() => void>();
        const ref: RefLike = { current: null };

        const view: RenderHookResult<void, unknown> = renderHook((): void => {
            useDismiss({ enabled: true, onDismiss, refs: [ref] });
        });

        view.unmount();
        pointerDownOn(outside);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(onDismiss).not.toHaveBeenCalled();
    });

    // Stacked overlays (ConfirmDialog over Dialog, Menu over a modal): one
    // Escape or outside pointerdown peels only the topmost layer instead of
    // collapsing the whole stack.
    describe('stacked layers', (): void => {
        it('routes Escape to only the topmost layer, then the next', (): void => {
            const lowerDismiss: Mock<() => void> = vi.fn<() => void>();
            const upperDismiss: Mock<() => void> = vi.fn<() => void>();
            const ref: RefLike = { current: null };

            renderHook((): void => {
                useDismiss({ enabled: true, onDismiss: lowerDismiss, refs: [ref] });
            });
            const upperView: RenderHookResult<void, unknown> = renderHook(
                (): void => {
                    useDismiss({
                        enabled: true,
                        onDismiss: upperDismiss,
                        refs: [ref],
                    });
                },
            );

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(upperDismiss).toHaveBeenCalledTimes(1);
            expect(lowerDismiss).not.toHaveBeenCalled();

            upperView.unmount();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(upperDismiss).toHaveBeenCalledTimes(1);
            expect(lowerDismiss).toHaveBeenCalledTimes(1);
        });

        it('routes an outside pointerdown to only the topmost layer', (): void => {
            const outside: HTMLElement = appendElement('button');
            const lowerDismiss: Mock<() => void> = vi.fn<() => void>();
            const upperDismiss: Mock<() => void> = vi.fn<() => void>();
            const ref: RefLike = { current: null };

            renderHook((): void => {
                useDismiss({ enabled: true, onDismiss: lowerDismiss, refs: [ref] });
            });
            const upperView: RenderHookResult<void, unknown> = renderHook(
                (): void => {
                    useDismiss({
                        enabled: true,
                        onDismiss: upperDismiss,
                        refs: [ref],
                    });
                },
            );

            pointerDownOn(outside);
            expect(upperDismiss).toHaveBeenCalledTimes(1);
            expect(lowerDismiss).not.toHaveBeenCalled();

            upperView.unmount();
            pointerDownOn(outside);
            expect(lowerDismiss).toHaveBeenCalledTimes(1);
        });
    });

    it('honours the outsidePointer and escapeKey toggles', (): void => {
        const outside: HTMLElement = appendElement('button');
        const onDismiss: Mock<() => void> = vi.fn<() => void>();
        const ref: RefLike = { current: null };

        renderHook((): void => {
            useDismiss({
                enabled: true,
                onDismiss,
                refs: [ref],
                outsidePointer: false,
                escapeKey: true,
            });
        });

        pointerDownOn(outside);
        expect(onDismiss).not.toHaveBeenCalled();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
