import { MAX_RIPPLES } from './rippleField';

// Vertex stage: forward the plane's 0..1 UV to the fragment stage and emit the
// plane's XY directly as clip-space coordinates, so the quad fills the canvas
// independent of camera framing. The uv and position attributes are injected by
// three's ShaderMaterial and must not be redeclared here.
export const RIPPLE_GRID_VERTEX_SHADER: string = /* glsl */ `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

// Fragment stage: a slowly drifting grid displaced by expanding, decaying
// wavefronts. Each pointer contact pushes one ripple source into the uniform
// arrays; this shader sums every active ripple's contribution per pixel.
export const RIPPLE_GRID_FRAGMENT_SHADER: string = /* glsl */ `
    #define MAX_RIPPLES ${String(MAX_RIPPLES)}

    varying vec2 vUv;

    uniform float uTime;
    uniform float uAspect;
    uniform vec3 uColorBackground;
    uniform vec3 uColorGrid;
    uniform vec3 uColorAccent;
    uniform vec2 uRippleOrigins[MAX_RIPPLES];
    uniform float uRippleStartTimes[MAX_RIPPLES];

    // Tunables. Each controls one feel of the surface; adjust freely.
    const float GRID_CELLS = 12.0;       // grid divisions across the panel
    const float GRID_THICKNESS = 0.04;   // line half-width, in cell fraction
    const float FLOAT_SPEED = 0.15;      // drift rate of the whole grid
    const float FLOAT_AMOUNT = 0.012;    // drift distance, in UV units
    const float WAVE_FREQUENCY = 26.0;   // ripple ring spacing
    const float WAVE_SPEED = 6.0;        // ripple expansion rate
    const float TIME_DECAY = 1.6;        // ripple fade over time
    const float DISTANCE_DECAY = 2.2;    // ripple fade over distance
    const float RIPPLE_LIFETIME = 4.0;   // seconds before a ripple is ignored
    const float DISPLACE_SCALE = 0.06;   // how far ripples bend the grid
    const float RIPPLE_GLOW = 0.9;       // accent brightness added by ripples

    // Returns ~1 on a grid line and ~0 in a cell interior.
    float gridIntensity(vec2 uv) {
        vec2 scaled = uv * GRID_CELLS;
        vec2 toBoundary = 0.5 - abs(fract(scaled) - 0.5);
        float nearest = min(toBoundary.x, toBoundary.y);
        return 1.0 - smoothstep(0.0, GRID_THICKNESS, nearest);
    }

    void main() {
        vec2 aspect = vec2(uAspect, 1.0);

        // Subtle continuous float of the whole grid.
        vec2 drift = vec2(
            sin(uTime * FLOAT_SPEED),
            cos(uTime * FLOAT_SPEED * 0.8)
        ) * FLOAT_AMOUNT;

        // Accumulate each active ripple's wave height and bend direction.
        float wave = 0.0;
        vec2 displacement = vec2(0.0);
        for (int index = 0; index < MAX_RIPPLES; index++) {
            float age = uTime - uRippleStartTimes[index];
            if (age < 0.0 || age > RIPPLE_LIFETIME) {
                continue;
            }
            vec2 toCenter = (vUv - uRippleOrigins[index]) * aspect;
            float radius = length(toCenter);
            float ring = sin(radius * WAVE_FREQUENCY - age * WAVE_SPEED);
            float envelope = exp(-age * TIME_DECAY) * exp(-radius * DISTANCE_DECAY);
            wave += ring * envelope;
            displacement += normalize(toCenter + vec2(1e-5)) * ring * envelope;
        }

        vec2 gridUv = vUv + drift + displacement * DISPLACE_SCALE;
        float line = gridIntensity(gridUv);

        vec3 color = mix(uColorBackground, uColorGrid, line);
        float glow = clamp(wave * 0.5 + 0.5, 0.0, 1.0) * RIPPLE_GLOW;
        color += uColorAccent * glow * line;
        color += uColorAccent * abs(wave) * 0.06;

        gl_FragColor = vec4(color, 1.0);
    }
`;
