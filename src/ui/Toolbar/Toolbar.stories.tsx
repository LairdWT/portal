import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';

import { CTA } from '../CTA/CTA';
import { Toolbar } from './Toolbar';
import { EToolbarOrientation, type ToolbarProps } from './Toolbar.types';
import { ToolbarGroup } from './ToolbarGroup';
import { ToolbarSeparator } from './ToolbarSeparator';

const meta: Meta<typeof Toolbar> = {
    title: 'UI/Toolbar',
    component: Toolbar,
    args: { label: 'Edit actions' },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args: ToolbarProps): ReactElement => (
        <Toolbar {...args}>
            <ToolbarGroup label="Clipboard">
                <CTA label="Cut" onClick={(): void => undefined} />
                <CTA label="Copy" onClick={(): void => undefined} />
                <CTA label="Paste" onClick={(): void => undefined} />
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup label="History">
                <CTA label="Undo" onClick={(): void => undefined} />
                <CTA label="Redo" onClick={(): void => undefined} />
            </ToolbarGroup>
        </Toolbar>
    ),
};

export const Vertical: Story = {
    args: { orientation: EToolbarOrientation.Vertical },
    render: (args: ToolbarProps): ReactElement => (
        <Toolbar {...args}>
            <CTA label="Deploy" onClick={(): void => undefined} />
            <CTA label="Recall" onClick={(): void => undefined} />
            <ToolbarSeparator />
            <CTA label="Abort" onClick={(): void => undefined} />
        </Toolbar>
    ),
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
    render: (args: ToolbarProps): ReactElement => (
        <Toolbar {...args}>
            <CTA label="Scan" onClick={(): void => undefined} />
            <CTA label="Mark" onClick={(): void => undefined} />
        </Toolbar>
    ),
};
