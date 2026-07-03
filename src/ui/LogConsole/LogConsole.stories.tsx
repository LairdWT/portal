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

// Long-form diagnostics for the wrap mode: multi-line rows on the
// measured-height virtualization path.
const LONG_MESSAGES: readonly string[] = [
    'reactor stack trace: coolant loop 2 reported a pressure excursion past the amber band during spool-up; the governor clamped flow to 82 percent and scheduled a staged re-open across the next three duty cycles',
    'nav fusion notice: star tracker 1 and the inertial platform disagreed by 0.4 arc-minutes after the correction burn, so the filter re-weighted toward the tracker until the gyro bias estimate settles',
    'cargo bay audit complete',
    'link budget report: the high-gain dish held 96 percent packet integrity through the occlusion window by stepping the symbol rate down twice and back up once the horizon cleared',
];

function buildWrappedEntries(count: number): readonly LogEntry[] {
    return Array.from(
        { length: count },
        (_unused: unknown, index: number): LogEntry => ({
            id: `wrapped-${String(index)}`,
            message: `${LONG_MESSAGES[index % LONG_MESSAGES.length] ?? 'tick'} [${String(index)}]`,
            timeLabel: `T+${String(index).padStart(4, '0')}`,
            ...(index % 5 === 0 ? { severity: ELogSeverity.Warning } : {}),
        }),
    );
}

export const Wrapped: Story = {
    render: (): ReactElement => (
        <LogConsole
            label="Incident detail"
            entries={buildWrappedEntries(120)}
            wrap={true}
        />
    ),
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
