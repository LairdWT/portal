import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useCallback,
    useState,
} from 'react';

import {
    ERadialAction as ACTION,
    type ERadialAction,
    ERadialVariant,
    type RadialItem,
    type RadialMenuProps,
    type RadialSides,
} from './Radial.types';
import { RadialCore } from './RadialCore';
import { resolveRadialSides } from './radialGeometry';

// Generic-UI radial menu. An open/close radial: items fan out from each edge
// of a 4-, 6-, or 8-sided ring and a click selects one; an optional center hub
// carries confirm/cancel/next/previous as drawn symbols. Behavior only - the
// shared RadialCore owns the overlay/inline surface, geometry, hub, animation,
// and dismissal. Cancel always closes; selecting closes unless
// closeOnSelect=false. When more items than sides are supplied, the Next /
// Previous center actions page through them (wrapping; the page resets on
// every open so the menu always reopens on page one). `collapsible` renders
// the inline disclosure form whose hub persists as the open/close toggle.
export function RadialMenu({
    open,
    onClose,
    onOpen,
    label,
    items,
    onSelect,
    sides = 8,
    centerActions = [],
    onCenterAction,
    closeOnSelect = true,
    collapsible = false,
    tone,
}: RadialMenuProps): ReactElement | null {
    const resolvedSides: RadialSides = resolveRadialSides(sides);
    const pageCount: number = Math.max(1, Math.ceil(items.length / resolvedSides));

    const [page, setPage]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const [prevOpen, setPrevOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(open);

    // Render-phase derived-state pattern: every fresh open lands on page one.
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setPage(0);
        }
    }

    // A shrinking items list could strand the page past the end; clamp for
    // render without writing state.
    const clampedPage: number = Math.min(page, pageCount - 1);
    const pageItems: readonly RadialItem[] = items.slice(
        clampedPage * resolvedSides,
        (clampedPage + 1) * resolvedSides,
    );

    const handleActivateSection: (item: RadialItem) => void = useCallback(
        (item: RadialItem): void => {
            onSelect(item.id);
            if (closeOnSelect) {
                onClose();
            }
        },
        [onSelect, closeOnSelect, onClose],
    );

    const handleActivateAction: (action: ERadialAction) => void = useCallback(
        (action: ERadialAction): void => {
            onCenterAction?.(action);
            if (action === ACTION.Cancel) {
                onClose();
                return;
            }
            if (pageCount <= 1) {
                return;
            }
            if (action === ACTION.Next) {
                setPage((current: number): number => (current + 1) % pageCount);
                return;
            }
            if (action === ACTION.Previous) {
                setPage(
                    (current: number): number =>
                        (current + pageCount - 1) % pageCount,
                );
            }
        },
        [onCenterAction, onClose, pageCount],
    );

    return (
        <RadialCore
            open={open}
            onClose={onClose}
            onOpen={onOpen}
            label={label}
            sides={resolvedSides}
            items={pageItems}
            centerActions={centerActions}
            variant={ERadialVariant.Menu}
            collapsible={collapsible}
            onActivateSection={handleActivateSection}
            onActivateAction={handleActivateAction}
            disabled={false}
            tone={tone}
        />
    );
}
