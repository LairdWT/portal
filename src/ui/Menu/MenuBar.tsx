import {
    type Dispatch,
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EPopoverPlacement } from '../Popover/Popover.types';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import { MenuSurface } from './Menu';
import styles from './Menu.module.css';
import {
    EMenuOrientation,
    type MenuBarMenu,
    type MenuBarProps,
} from './Menu.types';

const TYPEAHEAD_RESET_MS: number = 500;

function isBarItemDisabled(menu: MenuBarMenu, barDisabled: boolean): boolean {
    return barDisabled || menu.disabled === true;
}

// Next enabled bar index in a direction WITH wrapping; returns `from` when no
// other enabled entry exists.
function nextEnabledBar(
    menus: readonly MenuBarMenu[],
    from: number,
    direction: 1 | -1,
    barDisabled: boolean,
): number {
    const count: number = menus.length;
    if (count === 0) {
        return -1;
    }
    for (let step: number = 1; step <= count; step += 1) {
        const index: number = (((from + direction * step) % count) + count) % count;
        const menu: MenuBarMenu | undefined = menus[index];
        if (menu !== undefined && !isBarItemDisabled(menu, barDisabled)) {
            return index;
        }
    }
    return from;
}

function firstEnabledBar(
    menus: readonly MenuBarMenu[],
    barDisabled: boolean,
): number {
    for (let index: number = 0; index < menus.length; index += 1) {
        const menu: MenuBarMenu | undefined = menus[index];
        if (menu !== undefined && !isBarItemDisabled(menu, barDisabled)) {
            return index;
        }
    }
    return -1;
}

function lastEnabledBar(
    menus: readonly MenuBarMenu[],
    barDisabled: boolean,
): number {
    for (let index: number = menus.length - 1; index >= 0; index -= 1) {
        const menu: MenuBarMenu | undefined = menus[index];
        if (menu !== undefined && !isBarItemDisabled(menu, barDisabled)) {
            return index;
        }
    }
    return -1;
}

function barLabelText(menu: MenuBarMenu): string {
    return typeof menu.label === 'string' ? menu.label : '';
}

function findBarTypeAhead(
    menus: readonly MenuBarMenu[],
    query: string,
    fromIndex: number,
    barDisabled: boolean,
): number {
    const count: number = menus.length;
    if (count === 0) {
        return -1;
    }
    const lower: string = query.toLowerCase();
    for (let offset: number = 1; offset <= count; offset += 1) {
        const index: number = (((fromIndex + offset) % count) + count) % count;
        const menu: MenuBarMenu | undefined = menus[index];
        if (menu === undefined || isBarItemDisabled(menu, barDisabled)) {
            continue;
        }
        if (barLabelText(menu).toLowerCase().startsWith(lower)) {
            return index;
        }
    }
    return -1;
}

// A horizontal menubar (role=menubar) whose top-level entries each open a Menu.
// Owns the open-menu state internally; reports onSelect(menuId, itemId). Roving
// tabindex moves across the bar buttons; opening one closes any other.
export function MenuBar(props: MenuBarProps): ReactElement {
    const { menus, onSelect, enabled, tone, label, labelledBy }: MenuBarProps =
        props;
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const barDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const barId: string = useId();

    const buttonRefs: RefObject<readonly (HTMLButtonElement | null)[]> = useRef<
        readonly (HTMLButtonElement | null)[]
    >([]);
    const anchorRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(
        null,
    );
    const bufferRef: RefObject<string> = useRef<string>('');
    const typeaheadTimerRef: RefObject<number | null> = useRef<number | null>(null);

    const [openMenuId, setOpenMenuId]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(null);
    const [barFocusIndex, setBarFocusIndex]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>((): number => firstEnabledBar(menus, barDisabled));

    useEffect((): (() => void) => {
        return (): void => {
            if (typeaheadTimerRef.current !== null) {
                window.clearTimeout(typeaheadTimerRef.current);
                typeaheadTimerRef.current = null;
            }
        };
    }, []);

    const activeMenuIndex: number = menus.findIndex(
        (menu: MenuBarMenu): boolean => menu.id === openMenuId,
    );
    const activeMenu: MenuBarMenu | undefined =
        activeMenuIndex >= 0 ? menus[activeMenuIndex] : undefined;

    function buttonId(menuId: string): string {
        return `${barId}-${menuId}-button`;
    }

    function dropdownId(menuId: string): string {
        return `${barId}-${menuId}-dropdown`;
    }

    function clearTypeaheadTimer(): void {
        if (typeaheadTimerRef.current !== null) {
            window.clearTimeout(typeaheadTimerRef.current);
            typeaheadTimerRef.current = null;
        }
    }

    function focusBar(index: number): void {
        if (index < 0) {
            return;
        }
        setBarFocusIndex(index);
        buttonRefs.current[index]?.focus();
    }

    function openMenuAt(index: number): void {
        const menu: MenuBarMenu | undefined = menus[index];
        if (menu === undefined || isBarItemDisabled(menu, barDisabled)) {
            return;
        }
        anchorRef.current = buttonRefs.current[index] ?? null;
        setBarFocusIndex(index);
        setOpenMenuId(menu.id);
    }

    function switchMenu(direction: 1 | -1): void {
        const from: number = activeMenuIndex >= 0 ? activeMenuIndex : barFocusIndex;
        openMenuAt(nextEnabledBar(menus, from, direction, barDisabled));
    }

    function focusActiveButton(): void {
        if (activeMenuIndex < 0) {
            return;
        }
        setBarFocusIndex(activeMenuIndex);
        buttonRefs.current[activeMenuIndex]?.focus();
    }

    function handleOpenChange(next: boolean): void {
        if (next) {
            return;
        }
        setOpenMenuId(null);
    }

    function handleBarTypeAhead(key: string, fromIndex: number): void {
        clearTypeaheadTimer();
        const wasEmpty: boolean = bufferRef.current.length === 0;
        const query: string = bufferRef.current + key;
        bufferRef.current = query;
        typeaheadTimerRef.current = window.setTimeout((): void => {
            bufferRef.current = '';
            typeaheadTimerRef.current = null;
        }, TYPEAHEAD_RESET_MS);
        const start: number = wasEmpty ? fromIndex : fromIndex - 1;
        const match: number = findBarTypeAhead(menus, query, start, barDisabled);
        if (match >= 0) {
            focusBar(match);
        }
    }

    function handleButtonKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        index: number,
    ): void {
        if (barDisabled) {
            return;
        }
        const key: string = event.key;
        switch (key) {
            case 'ArrowRight': {
                event.preventDefault();
                focusBar(nextEnabledBar(menus, index, 1, barDisabled));
                return;
            }
            case 'ArrowLeft': {
                event.preventDefault();
                focusBar(nextEnabledBar(menus, index, -1, barDisabled));
                return;
            }
            case 'Home': {
                event.preventDefault();
                focusBar(firstEnabledBar(menus, barDisabled));
                return;
            }
            case 'End': {
                event.preventDefault();
                focusBar(lastEnabledBar(menus, barDisabled));
                return;
            }
            case 'ArrowDown':
            case 'Enter':
            case ' ': {
                event.preventDefault();
                openMenuAt(index);
                return;
            }
            default: {
                if (key.length === 1) {
                    event.preventDefault();
                    handleBarTypeAhead(key, index);
                }
                return;
            }
        }
    }

    function handleButtonClick(index: number): void {
        const menu: MenuBarMenu | undefined = menus[index];
        if (menu === undefined || isBarItemDisabled(menu, barDisabled)) {
            return;
        }
        if (openMenuId === menu.id) {
            setOpenMenuId(null);
            setBarFocusIndex(index);
            buttonRefs.current[index]?.focus();
            return;
        }
        openMenuAt(index);
    }

    function handleSelect(itemId: string): void {
        if (openMenuId === null) {
            return;
        }
        onSelect(openMenuId, itemId);
    }

    const rootClassName: string = [toneStyles.toneScope, styles.menubar]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <div
            role="menubar"
            className={rootClassName}
            style={toneProperties(tone)}
            aria-orientation={EMenuOrientation.Horizontal}
            data-orientation={EMenuOrientation.Horizontal}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
            {...(label !== undefined ? { 'aria-label': label } : {})}
            {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
        >
            {menus.map((menu: MenuBarMenu, index: number): ReactElement => {
                const isOpen: boolean = openMenuId === menu.id;
                const itemDisabled: boolean = isBarItemDisabled(menu, barDisabled);
                return (
                    <button
                        key={menu.id}
                        id={buttonId(menu.id)}
                        ref={(element: HTMLButtonElement | null): void => {
                            const nextRefs: (HTMLButtonElement | null)[] = [
                                ...buttonRefs.current,
                            ];
                            nextRefs[index] = element;
                            buttonRefs.current = nextRefs;
                        }}
                        type="button"
                        role="menuitem"
                        className={styles.barButton}
                        aria-haspopup="menu"
                        aria-expanded={isOpen}
                        aria-controls={isOpen ? dropdownId(menu.id) : undefined}
                        tabIndex={index === barFocusIndex ? 0 : -1}
                        disabled={itemDisabled}
                        data-open={isOpen ? 'true' : 'false'}
                        onClick={(): void => {
                            handleButtonClick(index);
                        }}
                        onKeyDown={(
                            event: KeyboardEvent<HTMLButtonElement>,
                        ): void => {
                            handleButtonKeyDown(event, index);
                        }}
                    >
                        {menu.label}
                    </button>
                );
            })}
            {activeMenu !== undefined ? (
                <MenuSurface
                    key={activeMenu.id}
                    items={activeMenu.items}
                    open
                    onOpenChange={handleOpenChange}
                    onSelect={handleSelect}
                    anchorRef={anchorRef}
                    placement={EPopoverPlacement.Bottom}
                    menuId={dropdownId(activeMenu.id)}
                    labelledBy={buttonId(activeMenu.id)}
                    tone={tone}
                    onArrowLeftEdge={(): void => {
                        switchMenu(-1);
                    }}
                    onArrowRightEdge={(): void => {
                        switchMenu(1);
                    }}
                    onCloseFocusAnchor={focusActiveButton}
                />
            ) : null}
        </div>
    );
}
