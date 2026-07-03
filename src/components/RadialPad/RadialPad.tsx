import { type ReactElement, useCallback, useMemo } from 'react';

import type {
    InputDescriptor,
    InputSignal,
    InputSource,
    TimeProvider,
} from '../../input';
import { createInputSource, EInputInteraction } from '../../input';
import {
    type ControllerContextValue,
    useControllerContext,
} from '../../react/ControllerContext';
import { type EmitBinding, useEmitBinding } from '../../react/hooks/useEmitBinding';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { useTimeProvider } from '../../react/TimeProviderContext';
import { EEnabledState } from '../../state/state';
import {
    ERadialAction as ACTION,
    type ERadialAction,
    ERadialVariant,
    type RadialItem,
    type RadialSides,
} from '../../ui/Radial/Radial.types';
import { RadialCore } from '../../ui/Radial/RadialCore';
import { resolveRadialSides } from '../../ui/Radial/radialGeometry';
import type { RadialPadProps } from './RadialPad.types';

// Every center action, in the fixed order the per-target signal sources are
// pre-built (mirrors DPad's ALL_DIRECTIONS).
const ALL_ACTIONS: readonly ERadialAction[] = [
    ACTION.Confirm,
    ACTION.Cancel,
    ACTION.Previous,
    ACTION.Next,
];

// Per-section signal target key. A section carries no stable semantic name (its
// meaning is consumer-defined), so it keys by radial index.
function sectionKey(index: number): string {
    return `section-${String(index)}`;
}

export function RadialPad({
    open,
    onClose,
    onOpen,
    label,
    sections,
    sides = 8,
    centerActions = [],
    onSelect,
    onCenterAction,
    onSignal,
    descriptor,
    enabled,
    collapsible = true,
    toggleIcon,
    toggleText,
    tone,
}: RadialPadProps): ReactElement | null {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;

    // Normalize like RadialCore does, so the pre-built per-section sources
    // always match the wedges the core actually renders.
    const resolvedSides: RadialSides = resolveRadialSides(sides);

    // Pad-level emit surface, used as the fallback when no per-target source
    // exists (no descriptor / onSignal wired).
    const { emitDigital }: EmitBinding = useEmitBinding(descriptor, onSignal);

    // Ambient wiring for the per-target streams, exactly as DPad builds its
    // per-direction sources: the context signal sink, the id namespace, and the
    // injected clock, so a target id composes as
    // `${idNamespace}.${descriptor.id}.${key}`.
    const timeProvider: TimeProvider = useTimeProvider();
    const { onSignal: contextOnSignal, idNamespace }: ControllerContextValue =
        useControllerContext();
    const resolvedOnSignal: ((signal: InputSignal) => void) | undefined =
        onSignal ?? contextOnSignal;

    // One InputSource per section index and per center action, pre-built so an
    // activation only looks the relevant source up rather than allocating.
    const targetSources: ReadonlyMap<string, InputSource> = useMemo<
        ReadonlyMap<string, InputSource>
    >((): ReadonlyMap<string, InputSource> => {
        const sources: Map<string, InputSource> = new Map<string, InputSource>();
        if (descriptor === undefined || resolvedOnSignal === undefined) {
            return sources;
        }
        const namespacedId: string =
            idNamespace === undefined
                ? descriptor.id
                : `${idNamespace}.${descriptor.id}`;
        const keys: string[] = [];
        for (let index: number = 0; index < resolvedSides; index += 1) {
            keys.push(sectionKey(index));
        }
        for (const action of ALL_ACTIONS) {
            keys.push(action);
        }
        for (const key of keys) {
            const memberDescriptor: InputDescriptor = {
                ...descriptor,
                id: `${namespacedId}.${key}`,
            };
            sources.set(
                key,
                createInputSource({
                    descriptor: memberDescriptor,
                    emit: resolvedOnSignal,
                    timeProvider,
                }),
            );
        }
        return sources;
    }, [descriptor, resolvedOnSignal, idNamespace, timeProvider, resolvedSides]);

    // A momentary select: Press immediately followed by Release. Falls back to a
    // pad-level pulse when the target has no dedicated source.
    const pulse: (key: string) => void = useCallback(
        (key: string): void => {
            const source: InputSource | undefined = targetSources.get(key);
            if (source === undefined) {
                emitDigital(true, EInputInteraction.Press);
                emitDigital(false, EInputInteraction.Release);
                return;
            }
            source.emitDigital(true, EInputInteraction.Press);
            source.emitDigital(false, EInputInteraction.Release);
        },
        [targetSources, emitDigital],
    );

    const handleActivateSection: (item: RadialItem, index: number) => void =
        useCallback(
            (item: RadialItem, index: number): void => {
                onSelect?.(item.id, index);
                pulse(sectionKey(index));
            },
            [onSelect, pulse],
        );

    const handleActivateAction: (action: ERadialAction) => void = useCallback(
        (action: ERadialAction): void => {
            onCenterAction?.(action);
            pulse(action);
            if (action === ACTION.Cancel) {
                onClose();
            }
        },
        [onCenterAction, pulse, onClose],
    );

    return (
        <RadialCore
            open={open}
            onClose={onClose}
            onOpen={onOpen}
            label={label}
            sides={resolvedSides}
            items={sections}
            centerActions={centerActions}
            variant={ERadialVariant.Controller}
            collapsible={collapsible}
            toggleIcon={toggleIcon}
            toggleText={toggleText}
            onActivateSection={handleActivateSection}
            onActivateAction={handleActivateAction}
            disabled={isDisabled}
            tone={tone}
        />
    );
}
