import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType, ReactElement } from 'react';

import { type RippleField, rippleGridShader } from '../shaders';
import { ShaderSurface } from './ShaderSurface';
import type { ShaderSurfaceProps } from './ShaderSurface.types';

// ShaderSurface fills its container, so each story wraps it in a sized stage.
function SurfaceStage({
    children,
}: Readonly<{ children: ReactElement }>): ReactElement {
    return (
        <div
            style={{
                position: 'relative',
                inlineSize: 'min(90vw, 32rem)',
                aspectRatio: '1',
            }}
        >
            {children}
        </div>
    );
}

const meta: Meta<ShaderSurfaceProps<RippleField>> = {
    title: 'R3F/ShaderSurface',
    parameters: { layout: 'centered' },
    decorators: [
        (Story: ComponentType): ReactElement => (
            <SurfaceStage>
                <Story />
            </SurfaceStage>
        ),
    ],
};

export default meta;

type Story = StoryObj<ShaderSurfaceProps<RippleField>>;

// The generic surface driven by the ripple-grid shader from the shaders lib.
// Pointer the panel to spawn ripples. Swapping to another shader descriptor is a
// one-line change here; no ShaderSurface code changes.
export const RippleGrid: Story = {
    render: (): ReactElement => <ShaderSurface shader={rippleGridShader} />,
};
