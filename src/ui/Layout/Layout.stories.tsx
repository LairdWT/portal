import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';

import demoStyles from '../../examples/storySupport.module.css';
import { Divider } from './Divider';
import { Grid } from './Grid';
import {
    EDividerOrientation,
    ELayoutGap,
    EStackAlign,
    EStackDirection,
    EStackJustify,
} from './Layout.types';
import { Stack } from './Stack';

// A visible block so the layout decisions read in the demos; the machined
// story-support swatch keeps the demo chrome on the design language.
function Swatch({ children }: Readonly<{ children: string }>): ReactElement {
    return <div className={demoStyles.swatch}>{children}</div>;
}

const meta: Meta<typeof Stack> = {
    title: 'UI/Layout',
    component: Stack,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const ColumnStack: Story = {
    render: (): ReactElement => (
        <Stack gap={ELayoutGap.Sm}>
            <Swatch>Alpha</Swatch>
            <Swatch>Bravo</Swatch>
            <Swatch>Charlie</Swatch>
        </Stack>
    ),
};

export const RowStack: Story = {
    render: (): ReactElement => (
        <Stack
            direction={EStackDirection.Row}
            gap={ELayoutGap.Lg}
            align={EStackAlign.Center}
            justify={EStackJustify.SpaceBetween}
        >
            <Swatch>Alpha</Swatch>
            <Swatch>Bravo</Swatch>
            <Swatch>Charlie</Swatch>
        </Stack>
    ),
};

export const FourColumnGrid: Story = {
    render: (): ReactElement => (
        <Grid columns={4} gap={ELayoutGap.Sm}>
            <Swatch>1</Swatch>
            <Swatch>2</Swatch>
            <Swatch>3</Swatch>
            <Swatch>4</Swatch>
            <Swatch>5</Swatch>
            <Swatch>6</Swatch>
        </Grid>
    ),
};

export const Dividers: Story = {
    render: (): ReactElement => (
        <Stack gap={ELayoutGap.Md}>
            <Swatch>Above</Swatch>
            <Divider />
            <Swatch>Between</Swatch>
            <Divider label="Telemetry" />
            <Stack direction={EStackDirection.Row} gap={ELayoutGap.Md}>
                <Swatch>Left</Swatch>
                <Divider orientation={EDividerOrientation.Vertical} />
                <Swatch>Right</Swatch>
            </Stack>
        </Stack>
    ),
};
