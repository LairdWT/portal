import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { Banner } from './Banner';
import { type BannerProps, EBannerKind } from './Banner.types';

// A small decorative icon slot. Portal ships no icon set; the icon prop accepts
// arbitrary ReactNode, so the stories pass an inline token-driven SVG mark.
function InfoMark(): ReactElement {
    return (
        <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="11" x2="12" y2="16" />
            <line x1="12" y1="8" x2="12" y2="8" />
        </svg>
    );
}

// A controlled wrapper for the dismissible story: it owns the visible state and
// hides the banner when the close button fires, the pattern a consumer wiring
// onDismiss to app state uses.
function DismissibleBanner(args: BannerProps): ReactElement {
    const [visible, setVisible]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    if (!visible) {
        return <span>Banner dismissed.</span>;
    }
    return (
        <Banner
            {...args}
            onDismiss={(): void => {
                setVisible(false);
            }}
        />
    );
}

const meta: Meta<typeof Banner> = {
    title: 'UI/Banner',
    component: Banner,
    args: {
        kind: EBannerKind.Info,
        children: 'Telemetry sync completed without errors.',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Success: Story = {
    args: {
        kind: EBannerKind.Success,
        children: 'Loadout saved to the cloud profile.',
    },
};

export const Warning: Story = {
    args: {
        kind: EBannerKind.Warning,
        children: 'Connection is degraded; some controls may lag.',
    },
};

export const Danger: Story = {
    args: {
        kind: EBannerKind.Danger,
        children: 'Hull integrity critical - retreat immediately.',
    },
};

// A consumer-supplied opaque tone color overrides the per-kind default seed and
// drives the rail, border, and glow.
export const Toned: Story = {
    args: {
        kind: EBannerKind.Info,
        children: 'Faction channel opened on a custom tone.',
        tone: 'oklch(0.7 0.15 280)',
    },
};

export const WithIcon: Story = {
    args: {
        kind: EBannerKind.Info,
        children: 'A new firmware revision is available.',
        icon: <InfoMark />,
    },
};

export const Dismissible: Story = {
    args: {
        kind: EBannerKind.Warning,
        children: 'Background sync paused. Dismiss to acknowledge.',
    },
    render: (args: BannerProps): ReactElement => <DismissibleBanner {...args} />,
};

export const BannerStack: Story = {
    render: (): ReactElement => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                inlineSize: 'min(32rem, 100%)',
            }}
        >
            <Banner kind={EBannerKind.Info} icon={<InfoMark />}>
                Sync scheduled for the next idle window.
            </Banner>
            <Banner kind={EBannerKind.Success}>Profile verified.</Banner>
            <Banner kind={EBannerKind.Warning}>Storage is nearly full.</Banner>
            <Banner kind={EBannerKind.Danger}>Connection lost.</Banner>
        </div>
    ),
};
