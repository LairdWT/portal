import { type ReactElement } from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Pagination.module.css';
import {
    EPaginationEdge,
    EPaginationEntryKind,
    EPaginationPageState,
    type PaginationEntry,
    type PaginationProps,
} from './Pagination.types';
import {
    DEFAULT_SIBLING_COUNT,
    type PaginationModel,
    resolvePaginationModel,
    windowedPages,
} from './Pagination.windowing';

// Default visible labels and the fixed accessible-name templates. Module-level
// consts mirror Helicon's PREVIOUS_LABEL / NEXT_LABEL / GAP_LABEL. The gap glyph
// is three ASCII periods (never U+2026) and is hidden from assistive tech, so the
// numbered buttons carry position.
const DEFAULT_LABEL: string = 'Pagination';
const PREVIOUS_LABEL: string = 'Prev';
const NEXT_LABEL: string = 'Next';
const GAP_GLYPH: string = '...';
const PREVIOUS_ACCESSIBLE_LABEL: string = 'Go to previous page';
const NEXT_ACCESSIBLE_LABEL: string = 'Go to next page';

function defaultPageAccessibleLabel(page: number, isCurrent: boolean): string {
    const pageText: string = String(page);
    return isCurrent ? `Page ${pageText}` : `Go to page ${pageText}`;
}

export function Pagination({
    currentPage,
    pageCount,
    onChange,
    siblingCount = DEFAULT_SIBLING_COUNT,
    label = DEFAULT_LABEL,
    labelledBy,
    previousLabel = PREVIOUS_LABEL,
    nextLabel = NEXT_LABEL,
    previousAccessibleLabel = PREVIOUS_ACCESSIBLE_LABEL,
    nextAccessibleLabel = NEXT_ACCESSIBLE_LABEL,
    pageAccessibleLabel = defaultPageAccessibleLabel,
    enabled,
    tone,
}: PaginationProps): ReactElement | null {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const model: PaginationModel = resolvePaginationModel(currentPage, pageCount);

    // Negative-first guard: an empty navigator renders nothing (Helicon's
    // `total_pages == 0 -> None`). The hook above ran unconditionally first.
    if (model.edge === EPaginationEdge.Empty) {
        return null;
    }

    // Navigation handlers: negative-first guards with early return, no-op on any
    // inert request (D2 inert-on-current). No effects, timers, listeners, or
    // pointer captures are created, so there is nothing to clean up.
    function goto(page: number): void {
        if (isDisabled) {
            return;
        }
        if (page === model.currentPage) {
            return;
        }
        if (page < 1 || page > model.pageCount) {
            return;
        }
        onChange?.(page);
    }

    function goToPrevious(): void {
        if (isDisabled || !model.previousEnabled) {
            return;
        }
        goto(model.currentPage - 1);
    }

    function goToNext(): void {
        if (isDisabled || !model.nextEnabled) {
            return;
        }
        goto(model.currentPage + 1);
    }

    const entries: readonly PaginationEntry[] = windowedPages(
        model.currentPage,
        model.pageCount,
        Math.max(0, siblingCount),
    );

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <nav
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
            aria-label={labelledBy === undefined ? label : undefined}
            aria-labelledby={labelledBy}
        >
            <ul className={styles.list}>
                <li className={styles.item}>
                    <button
                        type="button"
                        className={styles.control}
                        data-control="prev"
                        data-enabled={resolvedEnabled}
                        disabled={isDisabled || !model.previousEnabled}
                        aria-label={previousAccessibleLabel}
                        onClick={(): void => {
                            goToPrevious();
                        }}
                    >
                        <span className={styles.label}>{previousLabel}</span>
                    </button>
                </li>

                {entries.map((entry: PaginationEntry): ReactElement => {
                    switch (entry.kind) {
                        case EPaginationEntryKind.Gap:
                            return (
                                <li
                                    key={entry.id}
                                    className={styles.gap}
                                    aria-hidden="true"
                                >
                                    {GAP_GLYPH}
                                </li>
                            );
                        case EPaginationEntryKind.Page: {
                            const isCurrent: boolean =
                                entry.page === model.currentPage;
                            const pageState: EPaginationPageState = isCurrent
                                ? EPaginationPageState.Current
                                : EPaginationPageState.Idle;
                            return (
                                <li
                                    key={`page-${String(entry.page)}`}
                                    className={styles.item}
                                >
                                    <button
                                        type="button"
                                        className={styles.page}
                                        data-state={pageState}
                                        data-enabled={resolvedEnabled}
                                        disabled={isDisabled}
                                        aria-current={
                                            isCurrent ? 'page' : undefined
                                        }
                                        aria-label={pageAccessibleLabel(
                                            entry.page,
                                            isCurrent,
                                        )}
                                        onClick={(): void => {
                                            goto(entry.page);
                                        }}
                                    >
                                        {entry.page}
                                    </button>
                                </li>
                            );
                        }
                    }
                })}

                <li className={styles.item}>
                    <button
                        type="button"
                        className={styles.control}
                        data-control="next"
                        data-enabled={resolvedEnabled}
                        disabled={isDisabled || !model.nextEnabled}
                        aria-label={nextAccessibleLabel}
                        onClick={(): void => {
                            goToNext();
                        }}
                    >
                        <span className={styles.label}>{nextLabel}</span>
                    </button>
                </li>
            </ul>
        </nav>
    );
}
