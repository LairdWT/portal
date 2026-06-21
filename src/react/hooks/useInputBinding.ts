// Memoized React seam over a binding registry. A component resolves an inputId
// to its action without re-running the lookup on every render: the resolution is
// recomputed only when the registry, inputId, or context changes. The component
// depends on the IInputBindingRegistry contract, never the concrete class, so the
// binding profile stays swappable (per-player remap, context switch, ...).

import { useMemo } from 'react';

import type { BindingResolution, IInputBindingRegistry } from '../../input';

export function useInputBinding(
    registry: IInputBindingRegistry,
    inputId: string,
    context?: string,
): BindingResolution {
    return useMemo<BindingResolution>(
        (): BindingResolution => registry.resolve(inputId, context),
        [registry, inputId, context],
    );
}
