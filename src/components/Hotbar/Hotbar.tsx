import { type ReactElement } from 'react';

import {
    type DigitalPressBinding,
    useDigitalPress,
} from '../../react/hooks/useDigitalPress';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import styles from './Hotbar.module.css';
import { type HotbarProps, type HotbarSlot } from './Hotbar.types';

type HotbarKeyProps = Readonly<{
    slot: HotbarSlot;
    active: boolean;
    enabled: EEnabledState;
    onActivate: ((id: string) => void) | undefined;
    onSignal: HotbarProps['onSignal'];
}>;

// One hotbar key. A child component so each slot owns its useDigitalPress
// instance (press visuals + per-slot descriptor signals). Activation rides
// onClick - it fires exactly once for a pointer click AND for keyboard
// Enter/Space, which the pointer-only press hook cannot cover.
function HotbarKey({
    slot,
    active,
    enabled,
    onActivate,
    onSignal,
}: HotbarKeyProps): ReactElement {
    const {
        pressState,
        onPointerDown,
        onPointerUp,
        onPointerCancel,
    }: DigitalPressBinding = useDigitalPress({
        enabled,
        onSignal,
        descriptor: slot.descriptor,
    });

    return (
        <button
            type="button"
            className={styles.key}
            disabled={enabled === EEnabledState.Disabled}
            aria-label={slot.label}
            aria-pressed={active}
            aria-keyshortcuts={slot.keybind}
            data-active={active ? 'true' : 'false'}
            data-pressed={pressState}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onClick={(): void => {
                onActivate?.(slot.id);
            }}
        >
            <span className={styles.face} aria-hidden="true">
                {slot.content}
            </span>
            {slot.keybind !== undefined ? (
                <kbd className={styles.keybind} aria-hidden="true">
                    {slot.keybind}
                </kbd>
            ) : null}
        </button>
    );
}

// The Hotbar: a single-row action bar of digital-press keys with keybind
// chips and one active (selected) slot. Layout only - slot order is the
// consumer's; there is no drag in v1.
export function Hotbar({
    label,
    slots,
    activeId,
    onActivate,
    onSignal,
    enabled,
}: HotbarProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);

    return (
        <div
            role="group"
            aria-label={label}
            className={styles.bar}
            data-enabled={resolvedEnabled}
        >
            {slots.map(
                (slot: HotbarSlot): ReactElement => (
                    <HotbarKey
                        key={slot.id}
                        slot={slot}
                        active={slot.id === activeId}
                        enabled={resolvedEnabled}
                        onActivate={onActivate}
                        onSignal={onSignal}
                    />
                ),
            )}
        </div>
    );
}
