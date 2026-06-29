import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Tabs } from './Tabs';
import { type TabItem } from './Tabs.types';

// A flat (non-union) story args shape. TabsProps mixes the AccessibleName XOR
// union, which collapses Storybook's arg inference to `never`; the stories only
// ever exercise the `label` form, so a flat args type keeps the meta and story
// typing sound while still feeding valid Tabs props.
type TabsStoryArgs = Readonly<{
    items: readonly TabItem[];
    value: string;
    label: string;
    enabled?: EEnabledState;
    tone?: string;
}>;

const ITEMS: readonly TabItem[] = [
    { id: 'hand', label: 'Hand' },
    { id: 'deck', label: 'Deck' },
    { id: 'discard', label: 'Discard' },
];

const MANY_ITEMS: readonly TabItem[] = [
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
function ControlledTabs(args: TabsStoryArgs): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(args.value);
    return <Tabs {...args} value={value} onChange={setValue} />;
}

const meta: Meta<TabsStoryArgs> = {
    title: 'UI/Tabs',
    component: Tabs,
    args: {
        items: ITEMS,
        value: 'hand',
        label: 'Card zones',
    },
    render: (args: TabsStoryArgs): ReactElement => <ControlledTabs {...args} />,
};

export default meta;

type Story = StoryObj<TabsStoryArgs>;

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
