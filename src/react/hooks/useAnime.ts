// Thin Anime.js v4 binding. An animation scope is created inside a useEffect and
// fully reverted on cleanup via scope.revert(), so every animation, timer, and
// scoped handler the setup registers is torn down when the component unmounts or
// a dependency changes. The whole effect is a no-op when the user prefers reduced
// motion: no scope is created and nothing animates.
//
// The setup callback runs inside scope.add, so animations it registers are owned
// by the scope and reverted automatically. Use the passed scope's methods (for
// example scope.add for named methods) rather than creating animations outside
// it, otherwise cleanup cannot reclaim them.

import type { Scope } from 'animejs';
import { createScope } from 'animejs';
import type { DependencyList, RefObject } from 'react';
import { useEffect } from 'react';

import { useReducedMotion } from './useReducedMotion';

export type AnimeScopeSetup = (scope: Scope) => void;

export type UseAnimeOptions = Readonly<{
    root: RefObject<HTMLElement | null>;
    setup: AnimeScopeSetup;
    deps?: DependencyList;
}>;

export function useAnime({ root, setup, deps = [] }: UseAnimeOptions): void {
    const prefersReducedMotion: boolean = useReducedMotion();

    useEffect((): (() => void) | undefined => {
        if (prefersReducedMotion) {
            return undefined;
        }

        const rootElement: HTMLElement | null = root.current;
        if (rootElement === null) {
            return undefined;
        }

        const scope: Scope = createScope({ root: rootElement }).add(
            (self: Scope | undefined): void => {
                if (self === undefined) {
                    return;
                }
                setup(self);
            },
        );

        return (): void => {
            scope.revert();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefersReducedMotion, root, setup, ...deps]);
}
