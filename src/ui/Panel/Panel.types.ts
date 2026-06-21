import { type ReactNode } from 'react';

import { type Toned } from '../tone';

// Surface elevation for the Panel container. An E-prefixed const-object enum
// (not a boolean and not the `enum` keyword) whose kebab-case string values
// double as the data-elevation attribute the CSS reads. Flat draws on the base
// surface, Raised lifts onto the secondary surface.
export const EPanelElevation: {
    readonly Flat: 'flat';
    readonly Raised: 'raised';
} = {
    Flat: 'flat',
    Raised: 'raised',
};
export type EPanelElevation =
    (typeof EPanelElevation)[keyof typeof EPanelElevation];

// Heading level for the Panel title, constrained to the section-nesting range
// the spec allows. Defaults to 2 when a title is set.
export type PanelHeadingLevel = 2 | 3 | 4;

// Props for the Panel titled-container primitive.
//
// `title` is optional: when set, the panel renders a heading at the configured
// `headingLevel` and wires aria-labelledby to it via useId. `landmark` controls
// whether the root is a <section> (the default, an accessibility landmark) or a
// plain <div> for nested panels that would otherwise spam landmarks; pass
// `landmark={false}` to opt out. `elevation` selects the surface token. The
// Toned mixin carries the opaque `tone` color the root applies.
export type PanelProps = Readonly<{
    title?: ReactNode;
    headingLevel?: PanelHeadingLevel;
    elevation?: EPanelElevation;
    landmark?: boolean;
    children: ReactNode;
}> &
    Toned;
