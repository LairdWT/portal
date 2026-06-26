import { renderHook, type RenderHookResult } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useFocusTrap } from './useFocusTrap';

type RefLike = { current: HTMLElement | null };

afterEach((): void => {
    document.body.innerHTML = '';
});

function buildContainer(): {
    container: HTMLElement;
    first: HTMLButtonElement;
    last: HTMLButtonElement;
} {
    const container: HTMLElement = document.createElement('div');
    container.tabIndex = -1;
    const first: HTMLButtonElement = document.createElement('button');
    first.textContent = 'first';
    const last: HTMLButtonElement = document.createElement('button');
    last.textContent = 'last';
    container.append(first, last);
    document.body.appendChild(container);
    return { container, first, last };
}

function pressTab(shiftKey: boolean): void {
    document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true }),
    );
}

describe('useFocusTrap', (): void => {
    it('moves focus to the first focusable on activation', (): void => {
        const { container, first }: ReturnType<typeof buildContainer> =
            buildContainer();
        const ref: RefLike = { current: container };

        renderHook((): void => {
            useFocusTrap({ active: true, containerRef: ref });
        });

        expect(document.activeElement).toBe(first);
    });

    it('respects an explicit initial focus target', (): void => {
        const { container, last }: ReturnType<typeof buildContainer> =
            buildContainer();
        const ref: RefLike = { current: container };
        const initial: RefLike = { current: last };

        renderHook((): void => {
            useFocusTrap({
                active: true,
                containerRef: ref,
                initialFocusRef: initial,
            });
        });

        expect(document.activeElement).toBe(last);
    });

    it('wraps from the last element to the first on Tab', (): void => {
        const { container, first, last }: ReturnType<typeof buildContainer> =
            buildContainer();
        const ref: RefLike = { current: container };

        renderHook((): void => {
            useFocusTrap({ active: true, containerRef: ref });
        });

        last.focus();
        pressTab(false);
        expect(document.activeElement).toBe(first);
    });

    it('wraps from the first element to the last on Shift+Tab', (): void => {
        const { container, first, last }: ReturnType<typeof buildContainer> =
            buildContainer();
        const ref: RefLike = { current: container };

        renderHook((): void => {
            useFocusTrap({ active: true, containerRef: ref });
        });

        first.focus();
        pressTab(true);
        expect(document.activeElement).toBe(last);
    });

    it('restores focus to the previous element on release', (): void => {
        const outside: HTMLButtonElement = document.createElement('button');
        document.body.appendChild(outside);
        outside.focus();
        const { container }: ReturnType<typeof buildContainer> = buildContainer();
        const ref: RefLike = { current: container };

        const view: RenderHookResult<void, unknown> = renderHook((): void => {
            useFocusTrap({ active: true, containerRef: ref });
        });

        view.unmount();
        expect(document.activeElement).toBe(outside);
    });

    it('does not trap once released', (): void => {
        const { container, last }: ReturnType<typeof buildContainer> =
            buildContainer();
        const ref: RefLike = { current: container };

        const view: RenderHookResult<void, unknown> = renderHook((): void => {
            useFocusTrap({ active: true, containerRef: ref, restoreFocus: false });
        });

        view.unmount();
        last.focus();
        pressTab(false);
        expect(document.activeElement).toBe(last);
    });

    it('attaches nothing while inactive', (): void => {
        const outside: HTMLButtonElement = document.createElement('button');
        document.body.appendChild(outside);
        outside.focus();
        const { container }: ReturnType<typeof buildContainer> = buildContainer();
        const ref: RefLike = { current: container };

        renderHook((): void => {
            useFocusTrap({ active: false, containerRef: ref });
        });

        expect(document.activeElement).toBe(outside);
    });
});
