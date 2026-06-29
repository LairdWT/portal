import type { StorybookConfig } from '@storybook/react-vite';
import type { InlineConfig, PluginOption } from 'vite';

// The project vite config carries vite-plugin-dts (name 'vite:dts') for the
// library type emit. With rollupTypes it invokes api-extractor against
// ./dist/index.d.ts, which only exists after `pnpm build`. Storybook inherits
// the project vite plugins, so a cold `build-storybook` (CI, no prior build)
// would run that rollup and fail ("mainEntryPointFilePath ... does not exist").
// The docs site ships no declarations, so strip the dts plugin from the
// Storybook build entirely.
const isDtsPlugin: (plugin: PluginOption) => boolean = (
    plugin: PluginOption,
): boolean =>
    typeof plugin === 'object' &&
    plugin !== null &&
    'name' in plugin &&
    plugin.name === 'vite:dts';

const stripDtsPlugin: (plugins: PluginOption[]) => PluginOption[] = (
    plugins: PluginOption[],
): PluginOption[] =>
    plugins.reduce<PluginOption[]>(
        (kept: PluginOption[], plugin: PluginOption): PluginOption[] => {
            if (Array.isArray(plugin)) {
                kept.push(stripDtsPlugin(plugin));
            } else if (!isDtsPlugin(plugin)) {
                kept.push(plugin);
            }
            return kept;
        },
        [],
    );

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
    viteFinal: (viteConfig: InlineConfig): InlineConfig => {
        if (Array.isArray(viteConfig.plugins)) {
            viteConfig.plugins = stripDtsPlugin(viteConfig.plugins);
        }
        return viteConfig;
    },
};

export default config;
