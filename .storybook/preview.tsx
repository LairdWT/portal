import '../src/theme/tokens.css';
import '../src/theme/reset.css';

import type { Decorator, Preview } from '@storybook/react-vite';
import type { ReactElement } from 'react';

// Render every story on the portal dark surface so axe color-contrast checks
// evaluate components in their intended theme context, not against Storybook's
// default white canvas. Token references carry literal fallbacks so the decorator
// is robust even if a token is renamed.
const withPortalSurface: Decorator = (Story): ReactElement => (
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
