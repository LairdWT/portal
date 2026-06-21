import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType, ReactElement } from 'react';

import { SceneBackdrop } from './SceneBackdrop';

// The backdrop fills its nearest positioned ancestor, so every story wraps it
// in a relatively positioned, full-viewport stage. layout is fullscreen so the
// decorative surface is reviewed edge to edge.
function BackdropStage({
    children,
}: Readonly<{ children: ReactElement }>): ReactElement {
    return (
        <div
            style={{
                position: 'relative',
                inlineSize: '100vw',
                minBlockSize: '100svh',
            }}
        >
            {children}
        </div>
    );
}

const meta: Meta<typeof SceneBackdrop> = {
    title: 'R3F/SceneBackdrop',
    component: SceneBackdrop,
    parameters: { layout: 'fullscreen' },
    decorators: [
        (Story: ComponentType): ReactElement => (
            <BackdropStage>
                <Story />
            </BackdropStage>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Contained: Story = {
    decorators: [
        (Story: ComponentType): ReactElement => (
            <div
                style={{
                    position: 'relative',
                    inlineSize: 'min(90vw, 40rem)',
                    blockSize: 'min(70svh, 30rem)',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                }}
            >
                <Story />
            </div>
        ),
    ],
};
