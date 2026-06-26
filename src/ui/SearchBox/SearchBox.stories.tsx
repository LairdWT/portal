import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { SearchBox } from './SearchBox';
import { type SearchBoxProps } from './SearchBox.types';

// A controlled wrapper so the stories drive the query value locally; portal keeps
// the SearchBox controlled and the story owns the state.
function ControlledSearchBox(props: SearchBoxProps): ReturnType<typeof SearchBox> {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.value);
    return <SearchBox {...props} value={value} onChange={setValue} />;
}

const meta: Meta<typeof SearchBox> = {
    title: 'UI/SearchBox',
    component: SearchBox,
    render: (args: SearchBoxProps): ReturnType<typeof ControlledSearchBox> => (
        <ControlledSearchBox {...args} />
    ),
    args: { label: 'Search cards', value: '', placeholder: 'Search deck' },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Seeded with a query so the clear button is visible from the first render.
export const Filled: Story = {
    args: { value: 'dragon' },
};

// A consumer-supplied opaque tone color drives the focus ring, border accent, and
// the leading search affordance.
export const Toned: Story = {
    args: { value: 'phoenix', tone: 'oklch(0.62 0.21 25)' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled, value: 'Locked query' },
};

// A column of search boxes demonstrating empty, filled, and toned together.
export const Composition: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ControlledSearchBox
                label="Search cards"
                value=""
                placeholder="Search deck"
            />
            <ControlledSearchBox label="Search players" value="ada" />
            <ControlledSearchBox
                label="Search factions"
                value="crimson"
                tone="oklch(0.62 0.21 25)"
            />
        </div>
    ),
};
