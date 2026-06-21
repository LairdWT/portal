// Shared WebGL capability probe for the R3F surfaces. Returns false during SSR
// and when neither a webgl2 nor a webgl context can be created, so callers can
// render a static fallback instead of mounting a canvas.
export function isWebGlAvailable(): boolean {
    if (typeof document === 'undefined') {
        return false;
    }
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    const context: RenderingContext | null =
        canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    return context !== null;
}
