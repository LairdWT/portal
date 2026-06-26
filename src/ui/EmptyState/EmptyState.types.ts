import { type ReactNode } from 'react';

import { type EUiStatus, type Toned } from '../tone';

// Landmark/role for the EmptyState root. An E-prefixed const-object enum (not the
// `enum` keyword) whose string values double as the ARIA role applied to the
// root. Status is a live region that announces the placeholder when it appears
// after data drains; Region is a named landmark for a statically empty area.
// Both are given an accessible name via aria-labelledby wired to the title.
export const EEmptyStateRole: {
    readonly Status: 'status';
    readonly Region: 'region';
} = {
    Status: 'status',
    Region: 'region',
};
export type EEmptyStateRole =
    (typeof EEmptyStateRole)[keyof typeof EEmptyStateRole];

// Heading level for the EmptyState title, constrained to the section-nesting
// range the surrounding document allows. Defaults to 2.
export type EmptyStateHeadingLevel = 2 | 3 | 4;

// Props for the EmptyState placeholder.
//
// EmptyState is the centered placeholder shown when a region has no data: an
// optional decorative `icon` slot, a required `title` (rendered as a heading at
// `headingLevel` and used as the root's accessible name), an optional
// `description`, and an optional `action` slot (for example a CTA). `role`
// selects the root semantics (status live region by default, or a region
// landmark). The universal `status` overrides the tone seed via data-status, and
// the Toned mixin carries the opaque `tone` color the root applies. The
// component is non-interactive itself; any pointer target lives in `action`.
export type EmptyStateProps = Readonly<
    {
        title: ReactNode;
        description?: ReactNode;
        icon?: ReactNode;
        action?: ReactNode;
        headingLevel?: EmptyStateHeadingLevel;
        role?: EEmptyStateRole;
        status?: EUiStatus;
    } & Toned
>;
