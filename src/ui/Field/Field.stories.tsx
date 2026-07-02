import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactElement } from 'react';

import { Field } from './Field';
import type { FieldControlProps } from './Field.types';

// A plain native input for the demos: Field is scaffolding for ANY control,
// so the story wires an unowned element (token-styled inline) rather than a
// Portal input that already carries its own label.
const DEMO_INPUT_STYLE: CSSProperties = {
    minBlockSize: 'var(--portal-touch-target-min)',
    paddingInline: 'var(--portal-space-3)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    background: 'var(--portal-color-surface-0)',
    color: 'var(--portal-color-text-0)',
    font: 'inherit',
};

function demoControl(control: FieldControlProps): ReactElement {
    return <input {...control} style={DEMO_INPUT_STYLE} />;
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
