import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { VirtualKeyboard } from './VirtualKeyboard';
import { EKeyAction } from './VirtualKeyboard.types';

const READOUT_STYLE: CSSProperties = {
    minBlockSize: 'var(--portal-touch-target-min)',
    display: 'flex',
    alignItems: 'center',
    paddingInline: 'var(--portal-space-3)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    background: 'var(--portal-color-bg-0)',
    color: 'var(--portal-color-text-0)',
    fontFamily: 'var(--portal-font-mono)',
    whiteSpace: 'pre-wrap',
};

// Typing harness: the board writes into a visible buffer, Backspace deletes,
// Enter clears.
function TypingHarness(props: Readonly<{ enabled?: EEnabledState }>): ReactElement {
    const [buffer, setBuffer]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('');
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--portal-space-3)',
                maxInlineSize: '40rem',
            }}
        >
            <output style={READOUT_STYLE} aria-label="Typed text">
                {buffer}
            </output>
            <VirtualKeyboard
                label="On-screen keyboard"
                onKey={(text: string): void => {
                    setBuffer((prev: string): string => prev + text);
                }}
                onAction={(action: EKeyAction): void => {
                    if (action === EKeyAction.Backspace) {
                        setBuffer((prev: string): string => prev.slice(0, -1));
                        return;
                    }
                    setBuffer('');
                }}
                {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
            />
        </div>
    );
}

type VirtualKeyboardStoryArgs = Readonly<{ label: string }>;

const meta: Meta<VirtualKeyboardStoryArgs> = {
    title: 'Components/VirtualKeyboard',
    args: { label: 'VirtualKeyboard' },
};

export default meta;

type Story = StoryObj<VirtualKeyboardStoryArgs>;

export const Default: Story = {
    render: (): ReactElement => <TypingHarness />,
};

export const Disabled: Story = {
    render: (): ReactElement => <TypingHarness enabled={EEnabledState.Disabled} />,
};
