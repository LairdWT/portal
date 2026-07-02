import {
    type CSSProperties,
    type Dispatch,
    type MouseEvent,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import {
    type DigitalPressBinding,
    useDigitalPress,
} from '../../react/hooks/useDigitalPress';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { QWERTY_ROWS } from './keyboardLayout';
import styles from './VirtualKeyboard.module.css';
import {
    EKeyAction,
    EKeyboardLayer,
    type VirtualKeyboardProps,
    type VirtualKeyboardRow,
    type VirtualKeyDef,
} from './VirtualKeyboard.types';

// Cap text for a key on the active layer; a missing layer cap falls back to
// the base cap.
function capLabel(key: VirtualKeyDef, layer: EKeyboardLayer): string {
    return key.labels[layer] ?? key.labels[EKeyboardLayer.Base] ?? '';
}

type VirtualKeyProps = Readonly<{
    keyDef: VirtualKeyDef;
    layer: EKeyboardLayer;
    enabled: EEnabledState;
    onCommit: (key: VirtualKeyDef) => void;
}>;

// One key cap. A child component so each key owns its useDigitalPress
// instance. Pointer presses commit on pointerdown (game feel, the hook's
// onPress); keyboard activation commits through the synthesized click, which
// carries detail 0 - a pointer click carries detail >= 1 and is ignored so
// the two paths can never double-commit.
function VirtualKey({
    keyDef,
    layer,
    enabled,
    onCommit,
}: VirtualKeyProps): ReactElement {
    const action: EKeyAction = keyDef.action ?? EKeyAction.Input;
    const isToggle: boolean =
        action === EKeyAction.Shift || action === EKeyAction.Symbol;
    const toggled: boolean =
        (action === EKeyAction.Shift && layer === EKeyboardLayer.Shift) ||
        (action === EKeyAction.Symbol && layer === EKeyboardLayer.Symbol);
    const {
        pressState,
        onPointerDown,
        onPointerUp,
        onPointerCancel,
    }: DigitalPressBinding = useDigitalPress({
        enabled,
        onPress: (): void => {
            onCommit(keyDef);
        },
    });
    const keyStyle: CSSProperties | undefined =
        keyDef.widthUnits !== undefined
            ? { flexGrow: keyDef.widthUnits }
            : undefined;

    return (
        <button
            type="button"
            className={styles.key}
            style={keyStyle}
            disabled={enabled === EEnabledState.Disabled}
            aria-pressed={isToggle ? toggled : undefined}
            data-pressed={pressState}
            data-action={action}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onClick={(event: MouseEvent<HTMLButtonElement>): void => {
                if (event.detail !== 0) {
                    return;
                }
                onCommit(keyDef);
            }}
        >
            <span className={styles.cap}>{capLabel(keyDef, layer)}</span>
        </button>
    );
}

// The VirtualKeyboard: a data-driven on-screen key matrix of machined key
// faces (the BevelButton metal recipe) with base/shift/symbol layers. Shift
// is one-shot (drops back to Base after the next emitted character); Symbol
// latches until toggled back.
export function VirtualKeyboard({
    label,
    rows,
    onKey,
    onAction,
    enabled,
}: VirtualKeyboardProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const [layer, setLayer]: [
        EKeyboardLayer,
        Dispatch<SetStateAction<EKeyboardLayer>>,
    ] = useState<EKeyboardLayer>(EKeyboardLayer.Base);
    const resolvedRows: readonly VirtualKeyboardRow[] = rows ?? QWERTY_ROWS;

    function commit(key: VirtualKeyDef): void {
        const action: EKeyAction = key.action ?? EKeyAction.Input;
        switch (action) {
            case EKeyAction.Input: {
                onKey(capLabel(key, layer));
                if (layer === EKeyboardLayer.Shift) {
                    setLayer(EKeyboardLayer.Base);
                }
                return;
            }
            case EKeyAction.Space: {
                onKey(' ');
                if (layer === EKeyboardLayer.Shift) {
                    setLayer(EKeyboardLayer.Base);
                }
                return;
            }
            case EKeyAction.Shift: {
                setLayer(
                    (prev: EKeyboardLayer): EKeyboardLayer =>
                        prev === EKeyboardLayer.Shift
                            ? EKeyboardLayer.Base
                            : EKeyboardLayer.Shift,
                );
                return;
            }
            case EKeyAction.Symbol: {
                setLayer(
                    (prev: EKeyboardLayer): EKeyboardLayer =>
                        prev === EKeyboardLayer.Symbol
                            ? EKeyboardLayer.Base
                            : EKeyboardLayer.Symbol,
                );
                return;
            }
            case EKeyAction.Backspace:
            case EKeyAction.Enter: {
                onAction?.(action);
                return;
            }
        }
    }

    return (
        <div
            role="group"
            aria-label={label}
            className={styles.board}
            data-layer={layer}
            data-enabled={resolvedEnabled}
        >
            {resolvedRows.map(
                (row: VirtualKeyboardRow, rowIndex: number): ReactElement => (
                    <div
                        key={row[0]?.id ?? String(rowIndex)}
                        className={styles.row}
                    >
                        {row.map(
                            (key: VirtualKeyDef): ReactElement => (
                                <VirtualKey
                                    key={key.id}
                                    keyDef={key}
                                    layer={layer}
                                    enabled={resolvedEnabled}
                                    onCommit={commit}
                                />
                            ),
                        )}
                    </div>
                ),
            )}
        </div>
    );
}
