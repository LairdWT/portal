import {
    type AriaRole,
    type CSSProperties,
    type Dispatch,
    type KeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
    type ReactNode,
    type RefObject,
    type SetStateAction,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { Popover } from '../Popover/Popover';
import {
    type PopoverCoords,
    resolvePopoverPosition,
    toRect,
} from '../Popover/Popover.position';
import { EPopoverPlacement, EPopoverRole } from '../Popover/Popover.types';
import styles from './Menu.module.css';
import {
    EMenuNodeKind,
    EMenuOrientation,
    type MenuNode,
    type MenuProps,
    type MenuSeparatorNode,
    type MenuSubmenuNode,
} from './Menu.types';

// Type-ahead buffer reset window, mirroring Select.
const TYPEAHEAD_RESET_MS: number = 500;
// Gap between a submenu fly-out and its parent item, and the minimum gap from the
// viewport edge - small whole numbers fed to the reused Popover positioner.
const SUBMENU_OFFSET: number = 2;
const VIEWPORT_PADDING: number = 8;

// The currently open submenu at one level: which row opened it and whether the
// fly-out should pull focus (keyboard/tap) or stay put (hover).
type OpenSubmenu = Readonly<{
    index: number;
    autoFocus: boolean;
}>;

function isSeparator(node: MenuNode): node is MenuSeparatorNode {
    return node.kind === EMenuNodeKind.Separator;
}

// A separator carries no disabled flag; every other kind has an optional one.
function isNodeDisabled(node: MenuNode): boolean {
    if (node.kind === EMenuNodeKind.Separator) {
        return false;
    }
    return node.disabled === true;
}

// A row participates in navigation only when it is neither a separator nor
// disabled.
function isFocusableNode(node: MenuNode): boolean {
    return !isSeparator(node) && !isNodeDisabled(node);
}

// Type-ahead matches only plain-string labels; non-string ReactNode labels and
// separators have no searchable text and are skipped by the prefix match.
function nodeText(node: MenuNode): string {
    if (node.kind === EMenuNodeKind.Separator) {
        return '';
    }
    return typeof node.label === 'string' ? node.label : '';
}

// The ARIA role for a row, derived from its kind. Exhaustive over the kind union
// (no default branch, so a new kind is a compile error rather than a silent gap).
function roleForKind(kind: MenuNode['kind']): AriaRole {
    switch (kind) {
        case EMenuNodeKind.Action:
        case EMenuNodeKind.Submenu:
            return 'menuitem';
        case EMenuNodeKind.Checkbox:
            return 'menuitemcheckbox';
        case EMenuNodeKind.Radio:
            return 'menuitemradio';
        case EMenuNodeKind.Separator:
            return 'separator';
    }
}

// The next focusable index in a direction WITH wrapping (a menu cursor wraps top
// to bottom), skipping separators and disabled rows. Returns -1 for an empty set.
function nextFocusableIndex(
    items: readonly MenuNode[],
    from: number,
    direction: 1 | -1,
): number {
    const count: number = items.length;
    if (count === 0) {
        return -1;
    }
    for (let step: number = 1; step <= count; step += 1) {
        const index: number = (((from + direction * step) % count) + count) % count;
        const node: MenuNode | undefined = items[index];
        if (node !== undefined && isFocusableNode(node)) {
            return index;
        }
    }
    return from;
}

function firstFocusableIndex(items: readonly MenuNode[]): number {
    for (let index: number = 0; index < items.length; index += 1) {
        const node: MenuNode | undefined = items[index];
        if (node !== undefined && isFocusableNode(node)) {
            return index;
        }
    }
    return -1;
}

function lastFocusableIndex(items: readonly MenuNode[]): number {
    for (let index: number = items.length - 1; index >= 0; index -= 1) {
        const node: MenuNode | undefined = items[index];
        if (node !== undefined && isFocusableNode(node)) {
            return index;
        }
    }
    return -1;
}

// First focusable row (after `fromIndex`, wrapping) whose text starts with the
// type-ahead query, case-insensitively. Returns -1 when nothing matches.
function findTypeAheadIndex(
    items: readonly MenuNode[],
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
        const node: MenuNode | undefined = items[index];
        if (node === undefined || !isFocusableNode(node)) {
            continue;
        }
        if (nodeText(node).toLowerCase().startsWith(lower)) {
            return index;
        }
    }
    return -1;
}

// One menu level. Renders a role=menu list of rows, owns this level's roving
// focus, keyboard handling, type-ahead, and the single open submenu, and renders
// that submenu as a position:fixed fly-out (a DOM descendant of the same Popover
// panel, so the single Popover dismissal treats the whole tree as "inside" while
// the fixed box escapes the panel's overflow clip). Recurses for nesting.
type MenuListProps = Readonly<{
    items: readonly MenuNode[];
    menuId?: string | undefined;
    label?: string | undefined;
    labelledBy?: string | undefined;
    autoFocusFirst: boolean;
    isSubmenu: boolean;
    onSelect: (id: string) => void;
    closeTree: () => void;
    onDismiss: () => void;
    onArrowLeftEdge?: (() => void) | undefined;
    onArrowRightEdge?: (() => void) | undefined;
}>;

function MenuList(props: MenuListProps): ReactElement {
    const {
        items,
        menuId,
        label,
        labelledBy,
        autoFocusFirst,
        isSubmenu,
        onSelect,
        closeTree,
        onDismiss,
        onArrowLeftEdge,
        onArrowRightEdge,
    }: MenuListProps = props;

    const baseId: string = useId();
    const menuRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
        null,
    );
    const flyoutRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const itemRefs: RefObject<readonly (HTMLElement | null)[]> = useRef<
        readonly (HTMLElement | null)[]
    >([]);
    const bufferRef: RefObject<string> = useRef<string>('');
    const typeaheadTimerRef: RefObject<number | null> = useRef<number | null>(null);
    const didAutoFocusRef: RefObject<boolean> = useRef<boolean>(false);

    const [activeIndex, setActiveIndex]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>((): number => firstFocusableIndex(items));
    const [openSubmenu, setOpenSubmenu]: [
        OpenSubmenu | null,
        Dispatch<SetStateAction<OpenSubmenu | null>>,
    ] = useState<OpenSubmenu | null>(null);
    const [submenuCoords, setSubmenuCoords]: [
        PopoverCoords | null,
        Dispatch<SetStateAction<PopoverCoords | null>>,
    ] = useState<PopoverCoords | null>(null);

    // Focus the first enabled row once on mount when this level was opened for the
    // keyboard. Guarded so a later items change never steals focus back.
    useEffect((): void => {
        if (didAutoFocusRef.current) {
            return;
        }
        // Latch only when focus is actually taken: a hover mount (autoFocusFirst
        // false) must stay un-latched so a later ArrowRight/Enter that flips
        // autoFocusFirst true re-runs this effect and pulls focus into the
        // fly-out, instead of being blocked by an already-set latch.
        if (!autoFocusFirst) {
            return;
        }
        didAutoFocusRef.current = true;
        const first: number = firstFocusableIndex(items);
        if (first < 0) {
            return;
        }
        // activeIndex is already seeded to firstFocusableIndex(items) by the lazy
        // useState initializer, so only the DOM focus needs moving here - setting
        // state again would be a redundant render inside the effect.
        itemRefs.current[first]?.focus();
    }, [autoFocusFirst, items]);

    // Clear any pending type-ahead reset timer on unmount.
    useEffect((): (() => void) => {
        return (): void => {
            if (typeaheadTimerRef.current !== null) {
                window.clearTimeout(typeaheadTimerRef.current);
                typeaheadTimerRef.current = null;
            }
        };
    }, []);

    // Position the open submenu fly-out to the side of its parent row using the
    // REUSED Popover positioner (placement Right, flips Left). Recomputes on
    // scroll (capture) and resize and via ResizeObserver; every listener and the
    // observer are removed on cleanup. Mirrors Popover's positioning effect.
    useLayoutEffect((): (() => void) | undefined => {
        if (openSubmenu === null) {
            return undefined;
        }
        const anchor: HTMLElement | null =
            itemRefs.current[openSubmenu.index] ?? null;
        const flyout: HTMLDivElement | null = flyoutRef.current;
        if (anchor === null || flyout === null) {
            return undefined;
        }

        function update(): void {
            if (openSubmenu === null) {
                return;
            }
            const liveAnchor: HTMLElement | null =
                itemRefs.current[openSubmenu.index] ?? null;
            const liveFlyout: HTMLDivElement | null = flyoutRef.current;
            if (liveAnchor === null || liveFlyout === null) {
                return;
            }
            const next: PopoverCoords = resolvePopoverPosition({
                anchor: toRect(liveAnchor.getBoundingClientRect()),
                panel: toRect(liveFlyout.getBoundingClientRect()),
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
                placement: EPopoverPlacement.Right,
                offset: SUBMENU_OFFSET,
                padding: VIEWPORT_PADDING,
            });
            setSubmenuCoords((prev: PopoverCoords | null): PopoverCoords | null => {
                if (
                    prev !== null &&
                    prev.top === next.top &&
                    prev.left === next.left &&
                    prev.placement === next.placement
                ) {
                    return prev;
                }
                return next;
            });
        }

        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        let observer: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver((): void => {
                update();
            });
            observer.observe(anchor);
            observer.observe(flyout);
        }
        return (): void => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
            if (observer !== null) {
                observer.disconnect();
            }
        };
    }, [openSubmenu]);

    function clearTypeaheadTimer(): void {
        if (typeaheadTimerRef.current !== null) {
            window.clearTimeout(typeaheadTimerRef.current);
            typeaheadTimerRef.current = null;
        }
    }

    function focusIndex(index: number): void {
        if (index < 0) {
            return;
        }
        setActiveIndex(index);
        itemRefs.current[index]?.focus();
    }

    function moveActive(direction: 1 | -1): void {
        focusIndex(nextFocusableIndex(items, activeIndex, direction));
    }

    function openSubmenuAt(index: number, autoFocusChild: boolean): void {
        const node: MenuNode | undefined = items[index];
        if (node?.kind !== EMenuNodeKind.Submenu || isNodeDisabled(node)) {
            return;
        }
        setActiveIndex(index);
        setSubmenuCoords(null);
        setOpenSubmenu({ index, autoFocus: autoFocusChild });
    }

    function closeSubmenu(focusParent: boolean): void {
        const current: OpenSubmenu | null = openSubmenu;
        setOpenSubmenu(null);
        setSubmenuCoords(null);
        if (focusParent && current !== null) {
            setActiveIndex(current.index);
            itemRefs.current[current.index]?.focus();
        }
    }

    function activate(index: number): void {
        const node: MenuNode | undefined = items[index];
        if (node === undefined || isSeparator(node) || isNodeDisabled(node)) {
            return;
        }
        switch (node.kind) {
            case EMenuNodeKind.Action:
            case EMenuNodeKind.Checkbox:
            case EMenuNodeKind.Radio:
                onSelect(node.id);
                closeTree();
                return;
            case EMenuNodeKind.Submenu:
                openSubmenuAt(index, true);
                return;
        }
    }

    function handleTypeAhead(key: string): void {
        clearTypeaheadTimer();
        const wasEmpty: boolean = bufferRef.current.length === 0;
        const query: string = bufferRef.current + key;
        bufferRef.current = query;
        typeaheadTimerRef.current = window.setTimeout((): void => {
            bufferRef.current = '';
            typeaheadTimerRef.current = null;
        }, TYPEAHEAD_RESET_MS);
        const fromIndex: number = wasEmpty ? activeIndex : activeIndex - 1;
        const match: number = findTypeAheadIndex(items, query, fromIndex);
        if (match >= 0) {
            focusIndex(match);
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        const key: string = event.key;
        switch (key) {
            case 'ArrowDown': {
                event.preventDefault();
                moveActive(1);
                return;
            }
            case 'ArrowUp': {
                event.preventDefault();
                moveActive(-1);
                return;
            }
            case 'Home': {
                event.preventDefault();
                focusIndex(firstFocusableIndex(items));
                return;
            }
            case 'End': {
                event.preventDefault();
                focusIndex(lastFocusableIndex(items));
                return;
            }
            case 'ArrowRight': {
                const node: MenuNode | undefined = items[activeIndex];
                if (node?.kind === EMenuNodeKind.Submenu && !isNodeDisabled(node)) {
                    event.preventDefault();
                    openSubmenuAt(activeIndex, true);
                    return;
                }
                if (onArrowRightEdge !== undefined) {
                    event.preventDefault();
                    onArrowRightEdge();
                }
                return;
            }
            case 'ArrowLeft': {
                if (isSubmenu) {
                    event.preventDefault();
                    event.stopPropagation();
                    onDismiss();
                    return;
                }
                if (onArrowLeftEdge !== undefined) {
                    event.preventDefault();
                    onArrowLeftEdge();
                }
                return;
            }
            case 'Enter':
            case ' ': {
                event.preventDefault();
                activate(activeIndex);
                return;
            }
            case 'Escape': {
                event.preventDefault();
                event.stopPropagation();
                onDismiss();
                return;
            }
            case 'Tab': {
                event.preventDefault();
                closeTree();
                return;
            }
            default: {
                if (key.length === 1) {
                    event.preventDefault();
                    handleTypeAhead(key);
                }
                return;
            }
        }
    }

    function handleRowClick(index: number): void {
        const node: MenuNode | undefined = items[index];
        if (node === undefined || isSeparator(node) || isNodeDisabled(node)) {
            return;
        }
        if (node.kind === EMenuNodeKind.Submenu) {
            if (openSubmenu !== null && openSubmenu.index === index) {
                closeSubmenu(true);
                return;
            }
            openSubmenuAt(index, true);
            return;
        }
        onSelect(node.id);
        closeTree();
    }

    // Pointer activation is delegated to the role="menu" container (a directly
    // assigned, literal-interactive-role handler) rather than placed on each
    // dynamic-role row, then resolved back to the row via its data-index. Keeping
    // the only flagged pointer handler on an element with a statically interactive
    // role is what satisfies the a11y interaction rules; hover (onPointerEnter,
    // not a flagged handler) stays on the row.
    function handleMenuPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
        const origin: HTMLElement | null =
            event.target instanceof HTMLElement ? event.target : null;
        const row: HTMLElement | null = origin?.closest('[data-index]') ?? null;
        if (row === null) {
            return;
        }
        const indexAttribute: string | undefined = row.dataset.index;
        if (indexAttribute === undefined) {
            return;
        }
        handleRowClick(Number(indexAttribute));
    }

    function handleRowPointerEnter(index: number): void {
        const node: MenuNode | undefined = items[index];
        if (node === undefined || isSeparator(node) || isNodeDisabled(node)) {
            return;
        }
        if (node.kind === EMenuNodeKind.Submenu) {
            openSubmenuAt(index, false);
            return;
        }
        if (openSubmenu === null) {
            return;
        }
        const flyout: HTMLDivElement | null = flyoutRef.current;
        const active: Element | null = document.activeElement;
        const focusInside: boolean =
            flyout !== null && active instanceof Node && flyout.contains(active);
        if (!focusInside) {
            closeSubmenu(false);
        }
    }

    function handleCloseSubmenuFromChild(): void {
        closeSubmenu(true);
    }

    function renderRow(node: MenuNode, index: number): ReactElement {
        if (isSeparator(node)) {
            return (
                <div
                    key={node.id}
                    role="separator"
                    className={styles.separator}
                    data-kind={node.kind}
                />
            );
        }
        const disabled: boolean = isNodeDisabled(node);
        const isActive: boolean = index === activeIndex;
        const isSubmenuNode: boolean = node.kind === EMenuNodeKind.Submenu;
        const isOpen: boolean = openSubmenu !== null && openSubmenu.index === index;
        const rowId: string = `${baseId}-${node.id}`;
        const submenuMenuId: string = `${baseId}-${node.id}-menu`;
        const checked: boolean | undefined =
            node.kind === EMenuNodeKind.Checkbox ||
            node.kind === EMenuNodeKind.Radio
                ? node.checked
                : undefined;
        const icon: ReactNode = 'icon' in node ? node.icon : undefined;
        const shortcut: string | undefined =
            'shortcut' in node ? node.shortcut : undefined;
        return (
            <div
                key={node.id}
                id={rowId}
                ref={(element: HTMLElement | null): void => {
                    const next: (HTMLElement | null)[] = [...itemRefs.current];
                    next[index] = element;
                    itemRefs.current = next;
                }}
                role={roleForKind(node.kind)}
                className={styles.item}
                data-kind={node.kind}
                data-index={index}
                data-active={isActive ? 'true' : 'false'}
                tabIndex={isActive ? 0 : -1}
                aria-disabled={disabled ? true : undefined}
                aria-checked={checked}
                aria-haspopup={isSubmenuNode ? 'menu' : undefined}
                aria-expanded={isSubmenuNode ? isOpen : undefined}
                aria-controls={isSubmenuNode ? submenuMenuId : undefined}
                onPointerEnter={(): void => {
                    handleRowPointerEnter(index);
                }}
            >
                <span className={styles.indicator} aria-hidden="true" />
                {icon !== undefined ? (
                    <span className={styles.icon}>{icon}</span>
                ) : null}
                <span className={styles.label}>{node.label}</span>
                {shortcut !== undefined ? (
                    <span className={styles.shortcut}>{shortcut}</span>
                ) : null}
                {isSubmenuNode ? (
                    <span className={styles.chevron} aria-hidden="true" />
                ) : null}
            </div>
        );
    }

    const menuClassName: string = [
        styles.menu,
        isSubmenu ? styles.flyout : undefined,
    ]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    const submenuNode: MenuNode | undefined =
        openSubmenu !== null ? items[openSubmenu.index] : undefined;
    const openSubmenuNode: MenuSubmenuNode | undefined =
        submenuNode?.kind === EMenuNodeKind.Submenu ? submenuNode : undefined;

    const flyoutStyle: CSSProperties = {
        position: 'fixed',
        ...(submenuCoords !== null
            ? {
                  top: `${String(submenuCoords.top)}px`,
                  left: `${String(submenuCoords.left)}px`,
                  visibility: 'visible',
              }
            : { top: 0, left: 0, visibility: 'hidden' }),
    };

    return (
        <>
            <div
                ref={menuRef}
                role="menu"
                className={menuClassName}
                tabIndex={-1}
                onPointerDown={handleMenuPointerDown}
                aria-orientation={EMenuOrientation.Vertical}
                data-orientation={EMenuOrientation.Vertical}
                {...(menuId !== undefined ? { id: menuId } : {})}
                {...(label !== undefined ? { 'aria-label': label } : {})}
                {...(labelledBy !== undefined
                    ? { 'aria-labelledby': labelledBy }
                    : {})}
                onKeyDown={handleKeyDown}
            >
                {items.map(renderRow)}
            </div>
            {openSubmenu !== null && openSubmenuNode !== undefined ? (
                <div
                    ref={flyoutRef}
                    className={styles.flyoutAnchor}
                    style={flyoutStyle}
                >
                    <MenuList
                        items={openSubmenuNode.items}
                        menuId={`${baseId}-${openSubmenuNode.id}-menu`}
                        labelledBy={`${baseId}-${openSubmenuNode.id}`}
                        autoFocusFirst={openSubmenu.autoFocus}
                        isSubmenu
                        onSelect={onSelect}
                        closeTree={closeTree}
                        onDismiss={handleCloseSubmenuFromChild}
                    />
                </div>
            ) : null}
        </>
    );
}

// The shared root surface: a single Popover (generic group frame) holding the
// root MenuList. Used by Menu, MenuBar, and ContextMenu so the Popover wiring
// (portal mount, single outside-click + Escape dismissal, focus restoration,
// tone, reduced-motion entrance) is written once. The panel role is Group, not
// Menu, because the submenu fly-outs are role=menu DOM descendants of the panel:
// a role=menu panel owning nested role=menu fly-outs violates aria-required-
// children, so the generic group frames the named root menu and every fly-out is
// its own role=menu (the menu semantics live on the MenuList, which carries the
// accessible name). `surfaceKey` remounts the root list when a menubar switches
// menus while the Popover stays open, so the new menu auto-focuses its first row.
type MenuSurfaceProps = Readonly<{
    items: readonly MenuNode[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (id: string) => void;
    anchorRef: RefObject<HTMLElement | null>;
    placement: EPopoverPlacement;
    menuId?: string | undefined;
    label?: string | undefined;
    labelledBy?: string | undefined;
    tone?: string | undefined;
    surfaceKey?: string | number | undefined;
    onArrowLeftEdge?: (() => void) | undefined;
    onArrowRightEdge?: (() => void) | undefined;
    onCloseFocusAnchor?: (() => void) | undefined;
}>;

export function MenuSurface(props: MenuSurfaceProps): ReactElement {
    const {
        items,
        open,
        onOpenChange,
        onSelect,
        anchorRef,
        placement,
        menuId,
        label,
        labelledBy,
        tone,
        surfaceKey,
        onArrowLeftEdge,
        onArrowRightEdge,
        onCloseFocusAnchor,
    }: MenuSurfaceProps = props;

    function closeTree(): void {
        onOpenChange(false);
        onCloseFocusAnchor?.();
    }

    return (
        <Popover
            open={open}
            onClose={(): void => {
                onOpenChange(false);
            }}
            anchorRef={anchorRef}
            role={EPopoverRole.Group}
            placement={placement}
            trapFocus={false}
            restoreFocus={true}
            {...(tone !== undefined ? { tone } : {})}
        >
            <MenuList
                key={surfaceKey}
                items={items}
                menuId={menuId}
                autoFocusFirst
                isSubmenu={false}
                onSelect={onSelect}
                closeTree={closeTree}
                onDismiss={closeTree}
                label={label}
                labelledBy={labelledBy}
                onArrowLeftEdge={onArrowLeftEdge}
                onArrowRightEdge={onArrowRightEdge}
            />
        </Popover>
    );
}

// Controlled dropdown menu attached to a consumer-owned anchor. A disabled menu
// never opens. Item activation reports onSelect(id) and closes the whole tree;
// the consumer owns checkable state and flips it inside onSelect.
export function Menu(props: MenuProps): ReactElement {
    const {
        items,
        open,
        onOpenChange,
        onSelect,
        anchorRef,
        placement = EPopoverPlacement.Bottom,
        enabled,
        tone,
        label,
        labelledBy,
    }: MenuProps = props;
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const effectiveOpen: boolean =
        open && resolvedEnabled === EEnabledState.Enabled;

    return (
        <MenuSurface
            items={items}
            open={effectiveOpen}
            onOpenChange={onOpenChange}
            onSelect={onSelect}
            anchorRef={anchorRef}
            placement={placement}
            label={label}
            labelledBy={labelledBy}
            tone={tone}
        />
    );
}
