import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname: string =
    typeof __dirname !== 'undefined'
        ? __dirname
        : path.dirname(fileURLToPath(import.meta.url));

// Test configuration is kept separate from the library build (vite.config.ts):
// the build externalizes React and the R3F stack and emits type declarations,
// none of which should apply to the test runners. Two projects run: jsdom unit
// tests, and a Storybook project that renders every story in a real browser and
// runs axe accessibility checks (a11y violations fail the run; see preview.ts).
export default defineConfig({
    plugins: [react()],
    css: {
        modules: {
            localsConvention: 'camelCaseOnly',
        },
    },
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    environment: 'jsdom',
                    globals: true,
                    setupFiles: ['./src/test/setup.ts'],
                    include: ['src/**/*.{test,spec}.{ts,tsx}'],
                    exclude: ['src/**/*.stories.tsx'],
                    css: {
                        modules: {
                            classNameStrategy: 'non-scoped',
                        },
                    },
                },
            },
            {
                extends: true,
                plugins: [
                    storybookTest({
                        configDir: path.join(dirname, '.storybook'),
                    }),
                ],
                test: {
                    name: 'storybook',
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright({}),
                        instances: [{ browser: 'chromium' }],
                    },
                },
            },
        ],
        onConsoleLog: (log: string): boolean | undefined => {
            // three r183 deprecated THREE.Clock; the warning fires inside
            // @react-three/fiber when a Canvas mounts, not in Portal source.
            // Suppress only that one line so test stderr stays signal. The
            // Storybook browser project relays the same warning through a channel
            // this hook does not see; it is filtered in .storybook/preview.tsx.
            if (log.includes('THREE.Clock: This module has been deprecated')) {
                return false;
            }
            return undefined;
        },
        coverage: {
            provider: 'v8',
            reportsDirectory: './coverage',
        },
    },
});
