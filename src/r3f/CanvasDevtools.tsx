import { Perf } from 'r3f-perf';
import type { ReactElement } from 'react';

// Dev-only R3F overlay: frame rate, frame time, draw calls, and GPU memory.
// Gate it behind import.meta.env.DEV and a lazy dynamic import at the call site
// so r3f-perf is stripped from the published library build. Must render inside a
// <Canvas> because Perf reads the active R3F renderer.
export function CanvasDevtools(): ReactElement {
    return <Perf position="top-left" />;
}
