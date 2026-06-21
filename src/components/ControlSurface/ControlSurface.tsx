import { type ReactElement, type ReactNode, useId, useMemo } from 'react';

import { EInputValueType } from '../../input';
import { ActionButton } from '../ActionButton/ActionButton';
import { HudPanel } from '../HudPanel/HudPanel';
import { Joystick } from '../Joystick/Joystick';
import styles from './ControlSurface.module.css';
import {
    type ControlSurfaceProps,
    type ControlSurfaceReadout,
    type DefaultPresetDescriptors,
    type SignalForwardProps,
} from './ControlSurface.types';

const DEFAULT_LEFT_LABEL: string = 'Movement';
const DEFAULT_PRIMARY_LABEL: string = 'A';
const DEFAULT_SECONDARY_LABEL: string = 'B';
const HUD_PANEL_LABEL: string = 'Status readouts';
const NO_READOUTS: readonly ControlSurfaceReadout[] = [];

const MOVE_DESCRIPTOR_LABEL: string = 'Movement';
const PRIMARY_DESCRIPTOR_LABEL: string = 'Primary action';
const SECONDARY_DESCRIPTOR_LABEL: string = 'Secondary action';

function buildDefaultPresetDescriptors(
    instanceId: string,
): DefaultPresetDescriptors {
    return {
        move: {
            id: `${instanceId}.move`,
            kind: EInputValueType.Axis2D,
            label: MOVE_DESCRIPTOR_LABEL,
        },
        primary: {
            id: `${instanceId}.primary`,
            kind: EInputValueType.Digital,
            label: PRIMARY_DESCRIPTOR_LABEL,
        },
        secondary: {
            id: `${instanceId}.secondary`,
            kind: EInputValueType.Digital,
            label: SECONDARY_DESCRIPTOR_LABEL,
        },
    };
}

export function ControlSurface({
    onSignal,
    instanceId,
    leftLabel = DEFAULT_LEFT_LABEL,
    primaryLabel = DEFAULT_PRIMARY_LABEL,
    secondaryLabel = DEFAULT_SECONDARY_LABEL,
    readouts = NO_READOUTS,
    hudSlot,
    movementSlot,
    primarySlot,
    secondarySlot,
}: ControlSurfaceProps): ReactElement {
    // A stable fallback id so two un-configured instances do not collide on a
    // shared descriptor id. A caller-supplied instanceId wins when present.
    const generatedId: string = useId();
    const resolvedInstanceId: string = instanceId ?? generatedId;

    const descriptors: DefaultPresetDescriptors = useMemo<DefaultPresetDescriptors>(
        (): DefaultPresetDescriptors =>
            buildDefaultPresetDescriptors(resolvedInstanceId),
        [resolvedInstanceId],
    );

    // Under exactOptionalPropertyTypes an explicit `undefined` is not a valid
    // value for an optional prop, so the signal sink is spread in only when the
    // caller actually supplied one. This applies to the default preset controls
    // only; consumer-supplied slots wire their own descriptor and onSignal.
    const signalProps: SignalForwardProps =
        onSignal === undefined ? {} : { onSignal };

    const hudContent: ReactNode =
        hudSlot === undefined ? (
            <HudPanel label={HUD_PANEL_LABEL} readouts={readouts} />
        ) : (
            hudSlot
        );

    const movementContent: ReactNode =
        movementSlot === undefined ? (
            <Joystick
                label={leftLabel}
                descriptor={descriptors.move}
                {...signalProps}
            />
        ) : (
            movementSlot
        );

    const primaryContent: ReactNode =
        primarySlot === undefined ? (
            <ActionButton
                label={primaryLabel}
                descriptor={descriptors.primary}
                {...signalProps}
            />
        ) : (
            primarySlot
        );

    const secondaryContent: ReactNode =
        secondarySlot === undefined ? (
            <ActionButton
                label={secondaryLabel}
                descriptor={descriptors.secondary}
                {...signalProps}
            />
        ) : (
            secondarySlot
        );

    return (
        <section className={styles.surface}>
            <div className={styles.hud}>{hudContent}</div>

            <div className={styles.movement}>{movementContent}</div>

            <div className={styles.actions}>
                <div className={styles.actionCell}>{primaryContent}</div>
                <div className={styles.actionCell}>{secondaryContent}</div>
            </div>
        </section>
    );
}
