import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useEffect,
    useState,
} from 'react';

import { Compass } from './Compass';

// An explicit width: the centered story canvas shrink-wraps its children,
// so a max-width alone would let the strip collapse to the readout.
const FRAME_STYLE: CSSProperties = { inlineSize: 'min(28rem, 90vw)' };

// Turning harness: the heading eases around the rose so the tape slide and
// the seam wrap are visible live.
function TurningCompass(): ReactElement {
    const [heading, setHeading]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(340);
    useEffect((): (() => void) => {
        const timer: number = window.setInterval((): void => {
            setHeading((prev: number): number => prev + 5);
        }, 600);
        return (): void => {
            window.clearInterval(timer);
        };
    }, []);
    return <Compass label="Bearing (turning)" heading={heading} />;
}

type CompassStoryArgs = Readonly<{ label: string }>;

const meta: Meta<CompassStoryArgs> = {
    title: 'UI/Compass',
    args: { label: 'Compass' },
};

export default meta;

type Story = StoryObj<CompassStoryArgs>;

export const Default: Story = {
    render: (): ReactElement => (
        <div style={FRAME_STYLE}>
            <Compass label="Bearing" heading={73} />
        </div>
    ),
};

export const Turning: Story = {
    render: (): ReactElement => (
        <div style={FRAME_STYLE}>
            <TurningCompass />
        </div>
    ),
};

export const WideSpan: Story = {
    render: (): ReactElement => (
        <div style={FRAME_STYLE}>
            <Compass
                label="Panorama"
                heading={200}
                span={180}
                tone="var(--portal-color-success)"
            />
        </div>
    ),
};
