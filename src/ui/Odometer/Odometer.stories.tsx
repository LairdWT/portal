import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { CTA } from '../CTA/CTA';
import { Odometer } from './Odometer';

const STACK_STYLE: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--portal-space-4)',
    alignItems: 'flex-start',
};

const ROW_STYLE: CSSProperties = {
    display: 'flex',
    gap: 'var(--portal-space-3)',
};

// Counter harness: roll single ticks, bursts, and the digit-gaining
// 99 -> 100 carry.
function ScoreCounter(): ReactElement {
    const [score, setScore]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(94);
    return (
        <div style={STACK_STYLE}>
            <Odometer label="Score" value={score} minDigits={3} />
            <div style={ROW_STYLE}>
                <CTA
                    label="+1"
                    onClick={(): void => {
                        setScore((prev: number): number => prev + 1);
                    }}
                />
                <CTA
                    label="+25"
                    onClick={(): void => {
                        setScore((prev: number): number => prev + 25);
                    }}
                />
                <CTA
                    label="Reset"
                    onClick={(): void => {
                        setScore(0);
                    }}
                />
            </div>
        </div>
    );
}

type OdometerStoryArgs = Readonly<{ label: string }>;

const meta: Meta<OdometerStoryArgs> = {
    title: 'UI/Odometer',
    args: { label: 'Odometer' },
};

export default meta;

type Story = StoryObj<OdometerStoryArgs>;

export const Score: Story = {
    render: (): ReactElement => <ScoreCounter />,
};

export const Ammo: Story = {
    render: (): ReactElement => (
        <Odometer
            label="Ammo"
            value={42}
            minDigits={2}
            tone="var(--portal-color-warning)"
        />
    ),
};
