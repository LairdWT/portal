/// <reference types="vitest/config" />
// https://vite.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const dirname: string =
    typeof __dirname !== 'undefined'
        ? __dirname
        : path.dirname(fileURLToPath(import.meta.url));

// External packages must not be bundled into the published library output.
// React, the optional R3F stack, and animejs are resolved from the consumer.
const externalPackages: readonly string[] = [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    'animejs',
];

export default defineConfig({
    plugins: [
        react(),
        dts({
            // rollupTypes bundles each lib entry into a single self-contained
            // .d.ts via api-extractor (a vite-plugin-dts dependency), removing
            // the extensionless relative re-exports that node16/nodenext ESM
            // type resolution rejects (TS2305). All four subpath types then
            // resolve under node16, nodenext, and bundler. See
            // C:/dev/temp/portal-1.0-stabilization/residual-a-node16-dts-plan.md.
            rollupTypes: true,
            insertTypesEntry: true,
            include: ['src'],
            exclude: [
                'src/**/*.stories.tsx',
                'src/**/*.test.ts',
                'src/**/*.test.tsx',
                'src/**/*.test-d.ts',
                'src/test/**',
                'src/examples/**',
            ],
            tsconfigPath: path.resolve(dirname, 'tsconfig.json'),
        }),
    ],
    css: {
        modules: {
            localsConvention: 'camelCaseOnly',
        },
    },
    build: {
        cssCodeSplit: false,
        lib: {
            entry: {
                index: path.resolve(dirname, 'src/index.ts'),
                theme: path.resolve(dirname, 'src/theme/index.ts'),
                r3f: path.resolve(dirname, 'src/r3f/index.ts'),
                shaders: path.resolve(dirname, 'src/shaders/index.ts'),
            },
            formats: ['es'],
            fileName: (_format: string, entryName: string): string =>
                entryName === 'index' ? 'portal.js' : `${entryName}.js`,
        },
        rollupOptions: {
            external: (id: string): boolean =>
                externalPackages.some(
                    (packageName: string): boolean =>
                        id === packageName || id.startsWith(`${packageName}/`),
                ),
            output: {
                assetFileNames: (assetInfo: {
                    names?: readonly string[];
                }): string => {
                    const cssMatch: boolean = (assetInfo.names ?? []).some(
                        (assetName: string): boolean => assetName.endsWith('.css'),
                    );
                    return cssMatch ? 'portal.css' : 'assets/[name][extname]';
                },
            },
        },
    },
});
