// Reusable shader contract. A ShaderDescriptor is a self-contained shader unit:
// GLSL source, its own per-instance state, the uniform objects it needs, a
// per-frame update, and an optional pointer interaction. A panel references a
// descriptor instead of embedding GLSL and uniform wiring, so one renderer can
// drive any shader and shaders can be authored and tested in isolation. This
// mirrors Portal's input/render split: shader units stay free of React, and the
// r3f ShaderSurface binds them to a canvas.

import type { IUniform } from 'three';

// Per-frame inputs a shader needs to advance its uniforms.
export type ShaderFrameContext = Readonly<{
    elapsedSeconds: number;
    aspectRatio: number;
}>;

// A pointer contact in 0..1 surface space, origin bottom-left to match GLSL UV.
export type ShaderPointerSample = Readonly<{
    u: number;
    v: number;
    timeSeconds: number;
}>;

// The mutable uniform set handed to three's ShaderMaterial. Values are mutated
// in place each frame; three uploads them on the next render.
export type ShaderUniforms = Record<string, IUniform>;

// TState is the shader's private per-instance state (for example a ripple ring
// buffer). A stateless shader uses an empty object type and a no-op factory.
export type ShaderDescriptor<TState> = Readonly<{
    id: string;
    vertexShader: string;
    fragmentShader: string;
    createState: () => TState;
    createUniforms: (state: TState) => ShaderUniforms;
    update: (
        uniforms: ShaderUniforms,
        state: TState,
        context: ShaderFrameContext,
    ) => void;
    handlePointer?: (sample: ShaderPointerSample, state: TState) => void;
}>;
