import { describe, expect, it } from 'vitest';

import {
    EPaginationEdge,
    EPaginationEntryKind,
    type PaginationEntry,
} from './Pagination.types';
import {
    DEFAULT_SIBLING_COUNT,
    type PaginationModel,
    resolvePaginationModel,
    windowedPages,
} from './Pagination.windowing';

// Collects the 1-based page numbers from a windowed run, dropping gaps.
function pageNumbers(entries: readonly PaginationEntry[]): readonly number[] {
    const numbers: number[] = [];
    for (const entry of entries) {
        if (entry.kind === EPaginationEntryKind.Page) {
            numbers.push(entry.page);
        }
    }
    return numbers;
}

// Collects the stable gap ids from a windowed run, in order.
function gapIds(entries: readonly PaginationEntry[]): readonly string[] {
    const ids: string[] = [];
    for (const entry of entries) {
        if (entry.kind === EPaginationEntryKind.Gap) {
            ids.push(entry.id);
        }
    }
    return ids;
}

describe('resolvePaginationModel', (): void => {
    it('classifies an empty page count as Empty with both controls off', (): void => {
        const model: PaginationModel = resolvePaginationModel(3, 0);
        expect(model.edge).toBe(EPaginationEdge.Empty);
        expect(model.previousEnabled).toBe(false);
        expect(model.nextEnabled).toBe(false);
    });

    it('classifies a single page as SinglePage with both controls off', (): void => {
        const model: PaginationModel = resolvePaginationModel(1, 1);
        expect(model.edge).toBe(EPaginationEdge.SinglePage);
        expect(model.previousEnabled).toBe(false);
        expect(model.nextEnabled).toBe(false);
    });

    it('classifies the first page with previous off and next on', (): void => {
        const model: PaginationModel = resolvePaginationModel(1, 5);
        expect(model.edge).toBe(EPaginationEdge.FirstPage);
        expect(model.previousEnabled).toBe(false);
        expect(model.nextEnabled).toBe(true);
    });

    it('classifies a middle page with both controls on', (): void => {
        const model: PaginationModel = resolvePaginationModel(3, 5);
        expect(model.edge).toBe(EPaginationEdge.MiddlePage);
        expect(model.previousEnabled).toBe(true);
        expect(model.nextEnabled).toBe(true);
    });

    it('classifies the last page with previous on and next off', (): void => {
        const model: PaginationModel = resolvePaginationModel(5, 5);
        expect(model.edge).toBe(EPaginationEdge.LastPage);
        expect(model.previousEnabled).toBe(true);
        expect(model.nextEnabled).toBe(false);
    });

    it('clamps an out-of-range current page to the last page', (): void => {
        const model: PaginationModel = resolvePaginationModel(99, 5);
        expect(model.currentPage).toBe(5);
        expect(model.edge).toBe(EPaginationEdge.LastPage);
    });

    it('clamps a below-range current page to the first page', (): void => {
        const model: PaginationModel = resolvePaginationModel(0, 5);
        expect(model.currentPage).toBe(1);
        expect(model.edge).toBe(EPaginationEdge.FirstPage);
    });
});

describe('windowedPages', (): void => {
    it('is empty for an empty page count', (): void => {
        expect(windowedPages(1, 0, DEFAULT_SIBLING_COUNT)).toEqual([]);
    });

    it('shows every page with no gap for a small count', (): void => {
        const entries: readonly PaginationEntry[] = windowedPages(3, 5, 2);
        expect(entries).toEqual([
            { kind: EPaginationEntryKind.Page, page: 1 },
            { kind: EPaginationEntryKind.Page, page: 2 },
            { kind: EPaginationEntryKind.Page, page: 3 },
            { kind: EPaginationEntryKind.Page, page: 4 },
            { kind: EPaginationEntryKind.Page, page: 5 },
        ]);
        expect(gapIds(entries)).toEqual([]);
    });

    it('windows a large count to first, band, and last with two gaps', (): void => {
        const entries: readonly PaginationEntry[] = windowedPages(
            12,
            24,
            DEFAULT_SIBLING_COUNT,
        );
        expect(pageNumbers(entries)).toEqual([1, 10, 11, 12, 13, 14, 24]);
        expect(gapIds(entries)).toEqual(['gap-1-10', 'gap-14-24']);
    });

    it('always keeps the first and last page present', (): void => {
        const numbers: readonly number[] = pageNumbers(windowedPages(12, 24, 2));
        expect(numbers[0]).toBe(1);
        expect(numbers[numbers.length - 1]).toBe(24);
    });

    it('shows a gap even when exactly one page is hidden (D3)', (): void => {
        const entries: readonly PaginationEntry[] = windowedPages(1, 4, 1);
        expect(entries).toEqual([
            { kind: EPaginationEntryKind.Page, page: 1 },
            { kind: EPaginationEntryKind.Page, page: 2 },
            { kind: EPaginationEntryKind.Gap, id: 'gap-2-4' },
            { kind: EPaginationEntryKind.Page, page: 4 },
        ]);
    });

    it('gives the left and right gaps distinct stable ids', (): void => {
        const ids: readonly string[] = gapIds(windowedPages(12, 24, 2));
        expect(new Set<string>(ids).size).toBe(ids.length);
        expect(ids).toHaveLength(2);
    });

    it('collapses to first, current, and last at radius 0', (): void => {
        const entries: readonly PaginationEntry[] = windowedPages(3, 5, 0);
        expect(pageNumbers(entries)).toEqual([1, 3, 5]);
        expect(gapIds(entries)).toEqual(['gap-1-3', 'gap-3-5']);
    });

    it('treats a negative radius as 0', (): void => {
        expect(windowedPages(3, 5, -1)).toEqual(windowedPages(3, 5, 0));
    });

    it('widens the band with a larger radius', (): void => {
        expect(pageNumbers(windowedPages(5, 9, 3))).toEqual([
            1, 2, 3, 4, 5, 6, 7, 8, 9,
        ]);
    });
});
