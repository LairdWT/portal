// Shared render budget for the R3F surfaces. Holding the device-pixel-ratio cap
// in one constant keeps the value passed to <Canvas dpr> from drifting between
// the surfaces and lets any perf-budget assertion read the same anchor.
//
// 1.5 is the mobile device-pixel-ratio cap named by the r3f-embedded-surface and
// frontend-perf-budgets skills. ShaderSurface was unified DOWN from 2 to 1.5 to
// honour that budget: it renders a full-bleed shader plane every frame, so the
// extra fragment work an uncapped DPR of 2 would cost is exactly what the cap is
// meant to prevent.
export const SCENE_DEVICE_PIXEL_RATIO_RANGE: readonly [number, number] = [1, 1.5];
