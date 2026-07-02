import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Checkbox } from '../Checkbox/Checkbox';
import { Wizard } from './Wizard';
import type { WizardProps, WizardStep } from './Wizard.types';

const STEPS: readonly WizardStep[] = [
    {
        id: 'plan',
        label: 'Plan',
        content: <p>Chart the convoy route through the eastern pass.</p>,
    },
    {
        id: 'load',
        label: 'Load',
        content: <p>Assign cargo and confirm the manifest weights.</p>,
    },
    {
        id: 'launch',
        label: 'Launch',
        content: <p>Final checks complete - launch when ready.</p>,
    },
];

// Controlled harness so every story walks the steps live.
function WizardDemo(props: WizardProps): ReactElement {
    const [currentId, setCurrentId]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.currentId);
    return (
        <div style={{ inlineSize: 'min(30rem, 90vw)' }}>
            <Wizard
                {...props}
                currentId={currentId}
                onStepChange={setCurrentId}
                onFinish={(): void => {
                    console.log('finish');
                }}
            />
        </div>
    );
}

// A gated variant: the forward key unlocks only once the checkbox is set.
function GatedWizardDemo(props: WizardProps): ReactElement {
    const [currentId, setCurrentId]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.currentId);
    const [confirmed, setConfirmed]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const steps: readonly WizardStep[] = [
        {
            id: 'confirm',
            label: 'Confirm',
            content: (
                <Checkbox
                    label="I have reviewed the manifest"
                    checked={confirmed}
                    onChange={setConfirmed}
                />
            ),
        },
        ...STEPS.slice(1),
    ];
    return (
        <div style={{ inlineSize: 'min(30rem, 90vw)' }}>
            <Wizard
                {...props}
                steps={steps}
                currentId={currentId}
                onStepChange={setCurrentId}
                canAdvance={currentId !== 'confirm' || confirmed}
            />
        </div>
    );
}

const meta: Meta<typeof Wizard> = {
    title: 'UI/Wizard',
    component: Wizard,
    render: (args: WizardProps): ReactElement => <WizardDemo {...args} />,
    args: {
        label: 'Convoy setup',
        steps: STEPS,
        currentId: 'plan',
        onStepChange: (): void => undefined,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MidFlow: Story = {
    args: { currentId: 'load' },
};

export const GatedAdvance: Story = {
    render: (args: WizardProps): ReactElement => <GatedWizardDemo {...args} />,
    args: { currentId: 'confirm' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
};
