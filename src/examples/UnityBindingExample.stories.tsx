import type { Meta, StoryObj } from '@storybook/react-vite';

import { UnityBindingExample } from './UnityBindingExample';

const meta: Meta<typeof UnityBindingExample> = {
    title: 'Patterns/Unity Binding',
    component: UnityBindingExample,
};

export default meta;

type Story = StoryObj<typeof meta>;

// Press the control: each press and release emits a typed signal stamped by the
// injected clock, narrowed to the wire payload Unity would receive, while the
// registry resolves the input id to its action.
export const Default: Story = {};
