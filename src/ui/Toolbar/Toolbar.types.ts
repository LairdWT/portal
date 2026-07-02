import type { ReactNode } from 'react';

import type { Toned } from '../tone';

export const EToolbarOrientation: {
    readonly Horizontal: 'horizontal';
    readonly Vertical: 'vertical';
} = {
    Horizontal: 'horizontal',
    Vertical: 'vertical',
};
export type EToolbarOrientation =
    (typeof EToolbarOrientation)[keyof typeof EToolbarOrientation];

// Props for the Toolbar: a role=toolbar strip managing ONE roving tab stop
// across its interactive descendants (the APG toolbar pattern). Arrow keys
// along the orientation move focus; Home/End jump to the ends; Tab leaves
// the whole strip. Children are ordinary interactive elements (CTA, compact
// keys, Select triggers) - the toolbar discovers them, it never clones them.
export type ToolbarProps = Readonly<
    {
        label: string;
        children: ReactNode;
        orientation?: EToolbarOrientation | undefined;
    } & Toned
>;

// Props for ToolbarGroup: a labelled cluster inside the strip.
export type ToolbarGroupProps = Readonly<{
    label?: string | undefined;
    children: ReactNode;
}>;
