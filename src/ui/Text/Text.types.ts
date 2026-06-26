import { type ReactNode } from 'react';

import { type Toned } from '../tone';

// Typed typography for the generic UI layer. Text renders a single run of
// content at a named semantic role, driving font size/weight/color/letter
// spacing purely from --portal-* tokens. The component is non-interactive: it
// has no focus target, no motion, and no pointer behaviour. The accent role is
// the only tone-aware role; it reads the derived --portal-tone-accent var so a
// consumer can color a callout by passing a tone seed. Every role maps to a
// sensible default semantic element, which the `as` prop can override when the
// visual role and the document semantics need to differ.

// Presentation role for the text run. An E-prefixed const-object enum (not the
// banned `enum` keyword) whose kebab-free string values double as the data-role
// attribute the CSS keys off. The set mirrors Helicon's TextRole shorthands:
// heading, body, section label, secondary, dim, accent, mono (codex), styled.
export const ETextRole: {
    readonly Heading: 'heading';
    readonly Body: 'body';
    readonly Section: 'section';
    readonly Secondary: 'secondary';
    readonly Dim: 'dim';
    readonly Accent: 'accent';
    readonly Mono: 'mono';
    readonly Styled: 'styled';
} = {
    Heading: 'heading',
    Body: 'body',
    Section: 'section',
    Secondary: 'secondary',
    Dim: 'dim',
    Accent: 'accent',
    Mono: 'mono',
    Styled: 'styled',
};
export type ETextRole = (typeof ETextRole)[keyof typeof ETextRole];

// Heading level for the heading role, constrained to the valid h1-h6 range. The
// resolved element is one of h1..h6 so the level switch stays exhaustive and the
// tag name is never built by string interpolation. Defaults to 2.
export type TextHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

// The curated set of intrinsic elements Text can render. Keeping the polymorphic
// `as` prop to a closed union (rather than an open `keyof JSX.IntrinsicElements`)
// keeps the render strict and lets the CSS rely on the data-role attribute, not
// the tag, for styling.
export type TextElement =
    | 'p'
    | 'span'
    | 'div'
    | 'label'
    | 'small'
    | 'strong'
    | 'em'
    | 'code'
    | 'pre'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6';

// Props for the Text typography primitive.
//
// `role` selects the visual role and the default semantic element (defaults to
// body). `as` overrides the rendered element without changing the role styling.
// `level` only applies to the heading role and picks the heading depth. `tone`
// flows through the shared tone scope and is consumed by the accent role only.
// `children` is the rendered content.
export type TextProps = Readonly<{
    role?: ETextRole;
    as?: TextElement;
    level?: TextHeadingLevel;
    children: ReactNode;
}> &
    Toned;
