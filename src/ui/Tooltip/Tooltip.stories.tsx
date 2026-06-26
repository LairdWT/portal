import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type ReactElement,
    type RefObject,
    useEffect,
    useRef,
} from 'react';

import { EPopoverPlacement } from '../Popover/Popover.types';
import { Tooltip } from './Tooltip';
import { type TooltipProps } from './Tooltip.types';

const TRIGGER_STYLE: CSSProperties = {
    minBlockSize: 'var(--portal-touch-target-min)',
    paddingInline: 'var(--portal-space-4)',
    borderRadius: 'var(--portal-radius-md)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    background: 'var(--portal-color-surface-0)',
    color: 'var(--portal-color-text-0)',
    cursor: 'pointer',
};

// Focuses its trigger on mount so the bubble is shown without a pointer, letting
// axe evaluate the rendered tooltip panel in the storybook browser project.
function ForcedOpenTooltip(args: TooltipProps): ReactElement {
    const triggerRef: RefObject<HTMLButtonElement | null> =
        useRef<HTMLButtonElement | null>(null);
    useEffect((): void => {
        triggerRef.current?.focus();
    }, []);
    return (
        <Tooltip {...args}>
            <button ref={triggerRef} type="button" style={TRIGGER_STYLE}>
                Focused trigger
            </button>
        </Tooltip>
    );
}

const meta: Meta<typeof Tooltip> = {
    title: 'UI/Tooltip',
    component: Tooltip,
    args: {
        content: 'Re-run the query against the database.',
        placement: EPopoverPlacement.Top,
    },
    render: (args: TooltipProps): ReactElement => (
        <Tooltip {...args}>
            <button type="button" style={TRIGGER_STYLE}>
                Hover or focus me
            </button>
        </Tooltip>
    ),
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Titled: Story = {
    args: {
        title: 'Database',
        content: 'Re-runs the query against the live connection.',
    },
};

// Shown on mount so the panel and its a11y are exercised by the axe run.
export const Open: Story = {
    render: (args: TooltipProps): ReactElement => <ForcedOpenTooltip {...args} />,
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 145)' },
};

export const Placements: Story = {
    render: (args: TooltipProps): ReactElement => (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--portal-space-6)',
            }}
        >
            <Tooltip
                {...args}
                content="Opens above"
                placement={EPopoverPlacement.Top}
            >
                <button type="button" style={TRIGGER_STYLE}>
                    Top
                </button>
            </Tooltip>
            <Tooltip
                {...args}
                content="Opens below"
                placement={EPopoverPlacement.Bottom}
            >
                <button type="button" style={TRIGGER_STYLE}>
                    Bottom
                </button>
            </Tooltip>
            <Tooltip
                {...args}
                content="Opens left"
                placement={EPopoverPlacement.Left}
            >
                <button type="button" style={TRIGGER_STYLE}>
                    Left
                </button>
            </Tooltip>
            <Tooltip
                {...args}
                content="Opens right"
                placement={EPopoverPlacement.Right}
            >
                <button type="button" style={TRIGGER_STYLE}>
                    Right
                </button>
            </Tooltip>
        </div>
    ),
};

export const Composition: Story = {
    render: (args: TooltipProps): ReactElement => (
        <div style={{ display: 'flex', gap: 'var(--portal-space-4)' }}>
            <Tooltip {...args} content="First action">
                <button type="button" style={TRIGGER_STYLE}>
                    One
                </button>
            </Tooltip>
            <Tooltip {...args} content="Second action">
                <button type="button" style={TRIGGER_STYLE}>
                    Two
                </button>
            </Tooltip>
            <Tooltip {...args} content="Third action">
                <button type="button" style={TRIGGER_STYLE}>
                    Three
                </button>
            </Tooltip>
        </div>
    ),
};
