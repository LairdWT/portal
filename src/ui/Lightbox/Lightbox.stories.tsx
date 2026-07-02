import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import type { CarouselItem } from '../Carousel/Carousel.types';
import { CTA } from '../CTA/CTA';
import { Lightbox } from './Lightbox';
import type { LightboxProps } from './Lightbox.types';

function placard(title: string, hue: number): ReactElement {
    const style: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        inlineSize: '100%',
        minBlockSize: '18rem',
        background: `linear-gradient(160deg, oklch(0.45 0.09 ${String(hue)}), var(--portal-color-surface-0))`,
        color: 'var(--portal-color-text-0)',
        fontFamily: 'var(--portal-font-sans)',
        fontSize: 'var(--portal-size-text-lg)',
    };
    return <div style={style}>{title}</div>;
}

const ITEMS: readonly CarouselItem[] = [
    { id: 'ridge', content: placard('Eastern ridge', 240), label: 'Eastern ridge' },
    { id: 'pass', content: placard('Convoy pass', 150), label: 'Convoy pass' },
    { id: 'basin', content: placard('Night basin', 300), label: 'Night basin' },
];

// Opened by default so the visual and axe gates see the dialog; the trigger
// reopens it after dismissal.
function LightboxDemo(props: LightboxProps): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    return (
        <>
            <CTA
                label="Open gallery"
                onClick={(): void => {
                    setOpen(true);
                }}
            />
            <Lightbox
                {...props}
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
            />
        </>
    );
}

const meta: Meta<typeof Lightbox> = {
    title: 'UI/Lightbox',
    component: Lightbox,
    render: (args: LightboxProps): ReactElement => <LightboxDemo {...args} />,
    args: {
        open: true,
        onClose: (): void => undefined,
        label: 'Mission gallery',
        items: ITEMS,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
};
