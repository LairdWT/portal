import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { Text } from './Text';
import { ETextRole } from './Text.types';

const meta: Meta<typeof Text> = {
    title: 'UI/Text',
    component: Text,
    args: {
        children: 'The quick brown fox jumps over the lazy dog',
    },
};

export default meta;

type Story = StoryObj<typeof Text>;

export const Default: Story = {};

export const Heading: Story = {
    args: {
        role: ETextRole.Heading,
        level: 2,
        children: 'Section heading',
    },
};

export const Mono: Story = {
    args: {
        role: ETextRole.Mono,
        children: 'const energy = 42;',
    },
};

export const Toned: Story = {
    args: {
        role: ETextRole.Accent,
        tone: 'oklch(0.7 0.15 240)',
        children: 'Accented callout',
    },
};

export const Polymorphic: Story = {
    args: {
        role: ETextRole.Body,
        as: 'div',
        children: 'Body styling rendered as a div via the as prop',
    },
};

export const AllRoles: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
            <Text role={ETextRole.Heading} level={2}>
                Heading role
            </Text>
            <Text role={ETextRole.Body}>Body role: the standard reading copy.</Text>
            <Text role={ETextRole.Section}>Section label</Text>
            <Text role={ETextRole.Secondary}>Secondary supporting text</Text>
            <Text role={ETextRole.Dim}>Dim de-emphasised text</Text>
            <Text role={ETextRole.Accent} tone="oklch(0.62 0.2 25)">
                Accent toned text
            </Text>
            <Text role={ETextRole.Mono}>monospace 0123456789</Text>
            <Text role={ETextRole.Styled}>Styled display text</Text>
        </div>
    ),
};
