import type { ReactNode } from 'react';

// The shared spacing scale for the layout primitives, mapped onto the space
// tokens in CSS through the data-gap attribute.
export const ELayoutGap: {
    readonly None: 'none';
    readonly Xs: 'xs';
    readonly Sm: 'sm';
    readonly Md: 'md';
    readonly Lg: 'lg';
    readonly Xl: 'xl';
} = {
    None: 'none',
    Xs: 'xs',
    Sm: 'sm',
    Md: 'md',
    Lg: 'lg',
    Xl: 'xl',
};
export type ELayoutGap = (typeof ELayoutGap)[keyof typeof ELayoutGap];

export const EStackDirection: {
    readonly Column: 'column';
    readonly Row: 'row';
} = {
    Column: 'column',
    Row: 'row',
};
export type EStackDirection =
    (typeof EStackDirection)[keyof typeof EStackDirection];

// Cross-axis alignment, mapped onto align-items.
export const EStackAlign: {
    readonly Stretch: 'stretch';
    readonly Start: 'start';
    readonly Center: 'center';
    readonly End: 'end';
} = {
    Stretch: 'stretch',
    Start: 'start',
    Center: 'center',
    End: 'end',
};
export type EStackAlign = (typeof EStackAlign)[keyof typeof EStackAlign];

// Main-axis distribution, mapped onto justify-content.
export const EStackJustify: {
    readonly Start: 'start';
    readonly Center: 'center';
    readonly End: 'end';
    readonly SpaceBetween: 'space-between';
} = {
    Start: 'start',
    Center: 'center',
    End: 'end',
    SpaceBetween: 'space-between',
};
export type EStackJustify = (typeof EStackJustify)[keyof typeof EStackJustify];

// Props for Stack: the one-axis flow primitive (column by default). Purely
// compositional - no surface, no border - so consumers stop hand-rolling
// flex wrappers for every screen.
export type StackProps = Readonly<{
    children: ReactNode;
    direction?: EStackDirection | undefined;
    gap?: ELayoutGap | undefined;
    align?: EStackAlign | undefined;
    justify?: EStackJustify | undefined;
    wrap?: boolean | undefined;
}>;

// Props for Grid: the equal-track grid primitive. `columns` (1-12, clamped)
// drives repeat(columns, minmax(0, 1fr)) through a custom property.
export type GridProps = Readonly<{
    children: ReactNode;
    columns?: number | undefined;
    gap?: ELayoutGap | undefined;
}>;

export const EDividerOrientation: {
    readonly Horizontal: 'horizontal';
    readonly Vertical: 'vertical';
} = {
    Horizontal: 'horizontal',
    Vertical: 'vertical',
};
export type EDividerOrientation =
    (typeof EDividerOrientation)[keyof typeof EDividerOrientation];

// Props for Divider: a token-drawn separator rule, optionally carrying a
// centered label (horizontal only - a labelled vertical rule has no sane
// reading order).
export type DividerProps = Readonly<{
    label?: string | undefined;
    orientation?: EDividerOrientation | undefined;
}>;
