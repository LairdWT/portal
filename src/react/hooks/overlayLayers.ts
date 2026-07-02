// Module-level LIFO registries that coordinate stacked overlays. Each active
// focus trap and each active dismiss listener registers a layer; only the
// topmost layer of a registry acts on its document-level events, so an overlay
// opened above another (a ConfirmDialog over a Dialog, a Menu over a modal
// Window) neither fights the outer trap for focus nor lets a single Escape or
// outside pointerdown collapse the whole stack. One event resolves one layer:
// both hooks' document listeners see the same event, but a layer released in
// response to it unregisters after the dispatch, so the next layer acts only on
// the NEXT event. Registration order is activation (mount/effect) order, and
// release removes by identity, so out-of-order teardown (StrictMode replays,
// interleaved unmounts) cannot corrupt the stack.
//
// Deliberate consequence for non-nested overlays: an outside pointerdown
// dismisses only the most recent layer per event. Truly simultaneous sibling
// overlays are rare because opening one is itself an outside pointerdown that
// dismisses the other.

export type OverlayLayer = Readonly<{
    // True while this layer is the most recently registered live layer.
    isTop: () => boolean;
    // Remove this layer from its registry. Idempotent.
    release: () => void;
}>;

export type OverlayLayerRegistry = Readonly<{
    register: () => OverlayLayer;
}>;

function createLayerRegistry(): OverlayLayerRegistry {
    const layers: symbol[] = [];

    function register(): OverlayLayer {
        const token: symbol = Symbol('portal-overlay-layer');
        layers.push(token);
        return {
            isTop: (): boolean => layers[layers.length - 1] === token,
            release: (): void => {
                const index: number = layers.indexOf(token);
                if (index === -1) {
                    return;
                }
                layers.splice(index, 1);
            },
        };
    }

    return { register };
}

// Focus containment and dismissal stack independently: a non-trapping overlay
// (a Menu above a Dialog) must become the dismissal target without disturbing
// which trap owns Tab.
export const focusTrapLayers: OverlayLayerRegistry = createLayerRegistry();
export const dismissLayers: OverlayLayerRegistry = createLayerRegistry();
