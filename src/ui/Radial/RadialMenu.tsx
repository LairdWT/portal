import { type ReactElement, useCallback } from 'react';

import {
    ERadialAction as ACTION,
    type ERadialAction,
    ERadialVariant,
    type RadialItem,
    type RadialMenuProps,
} from './Radial.types';
import { RadialCore } from './RadialCore';

// Generic-UI radial menu. A modal open/close radial: items fan out from each
// edge of a 4-, 6-, or 8-sided ring and a click selects one; an optional center
// hub carries confirm/cancel/next/previous as drawn symbols. Behavior only - the
// shared RadialCore owns the overlay, geometry, hub, animation, focus trap, and
// dismissal. Cancel always closes; selecting closes unless closeOnSelect=false.
export function RadialMenu({
    open,
    onClose,
    label,
    items,
    onSelect,
    sides = 8,
    centerActions = [],
    onCenterAction,
    closeOnSelect = true,
    tone,
}: RadialMenuProps): ReactElement | null {
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
            }
        },
        [onCenterAction, onClose],
    );

    return (
        <RadialCore
            open={open}
            onClose={onClose}
            label={label}
            sides={sides}
            items={items}
            centerActions={centerActions}
            variant={ERadialVariant.Menu}
            onActivateSection={handleActivateSection}
            onActivateAction={handleActivateAction}
            disabled={false}
            tone={tone}
        />
    );
}
