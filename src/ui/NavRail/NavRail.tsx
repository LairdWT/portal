import {
    type Dispatch,
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './NavRail.module.css';
import {
    ENavItemState,
    type NavRailItem,
    type NavRailProps,
} from './NavRail.types';

// Resolves the index of the active item, returning -1 when the controlled active
// id matches no entry. Unlike Tabs/SegmentedControl, NavRail does NOT fall back
// to the first item: an out-of-range active leaves every band unselected (Helicon
// parity), so aria-current is omitted everywhere until the consumer supplies a
// matching id.
function resolveActiveIndex(items: readonly NavRailItem[], active: string): number {
    return items.findIndex((item: NavRailItem): boolean => item.id === active);
}

export function NavRail({
    items,
    active,
    onChange,
    enabled,
    label,
    labelledBy,
    tone,
}: NavRailProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const activeIndex: number = resolveActiveIndex(items, active);
    // The roving tab stop, decoupled from the active id because activation is
    // manual (arrows move focus only). It seeds to the active item, or the first
    // item when the active id matches nothing.
    const [focusIndex, setFocusIndex]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(activeIndex >= 0 ? activeIndex : 0);
    // Track the previous active id so a controlled active change moves the roving
    // tab stop to follow it (the React "adjust state when a prop changes" idiom,
    // preferred over an effect), letting Tab re-entry land on the current item.
    const [previousActive, setPreviousActive]: [
        string,
        Dispatch<SetStateAction<string>>,
    ] = useState<string>(active);
    // A fixed-index ref array: the ref callback writes refs.current[index] = el. An
    // effect keyed on items keeps the array length in sync so a shrinking item set
    // prunes the trailing refs.
    const itemRefs: RefObject<(HTMLAnchorElement | HTMLButtonElement | null)[]> =
        useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);

    useEffect((): void => {
        itemRefs.current.length = items.length;
    }, [items]);

    // Render-phase derived sync: when the controlled active id changes, follow it
    // with the roving tab stop (only when it matches an entry).
    if (active !== previousActive) {
        setPreviousActive(active);
        if (activeIndex >= 0) {
            setFocusIndex(activeIndex);
        }
    }

    const className: string = [toneStyles.toneScope, styles.rail]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    function moveFocus(targetIndex: number): void {
        if (isDisabled) {
            return;
        }
        const target: NavRailItem | undefined = items[targetIndex];
        if (target === undefined) {
            return;
        }
        setFocusIndex(targetIndex);
        itemRefs.current[targetIndex]?.focus();
    }

    function activateButton(item: NavRailItem, index: number): void {
        if (isDisabled) {
            return;
        }
        setFocusIndex(index);
        onChange?.(item.id);
    }

    function handleClick(item: NavRailItem, index: number): void {
        if (isDisabled) {
            return;
        }
        setFocusIndex(index);
        // A link navigates natively; the consumer reflects the new route back into
        // `active`. Only button items report selection through onChange.
        if (item.href !== undefined) {
            return;
        }
        onChange?.(item.id);
    }

    function handleKeyDown(
        event: KeyboardEvent<HTMLAnchorElement | HTMLButtonElement>,
        index: number,
        item: NavRailItem,
    ): void {
        if (isDisabled) {
            return;
        }
        if (items.length === 0) {
            return;
        }
        const lastIndex: number = items.length - 1;
        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                moveFocus(index === lastIndex ? 0 : index + 1);
                return;
            }
            case 'ArrowUp': {
                event.preventDefault();
                moveFocus(index === 0 ? lastIndex : index - 1);
                return;
            }
            case 'Home': {
                event.preventDefault();
                moveFocus(0);
                return;
            }
            case 'End': {
                event.preventDefault();
                moveFocus(lastIndex);
                return;
            }
            case 'Enter': {
                // Button: activate through onChange. Link: let the native anchor
                // navigate - do NOT preventDefault for an <a> on Enter.
                if (item.href === undefined) {
                    event.preventDefault();
                    activateButton(item, index);
                }
                return;
            }
            case ' ': {
                // Space activates a button (preventDefault stops page scroll). An
                // anchor does not activate on Space; leave native behavior.
                if (item.href === undefined) {
                    event.preventDefault();
                    activateButton(item, index);
                }
                return;
            }
            default:
                return;
        }
    }

    // Negative-first guard: an empty entry set renders the named landmark with no
    // bands and short-circuits all roving/activation math.
    if (items.length === 0) {
        return (
            <nav
                className={className}
                style={toneProperties(tone)}
                data-status={EUiStatus.None}
                data-enabled={resolvedEnabled}
                {...(label !== undefined ? { 'aria-label': label } : {})}
                {...(labelledBy !== undefined
                    ? { 'aria-labelledby': labelledBy }
                    : {})}
            />
        );
    }

    // Clamp the roving tab stop so a shrunk item set never points past the end.
    const rovingIndex: number = Math.min(focusIndex, items.length - 1);

    return (
        <nav
            className={className}
            style={toneProperties(tone)}
            data-status={EUiStatus.None}
            data-enabled={resolvedEnabled}
            {...(label !== undefined ? { 'aria-label': label } : {})}
            {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
        >
            {items.map((item: NavRailItem, index: number): ReactElement => {
                const isActive: boolean = item.id === active;
                const itemState: ENavItemState = isActive
                    ? ENavItemState.Active
                    : ENavItemState.Idle;
                const tabValue: number = index === rovingIndex ? 0 : -1;
                const ariaCurrent: 'page' | undefined = isActive
                    ? 'page'
                    : undefined;
                const content: ReactElement = (
                    <>
                        {item.icon !== undefined ? (
                            <span className={styles.icon} aria-hidden="true">
                                {item.icon}
                            </span>
                        ) : null}
                        <span className={styles.label}>{item.label}</span>
                        {item.badge !== undefined ? (
                            <span className={styles.badge}>{item.badge}</span>
                        ) : null}
                    </>
                );

                // Link mode only while enabled: a disabled rail ignores href and
                // renders the band as a disabled button (anchors cannot be
                // natively disabled).
                if (!isDisabled && item.href !== undefined) {
                    const href: string = item.href;
                    return (
                        <a
                            key={item.id}
                            ref={(element: HTMLAnchorElement | null): void => {
                                itemRefs.current[index] = element;
                            }}
                            href={href}
                            className={styles.item}
                            tabIndex={tabValue}
                            data-state={itemState}
                            data-enabled={resolvedEnabled}
                            aria-current={ariaCurrent}
                            onClick={(): void => {
                                handleClick(item, index);
                            }}
                            onKeyDown={(
                                event: KeyboardEvent<HTMLAnchorElement>,
                            ): void => {
                                handleKeyDown(event, index, item);
                            }}
                        >
                            {content}
                        </a>
                    );
                }

                return (
                    <button
                        key={item.id}
                        ref={(element: HTMLButtonElement | null): void => {
                            itemRefs.current[index] = element;
                        }}
                        type="button"
                        className={styles.item}
                        tabIndex={tabValue}
                        disabled={isDisabled}
                        data-state={itemState}
                        data-enabled={resolvedEnabled}
                        aria-current={ariaCurrent}
                        onClick={(): void => {
                            handleClick(item, index);
                        }}
                        onKeyDown={(
                            event: KeyboardEvent<HTMLButtonElement>,
                        ): void => {
                            handleKeyDown(event, index, item);
                        }}
                    >
                        {content}
                    </button>
                );
            })}
        </nav>
    );
}
