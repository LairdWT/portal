import {
    type CSSProperties,
    type Dispatch,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
    type ReactNode,
    type RefObject,
    type SetStateAction,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import {
    useVirtualWindow,
    type VirtualWindowState,
} from '../../react/hooks/useVirtualWindow';
import { EEnabledState } from '../../state/state';
import { EmptyState } from '../EmptyState/EmptyState';
import { EOverlayMotion } from '../overlayMotion';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './List.module.css';
import {
    EListRowState,
    EListSelectionMode,
    type ListProps,
    type ListRowRenderState,
} from './List.types';

// Fixed virtualization row height in px. 48 equals --portal-touch-target-min
// (3rem), so a selectable row also clears the pointer touch floor. Surfaced to
// CSS as the per-row inline block-size / translate, never authored in the module.
const ROW_HEIGHT_DEFAULT: number = 48;

// Type-ahead buffer reset window, matching the Select precedent.
const TYPEAHEAD_RESET_MS: number = 500;

// String-typed custom-property key (not a string literal) so the computed key
// satisfies CSSProperties, matching the --portal-tone / --portal-datatable-*
// precedent.
const MAX_BLOCK_PROPERTY: string = '--portal-list-max';

// Shared frozen empty selection so the absent-selection path does not allocate a
// Set per render.
const EMPTY_KEYS: readonly string[] = [];

// The pointer / keyboard modifier snapshot a selection activation reads.
type SelectionModifiers = Readonly<{
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
}>;

// First enabled-by-construction index whose type-ahead text starts with the
// query (case-insensitive), searched forward from fromIndex with wrap. List rows
// carry no per-item disabled flag, so every row is a candidate. Returns -1 when
// nothing matches.
function findTypeAheadIndex<Item>(
    items: readonly Item[],
    resolveText: (item: Item) => string,
    query: string,
    fromIndex: number,
): number {
    const count: number = items.length;
    if (count === 0) {
        return -1;
    }
    const lower: string = query.toLowerCase();
    for (let offset: number = 1; offset <= count; offset += 1) {
        const index: number = (((fromIndex + offset) % count) + count) % count;
        const item: Item | undefined = items[index];
        if (item === undefined) {
            continue;
        }
        if (resolveText(item).toLowerCase().startsWith(lower)) {
            return index;
        }
    }
    return -1;
}

export function List<Item>(props: ListProps<Item>): ReactElement {
    const {
        items,
        getItemKey,
        renderItem,
        rowHeight = ROW_HEIGHT_DEFAULT,
        overscan,
        selectionMode = EListSelectionMode.None,
        selectedKeys,
        onSelectionChange,
        getTypeAheadText,
        enabled,
        status = EUiStatus.None,
        emptyContent,
        maxBlockSize,
        tone,
    }: ListProps<Item> = props;
    const label: string | undefined = 'label' in props ? props.label : undefined;
    const labelledBy: string | undefined =
        'labelledBy' in props ? props.labelledBy : undefined;

    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const reducedMotion: boolean = useReducedMotion();
    const motion: EOverlayMotion = reducedMotion
        ? EOverlayMotion.Reduced
        : EOverlayMotion.Full;

    const listId: string = useId();
    const viewportRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const rangeAnchorRef: RefObject<number | null> = useRef<number | null>(null);
    const bufferRef: RefObject<string> = useRef<string>('');
    const typeaheadTimerRef: RefObject<number | null> = useRef<number | null>(null);

    const [rawActiveIndex, setRawActiveIndex]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>(0);

    const isInteractive: boolean = selectionMode !== EListSelectionMode.None;
    const isEmpty: boolean = items.length === 0;
    const lastIndex: number = items.length - 1;
    const activeIndex: number = isEmpty
        ? -1
        : Math.min(Math.max(rawActiveIndex, 0), lastIndex);
    const resolvedRowHeight: number = rowHeight;

    const selectedSet: ReadonlySet<string> = useMemo(
        (): ReadonlySet<string> => new Set<string>(selectedKeys ?? EMPTY_KEYS),
        [selectedKeys],
    );

    const virtualWindow: VirtualWindowState = useVirtualWindow({
        rowCount: items.length,
        rowHeight: resolvedRowHeight,
        scrollRef: viewportRef,
        ...(overscan !== undefined ? { overscan } : {}),
    });

    const clearTypeaheadTimer: () => void = useCallback((): void => {
        if (typeaheadTimerRef.current !== null) {
            window.clearTimeout(typeaheadTimerRef.current);
            typeaheadTimerRef.current = null;
        }
    }, []);

    // Clear a pending type-ahead reset timer on unmount. clearTypeaheadTimer is
    // stable, so this runs its cleanup exactly once on unmount.
    useEffect((): (() => void) => clearTypeaheadTimer, [clearTypeaheadTimer]);

    // Keep the active row scrolled into the visible band. Reading/writing
    // scrollTop fires the hook's scroll path, which recomputes the window; the
    // force-include below covers the one-frame gap meanwhile. No listeners are
    // attached, so the effect needs no cleanup. Instant (not smooth) scroll, so it
    // is reduced-motion safe without a behavior gate.
    useLayoutEffect((): void => {
        if (activeIndex < 0) {
            return;
        }
        const element: HTMLDivElement | null = viewportRef.current;
        if (element === null) {
            return;
        }
        const rowTop: number = activeIndex * resolvedRowHeight;
        const rowBottom: number = rowTop + resolvedRowHeight;
        const viewTop: number = element.scrollTop;
        const viewBottom: number = viewTop + element.clientHeight;
        if (rowTop < viewTop) {
            element.scrollTop = rowTop;
            return;
        }
        if (rowBottom > viewBottom) {
            element.scrollTop = rowBottom - element.clientHeight;
        }
    }, [activeIndex, resolvedRowHeight]);

    function rangeKeys(anchor: number, focus: number): readonly string[] {
        const start: number = Math.min(anchor, focus);
        const end: number = Math.max(anchor, focus);
        const keys: string[] = [];
        for (let index: number = start; index <= end; index += 1) {
            const item: Item | undefined = items[index];
            if (item !== undefined) {
                keys.push(getItemKey(item, index));
            }
        }
        return keys;
    }

    function toggleKey(
        current: ReadonlySet<string>,
        key: string,
    ): readonly string[] {
        const next: Set<string> = new Set<string>(current);
        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }
        return [...next];
    }

    function handleRowActivate(index: number, modifiers: SelectionModifiers): void {
        if (isDisabled) {
            return;
        }
        if (selectionMode === EListSelectionMode.None) {
            return;
        }
        const item: Item | undefined = items[index];
        if (item === undefined) {
            return;
        }
        const key: string = getItemKey(item, index);
        if (selectionMode === EListSelectionMode.Single) {
            onSelectionChange?.([key]);
            rangeAnchorRef.current = index;
            setRawActiveIndex(index);
            return;
        }
        const anchor: number | null = rangeAnchorRef.current;
        if (modifiers.shiftKey && anchor !== null) {
            onSelectionChange?.(rangeKeys(anchor, index));
        } else {
            onSelectionChange?.(toggleKey(selectedSet, key));
            rangeAnchorRef.current = index;
        }
        setRawActiveIndex(index);
    }

    // A directly-assigned (named) pointer handler rather than an inline arrow: it
    // reads the absolute row index from the row's data attribute and delegates to
    // handleRowActivate. Routing the selection-anchor ref access through a named
    // event handler keeps that ref access out of a render-created closure.
    function handleRowPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
        const indexAttribute: string | undefined =
            event.currentTarget.dataset.index;
        if (indexAttribute === undefined) {
            return;
        }
        handleRowActivate(Number(indexAttribute), {
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
        });
    }

    function moveActive(nextIndex: number, extend: boolean): void {
        if (isEmpty) {
            return;
        }
        const clamped: number = Math.min(Math.max(nextIndex, 0), lastIndex);
        if (extend && selectionMode === EListSelectionMode.Multiple) {
            const anchor: number = rangeAnchorRef.current ?? activeIndex;
            rangeAnchorRef.current = anchor;
            onSelectionChange?.(rangeKeys(anchor, clamped));
        }
        setRawActiveIndex(clamped);
    }

    function activateActive(modifiers: SelectionModifiers): void {
        if (selectionMode === EListSelectionMode.None) {
            return;
        }
        if (activeIndex < 0) {
            return;
        }
        handleRowActivate(activeIndex, modifiers);
    }

    function handleTypeAhead(key: string): void {
        const resolveText: ((item: Item) => string) | undefined = getTypeAheadText;
        if (resolveText === undefined) {
            return;
        }
        clearTypeaheadTimer();
        const wasEmpty: boolean = bufferRef.current.length === 0;
        const query: string = bufferRef.current + key;
        bufferRef.current = query;
        typeaheadTimerRef.current = window.setTimeout((): void => {
            bufferRef.current = '';
            typeaheadTimerRef.current = null;
        }, TYPEAHEAD_RESET_MS);
        const fromIndex: number = wasEmpty ? activeIndex : activeIndex - 1;
        const match: number = findTypeAheadIndex(
            items,
            resolveText,
            query,
            fromIndex,
        );
        if (match >= 0) {
            setRawActiveIndex(match);
        }
    }

    function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
        if (isDisabled) {
            return;
        }
        if (isEmpty) {
            return;
        }
        const modifiers: SelectionModifiers = {
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
        };
        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                moveActive(activeIndex + 1, event.shiftKey);
                return;
            }
            case 'ArrowUp': {
                event.preventDefault();
                moveActive(activeIndex - 1, event.shiftKey);
                return;
            }
            case 'Home': {
                event.preventDefault();
                moveActive(0, false);
                return;
            }
            case 'End': {
                event.preventDefault();
                moveActive(lastIndex, false);
                return;
            }
            case 'Enter':
            case ' ': {
                event.preventDefault();
                activateActive(modifiers);
                return;
            }
            default: {
                if (
                    getTypeAheadText !== undefined &&
                    event.key.length === 1 &&
                    event.key !== ' '
                ) {
                    event.preventDefault();
                    handleTypeAhead(event.key);
                }
                return;
            }
        }
    }

    const rootClassName: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    const emptyClassName: string = [toneStyles.toneScope, styles.root, styles.empty]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    const rootStyle: CSSProperties = {
        ...toneProperties(tone),
        ...(maxBlockSize !== undefined
            ? { [MAX_BLOCK_PROPERTY]: maxBlockSize }
            : {}),
    };

    function rowDomId(key: string): string {
        return `${listId}-row-${key}`;
    }

    const activeKey: string | undefined =
        isInteractive && activeIndex >= 0
            ? getItemKey(items[activeIndex] as Item, activeIndex)
            : undefined;
    const activeDescendantId: string | undefined =
        activeKey !== undefined ? rowDomId(activeKey) : undefined;

    function renderRow(index: number): ReactElement {
        const item: Item = items[index] as Item;
        const key: string = getItemKey(item, index);
        const selected: boolean = isInteractive && selectedSet.has(key);
        const active: boolean = isInteractive && index === activeIndex;
        const renderState: ListRowRenderState = { index, selected, active };
        const content: ReactNode = renderItem(item, renderState);
        const rowStyle: CSSProperties = {
            transform: `translateY(${String(index * resolvedRowHeight)}px)`,
            blockSize: `${String(resolvedRowHeight)}px`,
        };

        if (selectionMode === EListSelectionMode.None) {
            return (
                <div
                    key={key}
                    role="listitem"
                    className={styles.row}
                    style={rowStyle}
                    data-state={EListRowState.Idle}
                    data-enabled={resolvedEnabled}
                >
                    {content}
                </div>
            );
        }

        return (
            <div
                key={key}
                id={rowDomId(key)}
                role="option"
                className={styles.row}
                style={rowStyle}
                aria-selected={selected}
                data-state={selected ? EListRowState.Selected : EListRowState.Idle}
                data-active={active ? 'true' : undefined}
                data-enabled={resolvedEnabled}
                data-index={index}
                onPointerDown={handleRowPointerDown}
            >
                {content}
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div
                ref={viewportRef}
                className={emptyClassName}
                style={rootStyle}
                data-status={status}
                data-enabled={resolvedEnabled}
                data-motion={motion}
            >
                {emptyContent ?? <EmptyState title="No rows." />}
            </div>
        );
    }

    const windowRows: ReactElement[] = [];
    for (
        let index: number = virtualWindow.startIndex;
        index < virtualWindow.endIndex;
        index += 1
    ) {
        windowRows.push(renderRow(index));
    }
    // Guarantee the active row's element exists for aria-activedescendant even
    // when it has scrolled out of the rendered window.
    const activeOutsideWindow: boolean =
        isInteractive &&
        activeIndex >= 0 &&
        (activeIndex < virtualWindow.startIndex ||
            activeIndex >= virtualWindow.endIndex);

    const body: ReactElement = (
        <div
            className={styles.sizer}
            style={{ blockSize: `${String(virtualWindow.totalSize)}px` }}
        >
            {windowRows}
            {activeOutsideWindow ? renderRow(activeIndex) : null}
        </div>
    );

    if (!isInteractive) {
        return (
            <div
                ref={viewportRef}
                role="list"
                className={rootClassName}
                style={rootStyle}
                {...(label !== undefined ? { 'aria-label': label } : {})}
                {...(labelledBy !== undefined
                    ? { 'aria-labelledby': labelledBy }
                    : {})}
                // A presentational list still scrolls when windowed; the scroll
                // viewport is made keyboard-focusable so the scrollable region is
                // reachable (axe scrollable-region-focusable) even though the rows
                // carry no selection. Disabled drops it from the tab order.
                tabIndex={isDisabled ? -1 : 0}
                data-status={status}
                data-enabled={resolvedEnabled}
                data-motion={motion}
            >
                {body}
            </div>
        );
    }

    return (
        <div
            ref={viewportRef}
            role="listbox"
            className={rootClassName}
            style={rootStyle}
            {...(label !== undefined ? { 'aria-label': label } : {})}
            {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
            {...(activeDescendantId !== undefined
                ? { 'aria-activedescendant': activeDescendantId }
                : {})}
            aria-multiselectable={
                selectionMode === EListSelectionMode.Multiple ? true : undefined
            }
            aria-disabled={isDisabled ? true : undefined}
            tabIndex={isDisabled ? -1 : 0}
            data-status={status}
            data-enabled={resolvedEnabled}
            data-motion={motion}
            onKeyDown={handleKeyDown}
        >
            {body}
        </div>
    );
}
