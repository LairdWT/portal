import type { Meta, StoryObj } from '@storybook/react-vite';

import { UnityBindingExample } from './UnityBindingExample';

const meta: Meta<typeof UnityBindingExample> = {
    title: 'Patterns/Unity Binding',
    component: UnityBindingExample,
    // Example wiring, not a public component; opt out of the auto Docs page.
    tags: ['!autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

// Press the control: the example surfaces press, held, and released phases. Each
// press, held, and release emits a typed signal stamped by the injected clock,
// narrowed to the wire payload Unity would receive, while the registry resolves
// the input id to its action.
export const Default: Story = {};
