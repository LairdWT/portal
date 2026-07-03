import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useRef,
    useState,
} from 'react';

import { CTA } from '../CTA/CTA';
import { EUiStatus } from '../tone';
import { FloatingText } from './FloatingText';
import { type FloatingTextEvent } from './FloatingText.types';

const ARENA_STYLE: CSSProperties = {
    position: 'relative',
    inlineSize: 'min(24rem, 90vw)',
    blockSize: '16rem',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    borderRadius: 'var(--portal-bevel-2)',
    backgroundColor: 'var(--portal-color-bg-0)',
};

const STACK_STYLE: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--portal-space-4)',
    alignItems: 'flex-start',
};

const HITS: readonly Readonly<{
    text: string;
    status?: EUiStatus;
    emphasis?: boolean;
}>[] = [
    { text: '86' },
    { text: '124', status: EUiStatus.Danger },
    { text: 'CRIT 342', status: EUiStatus.Danger, emphasis: true },
    { text: '+45', status: EUiStatus.Success },
];

// Combat harness: each press spawns the next hit in the cycle; expired
// events prune themselves from the controlled list.
function CombatArena(): ReactElement {
    const [events, setEvents]: [
        readonly FloatingTextEvent[],
        Dispatch<SetStateAction<readonly FloatingTextEvent[]>>,
    ] = useState<readonly FloatingTextEvent[]>([]);
    const counterRef: { current: number } = useRef<number>(0);

    function spawn(): void {
        const hit: Readonly<{
            text: string;
            status?: EUiStatus;
            emphasis?: boolean;
        }> = HITS[counterRef.current % HITS.length] ?? { text: '1' };
        counterRef.current += 1;
        const id: string = `hit-${String(counterRef.current)}`;
        setEvents(
            (prev: readonly FloatingTextEvent[]): readonly FloatingTextEvent[] => [
                ...prev,
                {
                    id,
                    text: hit.text,
                    ...(hit.status !== undefined ? { status: hit.status } : {}),
                    ...(hit.emphasis !== undefined
                        ? { emphasis: hit.emphasis }
                        : {}),
                },
            ],
        );
    }

    return (
        <div style={STACK_STYLE}>
            <div style={ARENA_STYLE}>
                <FloatingText
                    events={events}
                    onExpire={(id: string): void => {
                        setEvents(
                            (
                                prev: readonly FloatingTextEvent[],
                            ): readonly FloatingTextEvent[] =>
                                prev.filter(
                                    (event: FloatingTextEvent): boolean =>
                                        event.id !== id,
                                ),
                        );
                    }}
                />
            </div>
            <CTA label="Strike" onClick={spawn} />
        </div>
    );
}

type FloatingTextStoryArgs = Readonly<{ label: string }>;

const meta: Meta<FloatingTextStoryArgs> = {
    title: 'UI/FloatingText',
    args: { label: 'FloatingText' },
};

export default meta;

type Story = StoryObj<FloatingTextStoryArgs>;

export const CombatText: Story = {
    render: (): ReactElement => <CombatArena />,
};

export const Static: Story = {
    render: (): ReactElement => (
        <div style={ARENA_STYLE}>
            <FloatingText
                events={[
                    { id: 'a', text: '128' },
                    {
                        id: 'b',
                        text: 'CRIT 342',
                        status: EUiStatus.Danger,
                        emphasis: true,
                    },
                    { id: 'c', text: '+45', status: EUiStatus.Success },
                ]}
            />
        </div>
    ),
};
