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
    if (context === null) {
        return false;
    }
    if (
        context instanceof WebGLRenderingContext ||
        context instanceof WebGL2RenderingContext
    ) {
        const loseContext: WEBGL_lose_context | null =
            context.getExtension('WEBGL_lose_context');
        if (loseContext !== null) {
            loseContext.loseContext();
        }
    }
    return true;
}
