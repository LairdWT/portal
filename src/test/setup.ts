import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

// jsdom implements no canvas, so HTMLCanvasElement.getContext raises a noisy
// "Not implemented" error - on its virtualConsole, which vitest's onConsoleLog
// cannot intercept - for every call. Portal's webglSupport feature-tests WebGL
// through getContext, so stub it to null at the source: the jsdom unit run then
// reports "no WebGL" deterministically and silently. The real WebGL surface is
// covered by the Storybook browser project.
vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
