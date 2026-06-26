import '../src/theme/tokens.css';
import '../src/theme/reset.css';

import type { Decorator, Preview } from '@storybook/react-vite';
import type { ReactElement } from 'react';

// three r183 deprecated THREE.Clock; the warning fires inside @react-three/fiber
// when a Canvas mounts in a story, not in Portal source. The Storybook browser
// project relays browser console.warn through a channel the vitest onConsoleLog
// hook does not see, so filter that single line at its source here (the jsdom
// unit project suppresses the same line via onConsoleLog). Everything else passes
// through untouched.
const originalWarn: typeof console.warn = console.warn;
console.warn = (...args: unknown[]): void => {
    if (
        typeof args[0] === 'string' &&
        args[0].includes('THREE.Clock: This module has been deprecated')
    ) {
        return;
    }
    originalWarn(...args);
};

// Render every story on the portal dark surface so axe color-contrast checks
// evaluate components in their intended theme context, not against Storybook's
// default white canvas. Token references carry literal fallbacks so the decorator
// is robust even if a token is renamed.
const withPortalSurface: Decorator = (
    Story: Parameters<Decorator>[0],
): ReactElement => (
    <div
        style={{
            background: 'var(--portal-color-bg-0, #07080d)',
            minHeight: '100vh',
            padding: 'var(--portal-space-6, 2rem)',
        }}
    >
        <Story />
    </div>
);

const preview: Preview = {
    decorators: [withPortalSurface],
    parameters: {
        layout: 'centered',
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },

        a11y: {
            // 'error' fails the test run on axe a11y violations (automated gate);
            // 'todo' would surface them in the Storybook UI only.
            test: 'error',
        },
    },
};

export default preview;
