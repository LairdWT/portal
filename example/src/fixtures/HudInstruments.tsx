import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import {
    Dial,
    Hotbar,
    type HotbarSlot,
    InventoryGrid,
    type InventorySlot,
    LogConsole,
    type LogEntry,
    moveSlot,
} from '@laird-wt/portal';

// HUD-instruments fixture: the 1.9.0 interaction surfaces under real layout.
// Each control mirrors its controlled state into a data-testid readout so the
// behavior specs can assert values without reaching into component internals:
// the Dial's committed value (rotary drag + detent settle), the Hotbar slot
// order (drag / Ctrl+Arrow reorder), the InventoryGrid order (keyboard
// grab-move-drop + pointer drag), and the LogConsole entry count with append
// buttons for the follow-tail spec.

const ABILITIES: readonly HotbarSlot[] = [
    { id: 'blink', label: 'Blink', keybind: '1', content: <span>BLNK</span> },
    { id: 'barrage', label: 'Barrage', keybind: '2', content: <span>BRRG</span> },
    { id: 'shield', label: 'Shield', keybind: '3', content: <span>SHLD</span> },
];

const CARGO: readonly InventorySlot[] = [
    { id: 'c1', label: 'Plasma cell', content: <span>PC</span> },
    { id: 'c2', label: 'Medkit', content: <span>MK</span> },
    { id: 'c3' },
    { id: 'c4' },
    { id: 'c5' },
    { id: 'c6' },
];

function buildEntries(count: number): readonly LogEntry[] {
    return Array.from(
        { length: count },
        (_unused: unknown, index: number): LogEntry => ({
            id: `t-${String(index)}`,
            message: `tick ${String(index)}`,
            timeLabel: `T+${String(index).padStart(4, '0')}`,
        }),
    );
}

export function HudInstruments(): ReactElement {
    const [throttle, setThrottle]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(40);
    const [slots, setSlots]: [
        readonly HotbarSlot[],
        Dispatch<SetStateAction<readonly HotbarSlot[]>>,
    ] = useState<readonly HotbarSlot[]>(ABILITIES);
    const [activeId, setActiveId]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('blink');
    const [cargo, setCargo]: [
        readonly InventorySlot[],
        Dispatch<SetStateAction<readonly InventorySlot[]>>,
    ] = useState<readonly InventorySlot[]>(CARGO);
    const [entries, setEntries]: [
        readonly LogEntry[],
        Dispatch<SetStateAction<readonly LogEntry[]>>,
    ] = useState<readonly LogEntry[]>((): readonly LogEntry[] =>
        buildEntries(40),
    );

    function appendEntries(count: number): void {
        setEntries((prev: readonly LogEntry[]): readonly LogEntry[] => [
            ...prev,
            ...buildEntries(prev.length + count).slice(prev.length),
        ]);
    }

    return (
        <main>
            <section aria-label="Dial fixture">
                <Dial
                    label="Throttle"
                    value={throttle}
                    min={0}
                    max={100}
                    step={1}
                    detents={[0, 25, 50, 75, 100]}
                    onChange={setThrottle}
                />
                <p data-testid="dial-value">{String(throttle)}</p>
            </section>
            <section aria-label="Hotbar fixture">
                <Hotbar
                    label="Abilities"
                    slots={slots}
                    activeId={activeId}
                    onActivate={setActiveId}
                    onMove={(fromIndex: number, toIndex: number): void => {
                        setSlots(
                            (
                                prev: readonly HotbarSlot[],
                            ): readonly HotbarSlot[] =>
                                moveSlot(prev, fromIndex, toIndex),
                        );
                    }}
                />
                <p data-testid="hotbar-order">
                    {slots.map((slot: HotbarSlot): string => slot.id).join(',')}
                </p>
                <p data-testid="hotbar-active">{activeId}</p>
            </section>
            <section aria-label="Inventory fixture">
                <InventoryGrid
                    label="Cargo"
                    slots={cargo}
                    columns={3}
                    onMove={(fromIndex: number, toIndex: number): void => {
                        setCargo(
                            (
                                prev: readonly InventorySlot[],
                            ): readonly InventorySlot[] =>
                                moveSlot(prev, fromIndex, toIndex),
                        );
                    }}
                />
                <p data-testid="cargo-order">
                    {cargo.map((slot: InventorySlot): string => slot.id).join(',')}
                </p>
            </section>
            <section aria-label="Log fixture">
                <LogConsole label="Telemetry" entries={entries} blockSize="240px" />
                <button
                    type="button"
                    onClick={(): void => {
                        appendEntries(1);
                    }}
                >
                    Append entry
                </button>
                <button
                    type="button"
                    onClick={(): void => {
                        appendEntries(30);
                    }}
                >
                    Append burst
                </button>
                <p data-testid="log-count">{String(entries.length)}</p>
            </section>
        </main>
    );
}
