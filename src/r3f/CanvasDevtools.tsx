import {
    type ComponentType,
    lazy,
    type LazyExoticComponent,
    type ReactElement,
    Suspense,
} from 'react';

// Dev-only R3F overlay: frame rate, frame time, draw calls, and GPU memory.
// r3f-perf is a devDependency, so it must never reach the published library
// graph. Perf is pulled through a lazy dynamic import() that the bundler keeps
// in its own async chunk and only resolves when this component renders, and
// rendering is gated behind import.meta.env.DEV. A stray static
// `import { CanvasDevtools }` therefore can never drag r3f-perf onto a shipped
// path. Must render inside a <Canvas> because Perf reads the active R3F renderer.
const PerfOverlay: LazyExoticComponent<ComponentType> = lazy(
    async (): Promise<{ default: ComponentType }> => {
        const { Perf }: { Perf: ComponentType<{ position?: string }> } =
            await import('r3f-perf');
        function PerfDevOverlay(): ReactElement {
            return <Perf position="top-left" />;
        }
        return { default: PerfDevOverlay };
    },
);

export function CanvasDevtools(): ReactElement | null {
    if (!import.meta.env.DEV) {
        return null;
    }
    return (
        <Suspense fallback={null}>
            <PerfOverlay />
        </Suspense>
    );
}
