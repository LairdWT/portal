import {
    type ChangeEvent as ReactChangeEvent,
    type CSSProperties,
    type Dispatch,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
    type ReactNode,
    type RefObject,
    type SetStateAction,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

import { useDismiss } from '../../react/hooks/useDismiss';
import { useFocusTrap } from '../../react/hooks/useFocusTrap';
import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { useScrollLock } from '../../react/hooks/useScrollLock';
import {
    useVirtualWindow,
    type VirtualWindowState,
} from '../../react/hooks/useVirtualWindow';
import { EEnabledState } from '../../state/state';
import { EmptyState } from '../EmptyState/EmptyState';
import { EOverlayMotion } from '../overlayMotion';
import { ensureOverlayRoot } from '../overlayRoot';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './CommandPalette.module.css';
import {
    type CommandPaletteProps,
    type CommandRow,
    ECommandFilterMode,
    ECommandRowKind,
} from './CommandPalette.types';
import { isCommandDisabled, resolveCommandRows } from './resolveCommandRows';
import {
    type ListboxNavigation,
    useListboxNavigation,
} from './useListboxNavigation';

// Fixed virtualization row height in px. 48 equals --portal-touch-target-min
// (3rem) so a row clears the pointer touch floor. Surfaced to CSS as the per-row
// inline block-size / translate, never authored in the module.
const ROW_HEIGHT_DEFAULT: number = 48;

// The accessible name of the clear control, shared with the tests.
const CLEAR_LABEL: string = 'Clear command filter';

// Render a label with its matched character ranges emphasised. The emphasis is a
// decorative enhancement; each option carries an explicit aria-label of the plain
// label, so the highlight markup never alters the accessible name.
function renderHighlightedLabel(
    label: string,
    ranges: readonly (readonly [number, number])[],
): ReactNode {
    if (ranges.length === 0) {
        return label;
    }
    const nodes: ReactNode[] = [];
    let cursor: number = 0;
    for (const [start, end] of ranges) {
        if (start > cursor) {
            nodes.push(
                <span key={`gap-${String(cursor)}`}>
                    {label.slice(cursor, start)}
                </span>,
            );
        }
        nodes.push(
            <span key={`hit-${String(start)}`} className={styles.match}>
                {label.slice(start, end)}
            </span>,
        );
        cursor = end;
    }
    if (cursor < label.length) {
        nodes.push(
            <span key={`tail-${String(cursor)}`}>{label.slice(cursor)}</span>,
        );
    }
    return nodes;
}

// The inner surface, mounted only while the palette is open. Mounting the
// windowing engine here (rather than in the always-rendered parent) means the
// useVirtualWindow layout effect runs fresh on every open with the live listbox
// element present, so the scroll listeners attach correctly each time.
type CommandPaletteSurfaceProps = Readonly<{
    panelRef: RefObject<HTMLDivElement | null>;
    inputRef: RefObject<HTMLInputElement | null>;
    baseId: string;
    motion: EOverlayMotion;
    resolvedEnabled: EEnabledState;
    isDisabled: boolean;
    status: EUiStatus;
    tone: string | undefined;
    label: string | undefined;
    labelledBy: string | undefined;
    commands: CommandPaletteProps['commands'];
    recentCommandIds: readonly string[] | undefined;
    query: string;
    onQueryChange: (query: string) => void;
    onSelect: (commandId: string) => void;
    filterMode: ECommandFilterMode;
    rowHeight: number;
    overscan: number | undefined;
    placeholder: string | undefined;
    emptyContent: ReactNode;
    noMatchesContent: ReactNode;
}>;

function CommandPaletteSurface(props: CommandPaletteSurfaceProps): ReactElement {
    const {
        panelRef,
        inputRef,
        baseId,
        motion,
        resolvedEnabled,
        isDisabled,
        status,
        tone,
        label,
        labelledBy,
        commands,
        recentCommandIds,
        query,
        onQueryChange,
        onSelect,
        filterMode,
        rowHeight,
        overscan,
        placeholder,
        emptyContent,
        noMatchesContent,
    }: CommandPaletteSurfaceProps = props;

    const listboxRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);

    const comboId: string = `${baseId}-combo`;
    const listboxId: string = `${baseId}-listbox`;

    function optionDomId(commandId: string): string {
        return `${baseId}-opt-${commandId}`;
    }

    const rows: readonly CommandRow[] = useMemo(
        (): readonly CommandRow[] =>
            resolveCommandRows(commands, recentCommandIds, query, filterMode),
        [commands, recentCommandIds, query, filterMode],
    );

    const enabledIndices: readonly number[] = useMemo((): readonly number[] => {
        const out: number[] = [];
        for (const row of rows) {
            if (row.kind !== ECommandRowKind.Option) {
                continue;
            }
            if (isCommandDisabled(row.command)) {
                continue;
            }
            out.push(row.index);
        }
        return out;
    }, [rows]);

    const navigation: ListboxNavigation = useListboxNavigation({
        optionIndices: enabledIndices,
        resetToken: query,
    });
    const activeIndex: number = navigation.activeIndex;

    const virtualWindow: VirtualWindowState = useVirtualWindow({
        rowCount: rows.length,
        rowHeight,
        scrollRef: listboxRef,
        ...(overscan !== undefined ? { overscan } : {}),
    });

    // Keep the active row scrolled into the visible band. Instant scroll, so it is
    // reduced-motion safe without a behaviour gate; no listeners, so no cleanup.
    useLayoutEffect((): void => {
        if (activeIndex < 0) {
            return;
        }
        const element: HTMLDivElement | null = listboxRef.current;
        if (element === null) {
            return;
        }
        const rowTop: number = activeIndex * rowHeight;
        const rowBottom: number = rowTop + rowHeight;
        const viewTop: number = element.scrollTop;
        const viewBottom: number = viewTop + element.clientHeight;
        if (rowTop < viewTop) {
            element.scrollTop = rowTop;
            return;
        }
        if (rowBottom > viewBottom) {
            element.scrollTop = rowBottom - element.clientHeight;
        }
    }, [activeIndex, rowHeight]);

    let optionRowCount: number = 0;
    for (const row of rows) {
        if (row.kind === ECommandRowKind.Option) {
            optionRowCount += 1;
        }
    }
    const isEmptyCorpus: boolean = commands.length === 0;
    const hasOptions: boolean = optionRowCount > 0;

    const activeRow: CommandRow | undefined =
        activeIndex >= 0 ? rows[activeIndex] : undefined;
    const activeOptionId: string | undefined =
        activeRow?.kind === ECommandRowKind.Option
            ? optionDomId(activeRow.command.id)
            : undefined;

    function activateActiveOption(): void {
        if (isDisabled) {
            return;
        }
        if (activeIndex < 0) {
            return;
        }
        const row: CommandRow | undefined = rows[activeIndex];
        if (row === undefined) {
            return;
        }
        if (row.kind !== ECommandRowKind.Option) {
            return;
        }
        if (isCommandDisabled(row.command)) {
            return;
        }
        onSelect(row.command.id);
    }

    function handleInputChange(event: ReactChangeEvent<HTMLInputElement>): void {
        if (isDisabled) {
            return;
        }
        onQueryChange(event.currentTarget.value);
    }

    function handleComboKeyDown(event: ReactKeyboardEvent<HTMLInputElement>): void {
        if (isDisabled) {
            return;
        }
        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                navigation.moveBy(1);
                return;
            }
            case 'ArrowUp': {
                event.preventDefault();
                navigation.moveBy(-1);
                return;
            }
            case 'Home': {
                event.preventDefault();
                navigation.moveToFirst();
                return;
            }
            case 'End': {
                event.preventDefault();
                navigation.moveToLast();
                return;
            }
            case 'Enter': {
                event.preventDefault();
                activateActiveOption();
                return;
            }
            default: {
                return;
            }
        }
    }

    function handleClear(): void {
        if (isDisabled) {
            return;
        }
        onQueryChange('');
        inputRef.current?.focus();
    }

    // A named pointer handler (not an inline arrow) reading the absolute row index
    // from the row's data attribute. preventDefault keeps DOM focus on the
    // combobox input so the listbox never becomes the focus owner.
    function handleRowPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
        if (event.button !== 0) {
            return;
        }
        if (isDisabled) {
            return;
        }
        const indexAttribute: string | undefined =
            event.currentTarget.dataset.index;
        if (indexAttribute === undefined) {
            return;
        }
        const row: CommandRow | undefined = rows[Number(indexAttribute)];
        if (row === undefined) {
            return;
        }
        if (row.kind !== ECommandRowKind.Option) {
            return;
        }
        if (isCommandDisabled(row.command)) {
            return;
        }
        event.preventDefault();
        onSelect(row.command.id);
    }

    function handleRowPointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
        const indexAttribute: string | undefined =
            event.currentTarget.dataset.index;
        if (indexAttribute === undefined) {
            return;
        }
        navigation.setActiveRow(Number(indexAttribute));
    }

    const ariaNameProps: Record<string, string> = {};
    if (label !== undefined) {
        ariaNameProps['aria-label'] = label;
    } else if (labelledBy !== undefined) {
        ariaNameProps['aria-labelledby'] = labelledBy;
    }

    function renderRow(row: CommandRow): ReactElement {
        const rowStyle: CSSProperties = {
            transform: `translateY(${String(row.index * rowHeight)}px)`,
            blockSize: `${String(rowHeight)}px`,
        };
        switch (row.kind) {
            case ECommandRowKind.Header: {
                return (
                    <div
                        key={`header-${String(row.index)}`}
                        role="presentation"
                        className={styles.header}
                        style={rowStyle}
                    >
                        {row.groupLabel}
                    </div>
                );
            }
            case ECommandRowKind.Option: {
                const disabled: boolean = isCommandDisabled(row.command);
                const active: boolean = row.index === activeIndex;
                return (
                    <div
                        key={`option-${row.command.id}`}
                        id={optionDomId(row.command.id)}
                        role="option"
                        aria-label={row.command.label}
                        aria-selected={active}
                        aria-disabled={disabled ? true : undefined}
                        className={styles.row}
                        style={rowStyle}
                        data-active={active ? 'true' : undefined}
                        data-enabled={
                            disabled
                                ? EEnabledState.Disabled
                                : EEnabledState.Enabled
                        }
                        data-index={row.index}
                        onPointerDown={handleRowPointerDown}
                        onPointerMove={handleRowPointerMove}
                    >
                        {row.command.icon !== undefined ? (
                            <span className={styles.icon} aria-hidden="true">
                                {row.command.icon}
                            </span>
                        ) : null}
                        <span className={styles.rowBody}>
                            <span className={styles.rowLabel}>
                                {renderHighlightedLabel(
                                    row.command.label,
                                    row.matchRanges,
                                )}
                            </span>
                            {row.command.description !== undefined ? (
                                <span className={styles.rowDescription}>
                                    {row.command.description}
                                </span>
                            ) : null}
                        </span>
                        {row.command.shortcut !== undefined ? (
                            <span className={styles.shortcut} aria-hidden="true">
                                {row.command.shortcut}
                            </span>
                        ) : null}
                    </div>
                );
            }
        }
    }

    const windowRows: ReactElement[] = [];
    for (
        let index: number = virtualWindow.startIndex;
        index < virtualWindow.endIndex;
        index += 1
    ) {
        const row: CommandRow | undefined = rows[index];
        if (row === undefined) {
            continue;
        }
        windowRows.push(renderRow(row));
    }

    // Force-render the active row even when it has scrolled out of the window, so
    // the aria-activedescendant id always references an element in the DOM.
    const activeOutsideWindow: boolean =
        activeIndex >= 0 &&
        (activeIndex < virtualWindow.startIndex ||
            activeIndex >= virtualWindow.endIndex);
    let forcedActiveRow: ReactElement | null = null;
    if (activeOutsideWindow) {
        const row: CommandRow | undefined = rows[activeIndex];
        if (row !== undefined) {
            forcedActiveRow = renderRow(row);
        }
    }

    const panelClassName: string = [toneStyles.toneScope, styles.panel]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    const placeholderContent: ReactNode = isEmptyCorpus
        ? (emptyContent ?? <EmptyState title="No commands." />)
        : (noMatchesContent ?? <EmptyState title="No matching commands." />);

    return (
        <div
            ref={panelRef}
            role="dialog"
            aria-modal={true}
            tabIndex={-1}
            className={panelClassName}
            style={toneProperties(tone)}
            data-status={status}
            data-motion={motion}
            data-enabled={resolvedEnabled}
            data-filter-mode={filterMode}
            {...ariaNameProps}
        >
            <div className={styles.combobox} data-enabled={resolvedEnabled}>
                <span className={styles.affordance} aria-hidden="true" />
                <input
                    ref={inputRef}
                    id={comboId}
                    role="combobox"
                    type="text"
                    className={styles.input}
                    value={query}
                    disabled={isDisabled}
                    aria-autocomplete="list"
                    aria-expanded={hasOptions}
                    aria-controls={listboxId}
                    autoComplete="off"
                    spellCheck={false}
                    {...(activeOptionId !== undefined
                        ? { 'aria-activedescendant': activeOptionId }
                        : {})}
                    {...(placeholder !== undefined ? { placeholder } : {})}
                    {...ariaNameProps}
                    onChange={handleInputChange}
                    onKeyDown={handleComboKeyDown}
                />
                {query.length > 0 ? (
                    <button
                        type="button"
                        className={styles.clear}
                        aria-label={CLEAR_LABEL}
                        disabled={isDisabled}
                        data-enabled={resolvedEnabled}
                        onClick={handleClear}
                    >
                        <span className={styles.clearGlyph} aria-hidden="true" />
                    </button>
                ) : null}
            </div>
            <div
                ref={listboxRef}
                id={listboxId}
                className={styles.listbox}
                role={hasOptions ? 'listbox' : 'presentation'}
                {...(hasOptions ? ariaNameProps : {})}
            >
                {hasOptions ? (
                    <div
                        className={styles.sizer}
                        style={{
                            blockSize: `${String(virtualWindow.totalSize)}px`,
                        }}
                    >
                        {windowRows}
                        {forcedActiveRow}
                    </div>
                ) : (
                    <div className={styles.empty}>{placeholderContent}</div>
                )}
            </div>
        </div>
    );
}

export function CommandPalette(props: CommandPaletteProps): ReactElement | null {
    const {
        open,
        onClose,
        commands,
        query,
        onQueryChange,
        onSelect,
        recentCommandIds,
        filterMode = ECommandFilterMode.Fuzzy,
        rowHeight = ROW_HEIGHT_DEFAULT,
        overscan,
        placeholder,
        emptyContent,
        noMatchesContent,
        enabled,
        status = EUiStatus.None,
        tone,
    }: CommandPaletteProps = props;
    const label: string | undefined = 'label' in props ? props.label : undefined;
    const labelledBy: string | undefined =
        'labelledBy' in props ? props.labelledBy : undefined;

    const panelRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const inputRef: RefObject<HTMLInputElement | null> =
        useRef<HTMLInputElement | null>(null);
    const baseId: string = useId();
    const [overlayRoot]: [
        HTMLElement | null,
        Dispatch<SetStateAction<HTMLElement | null>>,
    ] = useState<HTMLElement | null>((): HTMLElement | null => ensureOverlayRoot());

    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const prefersReducedMotion: boolean = useReducedMotion();

    // Lock page scroll, trap focus in the panel, and wire the two ambient
    // dismissals - the same primitives Dialog uses; all are no-ops while closed.
    useScrollLock({ locked: open });
    useFocusTrap({
        active: open,
        containerRef: panelRef,
        initialFocusRef: inputRef,
        restoreFocus: true,
    });
    useDismiss({
        enabled: open,
        onDismiss: onClose,
        refs: [panelRef],
    });

    if (!open) {
        return null;
    }
    if (overlayRoot === null) {
        return null;
    }

    const motion: EOverlayMotion = prefersReducedMotion
        ? EOverlayMotion.Reduced
        : EOverlayMotion.Full;

    return createPortal(
        <>
            <div
                className={styles.backdrop}
                data-motion={motion}
                aria-hidden="true"
            />
            <div className={styles.positioner}>
                <CommandPaletteSurface
                    panelRef={panelRef}
                    inputRef={inputRef}
                    baseId={baseId}
                    motion={motion}
                    resolvedEnabled={resolvedEnabled}
                    isDisabled={isDisabled}
                    status={status}
                    tone={tone}
                    label={label}
                    labelledBy={labelledBy}
                    commands={commands}
                    recentCommandIds={recentCommandIds}
                    query={query}
                    onQueryChange={onQueryChange}
                    onSelect={onSelect}
                    filterMode={filterMode}
                    rowHeight={rowHeight}
                    overscan={overscan}
                    placeholder={placeholder}
                    emptyContent={emptyContent}
                    noMatchesContent={noMatchesContent}
                />
            </div>
        </>,
        overlayRoot,
    );
}
