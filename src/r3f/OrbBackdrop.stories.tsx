import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType, ReactElement } from 'react';

import { type RippleField, rippleGridShader } from '../shaders';
import { OrbBackdrop } from './OrbBackdrop';
import type { OrbBackdropProps } from './OrbBackdrop.types';

// OrbBackdrop fills its container, so the story wraps it in a full-viewport,
// relatively positioned stage and reviews it edge to edge.
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

const meta: Meta<OrbBackdropProps<RippleField>> = {
    title: 'R3F/OrbBackdrop',
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

type Story = StoryObj<OrbBackdropProps<RippleField>>;

// The ripple-grid shader drawn full-bleed with a distort orb floating over it.
// Pointer the surface to spawn ripples. Pass another shader descriptor to swap
// the backdrop; pass orbColor to retint the orb.
export const RippleGridOrb: Story = {
    render: (): ReactElement => <OrbBackdrop shader={rippleGridShader} />,
};
