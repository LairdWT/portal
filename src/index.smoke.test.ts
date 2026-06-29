import { describe, expect, it } from 'vitest';

import * as root from './index';
import * as r3f from './r3f';
import * as shaders from './shaders';
import * as theme from './theme';

// Entry-point smoke test (1.0 stabilization, Track 3). Imports each published
// `exports`-map subpath through its source entry and asserts the load-bearing
// symbols resolve. This catches a whole class of packaging regression - a public
// export dropped from a barrel, or a docs/example import that no longer resolves
// (the README ./r3f and ./theme samples both drifted before 1.0) - at the source
// level, before the built tarball reaches a consumer.

describe('package entry points', (): void => {
    it('root barrel exposes representative component, token, and enum exports', (): void => {
        expect(typeof root.CTA).toBe('function');
        expect(typeof root.DataTable).toBe('function');
        expect(typeof root.useToast).toBe('function');
        expect(typeof root.PORTAL_TOKENS).toBe('object');
        // The canonical selection-mode enum (P0-2 freeze contract).
        expect(root.ESelectionMode.Multi).toBe('multi');
    });

    it('./theme exposes PORTAL_TOKENS as var() references', (): void => {
        expect(theme.PORTAL_TOKENS.color.accent).toBe('var(--portal-color-accent)');
        expect(theme.PORTAL_TOKENS.press.scale).toBe('var(--portal-press-scale)');
    });

    it('./r3f exposes the optional React Three Fiber surface', (): void => {
        expect(typeof r3f.OrbBackdrop).toBe('function');
        expect(typeof r3f.ShaderSurface).toBe('function');
        expect(typeof r3f.isWebGlAvailable).toBe('function');
    });

    it('./shaders exposes the shader core for custom renderers', (): void => {
        expect(typeof shaders.createRippleField).toBe('function');
        expect(typeof shaders.rippleGridShader).toBe('object');
        expect(typeof shaders.MAX_RIPPLES).toBe('number');
    });
});
