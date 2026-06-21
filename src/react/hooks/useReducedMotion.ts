// React binding that reports the user's reduced-motion preference.
//
// Implemented with useSyncExternalStore so the subscription is the single
// source of truth: no setState inside an effect, no cascading renders, and a
// correct server snapshot for SSR. The store reads the
// (prefers-reduced-motion: reduce) media query and re-renders when it flips.

import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY: string = '(prefers-reduced-motion: reduce)';

function unsubscribeNoop(): void {
    // No matchMedia environment (for example SSR); nothing to unsubscribe.
}

function subscribeToReducedMotion(onStoreChange: () => void): () => void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return unsubscribeNoop;
    }
    const mediaQueryList: MediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
    mediaQueryList.addEventListener('change', onStoreChange);
    return (): void => {
        mediaQueryList.removeEventListener('change', onStoreChange);
    };
}

function getReducedMotionSnapshot(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false;
    }
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot(): boolean {
    return false;
}

export function useReducedMotion(): boolean {
    return useSyncExternalStore(
        subscribeToReducedMotion,
        getReducedMotionSnapshot,
        getReducedMotionServerSnapshot,
    );
}
