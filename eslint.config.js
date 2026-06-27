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

// jsx-a11y's interaction rules default to mouse/keyboard handlers only. Portal's
// controls drive interaction with Pointer Events, so extend the handler set to
// include them; otherwise role="group" + onPointerDown slips past the a11y rules.
const interactionHandlers = [
    'onClick',
    'onError',
    'onLoad',
    'onMouseDown',
    'onMouseUp',
    'onKeyPress',
    'onKeyDown',
    'onKeyUp',
    'onPointerDown',
    'onPointerMove',
    'onPointerUp',
    'onPointerCancel',
];

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
            'jsx-a11y/no-noninteractive-element-interactions': [
                'error',
                { handlers: interactionHandlers },
            ],
            'jsx-a11y/no-static-element-interactions': [
                'error',
                { handlers: interactionHandlers },
            ],
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
            '@typescript-eslint/explicit-module-boundary-types': [
                'error',
                {
                    allowDirectConstAssertionInArrowFunctions: true,
                    allowHigherOrderFunctions: true,
                    allowTypedFunctionExpressions: true,
                    allowOverloadFunctions: true,
                },
            ],
            // A no-default union switch (the house dispatch idiom) still requires
            // every member, so a new member breaks the build. A union switch with
            // a MEANINGFUL default (a pass-through transform, a parse that returns
            // null for any non-member) is accepted - considerDefaultExhaustiveForUnions
            // true keeps that legitimate idiom from being churned into a verbose
            // case-per-member enumeration. requireDefaultForNonUnion still forces a
            // default on open (string/number) switches.
            '@typescript-eslint/switch-exhaustiveness-check': [
                'error',
                {
                    requireDefaultForNonUnion: true,
                    considerDefaultExhaustiveForUnions: true,
                },
            ],
            '@typescript-eslint/explicit-function-return-type': [
                'error',
                {
                    allowExpressions: true,
                    allowTypedFunctionExpressions: true,
                    allowHigherOrderFunctions: true,
                    allowDirectConstAssertionInArrowFunctions: true,
                    allowConciseArrowFunctionExpressionsStartingWithVoid: true,
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
    // e2e specs compile under Playwright's own runner, not the library tsconfig;
    // lint them without type-aware rules so they need not join a tsconfig project.
    {
        files: ['e2e/**/*.ts'],
        extends: [tseslint.configs.disableTypeChecked],
        languageOptions: { parserOptions: { projectService: false } },
    },
    // Playwright's config pulls in DOM-dependent option types the node tsconfig
    // (no DOM lib) cannot fully resolve, and Playwright runs it with its own
    // runner. Lint it without type-aware rules and outside the type project, the
    // same way the e2e specs are handled.
    {
        files: ['playwright.config.ts'],
        extends: [tseslint.configs.disableTypeChecked],
        languageOptions: { parserOptions: { projectService: false } },
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
