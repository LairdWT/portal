import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { Accordion } from './Accordion';
import {
    type AccordionHeadingLevel,
    type AccordionItem,
    EAccordionMode,
} from './Accordion.types';

// A single (non-union) story args shape. The component props are a discriminated
// union on `mode`, which collapses Storybook's arg inference; a flat args type
// keeps the meta and story typing sound while a mode-aware controlled wrapper
// feeds valid single/multiple Accordion props. `initialExpanded` seeds the
// controlled open state (single uses the first id; multiple uses the whole set).
type AccordionStoryArgs = Readonly<{
    items: readonly AccordionItem[];
    mode: EAccordionMode;
    initialExpanded: readonly string[];
    headingLevel?: AccordionHeadingLevel;
    collapsible?: boolean;
    enabled?: EEnabledState;
    status?: EUiStatus;
    tone?: string;
}>;

const ITEMS: readonly AccordionItem[] = [
    {
        id: 'overview',
        title: 'Overview',
        content: 'Mission summary, current phase, and the active objective.',
    },
    {
        id: 'telemetry',
        title: 'Telemetry',
        content: 'Live readouts for power, thermal load, and link quality.',
    },
    {
        id: 'diagnostics',
        title: 'Diagnostics',
        content: 'Fault history and the last self-test result for each subsystem.',
    },
];

const INSPECTOR_ITEMS: readonly AccordionItem[] = [
    { id: 'transform', title: 'Transform', content: 'Position, rotation, scale.' },
    {
        id: 'material',
        title: 'Material',
        content: 'Base color, metalness, roughness.',
    },
    {
        id: 'physics',
        title: 'Physics',
        content: 'Mass, drag, and collision response.',
    },
    {
        id: 'audio',
        title: 'Audio',
        content: 'Emitter, attenuation, and bus routing.',
    },
    { id: 'tags', title: 'Tags', content: 'Gameplay tags and editor-only labels.' },
];

// Single-open controlled wrapper: owns the open id and feeds it back, the pattern
// a consumer wiring the accordion to app state uses.
function SingleControlled(args: AccordionStoryArgs): ReactElement {
    const [expandedId, setExpandedId]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(args.initialExpanded[0] ?? null);
    return (
        <Accordion
            mode={EAccordionMode.Single}
            items={args.items}
            expandedId={expandedId}
            onExpandedChange={setExpandedId}
            {...(args.headingLevel !== undefined
                ? { headingLevel: args.headingLevel }
                : {})}
            {...(args.collapsible !== undefined
                ? { collapsible: args.collapsible }
                : {})}
            {...(args.enabled !== undefined ? { enabled: args.enabled } : {})}
            {...(args.status !== undefined ? { status: args.status } : {})}
            {...(args.tone !== undefined ? { tone: args.tone } : {})}
        />
    );
}

// Many-open controlled wrapper: owns the open id set.
function MultipleControlled(args: AccordionStoryArgs): ReactElement {
    const [expandedIds, setExpandedIds]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(new Set<string>(args.initialExpanded));
    return (
        <Accordion
            mode={EAccordionMode.Multiple}
            items={args.items}
            expandedIds={expandedIds}
            onExpandedChange={setExpandedIds}
            {...(args.headingLevel !== undefined
                ? { headingLevel: args.headingLevel }
                : {})}
            {...(args.enabled !== undefined ? { enabled: args.enabled } : {})}
            {...(args.status !== undefined ? { status: args.status } : {})}
            {...(args.tone !== undefined ? { tone: args.tone } : {})}
        />
    );
}

function ControlledAccordion(args: AccordionStoryArgs): ReactElement {
    if (args.mode === EAccordionMode.Single) {
        return <SingleControlled {...args} />;
    }
    return <MultipleControlled {...args} />;
}

// `component` is intentionally omitted: the flat AccordionStoryArgs (which the
// mode-aware wrapper consumes) is not assignable to the component's discriminated
// props union, and Storybook's `component` field is typed against the args. The
// render function supplies the real Accordion, so the addon-a11y axe gate still
// runs over the live component for every story.
const meta: Meta<AccordionStoryArgs> = {
    title: 'UI/Accordion',
    args: {
        items: ITEMS,
        mode: EAccordionMode.Single,
        initialExpanded: ['overview'],
    },
    render: (args: AccordionStoryArgs): ReactElement => (
        <ControlledAccordion {...args} />
    ),
};

export default meta;

type Story = StoryObj<AccordionStoryArgs>;

// Single mode: one section open, the rest collapsed (inert) - the axe gate sees
// both an expanded region and inert collapsed regions.
export const Default: Story = {};

// Many-open: two sections expanded at once.
export const Multiple: Story = {
    args: {
        mode: EAccordionMode.Multiple,
        initialExpanded: ['overview', 'diagnostics'],
    },
};

// A consumer-supplied opaque tone color drives the marker, the expanded ring, and
// the glow; AA-critical text stays on the base text token.
export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)' },
};

// Single mode with collapsing disabled: one section is always open and clicking
// the open header is a no-op.
export const NonCollapsibleSingle: Story = {
    args: { collapsible: false },
};

// The universal danger status routes the danger ramp through the tone scope.
export const StatusDanger: Story = {
    args: { status: EUiStatus.Danger },
};

// Every header is natively disabled.
export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

// A taller inspector-style column verifying the HUD family read end to end, with
// expanded and collapsed sections side by side.
export const InspectorColumn: Story = {
    args: {
        items: INSPECTOR_ITEMS,
        mode: EAccordionMode.Multiple,
        initialExpanded: ['transform', 'material'],
    },
};
