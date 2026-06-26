// Body scroll-lock hook for modal surfaces (Dialog). While locked, it prevents
// the document body from scrolling and restores the prior state exactly on
// release. A module-level reference count makes stacked locks safe: the first
// lock captures the body's inline overflow and padding-right and applies the
// lock; the last release restores them, so a nested dialog never unlocks the page
// while an outer one is still open. Scrollbar width is compensated via
// padding-right to avoid a layout jump when the scrollbar disappears.
//
// Negative-first guards with early return; the effect returns its cleanup; SSR
// (no document) is a no-op.

import { useEffect } from 'react';

export type UseScrollLockOptions = Readonly<{
    locked: boolean;
}>;

// Shared across every hook instance so stacked locks coordinate. Captured once
// when the count rises from zero and restored once when it returns to zero.
let lockCount: number = 0;
let savedOverflow: string = '';
let savedPaddingRight: string = '';

export function useScrollLock(options: UseScrollLockOptions): void {
    const { locked }: UseScrollLockOptions = options;

    useEffect((): (() => void) | undefined => {
        if (!locked) {
            return undefined;
        }
        if (typeof document === 'undefined') {
            return undefined;
        }
        const body: HTMLElement = document.body;

        if (lockCount === 0) {
            savedOverflow = body.style.overflow;
            savedPaddingRight = body.style.paddingRight;
            const scrollbarWidth: number =
                window.innerWidth - document.documentElement.clientWidth;
            if (scrollbarWidth > 0) {
                const computed: number = Number.parseFloat(
                    window.getComputedStyle(body).paddingRight,
                );
                const basePadding: number = Number.isFinite(computed)
                    ? computed
                    : 0;
                body.style.paddingRight = `${String(basePadding + scrollbarWidth)}px`;
            }
            body.style.overflow = 'hidden';
        }
        lockCount += 1;

        return (): void => {
            lockCount -= 1;
            if (lockCount > 0) {
                return;
            }
            body.style.overflow = savedOverflow;
            body.style.paddingRight = savedPaddingRight;
        };
    }, [locked]);
}
