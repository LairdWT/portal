import { Color, type IUniform } from 'three';

import type {
    ShaderDescriptor,
    ShaderFrameContext,
    ShaderPointerSample,
    ShaderUniforms,
} from '../shaderContract';
import { createRippleField, type RippleField } from './rippleField';
import {
    RIPPLE_GRID_FRAGMENT_SHADER,
    RIPPLE_GRID_VERTEX_SHADER,
} from './rippleGridSource';

// Raw hex mirrors of the Portal CSS tokens. three materials need a concrete
// color, not a CSS var() reference.
const COLOR_BACKGROUND: string = '#07080d';
const COLOR_GRID: string = '#5f6dac';
const COLOR_ACCENT: string = '#92a1e4';

function createRippleGridUniforms(state: RippleField): ShaderUniforms {
    return {
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uColorBackground: { value: new Color(COLOR_BACKGROUND) },
        uColorGrid: { value: new Color(COLOR_GRID) },
        uColorAccent: { value: new Color(COLOR_ACCENT) },
        uRippleOrigins: { value: state.origins },
        uRippleStartTimes: { value: state.startTimes },
    };
}

// Only the clock-driven uniforms change per frame; the ripple arrays are mutated
// in place by spawn, so the same Float32Array references stay bound.
function updateRippleGrid(
    uniforms: ShaderUniforms,
    _state: RippleField,
    context: ShaderFrameContext,
): void {
    const uniformTime: IUniform | undefined = uniforms.uTime;
    const uniformAspect: IUniform | undefined = uniforms.uAspect;
    if (uniformTime === undefined || uniformAspect === undefined) {
        return;
    }
    uniformTime.value = context.elapsedSeconds;
    uniformAspect.value = context.aspectRatio;
}

function spawnRipple(sample: ShaderPointerSample, state: RippleField): void {
    state.spawn({
        originU: sample.u,
        originV: sample.v,
        timeSeconds: sample.timeSeconds,
    });
}

// A pointer-reactive grid that ripples outward from each contact. Reference it
// from a ShaderSurface; no GLSL or uniform wiring leaks into the panel.
export const rippleGridShader: ShaderDescriptor<RippleField> = {
    id: 'ripple-grid',
    vertexShader: RIPPLE_GRID_VERTEX_SHADER,
    fragmentShader: RIPPLE_GRID_FRAGMENT_SHADER,
    createState: createRippleField,
    createUniforms: createRippleGridUniforms,
    update: updateRippleGrid,
    handlePointer: spawnRipple,
};
