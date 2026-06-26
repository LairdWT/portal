import { type ReactNode } from 'react';

import { type EUiStatus, type Toned } from '../tone';

// Heading level for the Section title, constrained to the document-outline range
// a grouping heading occupies. Defaults to 2. Unlike Panel (which stops at 4),
// Section allows 2-6 so a deeply nested grouping can keep a correct outline.
export type SectionHeadingLevel = 2 | 3 | 4 | 5 | 6;

// Props for the Section primitive: a lightweight titled content grouping for the
// domain-agnostic UI layer.
//
// `title` is the required grouping label, rendered as a heading at the
// configured `headingLevel` and wired to the root via aria-labelledby so the
// <section> exposes a region landmark named by its title. `actions` is an
// optional slot rendered at the trailing edge of the header (for example a small
// control cluster) and accepts arbitrary content. `children` is the body. Unlike
// Panel, Section carries NO elevation or surface chrome - it is structure, not a
// card. The Toned mixin carries the opaque `tone` color the header accent and
// rule derive from; the universal `status` overrides the tone seed via the
// data-status attribute the tone scope reads.
export type SectionProps = Readonly<
    {
        title: ReactNode;
        headingLevel?: SectionHeadingLevel;
        actions?: ReactNode;
        status?: EUiStatus;
        children: ReactNode;
    } & Toned
>;
