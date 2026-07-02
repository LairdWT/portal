import { describe, expect, it } from 'vitest';

import {
    dismissLayers,
    focusTrapLayers,
    type OverlayLayer,
    type OverlayLayerRegistry,
} from './overlayLayers';

// The registries are module singletons; every layer registered here must be
// released so no test leaks stack state into another.
function withRegistry(
    registry: OverlayLayerRegistry,
    run: (register: () => OverlayLayer) => void,
): void {
    const registered: OverlayLayer[] = [];
    const register: () => OverlayLayer = (): OverlayLayer => {
        const layer: OverlayLayer = registry.register();
        registered.push(layer);
        return layer;
    };
    try {
        run(register);
    } finally {
        for (const layer of registered) {
            layer.release();
        }
    }
}

describe('overlayLayers', (): void => {
    it('reports a single registered layer as top', (): void => {
        withRegistry(focusTrapLayers, (register: () => OverlayLayer): void => {
            const layer: OverlayLayer = register();
            expect(layer.isTop()).toBe(true);
        });
    });

    it('promotes the most recent registration to top and restores on release', (): void => {
        withRegistry(focusTrapLayers, (register: () => OverlayLayer): void => {
            const lower: OverlayLayer = register();
            const upper: OverlayLayer = register();

            expect(lower.isTop()).toBe(false);
            expect(upper.isTop()).toBe(true);

            upper.release();
            expect(lower.isTop()).toBe(true);
        });
    });

    it('survives out-of-order release without corrupting the stack', (): void => {
        withRegistry(dismissLayers, (register: () => OverlayLayer): void => {
            const bottom: OverlayLayer = register();
            const middle: OverlayLayer = register();
            const top: OverlayLayer = register();

            middle.release();
            expect(top.isTop()).toBe(true);

            top.release();
            expect(bottom.isTop()).toBe(true);
        });
    });

    it('treats release as idempotent', (): void => {
        withRegistry(dismissLayers, (register: () => OverlayLayer): void => {
            const lower: OverlayLayer = register();
            const upper: OverlayLayer = register();

            upper.release();
            upper.release();
            expect(lower.isTop()).toBe(true);
        });
    });

    it('keeps the trap and dismiss registries independent', (): void => {
        withRegistry(focusTrapLayers, (registerTrap: () => OverlayLayer): void => {
            withRegistry(
                dismissLayers,
                (registerDismiss: () => OverlayLayer): void => {
                    const trap: OverlayLayer = registerTrap();
                    const dismiss: OverlayLayer = registerDismiss();
                    const dismissAbove: OverlayLayer = registerDismiss();

                    expect(trap.isTop()).toBe(true);
                    expect(dismiss.isTop()).toBe(false);
                    expect(dismissAbove.isTop()).toBe(true);
                },
            );
        });
    });
});
