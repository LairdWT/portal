// Breadcrumb: a domain-agnostic path-trail navigation landmark for the generic
// UI layer. The trail is an ordered list of crumbs, root-first; every crumb
// except the last is a clickable ancestor, and the last crumb is the current
// location, rendered inert with aria-current="page". Navigation is reported as a
// plain callback (Portal ships no router), mirroring the Tabs onChange shape and
// Helicon's Some(index) ancestor click. See Breadcrumb.tsx for the WAI-ARIA
// breadcrumb pattern (nav landmark + <ol>), keyboard, and the collapsible
// overflow built on the shared Popover primitive.

import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type EUiStatus, type Toned } from '../tone';

// Per-crumb presentation state. An E-prefixed const-object enum so the two
// distinct visual states are a named member set; the kebab values double as the
// data-state attribute the CSS reads. Current is paired with aria-current="page"
// so the active node is never conveyed by tone color alone (mirrors ETabState).
export const EBreadcrumbCrumbState: {
    readonly Link: 'link';
    readonly Current: 'current';
} = { Link: 'link', Current: 'current' };
export type EBreadcrumbCrumbState =
    (typeof EBreadcrumbCrumbState)[keyof typeof EBreadcrumbCrumbState];

// One node in the trail. `id` is an opaque consumer identity reported through
// onNavigate; `label` is arbitrary renderable content (ReactNode, so an icon +
// text composition needs no icon dependency). `onNavigate` is the per-item
// navigation hook; it is absent on the current (last) node, which is inert.
export type BreadcrumbItem = Readonly<{
    id: string;
    label: ReactNode;
    onNavigate?: () => void;
}>;

// Props for the Breadcrumb: a domain-agnostic path trail.
//
// `items` is the ordered trail, root-first; the last item is the current
// location and is rendered inert with aria-current="page". `onNavigate` is the
// aggregate callback (Helicon's Some(index) shape) fired with the activated
// node id and index; a per-item onNavigate, when present, fires first. `label`
// is the nav landmark accessible name (default "Breadcrumb"). `maxVisible`
// opts into middle-collapse when the trail is longer than it (>= 2 to keep the
// root and tail); `overflowLabel` overrides the collapsed control's name.
// `status` routes the universal danger/success seed through the tone scope;
// `enabled` resolves through useResolvedEnabled; `tone` flows through the shared
// tone scope and tints the link/current accents.
export type BreadcrumbProps = Readonly<
    {
        items: readonly BreadcrumbItem[];
        onNavigate?: (id: string, index: number) => void;
        label?: string;
        maxVisible?: number;
        overflowLabel?: string;
        status?: EUiStatus;
        enabled?: EEnabledState;
    } & Toned
>;
