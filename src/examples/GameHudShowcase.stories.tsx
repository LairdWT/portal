import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { Dial } from '../components/Dial/Dial';
import { Hotbar } from '../components/Hotbar/Hotbar';
import { type HotbarSlot } from '../components/Hotbar/Hotbar.types';
import { Compass } from '../ui/Compass/Compass';
import { Cooldown } from '../ui/Cooldown/Cooldown';
import { Dialog } from '../ui/Dialog/Dialog';
import { FloatingText } from '../ui/FloatingText/FloatingText';
import { type FloatingTextEvent } from '../ui/FloatingText/FloatingText.types';
import { Gauge } from '../ui/Gauge/Gauge';
import { InventoryGrid } from '../ui/InventoryGrid/InventoryGrid';
import { type InventorySlot } from '../ui/InventoryGrid/InventoryGrid.types';
import { moveSlot } from '../ui/InventoryGrid/slotMath';
import { LogConsole } from '../ui/LogConsole/LogConsole';
import { ELogSeverity, type LogEntry } from '../ui/LogConsole/LogConsole.types';
import { Minimap } from '../ui/Minimap/Minimap';
import { EMapMarkerKind, type MapMarker } from '../ui/Minimap/Minimap.types';
import { ObjectiveTracker } from '../ui/ObjectiveTracker/ObjectiveTracker';
import {
    EObjectiveState,
    type Objective,
} from '../ui/ObjectiveTracker/ObjectiveTracker.types';
import { Odometer } from '../ui/Odometer/Odometer';
import { StatusFooter } from '../ui/StatusFooter/StatusFooter';
import { EFooterStatus } from '../ui/StatusFooter/StatusFooter.types';
import { EUiStatus } from '../ui/tone';

// The integration showcase: the full HUD set wired through REAL state.
// Hotbar presses arm the Cooldown chip, score the Odometer, spawn
// FloatingText hits, and append LogConsole entries; the Dial drives the
// reactor Gauge (danger band + status past the redline); the cargo key
// opens an InventoryGrid dialog whose moves also log; the Minimap, Compass,
// and ObjectiveTracker frame the scene; and the StatusFooter mirrors the
// latest event. Nothing here is mocked - the story doubles as an
// integration test under the story/axe gate.

const COOLDOWN_MS: number = 5000;
const POWER_REDLINE: number = 85;

const ABILITIES: readonly HotbarSlot[] = [
    { id: 'blink', label: 'Blink', keybind: '1', content: <span>BLNK</span> },
    { id: 'barrage', label: 'Barrage', keybind: '2', content: <span>BRRG</span> },
    { id: 'shield', label: 'Shield', keybind: '3', content: <span>SHLD</span> },
    {
        id: 'cargo',
        label: 'Open cargo hold',
        keybind: '4',
        content: <span>CRGO</span>,
    },
];

const ABILITY_FACES: Readonly<Record<string, string>> = {
    blink: 'BLNK',
    barrage: 'BRRG',
    shield: 'SHLD',
};

const INITIAL_CARGO: readonly InventorySlot[] = [
    { id: 'cell', label: 'Plasma cell', content: <span>PC</span> },
    { id: 'medkit', label: 'Medkit', content: <span>MK</span> },
    { id: 'scrap', label: 'Scrap alloy', content: <span>SA</span> },
    { id: 'bay-4' },
    { id: 'bay-5' },
    { id: 'bay-6' },
    { id: 'bay-7' },
    { id: 'bay-8' },
];

const INITIAL_LOG: readonly LogEntry[] = [
    { id: 'hud-0', message: 'HUD online.', timeLabel: 'T+0000' },
    {
        id: 'hud-1',
        message: 'Reactor holding at 62 percent.',
        timeLabel: 'T+0001',
    },
];

const HEADING_DEGREES: number = 30;

const MAP_MARKERS: readonly MapMarker[] = [
    { id: 'wing', x: -30, y: 45, label: 'Wingman', kind: EMapMarkerKind.Ally },
    {
        id: 'raider',
        x: 40,
        y: -60,
        label: 'Raider',
        kind: EMapMarkerKind.Hostile,
    },
    {
        id: 'relay',
        x: 220,
        y: 160,
        label: 'Relay (out of range)',
        kind: EMapMarkerKind.Objective,
    },
];

const OBJECTIVES: readonly Objective[] = [
    { id: 'hold', label: 'Hold the eastern pass' },
    { id: 'cells', label: 'Recover power cells', count: 3, total: 5 },
    {
        id: 'silence',
        label: 'Silence the battery',
        state: EObjectiveState.Complete,
    },
];

const SCORE_PER_CAST: number = 25;

const ROOT_STYLE: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--portal-space-4)',
    maxInlineSize: '64rem',
};

const INSTRUMENT_ROW_STYLE: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))',
    gap: 'var(--portal-space-4)',
    alignItems: 'start',
};

const ACTION_ROW_STYLE: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--portal-space-5)',
    alignItems: 'center',
};

// The FloatingText arena beside the score: hits rise out of this box.
const HIT_ARENA_STYLE: CSSProperties = {
    position: 'relative',
    inlineSize: '8rem',
    blockSize: 'var(--portal-touch-target-min)',
};

const LOWER_ROW_STYLE: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    gap: 'var(--portal-space-4)',
    alignItems: 'start',
};

const CHIP_FACE_STYLE: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    inlineSize: 'var(--portal-touch-target-min)',
    blockSize: 'var(--portal-touch-target-min)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    borderRadius: 'var(--portal-bevel-2)',
    backgroundColor: 'var(--portal-color-surface-0)',
    color: 'var(--portal-color-text-0)',
    fontFamily: 'var(--portal-font-mono)',
    fontSize: 'var(--portal-size-text-sm)',
};

// One armed ability cast. The cast counter keys the Cooldown so re-casting
// the same ability re-arms the sweep by remount (the documented contract).
type ArmedCast = Readonly<{
    abilityId: string;
    label: string;
    cast: number;
}>;

function GameHud(): ReactElement {
    const [power, setPower]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(62);
    const [entries, setEntries]: [
        readonly LogEntry[],
        Dispatch<SetStateAction<readonly LogEntry[]>>,
    ] = useState<readonly LogEntry[]>(INITIAL_LOG);
    const [activeId, setActiveId]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('blink');
    const [cast, setCast]: [
        ArmedCast | null,
        Dispatch<SetStateAction<ArmedCast | null>>,
    ] = useState<ArmedCast | null>(null);
    const [castCount, setCastCount]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const [cargoOpen, setCargoOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [cargo, setCargo]: [
        readonly InventorySlot[],
        Dispatch<SetStateAction<readonly InventorySlot[]>>,
    ] = useState<readonly InventorySlot[]>(INITIAL_CARGO);
    const [score, setScore]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(1250);
    const [hits, setHits]: [
        readonly FloatingTextEvent[],
        Dispatch<SetStateAction<readonly FloatingTextEvent[]>>,
    ] = useState<readonly FloatingTextEvent[]>([]);

    function appendLog(message: string, severity?: ELogSeverity): void {
        setEntries((prev: readonly LogEntry[]): readonly LogEntry[] => [
            ...prev,
            {
                id: `hud-${String(prev.length)}`,
                message,
                timeLabel: `T+${String(prev.length).padStart(4, '0')}`,
                ...(severity !== undefined ? { severity } : {}),
            },
        ]);
    }

    function handleActivate(id: string): void {
        if (id === 'cargo') {
            setCargoOpen(true);
            appendLog('Cargo hold opened.');
            return;
        }
        const ability: HotbarSlot | undefined = ABILITIES.find(
            (slot: HotbarSlot): boolean => slot.id === id,
        );
        if (ability === undefined) {
            return;
        }
        setActiveId(id);
        const nextCast: number = castCount + 1;
        setCastCount(nextCast);
        setCast({ abilityId: id, label: ability.label, cast: nextCast });
        setScore((prev: number): number => prev + SCORE_PER_CAST);
        setHits(
            (prev: readonly FloatingTextEvent[]): readonly FloatingTextEvent[] => [
                ...prev,
                {
                    id: `hit-${String(nextCast)}`,
                    text: `+${String(SCORE_PER_CAST)}`,
                    status: EUiStatus.Success,
                },
            ],
        );
        appendLog(`${ability.label} engaged.`);
    }

    const lastEntry: LogEntry | undefined = entries[entries.length - 1];
    const overRedline: boolean = power >= POWER_REDLINE;

    return (
        <div style={ROOT_STYLE}>
            <div style={INSTRUMENT_ROW_STYLE}>
                <Gauge
                    label="Hull integrity"
                    value={68}
                    units="%"
                    bands={[{ from: 0, to: 25, status: EUiStatus.Danger }]}
                />
                <Gauge
                    label="Reactor output"
                    value={power}
                    units="%"
                    bands={[
                        {
                            from: POWER_REDLINE,
                            to: 100,
                            status: EUiStatus.Danger,
                        },
                    ]}
                    status={overRedline ? EUiStatus.Danger : EUiStatus.None}
                />
                <Dial
                    label="Reactor throttle"
                    value={power}
                    min={0}
                    max={100}
                    step={1}
                    detents={[0, 25, 50, 75, 100]}
                    onChange={setPower}
                />
                <Minimap
                    label="Tactical"
                    markers={MAP_MARKERS}
                    center={{ x: 0, y: 0 }}
                    range={100}
                    heading={HEADING_DEGREES}
                />
            </div>
            <Compass label="Bearing" heading={HEADING_DEGREES} />
            <div style={ACTION_ROW_STYLE}>
                <Hotbar
                    label="Ability bar"
                    slots={ABILITIES}
                    activeId={activeId}
                    onActivate={handleActivate}
                />
                {cast !== null ? (
                    <Cooldown
                        key={`${cast.abilityId}:${String(cast.cast)}`}
                        label={`${cast.label} cooldown`}
                        durationMs={COOLDOWN_MS}
                        remainingMs={COOLDOWN_MS}
                        onComplete={(): void => {
                            appendLog(`${cast.label} ready.`);
                            setCast(null);
                        }}
                    >
                        <span style={CHIP_FACE_STYLE}>
                            {ABILITY_FACES[cast.abilityId] ?? '----'}
                        </span>
                    </Cooldown>
                ) : (
                    <span style={CHIP_FACE_STYLE}>RDY</span>
                )}
                <Odometer label="Score" value={score} minDigits={4} />
                <div style={HIT_ARENA_STYLE}>
                    <FloatingText
                        events={hits}
                        onExpire={(id: string): void => {
                            setHits(
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
            </div>
            <div style={LOWER_ROW_STYLE}>
                <LogConsole label="Mission log" entries={entries} />
                <ObjectiveTracker label="Objectives" objectives={OBJECTIVES} />
            </div>
            <StatusFooter
                label="HUD status"
                status={overRedline ? EFooterStatus.Warning : EFooterStatus.Ok}
                {...(lastEntry !== undefined ? { message: lastEntry.message } : {})}
                end={<span>portal HUD</span>}
            />
            <Dialog
                open={cargoOpen}
                onClose={(): void => {
                    setCargoOpen(false);
                }}
                title="Cargo hold"
            >
                <InventoryGrid
                    label="Cargo hold"
                    slots={cargo}
                    columns={4}
                    onMove={(fromIndex: number, toIndex: number): void => {
                        setCargo(
                            (
                                prev: readonly InventorySlot[],
                            ): readonly InventorySlot[] =>
                                moveSlot(prev, fromIndex, toIndex),
                        );
                        appendLog(
                            `Cargo moved to bay ${String(toIndex + 1)}.`,
                            ELogSeverity.Info,
                        );
                    }}
                />
            </Dialog>
        </div>
    );
}

type GameHudStoryArgs = Readonly<{ label: string }>;

const meta: Meta<GameHudStoryArgs> = {
    title: 'Patterns/Game HUD',
    tags: ['!autodocs'],
    // A composed HUD needs the full canvas (the DockLayout lesson).
    parameters: { layout: 'padded' },
    args: { label: 'Game HUD' },
};

export default meta;

type Story = StoryObj<GameHudStoryArgs>;

export const Showcase: Story = {
    render: (): ReactElement => <GameHud />,
};
