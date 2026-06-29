import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.tsx'],
    addons: [
        '@storybook/addon-vitest',
        '@storybook/addon-a11y',
        '@storybook/addon-docs',
    ],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    typescript: {
        // RDT (TS compiler) resolves the intersection/alias prop types this
        // library uses (Readonly<{...}> & Toned & AccessibleName); the default
        // AST engine (react-docgen) does not reliably expand imported alias
        // intersections, so tone/label/labelledBy would be missing from tables.
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
            tsconfigPath: './tsconfig.json',
            shouldExtractLiteralValuesFromEnum: true,
            shouldRemoveUndefinedFromOptional: true,
            // Keep tables to the component's own props: drop anything declared
            // in node_modules (React/DOM lib types). Portal components do not
            // extend HTMLAttributes, so this is a guard, not a heavy filter.
            propFilter: (prop: { parent?: { fileName: string } }): boolean =>
                prop.parent ? !prop.parent.fileName.includes('node_modules') : true,
        },
    },
    docs: {
        defaultName: 'Docs',
    },
};

export default config;
