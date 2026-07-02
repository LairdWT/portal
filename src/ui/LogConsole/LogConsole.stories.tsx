import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useEffect,
    useState,
} from 'react';

import { LogConsole } from './LogConsole';
import { ELogSeverity, type LogEntry } from './LogConsole.types';

const SEVERITIES: readonly (ELogSeverity | undefined)[] = [
    undefined,
    ELogSeverity.Info,
    ELogSeverity.Debug,
    undefined,
    ELogSeverity.Warning,
    undefined,
    ELogSeverity.Error,
];

const MESSAGES: readonly string[] = [
    'telemetry link established',
    'nav solution converged',
    'cargo manifest synced',
    'coolant pressure nominal',
    'coolant pressure drifting high',
    'relay handshake complete',
    'thermal margin exceeded on cell 3',
];

function buildEntry(index: number): LogEntry {
    const severity: ELogSeverity | undefined =
        SEVERITIES[index % SEVERITIES.length];
    return {
        id: `entry-${String(index)}`,
        message: `${MESSAGES[index % MESSAGES.length] ?? 'tick'} [${String(index)}]`,
        timeLabel: `T+${String(index).padStart(4, '0')}`,
        ...(severity !== undefined ? { severity } : {}),
    };
}

function buildEntries(count: number): readonly LogEntry[] {
    return Array.from(
        { length: count },
        (_unused: unknown, index: number): LogEntry => buildEntry(index),
    );
}

// Streaming harness: an entry lands every 800ms, exercising follow-tail.
function LiveTailHarness(): ReactElement {
    const [entries, setEntries]: [
        readonly LogEntry[],
        Dispatch<SetStateAction<readonly LogEntry[]>>,
    ] = useState<readonly LogEntry[]>((): readonly LogEntry[] => buildEntries(40));
    useEffect((): (() => void) => {
        const timer: number = window.setInterval((): void => {
            setEntries((prev: readonly LogEntry[]): readonly LogEntry[] => [
                ...prev,
                buildEntry(prev.length),
            ]);
        }, 800);
        return (): void => {
            window.clearInterval(timer);
        };
    }, []);
    return <LogConsole label="Live telemetry" entries={entries} />;
}

type LogConsoleStoryArgs = Readonly<{ label: string }>;

const meta: Meta<LogConsoleStoryArgs> = {
    title: 'UI/LogConsole',
    args: { label: 'LogConsole' },
};

export default meta;

type Story = StoryObj<LogConsoleStoryArgs>;

export const Default: Story = {
    render: (): ReactElement => (
        <LogConsole label="Mission log" entries={buildEntries(200)} />
    ),
};

export const LiveTail: Story = {
    render: (): ReactElement => <LiveTailHarness />,
};

export const Toned: Story = {
    render: (): ReactElement => (
        <LogConsole
            label="Diagnostics"
            entries={buildEntries(60)}
            tone="var(--portal-color-success)"
            scanlines={false}
        />
    ),
};
