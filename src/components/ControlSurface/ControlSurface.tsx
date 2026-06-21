import { type ReactElement, type ReactNode, useId, useMemo } from 'react';

import { EInputValueType } from '../../input';
import { ActionButton } from '../ActionButton/ActionButton';
import { EBevelCorners } from '../ActionButton/ActionButton.types';
import { BevelButton } from '../BevelButton/BevelButton';
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
const DEFAULT_TERTIARY_LABEL: string = 'X';
const DEFAULT_QUATERNARY_LABEL: string = 'Y';
const DEFAULT_START_LABEL: string = 'Start';
const DEFAULT_SELECT_LABEL: string = 'Select';
const HUD_PANEL_LABEL: string = 'Status readouts';
const NO_READOUTS: readonly ControlSurfaceReadout[] = [];

const MOVE_DESCRIPTOR_LABEL: string = 'Movement';
const PRIMARY_DESCRIPTOR_LABEL: string = 'Primary action';
const SECONDARY_DESCRIPTOR_LABEL: string = 'Secondary action';
const TERTIARY_DESCRIPTOR_LABEL: string = 'Tertiary action';
const QUATERNARY_DESCRIPTOR_LABEL: string = 'Quaternary action';
const START_DESCRIPTOR_LABEL: string = 'Start';
const SELECT_DESCRIPTOR_LABEL: string = 'Select';

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
        tertiary: {
            id: `${instanceId}.tertiary`,
            kind: EInputValueType.Digital,
            label: TERTIARY_DESCRIPTOR_LABEL,
        },
        quaternary: {
            id: `${instanceId}.quaternary`,
            kind: EInputValueType.Digital,
            label: QUATERNARY_DESCRIPTOR_LABEL,
        },
        start: {
            id: `${instanceId}.start`,
            kind: EInputValueType.Digital,
            label: START_DESCRIPTOR_LABEL,
        },
        select: {
            id: `${instanceId}.select`,
            kind: EInputValueType.Digital,
            label: SELECT_DESCRIPTOR_LABEL,
        },
    };
}

export function ControlSurface({
    onSignal,
    instanceId,
    leftLabel = DEFAULT_LEFT_LABEL,
    primaryLabel = DEFAULT_PRIMARY_LABEL,
    secondaryLabel = DEFAULT_SECONDARY_LABEL,
    tertiaryLabel = DEFAULT_TERTIARY_LABEL,
    quaternaryLabel = DEFAULT_QUATERNARY_LABEL,
    startLabel = DEFAULT_START_LABEL,
    selectLabel = DEFAULT_SELECT_LABEL,
    readouts = NO_READOUTS,
    backgroundSlot,
    hudSlot,
    extrasSlot,
    movementSlot,
    primarySlot,
    secondarySlot,
    tertiarySlot,
    quaternarySlot,
    startSlot,
    selectSlot,
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
                bevelCorners={EBevelCorners.TopLeftBottomRight}
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
                bevelCorners={EBevelCorners.TopRightBottomLeft}
                descriptor={descriptors.secondary}
                {...signalProps}
            />
        ) : (
            secondarySlot
        );

    const tertiaryContent: ReactNode =
        tertiarySlot === undefined ? (
            <ActionButton
                label={tertiaryLabel}
                bevelCorners={EBevelCorners.TopRightBottomLeft}
                descriptor={descriptors.tertiary}
                {...signalProps}
            />
        ) : (
            tertiarySlot
        );

    const quaternaryContent: ReactNode =
        quaternarySlot === undefined ? (
            <ActionButton
                label={quaternaryLabel}
                bevelCorners={EBevelCorners.TopLeftBottomRight}
                descriptor={descriptors.quaternary}
                {...signalProps}
            />
        ) : (
            quaternarySlot
        );

    const startContent: ReactNode =
        startSlot === undefined ? (
            <BevelButton descriptor={descriptors.start} {...signalProps}>
                {startLabel}
            </BevelButton>
        ) : (
            startSlot
        );

    const selectContent: ReactNode =
        selectSlot === undefined ? (
            <BevelButton descriptor={descriptors.select} {...signalProps}>
                {selectLabel}
            </BevelButton>
        ) : (
            selectSlot
        );

    return (
        <section
            className={styles.surface}
            data-has-extras={extrasSlot === undefined ? undefined : 'true'}
        >
            {backgroundSlot === undefined ? null : (
                <div className={styles.backdrop} aria-hidden="true">
                    {backgroundSlot}
                </div>
            )}

            <div className={styles.hud}>{hudContent}</div>

            {extrasSlot === undefined ? null : (
                <div className={styles.extras}>{extrasSlot}</div>
            )}

            <div className={styles.deck}>
                <div className={styles.deckInner}>
                    <div className={styles.movement}>{movementContent}</div>

                    <div className={styles.deckCenter}>
                        {startContent}
                        {selectContent}
                    </div>

                    <div className={styles.actions}>
                        <div className={styles.actionCell}>{primaryContent}</div>
                        <div className={styles.actionCell}>{secondaryContent}</div>
                        <div className={styles.actionCell}>{tertiaryContent}</div>
                        <div className={styles.actionCell}>{quaternaryContent}</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
