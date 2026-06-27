import {
    type CSSProperties,
    type ReactElement,
    type ReactNode,
    useMemo,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { type EEnabledState } from '../../state/state';
import { EmptyState } from '../EmptyState/EmptyState';
import { SearchBox } from '../SearchBox/SearchBox';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import { List } from './List';
import { EListSelectionMode } from './List.types';
import styles from './SearchableList.module.css';
import { type SearchableListProps } from './SearchableList.types';

// The accessible name of the detail region. Kept as a constant so the component
// and its tests agree on the exact label without duplicating the literal.
const DETAIL_LABEL: string = 'Selection detail';

export function SearchableList<Item>(
    props: SearchableListProps<Item>,
): ReactElement {
    const {
        items,
        getItemKey,
        renderItem,
        getFilterText,
        query,
        onQueryChange,
        selectedKey = null,
        onSelectedKeyChange,
        renderDetail,
        rowHeight,
        overscan,
        searchLabel,
        searchPlaceholder,
        listLabel,
        emptyContent,
        noMatchesContent,
        enabled,
        status = EUiStatus.None,
        tone,
    }: SearchableListProps<Item> = props;

    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const hasDetail: boolean = renderDetail !== undefined;

    // Case-insensitive contains over getFilterText - exactly Helicon's
    // searchable_filter_predicate (needle.is_empty() || label.contains(needle)).
    // Memoized on items + query + the getFilterText identity.
    const filtered: readonly Item[] = useMemo((): readonly Item[] => {
        const needle: string = query.trim().toLowerCase();
        if (needle.length === 0) {
            return items;
        }
        return items.filter((item: Item): boolean =>
            getFilterText(item).toLowerCase().includes(needle),
        );
    }, [items, query, getFilterText]);

    // The selected item resolved from the controlled key, used to drive the
    // detail column. null when nothing is selected.
    const selectedItem: Item | null = useMemo((): Item | null => {
        if (selectedKey === null) {
            return null;
        }
        const found: Item | undefined = items.find(
            (item: Item, index: number): boolean =>
                getItemKey(item, index) === selectedKey,
        );
        return found ?? null;
    }, [items, selectedKey, getItemKey]);

    const selectedKeys: readonly string[] =
        selectedKey !== null ? [selectedKey] : [];

    // Map the inner List's one-element selection back to the single-key contract.
    function handleSelectionChange(keys: readonly string[]): void {
        const next: string | undefined = keys[0];
        onSelectedKeyChange?.(next ?? null);
    }

    // Empty / no-matches split: when there are no items at all show emptyContent
    // ("No rows."); when items exist but the filter excludes them all show
    // noMatchesContent ("No matches."). The inner List renders the placeholder we
    // hand it whenever its (filtered) item set is empty.
    const listEmptyContent: ReactNode =
        items.length === 0
            ? (emptyContent ?? <EmptyState title="No rows." />)
            : (noMatchesContent ?? <EmptyState title="No matches." />);

    const rootClassName: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    const rootStyle: CSSProperties = toneProperties(tone);

    return (
        <div
            className={rootClassName}
            style={rootStyle}
            data-status={status}
            data-enabled={resolvedEnabled}
            data-detail={hasDetail ? 'true' : 'false'}
        >
            <div className={styles.listColumn}>
                <SearchBox
                    label={searchLabel}
                    value={query}
                    onChange={onQueryChange}
                    {...(searchPlaceholder !== undefined
                        ? { placeholder: searchPlaceholder }
                        : {})}
                    {...(enabled !== undefined ? { enabled } : {})}
                    {...(tone !== undefined ? { tone } : {})}
                />
                <List<Item>
                    label={listLabel ?? searchLabel}
                    items={filtered}
                    getItemKey={getItemKey}
                    renderItem={renderItem}
                    selectionMode={EListSelectionMode.Single}
                    selectedKeys={selectedKeys}
                    onSelectionChange={handleSelectionChange}
                    emptyContent={listEmptyContent}
                    {...(rowHeight !== undefined ? { rowHeight } : {})}
                    {...(overscan !== undefined ? { overscan } : {})}
                    {...(enabled !== undefined ? { enabled } : {})}
                    status={status}
                    {...(tone !== undefined ? { tone } : {})}
                />
            </div>
            {renderDetail !== undefined ? (
                <div
                    className={styles.detail}
                    role="region"
                    aria-label={DETAIL_LABEL}
                >
                    {renderDetail(selectedItem)}
                </div>
            ) : null}
        </div>
    );
}
