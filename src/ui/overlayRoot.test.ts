import { afterEach, describe, expect, it } from 'vitest';

import { ensureOverlayRoot, OVERLAY_ROOT_ATTRIBUTE } from './overlayRoot';

afterEach((): void => {
    document.body.innerHTML = '';
});

describe('ensureOverlayRoot', (): void => {
    it('creates a root on <body> marked with the overlay attribute', (): void => {
        const root: HTMLElement | null = ensureOverlayRoot();

        expect(root).not.toBeNull();
        expect(root?.hasAttribute(OVERLAY_ROOT_ATTRIBUTE)).toBe(true);
        expect(root?.parentElement).toBe(document.body);
    });

    it('returns the existing root on subsequent calls without churning it', (): void => {
        const first: HTMLElement | null = ensureOverlayRoot();
        const second: HTMLElement | null = ensureOverlayRoot();

        expect(second).toBe(first);
        const roots: NodeListOf<Element> = document.querySelectorAll(
            `[${OVERLAY_ROOT_ATTRIBUTE}]`,
        );
        expect(roots.length).toBe(1);
    });

    it('exposes the documented marker attribute name', (): void => {
        expect(OVERLAY_ROOT_ATTRIBUTE).toBe('data-portal-overlay-root');
    });
});
