// Pagination - a controlled page navigator for the generic UI layer.
//
// Contract: Pagination owns no page state. The consumer holds `currentPage` and
// the component reports the requested page through `onChange`, mirroring
// Helicon's stateless `pagination(ui, current_page, total_pages) -> Option<usize>`
// (src/pagination.rs). The deliberate, documented web-idiom divergences are:
//
// - D1 (1-based public API): `currentPage`, `pageCount`, and the `onChange`
//   target are 1-based to match the rendered numbers and `aria-current`, removing
//   the off-by-one trap of Helicon's zero-based indices. The windowing module
//   operates in 1-based page numbers directly; there is no internal base mixing.
// - D2 (current stays focusable): Helicon disables the current-page button; the
//   web a11y idiom keeps the current page perceivable and in the tab order with
//   `aria-current="page"`. It is a real button whose click is a no-op (`onChange`
//   is not fired for the current page).
// - D3 (single hidden page still collapses to a gap): a `...` marker is shown even
//   when exactly one page is hidden, preserving Helicon's `visible_pages` behavior.
//
// A11y model: a `<nav>` landmark (default accessible name 'Pagination', or
// `aria-labelledby` via `labelledBy`) wrapping a single `<ul>` of native
// `<button type="button">` controls. The current page carries `aria-current`
// redundantly with the visible tone-accent key and `data-state`, so state is
// never conveyed by color alone.

import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type Toned } from '../tone';

// User-visible boundary state of the navigator. Mirrors Helicon's
// `PaginationEdgeState` member-for-member and drives the prev/next disabled
// predicates. Modeled as an E-prefixed annotated const object plus a derived
// union (the required form: a bare `as const` carries no annotation and is
// rejected by `@typescript-eslint/typedef variableDeclaration`).
export const EPaginationEdge: {
    readonly Empty: 'empty';
    readonly SinglePage: 'single-page';
    readonly FirstPage: 'first-page';
    readonly MiddlePage: 'middle-page';
    readonly LastPage: 'last-page';
} = {
    Empty: 'empty',
    SinglePage: 'single-page',
    FirstPage: 'first-page',
    MiddlePage: 'middle-page',
    LastPage: 'last-page',
};
export type EPaginationEdge =
    (typeof EPaginationEdge)[keyof typeof EPaginationEdge];

// Kind discriminant for one entry in the windowed run. Internal render detail
// (not barrel-exported).
export const EPaginationEntryKind: {
    readonly Page: 'page';
    readonly Gap: 'gap';
} = {
    Page: 'page',
    Gap: 'gap',
};
export type EPaginationEntryKind =
    (typeof EPaginationEntryKind)[keyof typeof EPaginationEntryKind];

// Per-page presentation state. Internal; the kebab-case values double as the
// `data-state` attribute the CSS reads. `Current` is paired with `aria-current`
// so the active page is never conveyed by tone color alone.
export const EPaginationPageState: {
    readonly Current: 'current';
    readonly Idle: 'idle';
} = {
    Current: 'current',
    Idle: 'idle',
};
export type EPaginationPageState =
    (typeof EPaginationPageState)[keyof typeof EPaginationPageState];

// One entry in the windowed run. A discriminated union so impossible states are
// unrepresentable: a page entry carries its 1-based number; a gap carries a
// stable `id` so the left gap and the right gap of the band get distinct React
// keys. Internal render detail (not barrel-exported).
export type PaginationEntry =
    | { readonly kind: typeof EPaginationEntryKind.Page; readonly page: number }
    | { readonly kind: typeof EPaginationEntryKind.Gap; readonly id: string };

// Props for the controlled, domain-agnostic page navigator.
//
// `currentPage`/`pageCount` are 1-based; `pageCount` of 0 renders nothing.
// `onChange` reports the 1-based target and is fired only when the target differs
// from `currentPage` (D2). `siblingCount` is the window radius around the current
// page (default 2, = Helicon's PAGE_WINDOW_RADIUS). The accessible name defaults
// to 'Pagination'; `labelledBy` is an external-label escape hatch that wins over
// `label`. `enabled` is resolved through `useResolvedEnabled`; the native
// disabled attribute on each control derives from it. `tone` flows through the
// shared tone scope and drives the active page key only.
//
// The visible prev/next labels (`previousLabel`/`nextLabel`) are localizable, so
// the announced names are too: `previousAccessibleLabel`/`nextAccessibleLabel`
// override the prev/next aria-labels and `pageAccessibleLabel` builds each page
// button's aria-label. All three default to the English templates, so the
// announced name tracks a localized visible label when supplied and behavior is
// unchanged when omitted.
export type PaginationProps = Readonly<{
    currentPage: number;
    pageCount: number;
    onChange?: (page: number) => void;
    siblingCount?: number;
    label?: string;
    labelledBy?: string;
    previousLabel?: ReactNode;
    nextLabel?: ReactNode;
    previousAccessibleLabel?: string;
    nextAccessibleLabel?: string;
    pageAccessibleLabel?: (page: number, isCurrent: boolean) => string;
    enabled?: EEnabledState;
}> &
    Toned;
