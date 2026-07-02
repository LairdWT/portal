import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactElement } from 'react';

import { Carousel } from './Carousel';
import type { CarouselItem } from './Carousel.types';

// Gradient placards stand in for media so the demos carry no binary assets.
function placard(title: string, hue: number): ReactElement {
    const style: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        inlineSize: '100%',
        minBlockSize: '14rem',
        background: `linear-gradient(160deg, oklch(0.45 0.09 ${String(hue)}), var(--portal-color-surface-0))`,
        color: 'var(--portal-color-text-0)',
        fontFamily: 'var(--portal-font-sans)',
        fontSize: 'var(--portal-size-text-lg)',
        letterSpacing: 'var(--portal-letter-spacing-wide)',
    };
    return <div style={style}>{title}</div>;
}

const ITEMS: readonly CarouselItem[] = [
    { id: 'ridge', content: placard('Eastern ridge', 240), label: 'Eastern ridge' },
    { id: 'pass', content: placard('Convoy pass', 150), label: 'Convoy pass' },
    { id: 'basin', content: placard('Night basin', 300), label: 'Night basin' },
    { id: 'relay', content: placard('Relay station', 25), label: 'Relay station' },
];

const meta: Meta<typeof Carousel> = {
    title: 'UI/Carousel',
    component: Carousel,
    args: {
        label: 'Mission gallery',
        items: ITEMS,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoSlides: Story = {
    args: { items: ITEMS.slice(0, 2) },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
};
