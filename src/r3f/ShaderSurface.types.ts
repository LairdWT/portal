// Public contract for the ShaderSurface renderer. The surface is generic over a
// shader descriptor's private state type, so it renders any shader without
// knowing its GLSL or uniforms.

import type { ShaderDescriptor } from '../shaders/shaderContract';

export type ShaderSurfaceProps<TState> = Readonly<{
    shader: ShaderDescriptor<TState>;
    className?: string;
    // When true (default) and the shader defines handlePointer, pointer contact
    // is forwarded to the shader in 0..1 UV space.
    interactive?: boolean;
}>;
