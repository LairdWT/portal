import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import demoStyles from '../../examples/storySupport.module.css';
import { Cooldown } from './Cooldown';
import { type CooldownProps } from './Cooldown.types';

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
                className={demoStyles.chipFace}
                style={{ cursor: 'pointer' }}
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
            <div className={demoStyles.chipFace}>Q</div>
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
