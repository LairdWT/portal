import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { Popover } from './Popover';
import {
    EPopoverPlacement,
    EPopoverRole,
    type PopoverProps,
} from './Popover.types';

const TRIGGER_STYLE: CSSProperties = {
    minBlockSize: 'var(--portal-touch-target-min)',
    paddingInline: 'var(--portal-space-4)',
    borderRadius: 'var(--portal-radius-md)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    background: 'var(--portal-color-surface-0)',
    color: 'var(--portal-color-text-0)',
    cursor: 'pointer',
};

const CONTENT_STYLE: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--portal-space-2)',
    maxInlineSize: '18rem',
};

// A controlled wrapper the stories share: the Popover is controlled, so the
// story owns `open` and feeds it back, the pattern a consumer wiring it to app
// state uses. The trigger is passed as a node (the trigger render path); the
// consumer owns its aria-expanded and onClick because it owns the open state.
function PopoverDemo(args: Partial<PopoverProps>): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(args.open ?? false);
    return (
        <Popover
            {...args}
            open={open}
            onClose={(): void => {
                setOpen(false);
            }}
            trigger={
                <button
                    type="button"
                    style={TRIGGER_STYLE}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    onClick={(): void => {
                        setOpen((previous: boolean): boolean => !previous);
                    }}
                >
                    Toggle panel
                </button>
            }
        >
            <div style={CONTENT_STYLE}>
                <strong>Floating panel</strong>
                <span>
                    Anchored to the trigger and kept in view by the hand-rolled
                    flip/shift positioning.
                </span>
                <button
                    type="button"
                    style={TRIGGER_STYLE}
                    onClick={(): void => {
                        setOpen(false);
                    }}
                >
                    Close
                </button>
            </div>
        </Popover>
    );
}

const meta: Meta<typeof Popover> = {
    title: 'UI/Popover',
    component: Popover,
    args: {
        open: false,
        label: 'Example popover',
        role: EPopoverRole.Dialog,
        placement: EPopoverPlacement.Bottom,
    },
    render: (args: PopoverProps): ReactElement => <PopoverDemo {...args} />,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Opens immediately so the floating panel (and its accessibility) is exercised.
export const Open: Story = {
    args: { open: true },
};

// A consumer-supplied opaque tone color drives the panel border and glow.
export const Toned: Story = {
    args: { open: true, tone: 'oklch(0.7 0.18 145)' },
};

// Modal mode: the panel traps Tab focus and restores it to the trigger on close.
export const Modal: Story = {
    args: { open: true, trapFocus: true },
};

// Several independent popovers side by side, each closed, to show composition.
export const Composition: Story = {
    render: (): ReactElement => (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--portal-space-4)',
            }}
        >
            <PopoverDemo open={false} label="First" role={EPopoverRole.Dialog} />
            <PopoverDemo
                open={false}
                label="Second"
                role={EPopoverRole.Dialog}
                placement={EPopoverPlacement.Top}
            />
            <PopoverDemo
                open={false}
                label="Third"
                role={EPopoverRole.Dialog}
                placement={EPopoverPlacement.Right}
            />
        </div>
    ),
};
