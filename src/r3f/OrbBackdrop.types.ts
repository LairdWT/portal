// Public contract for the OrbBackdrop scene: a shader plane drawn full-bleed
// with a slowly turning distort orb and lighting above it. Generic over the
// shader descriptor's private state type, so it composes any shader.

import type { ShaderDescriptor } from '../shaders/shaderContract';

export type OrbBackdropProps<TState> = Readonly<{
    shader: ShaderDescriptor<TState>;
    className?: string;
    // When true (default) and the shader defines handlePointer, pointer contact
    // spawns shader ripples in 0..1 UV space.
    interactive?: boolean;
    // Orb material colour as a concrete CSS colour string. three reads a real
    // colour, not a CSS var, so this defaults to the portal accent mirror; pass a
    // hex/rgb/oklch string to retint the orb.
    orbColor?: string;
}>;
