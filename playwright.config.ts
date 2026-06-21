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
    projects: [
        { name: 'phone-portrait', use: { ...devices['Pixel 5'] } },
        { name: 'phone-landscape', use: { ...devices['Pixel 5 landscape'] } },
        { name: 'tablet-portrait', use: { ...devices['Galaxy Tab S4'] } },
        {
            name: 'tablet-landscape',
            use: { ...devices['Galaxy Tab S4 landscape'] },
        },
        { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
        {
            name: 'reduced-motion',
            use: { ...devices['Pixel 5'], reducedMotion: 'reduce' },
        },
        {
            name: 'forced-colors',
            use: { ...devices['Desktop Chrome'], forcedColors: 'active' },
        },
    ],
});
