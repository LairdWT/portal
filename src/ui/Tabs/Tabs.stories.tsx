import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Tabs } from './Tabs';
import { type TabsProps, type UiTabItem } from './Tabs.types';

const ITEMS: readonly UiTabItem[] = [
    { id: 'hand', label: 'Hand' },
    { id: 'deck', label: 'Deck' },
    { id: 'discard', label: 'Discard' },
];

const MANY_ITEMS: readonly UiTabItem[] = [
    { id: 'phase-draw', label: 'Draw' },
    { id: 'phase-main', label: 'Main' },
    { id: 'phase-combat', label: 'Combat' },
    { id: 'phase-second', label: 'Second' },
    { id: 'phase-end', label: 'End' },
    { id: 'phase-cleanup', label: 'Cleanup' },
];

// A controlled wrapper the stories share: Tabs is controlled, so the story owns
// the selected id and feeds it back through `value`, the pattern a consumer
// wiring Tabs to app state uses.
function ControlledTabs(args: TabsProps): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(args.value);
    return <Tabs {...args} value={value} onChange={setValue} />;
}

const meta: Meta<typeof Tabs> = {
    title: 'UI/Tabs',
    component: Tabs,
    args: {
        items: ITEMS,
        value: 'hand',
    },
    render: (args: TabsProps): ReactElement => <ControlledTabs {...args} />,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// A consumer-supplied opaque tone color drives the selected indicator and scrim.
export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const ManyTabs: Story = {
    args: { items: MANY_ITEMS, value: 'phase-main' },
};
