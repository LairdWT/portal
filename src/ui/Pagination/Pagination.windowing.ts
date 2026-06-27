// Pure, React-free windowing model for Pagination (zero React imports). A direct
// port of Helicon's `PaginationStatus::new` + edge predicates and `visible_pages`
// (src/pagination.rs), in 1-based page numbers (divergence D1). Keeping the logic
// here decouples it from render, keeps the component module's exports
// fast-refresh pure, and lets the math be unit-tested in isolation. The precedent
// is `Popover.position.ts`. This module is internal: it is not barrel-exported.

import {
    EPaginationEdge,
    EPaginationEntryKind,
    type PaginationEntry,
} from './Pagination.types';

// The default window radius around the current page, equal to Helicon's
// PAGE_WINDOW_RADIUS.
export const DEFAULT_SIBLING_COUNT: number = 2;

// The normalized navigator model: a clamped 1-based current page, the page count,
// the boundary edge state, and the prev/next enabled predicates.
export type PaginationModel = Readonly<{
    currentPage: number;
    pageCount: number;
    edge: EPaginationEdge;
    previousEnabled: boolean;
    nextEnabled: boolean;
}>;

// Clamps a 1-based page request into [1, pageCount].
function clampPage(page: number, pageCount: number): number {
    if (page < 1) {
        return 1;
    }
    if (page > pageCount) {
        return pageCount;
    }
    return page;
}

// Clamp + edge classification (mirrors `PaginationStatus::new` and the
// previous/next enabled predicates), in 1-based page numbers.
export function resolvePaginationModel(
    currentPage: number,
    pageCount: number,
): PaginationModel {
    if (pageCount <= 0) {
        return {
            currentPage: 1,
            pageCount: 0,
            edge: EPaginationEdge.Empty,
            previousEnabled: false,
            nextEnabled: false,
        };
    }
    if (pageCount === 1) {
        return {
            currentPage: 1,
            pageCount: 1,
            edge: EPaginationEdge.SinglePage,
            previousEnabled: false,
            nextEnabled: false,
        };
    }

    const clamped: number = clampPage(currentPage, pageCount);
    if (clamped === 1) {
        return {
            currentPage: clamped,
            pageCount,
            edge: EPaginationEdge.FirstPage,
            previousEnabled: false,
            nextEnabled: true,
        };
    }
    if (clamped === pageCount) {
        return {
            currentPage: clamped,
            pageCount,
            edge: EPaginationEdge.LastPage,
            previousEnabled: true,
            nextEnabled: false,
        };
    }
    return {
        currentPage: clamped,
        pageCount,
        edge: EPaginationEdge.MiddlePage,
        previousEnabled: true,
        nextEnabled: true,
    };
}

// Windowed run (mirrors `visible_pages`): the first page, the last page, and
// every page within `siblingCount` of the clamped current page are present; a gap
// entry is inserted whenever an included page is not adjacent to the previously
// included page (so a single hidden page still yields a gap - divergence D3). A
// negative `siblingCount` is treated as 0 so the run never crashes.
export function windowedPages(
    currentPage: number,
    pageCount: number,
    siblingCount: number,
): readonly PaginationEntry[] {
    if (pageCount <= 0) {
        return [];
    }

    const clampedCurrent: number = clampPage(currentPage, pageCount);
    const radius: number = siblingCount < 0 ? 0 : siblingCount;
    const entries: PaginationEntry[] = [];
    let previous: number | undefined = undefined;

    for (let page: number = 1; page <= pageCount; page += 1) {
        const withinWindow: boolean = Math.abs(page - clampedCurrent) <= radius;
        if (page !== 1 && page !== pageCount && !withinWindow) {
            continue;
        }
        if (previous !== undefined && page > previous + 1) {
            entries.push({
                kind: EPaginationEntryKind.Gap,
                id: `gap-${String(previous)}-${String(page)}`,
            });
        }
        entries.push({ kind: EPaginationEntryKind.Page, page });
        previous = page;
    }

    return entries;
}
