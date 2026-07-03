import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { CTA } from '../CTA/CTA';
import { Reticle } from './Reticle';
import { EReticleVariant } from './Reticle.types';

const ROW_STYLE: CSSProperties = {
    display: 'flex',
    gap: 'var(--portal-space-6)',
    alignItems: 'center',
    padding: 'var(--portal-space-4)',
};

const STACK_STYLE: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--portal-space-4)',
    alignItems: 'flex-start',
};

// Firing-range harness: each shot bumps the hit token (one flash per shot)
// and kicks the spread, which eases back through the transform transition.
function FiringRange(): ReactElement {
    const [hits, setHits]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const [spread, setSpread]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    return (
        <div style={STACK_STYLE}>
            <div style={ROW_STYLE}>
                <Reticle
                    variant={EReticleVariant.Brackets}
                    spreadPx={spread}
                    hitToken={hits}
                />
            </div>
            <CTA
                label="Fire"
                onClick={(): void => {
                    setHits((prev: number): number => prev + 1);
                    setSpread((prev: number): number =>
                        prev >= 12 ? 4 : prev + 4,
                    );
                }}
            />
        </div>
    );
}

type ReticleStoryArgs = Readonly<{ label: string }>;

const meta: Meta<ReticleStoryArgs> = {
    title: 'UI/Reticle',
    args: { label: 'Reticle' },
};

export default meta;

type Story = StoryObj<ReticleStoryArgs>;

export const Variants: Story = {
    render: (): ReactElement => (
        <div style={ROW_STYLE}>
            <Reticle variant={EReticleVariant.Cross} />
            <Reticle variant={EReticleVariant.Dot} />
            <Reticle variant={EReticleVariant.Circle} />
            <Reticle variant={EReticleVariant.Brackets} />
        </div>
    ),
};

export const Spread: Story = {
    render: (): ReactElement => (
        <div style={ROW_STYLE}>
            <Reticle variant={EReticleVariant.Cross} spreadPx={0} />
            <Reticle variant={EReticleVariant.Cross} spreadPx={4} />
            <Reticle variant={EReticleVariant.Cross} spreadPx={8} />
        </div>
    ),
};

export const HitFlash: Story = {
    render: (): ReactElement => <FiringRange />,
};

export const Toned: Story = {
    render: (): ReactElement => (
        <div style={ROW_STYLE}>
            <Reticle
                variant={EReticleVariant.Circle}
                tone="var(--portal-color-danger)"
            />
            <Reticle
                variant={EReticleVariant.Brackets}
                tone="var(--portal-color-success)"
            />
        </div>
    ),
};
