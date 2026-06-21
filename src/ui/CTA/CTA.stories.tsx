import { type Meta, type StoryObj } from '@storybook/react-vite';

import { EEnabledState } from '../../state/state';
import { CTA } from './CTA';
import { ECtaSize, ECtaVariant } from './CTA.types';

const meta: Meta<typeof CTA> = {
    title: 'UI/CTA',
    component: CTA,
    args: { children: 'Confirm' },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: { variant: ECtaVariant.Primary },
};

export const Secondary: Story = {
    args: { variant: ECtaVariant.Secondary },
};

export const Ghost: Story = {
    args: { variant: ECtaVariant.Ghost },
};

export const Danger: Story = {
    args: { variant: ECtaVariant.Danger, children: 'Delete' },
};

export const Small: Story = {
    args: { size: ECtaSize.Sm },
};

export const Medium: Story = {
    args: { size: ECtaSize.Md },
};

export const Large: Story = {
    args: { size: ECtaSize.Lg },
};

// A consumer-supplied opaque tone color drives the derived accent/border ramp.
export const Toned: Story = {
    args: { tone: 'oklch(0.62 0.21 25)', children: 'Engage' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};
