import { renderHook, type RenderHookResult } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useScrollLock } from './useScrollLock';

afterEach((): void => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
});

describe('useScrollLock', (): void => {
    it('locks body overflow while locked', (): void => {
        renderHook((): void => {
            useScrollLock({ locked: true });
        });

        expect(document.body.style.overflow).toBe('hidden');
    });

    it('leaves the body untouched while unlocked', (): void => {
        renderHook((): void => {
            useScrollLock({ locked: false });
        });

        expect(document.body.style.overflow).toBe('');
    });

    it('restores body overflow on unmount', (): void => {
        const view: RenderHookResult<void, unknown> = renderHook((): void => {
            useScrollLock({ locked: true });
        });

        view.unmount();
        expect(document.body.style.overflow).toBe('');
    });

    it('ref-counts stacked locks so the page unlocks only on the last release', (): void => {
        const outer: RenderHookResult<void, unknown> = renderHook((): void => {
            useScrollLock({ locked: true });
        });
        const inner: RenderHookResult<void, unknown> = renderHook((): void => {
            useScrollLock({ locked: true });
        });

        expect(document.body.style.overflow).toBe('hidden');

        inner.unmount();
        expect(document.body.style.overflow).toBe('hidden');

        outer.unmount();
        expect(document.body.style.overflow).toBe('');
    });

    it('restores a pre-existing inline overflow value exactly', (): void => {
        document.body.style.overflow = 'scroll';

        const view: RenderHookResult<void, unknown> = renderHook((): void => {
            useScrollLock({ locked: true });
        });
        expect(document.body.style.overflow).toBe('hidden');

        view.unmount();
        expect(document.body.style.overflow).toBe('scroll');
    });
});
