import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { DialogueBox } from './DialogueBox';
import { EDialogueVariant } from './DialogueBox.types';

const FRAME_STYLE: CSSProperties = { inlineSize: 'min(32rem, 90vw)' };

type Line = Readonly<{ speaker: string; text: string }>;

const SCRIPT: readonly Line[] = [
    {
        speaker: 'Vex',
        text: 'The relay is ours. Route the convoy through the eastern pass.',
    },
    {
        speaker: 'Odum',
        text: 'Eastern pass reads hot - two raider wings on the scope.',
    },
    {
        speaker: 'Vex',
        text: 'Then we thread the needle. Spool the drives and stay dark.',
    },
];

// Conversation harness: Continue steps through the script and loops.
function Conversation(): ReactElement {
    const [index, setIndex]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const line: Line = SCRIPT[index % SCRIPT.length] ?? {
        speaker: 'Vex',
        text: '...',
    };
    return (
        <div style={FRAME_STYLE}>
            <DialogueBox
                label="Dialogue"
                speaker={line.speaker}
                text={line.text}
                charactersPerSecond={40}
                onAdvance={(): void => {
                    setIndex((prev: number): number => prev + 1);
                }}
            />
        </div>
    );
}

type DialogueBoxStoryArgs = Readonly<{ label: string }>;

const meta: Meta<DialogueBoxStoryArgs> = {
    title: 'UI/DialogueBox',
    args: { label: 'DialogueBox' },
};

export default meta;

type Story = StoryObj<DialogueBoxStoryArgs>;

export const Typewriter: Story = {
    render: (): ReactElement => <Conversation />,
};

export const Static: Story = {
    render: (): ReactElement => (
        <div style={FRAME_STYLE}>
            <DialogueBox
                label="Dialogue"
                speaker="Odum"
                text="No typewriter here: the full line lands at once."
            />
        </div>
    ),
};

export const Subtitle: Story = {
    render: (): ReactElement => (
        <div style={FRAME_STYLE}>
            <DialogueBox
                label="Subtitles"
                text="[Reactor hum intensifies]"
                variant={EDialogueVariant.Subtitle}
            />
        </div>
    ),
};
