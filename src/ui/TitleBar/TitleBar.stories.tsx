import { type Meta, type StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

import { Badge } from '../Badge/Badge';
import { EBadgeKind } from '../Badge/Badge.types';
import { Breadcrumb } from '../Breadcrumb/Breadcrumb';
import { CTA } from '../CTA/CTA';
import { ECtaSize, ECtaVariant } from '../CTA/CTA.types';
import { TitleBar } from './TitleBar';
import { ETitleBarLandmark } from './TitleBar.types';

const meta: Meta<typeof TitleBar> = {
    title: 'UI/TitleBar',
    component: TitleBar,
    parameters: { layout: 'fullscreen' },
    args: {
        title: 'SAAS RADAR',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

// A no-op for slot callbacks: the stories exercise the masthead layout only, not
// the behavior of slotted controls (each owns its own contract elsewhere).
function noop(): void {
    return undefined;
}

// A reusable logo glyph for the leading slot. Decorative: the title supplies the
// accessible name, so the glyph is aria-hidden and never duplicates the name.
function LogoGlyph(): ReactElement {
    return (
        <span aria-hidden="true" style={{ fontFamily: 'var(--portal-font-mono)' }}>
            [#]
        </span>
    );
}

// Zero-config: title only (Helicon title_strip("FOO").draw(ui, |_| {})).
export const Default: Story = {};

// Title + tagline + the default '::' separator (Helicon tagline example).
export const WithTagline: Story = {
    args: {
        tagline: 'TACTICAL OPPORTUNITY DISPLAY',
    },
};

// A custom separator glyph between the title and tagline.
export const CustomSeparator: Story = {
    args: {
        tagline: 'TACTICAL OPPORTUNITY DISPLAY',
        separator: '//',
    },
};

// Separator suppressed with '' (Helicon parity): the tagline follows directly.
export const SuppressedSeparator: Story = {
    args: {
        tagline: 'TACTICAL OPPORTUNITY DISPLAY',
        separator: '',
    },
};

// A leading logo plus real Portal controls in the trailing slot - a CTA and a
// status Badge - demonstrating the 3rem touch target on slotted controls.
export const LeadingAndTrailing: Story = {
    args: {
        leading: <LogoGlyph />,
        trailing: (
            <>
                <Badge kind={EBadgeKind.Status} label="Online" />
                <CTA
                    label="Refresh"
                    variant={ECtaVariant.Secondary}
                    size={ECtaSize.Md}
                    onClick={noop}
                />
            </>
        ),
    },
};

// A composed Breadcrumb trail in the optional second row.
export const WithBreadcrumb: Story = {
    args: {
        breadcrumb: (
            <Breadcrumb
                items={[
                    { id: 'home', label: 'Home', onNavigate: noop },
                    { id: 'fleet', label: 'Fleet', onNavigate: noop },
                    { id: 'detail', label: 'Detail' },
                ]}
            />
        ),
    },
};

// A consumer tone color drives the bottom readout edge and glow only; the
// tagline accent is a fixed AA-safe token, not tone-driven.
export const Toned: Story = {
    args: {
        tagline: 'TACTICAL OPPORTUNITY DISPLAY',
        tone: 'oklch(0.7 0.18 145)',
    },
};

// The danger status ramp routes through the tone scope (border/glow, not text).
export const StatusDanger: Story = {
    args: {
        tagline: 'SIGNAL LOST',
        status: 'danger',
    },
};

// The success status ramp routes through the tone scope.
export const StatusSuccess: Story = {
    args: {
        tagline: 'ALL SYSTEMS NOMINAL',
        status: 'success',
    },
};

// A non-masthead bar as a labelled Region landmark, nested under a page main so
// it does not claim or duplicate the page banner.
export const RegionLandmark: Story = {
    render: function RegionTitleBar(): ReactElement {
        return (
            <main>
                <TitleBar
                    title="DETAIL PANE"
                    headingLevel={2}
                    landmark={ETitleBarLandmark.Region}
                    tagline="SUB-VIEW"
                />
            </main>
        );
    },
};

// A full composition - leading logo, title, tagline, trailing controls, and a
// breadcrumb row - verifying the machined-HUD family read end to end.
export const Masthead: Story = {
    args: {
        title: 'SAAS RADAR',
        tagline: 'TACTICAL OPPORTUNITY DISPLAY',
        tone: 'oklch(0.72 0.16 230)',
        leading: <LogoGlyph />,
        trailing: (
            <>
                <Badge kind={EBadgeKind.Status} label="Live" />
                <CTA
                    label="Scan"
                    variant={ECtaVariant.Primary}
                    size={ECtaSize.Md}
                    onClick={noop}
                />
            </>
        ),
        breadcrumb: (
            <Breadcrumb
                items={[
                    { id: 'home', label: 'Home', onNavigate: noop },
                    { id: 'radar', label: 'Radar' },
                ]}
            />
        ),
    },
};
