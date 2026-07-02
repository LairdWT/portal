import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { Cooldown } from './Cooldown';
import { type CooldownProps } from './Cooldown.types';

// A plain ability-key tile for the wrapped-children slot.
const TILE_STYLE: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    inlineSize: 'var(--portal-space-8)',
    blockSize: 'var(--portal-space-8)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    background: 'var(--portal-color-surface-0)',
    color: 'var(--portal-color-text-0)',
    fontFamily: 'var(--portal-font-mono)',
    fontSize: 'var(--portal-size-text-lg)',
};

// Interactive recast demo: casting disables the key and re-keys the Cooldown
// (the documented re-trigger contract), and completion re-enables it.
function RecastHarness(): ReactElement {
    const [castCount, setCastCount]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const [ready, setReady]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    return (
        <Cooldown
            key={String(castCount)}
            label="Barrage cooldown"
            durationMs={5000}
            remainingMs={castCount === 0 ? 0 : 5000}
            onComplete={(): void => {
                setReady(true);
            }}
        >
            <button
                type="button"
                style={{ ...TILE_STYLE, cursor: 'pointer' }}
                disabled={!ready}
                onClick={(): void => {
                    setReady(false);
                    setCastCount((prev: number): number => prev + 1);
                }}
            >
                R
            </button>
        </Cooldown>
    );
}

const meta: Meta<typeof Cooldown> = {
    title: 'UI/Cooldown',
    component: Cooldown,
    args: {
        label: 'Blink cooldown',
        durationMs: 8000,
        remainingMs: 8000,
    },
    render: (args: CooldownProps): ReactElement => (
        <Cooldown {...args}>
            <div style={TILE_STYLE}>Q</div>
        </Cooldown>
    ),
};

export default meta;

type Story = StoryObj<typeof Cooldown>;

export const Default: Story = {};

export const MidCooldown: Story = {
    args: { remainingMs: 2500 },
};

export const Ready: Story = {
    args: { remainingMs: 0 },
};

export const Toned: Story = {
    args: {
        label: 'Overdrive cooldown',
        remainingMs: 6000,
        tone: 'var(--portal-color-success)',
    },
};

export const Recast: Story = {
    render: (): ReactElement => <RecastHarness />,
};
