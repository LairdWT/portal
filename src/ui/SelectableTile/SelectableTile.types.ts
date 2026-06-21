import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type Toned } from '../tone';

// Selection state for a SelectableTile. Modeled as an E-prefixed const-object
// enum rather than a boolean so the three distinct presentation states are a
// named member set. The kebab-case values double as the data-state attribute the
// CSS reads. Targetable is a valid-target highlight that must be conveyed by a
// non-color cue (border/glow) plus a text hint, never by tone color alone.
export const ESelectionState: {
    readonly Default: 'default';
    readonly Selected: 'selected';
    readonly Targetable: 'targetable';
} = {
    Default: 'default',
    Selected: 'selected',
    Targetable: 'targetable',
};
export type ESelectionState =
    (typeof ESelectionState)[keyof typeof ESelectionState];

// Props for the SelectableTile selection primitive.
//
// `state` and `enabled` are enums, not booleans, so the derived ARIA and DOM
// states stay explicit. `onSelect` is a plain value-shaped callback; when it is
// omitted the tile falls back to the ambient SelectionContext sink, calling its
// onSelect with this tile's `id`. `selectionLabel` optionally supplements the
// accessible name. `tone` is an opaque CSS color the consumer supplies; the tile
// never enumerates a palette.
export type SelectableTileProps = Readonly<{
    id: string;
    state?: ESelectionState;
    enabled?: EEnabledState;
    onSelect?: () => void;
    selectionLabel?: string;
    children: ReactNode;
}> &
    Toned;
