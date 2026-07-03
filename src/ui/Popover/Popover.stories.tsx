import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import demoStyles from '../../examples/storySupport.module.css';
import { Popover } from './Popover';
import { EPopoverPlacement, EPopoverRole } from './Popover.types';

// A single (non-union) story args shape. PopoverProps is a role-discriminated
// XOR union (the dialog role requires an AccessibleName), which collapses
// Storybook's arg inference to `never`; the stories exercise the dialog role
// with a `label`, so a flat args type keeps the meta and story typing sound.
type PopoverStoryArgs = Readonly<{
    open?: boolean;
    label?: string;
    placement?: EPopoverPlacement;
    tone?: string;
    trapFocus?: boolean;
}>;

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
function PopoverDemo(args: PopoverStoryArgs): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(args.open ?? false);
    // The stories exercise the dialog role exclusively, which requires an
    // accessible name; resolve a concrete label string (defaulting) so the
    // dialog branch of the PopoverProps union is satisfied.
    const label: string =
        typeof args.label === 'string' ? args.label : 'Example popover';
    return (
        <Popover
            open={open}
            onClose={(): void => {
                setOpen(false);
            }}
            label={label}
            role={EPopoverRole.Dialog}
            {...(args.placement !== undefined ? { placement: args.placement } : {})}
            {...(args.trapFocus !== undefined ? { trapFocus: args.trapFocus } : {})}
            {...(args.tone !== undefined ? { tone: args.tone } : {})}
            trigger={
                <button
                    type="button"
                    className={demoStyles.trigger}
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
                    className={demoStyles.trigger}
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

const meta: Meta<PopoverStoryArgs> = {
    title: 'UI/Popover',
    // The controlled wrapper is the story component: Popover owns required
    // children/open the story supplies internally, so the flat story args map to
    // the wrapper, not to Popover directly.
    component: PopoverDemo,
    args: {
        open: false,
        label: 'Example popover',
        placement: EPopoverPlacement.Bottom,
    },
    render: (args: PopoverStoryArgs): ReactElement => <PopoverDemo {...args} />,
};

export default meta;

type Story = StoryObj<PopoverStoryArgs>;

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
            <PopoverDemo open={false} label="First" />
            <PopoverDemo
                open={false}
                label="Second"
                placement={EPopoverPlacement.Top}
            />
            <PopoverDemo
                open={false}
                label="Third"
                placement={EPopoverPlacement.Right}
            />
        </div>
    ),
};
