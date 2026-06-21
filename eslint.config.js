// Flat config for the Portal library. Mirrors signal-runner rule intent
// without the application-only react-refresh and storybook plugins.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
    {
        ignores: [
            'dist',
            'coverage',
            'storybook-static',
            'playwright-report',
            'test-results',
            'node_modules',
            'example',
        ],
    },
    js.configs.recommended,
    jsxA11y.flatConfigs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        languageOptions: {
            ecmaVersion: 2023,
            globals: { ...globals.browser, ...globals.es2023 },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: configDirectory,
            },
        },
        plugins: { 'react-hooks': reactHooks },
        rules: {
            ...reactHooks.configs.recommended.rules,
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/prefer-readonly': 'warn',
            '@typescript-eslint/typedef': [
                'error',
                {
                    arrayDestructuring: true,
                    arrowParameter: true,
                    memberVariableDeclaration: true,
                    objectDestructuring: true,
                    parameter: true,
                    propertyDeclaration: true,
                    variableDeclaration: true,
                    variableDeclarationIgnoreFunction: false,
                },
            ],
        },
    },
    // The decoupled input core must not import React.
    {
        files: ['src/input/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: 'react',
                            message: 'src/input must stay free of React imports.',
                        },
                        {
                            name: 'react-dom',
                            message: 'src/input must stay free of React imports.',
                        },
                    ],
                    patterns: ['react/*', 'react-dom/*'],
                },
            ],
        },
    },
    // Type-aware rules off for plain JS config files and test setup tooling.
    {
        files: ['**/*.{js,cjs,mjs}'],
        extends: [tseslint.configs.disableTypeChecked],
    },
    {
        plugins: { 'simple-import-sort': simpleImportSort },
        rules: {
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
        },
    },
    // Must stay last: disables ESLint rules that conflict with Prettier formatting.
    eslintConfigPrettier,
);
