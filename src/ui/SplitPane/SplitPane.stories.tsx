import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type ReactNode,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { SplitPane } from './SplitPane';
import { ESplitOrientation } from './SplitPane.types';

// A single (non-union) story args shape. SplitPane's own props mix the
// AccessibleName XOR union, which collapses Storybook's arg inference to `never`;
// the stories only exercise the `label` form, so a flat args type keeps the meta
// and story typing sound while still feeding valid SplitPane props.
type SplitPaneStoryArgs = Readonly<{
    orientation?: ESplitOrientation;
    fraction: number;
    // Present so the flat args type stays structurally assignable to the
    // component's required onFractionChange; the controlled wrapper overrides it.
    onFractionChange: (fraction: number) => void;
    label: string;
    minFraction?: number;
    maxFraction?: number;
    minPrimarySize?: string;
    minSecondarySize?: string;
    keyboardStep?: number;
    primary: ReactNode;
    secondary: ReactNode;
    enabled?: EEnabledState;
    status?: EUiStatus;
    tone?: string;
}>;

// A bounded container so the split is visible (the frame fills its parent).
const CONTAINER_STYLE: CSSProperties = {
    inlineSize: '40rem',
    blockSize: '20rem',
};

const SAMPLE_PRIMARY: ReactNode = (
    <div>
        <h3>Inspector</h3>
        <p>The primary pane holds caller-owned content and scrolls on its own.</p>
    </div>
);

const SAMPLE_SECONDARY: ReactNode = (
    <div>
        <h3>Detail</h3>
        <p>The secondary pane is an independent scroll region.</p>
    </div>
);

// SplitPane is controlled, so the story owns the fraction and feeds it back
// through `fraction`, the pattern a consumer wiring it to app state uses.
function ControlledSplitPane(args: SplitPaneStoryArgs): ReactElement {
    const [fraction, setFraction]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(args.fraction);
    return (
        <div style={CONTAINER_STYLE}>
            <SplitPane
                {...args}
                fraction={fraction}
                onFractionChange={setFraction}
            />
        </div>
    );
}

const meta: Meta<SplitPaneStoryArgs> = {
    title: 'UI/SplitPane',
    component: SplitPane,
    args: {
        fraction: 0.5,
        label: 'Resize panels',
        primary: SAMPLE_PRIMARY,
        secondary: SAMPLE_SECONDARY,
    },
    render: (args: SplitPaneStoryArgs): ReactElement => (
        <ControlledSplitPane {...args} />
    ),
};

export default meta;

type Story = StoryObj<SplitPaneStoryArgs>;

export const Horizontal: Story = {};

export const Vertical: Story = {
    args: { orientation: ESplitOrientation.Vertical },
};

export const MasterDetail: Story = {
    args: {
        label: 'Resize the item list',
        primary: (
            <nav aria-label="Items">
                <ul>
                    <li>Alpha</li>
                    <li>Bravo</li>
                    <li>Charlie</li>
                    <li>Delta</li>
                </ul>
            </nav>
        ),
        secondary: (
            <div>
                <h3>Bravo</h3>
                <p>The detail region for the selected item.</p>
            </div>
        ),
    },
};

export const Bounded: Story = {
    args: {
        minPrimarySize: 'var(--portal-space-8)',
        minSecondarySize: 'var(--portal-space-8)',
        fraction: 0.3,
    },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)' },
};

export const StatusDanger: Story = {
    args: { status: EUiStatus.Danger },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

// A nested split inside the primary pane verifies independent fractions and
// separators (Helicon's nesting capability).
function NestedSplit(): ReactElement {
    const [outer, setOuter]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0.4);
    const [inner, setInner]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0.5);
    return (
        <div style={CONTAINER_STYLE}>
            <SplitPane
                label="Resize outer split"
                fraction={outer}
                onFractionChange={setOuter}
                primary={SAMPLE_PRIMARY}
                secondary={
                    <SplitPane
                        label="Resize inner split"
                        orientation={ESplitOrientation.Vertical}
                        fraction={inner}
                        onFractionChange={setInner}
                        primary={SAMPLE_SECONDARY}
                        secondary={SAMPLE_PRIMARY}
                    />
                }
            />
        </div>
    );
}

export const Nested: Story = {
    render: (): ReactElement => <NestedSplit />,
};
