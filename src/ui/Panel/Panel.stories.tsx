import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { Panel } from './Panel';
import { EPanelElevation } from './Panel.types';

const meta: Meta<typeof Panel> = {
    title: 'UI/Panel',
    component: Panel,
    args: {
        title: 'Squad status',
        children: 'Panel body content.',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Default landmark section with a level-2 heading wired via aria-labelledby.
export const Titled: Story = {};

// No title: the container renders without a heading and stays unlabelled.
export const Untitled: Story = {
    args: { title: undefined },
};

// Raised elevation lifts the surface onto the secondary surface token.
export const Raised: Story = {
    args: { elevation: EPanelElevation.Raised },
};

// A consumer tone color cascades to the border and heading via the tone scope.
export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)' },
};

// A nested panel opts out of the landmark and renders a plain div so it does
// not spam landmarks inside an outer titled section.
export const Nested: Story = {
    render: function NestedPanels(): ReactElement {
        return (
            <Panel title="Outer panel">
                <Panel
                    title="Inner panel"
                    landmark={false}
                    headingLevel={3}
                    elevation={EPanelElevation.Raised}
                >
                    Nested body content.
                </Panel>
            </Panel>
        );
    },
};
