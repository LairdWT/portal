import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';

import demoStyles from '../../examples/storySupport.module.css';
import { Field } from './Field';
import type { FieldControlProps } from './Field.types';

// A plain native input for the demos: Field is scaffolding for ANY control,
// so the story wires an unowned element rather than a Portal input that
// already carries its own label - but its chrome still speaks the design
// language (beveled, not square) via the story-support class.
function demoControl(control: FieldControlProps): ReactElement {
    return <input {...control} className={demoStyles.demoInput} />;
}

const meta: Meta<typeof Field> = {
    title: 'UI/Field',
    component: Field,
    args: {
        label: 'Callsign',
        children: demoControl,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { hint: 'Three to five letters, no digits.' },
};

export const WithError: Story = {
    args: {
        hint: 'Three to five letters, no digits.',
        error: 'That callsign is already taken.',
    },
};

export const Required: Story = {
    args: { required: true },
};

export const Toned: Story = {
    args: {
        hint: 'Tone drives the required marker and wrapped-control accents.',
        required: true,
        tone: 'oklch(0.7 0.15 240)',
    },
};
