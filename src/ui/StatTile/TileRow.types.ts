import { type ReactNode } from 'react';

// Props for TileRow, an equal-width responsive layout for a strip of StatTile
// children (Helicon tile_row / metric_row). It owns layout ONLY - the consumer
// composes the tiles; the row does not re-declare tile data. `children` are the
// StatTile elements. `columns` fixes an equal N-column grid (Helicon's
// equal-cell tile_row) and must be a positive integer (>= 1); when omitted - or
// given any non-positive-integer value - the grid auto-fits down to a token floor
// and wraps. `label`, when supplied, names the group for assistive tech (role="group"
// + aria-label); when omitted the row is a presentational layout div and the
// tiles carry their own semantics. The row is NOT toned - tone lives on each tile.
export type TileRowProps = Readonly<{
    children: ReactNode;
    columns?: number;
    label?: string;
}>;
