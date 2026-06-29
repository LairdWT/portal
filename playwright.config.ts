import { defineConfig, devices } from '@playwright/test';

// A dedicated, strict port keeps the example isolated from any other dev server
// that may already hold vite's default 5173 (avoids silently testing the wrong app).
const baseURL: string = 'http://127.0.0.1:5183';

// The e2e suite drives the example app, which consumes portal's built dist via a
// workspace dependency. The webServer therefore builds the library before serving
// the demo. Device projects cover the mobile-first viewport matrix; the final two
// projects re-run the same specs under reduced-motion and forced-colors emulation
// - media conditions Storybook cannot emulate but a real browser context can.
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    reporter: 'list',
    use: {
        baseURL,
        trace: 'on-first-retry',
    },
    webServer: {
        command:
            'pnpm build && pnpm -C example exec vite --host 127.0.0.1 --port 5183 --strictPort',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
    // The 7 device/media projects run ONLY the two layout specs - keyboard /
    // overlay / selection semantics do not vary by viewport, so the behavior specs
    // are ignored here and confined to the two dedicated projects below (desktop +
    // forced-colors), avoiding a 7x run-cost and flake multiplier.
    projects: [
        {
            name: 'phone-portrait',
            use: { ...devices['Pixel 5'] },
            testIgnore: '**/behavior/**',
        },
        {
            name: 'phone-landscape',
            use: { ...devices['Pixel 5 landscape'] },
            testIgnore: '**/behavior/**',
        },
        {
            name: 'tablet-portrait',
            use: { ...devices['Galaxy Tab S4'] },
            testIgnore: '**/behavior/**',
        },
        {
            name: 'tablet-landscape',
            use: { ...devices['Galaxy Tab S4 landscape'] },
            testIgnore: '**/behavior/**',
        },
        {
            name: 'desktop-chrome',
            use: { ...devices['Desktop Chrome'] },
            testIgnore: '**/behavior/**',
        },
        {
            name: 'reduced-motion',
            use: { ...devices['Pixel 5'], reducedMotion: 'reduce' },
            testIgnore: '**/behavior/**',
        },
        {
            name: 'forced-colors',
            use: { ...devices['Desktop Chrome'], forcedColors: 'active' },
            testIgnore: '**/behavior/**',
        },
        // The behavior specs run once on a real desktop Chromium - the correct
        // context for focus / Tab / portal / scroll semantics.
        {
            name: 'behavior',
            use: { ...devices['Desktop Chrome'] },
            testMatch: '**/behavior/**',
        },
        // A second behavior run under forced-colors proves the selected / active /
        // focus states survive forced-colors (a real-browser-only check the axe
        // story project cannot emulate).
        {
            name: 'behavior-forced-colors',
            use: { ...devices['Desktop Chrome'], forcedColors: 'active' },
            testMatch: '**/behavior/**',
        },
    ],
});
