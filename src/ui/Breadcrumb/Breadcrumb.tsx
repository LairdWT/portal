import {
    type Dispatch,
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
import { Popover } from '../Popover/Popover';
import { EPopoverPlacement, EPopoverRole } from '../Popover/Popover.types';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Breadcrumb.module.css';
import {
    type BreadcrumbItem,
    type BreadcrumbProps,
    EBreadcrumbCrumbState,
} from './Breadcrumb.types';

// The default accessible name of the nav landmark. A breadcrumb has a single
// universally-correct name, so this is a literal default rather than a required
// prop (the AccessibleName XOR the dialog pattern uses is needless friction
// here); a consumer may still override it through `label`.
const DEFAULT_LABEL: string = 'Breadcrumb';

// The accessible name of the collapsed-overflow control. Exported (off the
// barrel) so the test can assert the exact literal without duplicating it. The
// glyph itself is decorative CSS content, so this string is the control's only
// name.
export function defaultOverflowLabel(count: number): string {
    return `Show ${String(count)} more steps`;
}

// One crumb paired with its original index in `items`, so the aggregate
// onNavigate always reports the true position even for a crumb surfaced from the
// collapsed overflow panel.
type CrumbEntry = Readonly<{ item: BreadcrumbItem; index: number }>;

// The pure overflow plan. Either every crumb is shown, or the middle is folded
// behind an overflow control while the root (head) and the tail stay visible.
type VisiblePlan =
    | Readonly<{ kind: 'all'; entries: readonly CrumbEntry[] }>
    | Readonly<{
          kind: 'collapsed';
          head: CrumbEntry;
          hidden: readonly CrumbEntry[];
          tail: readonly CrumbEntry[];
      }>;

// One rendered list position: a crumb, or the overflow control carrying the
// hidden crumbs it reveals.
type Slot =
    | Readonly<{ kind: 'crumb'; entry: CrumbEntry }>
    | Readonly<{ kind: 'overflow'; hidden: readonly CrumbEntry[] }>;

// Decide which crumbs are visible. Collapse ONLY when an explicit maxVisible of
// at least 2 is smaller than the trail length; otherwise render all. The head is
// always the root and the current (last) node always lands in the tail.
function planVisible(
    items: readonly BreadcrumbItem[],
    maxVisible: number | undefined,
): VisiblePlan {
    const entries: readonly CrumbEntry[] = items.map(
        (item: BreadcrumbItem, index: number): CrumbEntry => ({ item, index }),
    );
    if (maxVisible === undefined || maxVisible < 2 || items.length <= maxVisible) {
        return { kind: 'all', entries };
    }
    const head: CrumbEntry | undefined = entries[0];
    if (head === undefined) {
        return { kind: 'all', entries };
    }
    const splitAt: number = entries.length - (maxVisible - 1);
    const hidden: readonly CrumbEntry[] = entries.slice(1, splitAt);
    const tail: readonly CrumbEntry[] = entries.slice(splitAt);
    return { kind: 'collapsed', head, hidden, tail };
}

export function Breadcrumb({
    items,
    onNavigate,
    label,
    labelledBy,
    maxVisible,
    overflowLabel,
    status,
    enabled,
    tone,
}: BreadcrumbProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const overflowId: string = useId();
    const [isOverflowOpen, setOverflowOpen]: [
        boolean,
        Dispatch<SetStateAction<boolean>>,
    ] = useState<boolean>(false);

    // The revealed disclosure list, reached across the Popover portal so the open
    // effect can pull keyboard focus into the panel. The panel mounts at the end of
    // the overlay root, so without this the revealed controls sit far away in tab
    // order; moving focus to the first one makes them reachable from the keyboard.
    const overflowListRef: RefObject<HTMLUListElement | null> =
        useRef<HTMLUListElement | null>(null);
    useEffect((): void => {
        if (!isOverflowOpen) {
            return;
        }
        overflowListRef.current
            ?.querySelector<HTMLButtonElement>('button')
            ?.focus();
    }, [isOverflowOpen]);

    const className: string = [toneStyles.toneScope, styles.nav]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    const navLabel: string = label ?? DEFAULT_LABEL;
    const navStatus: EUiStatus = status ?? EUiStatus.None;
    // labelledBy, when supplied, points the landmark at visible text and takes
    // precedence: aria-labelledby wins and the defaulted aria-label is dropped so
    // the two naming sources never both apply.
    const navNameProps: Readonly<
        { 'aria-labelledby': string } | { 'aria-label': string }
    > =
        labelledBy !== undefined
            ? { 'aria-labelledby': labelledBy }
            : { 'aria-label': navLabel };

    // Negative-first guard: an empty trail renders the landmark with an empty
    // list and short-circuits all overflow/selection math (Helicon renders an
    // empty slice as nothing meaningful).
    if (items.length === 0) {
        return (
            <nav
                className={className}
                style={toneProperties(tone)}
                data-status={navStatus}
                data-enabled={resolvedEnabled}
                {...navNameProps}
            >
                <ol className={styles.list} />
            </nav>
        );
    }

    const lastIndex: number = items.length - 1;
    const plan: VisiblePlan = planVisible(items, maxVisible);
    const slots: readonly Slot[] =
        plan.kind === 'all'
            ? plan.entries.map(
                  (entry: CrumbEntry): Slot => ({ kind: 'crumb', entry }),
              )
            : [
                  { kind: 'crumb', entry: plan.head },
                  { kind: 'overflow', hidden: plan.hidden },
                  ...plan.tail.map(
                      (entry: CrumbEntry): Slot => ({ kind: 'crumb', entry }),
                  ),
              ];

    function activate(
        item: BreadcrumbItem,
        index: number,
        fromOverflow: boolean,
    ): void {
        if (isDisabled) {
            return;
        }
        item.onNavigate?.();
        onNavigate?.(item.id, index);
        if (fromOverflow) {
            setOverflowOpen(false);
        }
    }

    function renderCrumb(entry: CrumbEntry, fromOverflow: boolean): ReactElement {
        const { item, index }: CrumbEntry = entry;
        if (index === lastIndex) {
            return (
                <span
                    className={styles.crumbLabel}
                    data-state={EBreadcrumbCrumbState.Current}
                    aria-current="page"
                >
                    {item.label}
                </span>
            );
        }
        const isInteractive: boolean =
            item.onNavigate !== undefined || onNavigate !== undefined;
        if (!isInteractive) {
            return (
                <span
                    className={styles.crumbLabel}
                    data-state={EBreadcrumbCrumbState.Link}
                >
                    {item.label}
                </span>
            );
        }
        return (
            <button
                type="button"
                className={styles.crumbLabel}
                data-state={EBreadcrumbCrumbState.Link}
                data-enabled={resolvedEnabled}
                disabled={isDisabled}
                onClick={(): void => {
                    activate(item, index, fromOverflow);
                }}
            >
                {item.label}
            </button>
        );
    }

    function renderOverflow(hidden: readonly CrumbEntry[]): ReactElement {
        const overflowName: string =
            overflowLabel ?? defaultOverflowLabel(hidden.length);
        // The trigger carries the shared crumb edge plus its own ellipsis/open
        // chrome; built with the same nullable-class filter the nav scope uses.
        const triggerClassName: string = [styles.crumbLabel, styles.overflowTrigger]
            .filter(
                (entry: string | undefined): entry is string => entry !== undefined,
            )
            .join(' ');
        return (
            <Popover
                open={isOverflowOpen}
                onClose={(): void => {
                    setOverflowOpen(false);
                }}
                role={EPopoverRole.Group}
                placement={EPopoverPlacement.Bottom}
                id={overflowId}
                trapFocus={false}
                trigger={
                    <button
                        type="button"
                        className={triggerClassName}
                        aria-label={overflowName}
                        aria-expanded={isOverflowOpen}
                        aria-controls={overflowId}
                        disabled={isDisabled}
                        onClick={(): void => {
                            setOverflowOpen((open: boolean): boolean => !open);
                        }}
                    />
                }
            >
                <ul ref={overflowListRef} className={styles.overflowList}>
                    {hidden.map(
                        (entry: CrumbEntry): ReactElement => (
                            <li key={entry.index} className={styles.overflowItem}>
                                {renderCrumb(entry, true)}
                            </li>
                        ),
                    )}
                </ul>
            </Popover>
        );
    }

    return (
        <nav
            className={className}
            style={toneProperties(tone)}
            data-status={navStatus}
            data-enabled={resolvedEnabled}
            {...navNameProps}
        >
            <ol className={styles.list}>
                {slots.map(
                    (slot: Slot, position: number): ReactElement => (
                        <li
                            key={
                                slot.kind === 'crumb'
                                    ? slot.entry.index
                                    : 'overflow'
                            }
                            className={styles.crumb}
                        >
                            {position > 0 ? (
                                <span
                                    className={styles.separator}
                                    aria-hidden="true"
                                />
                            ) : null}
                            {slot.kind === 'crumb'
                                ? renderCrumb(slot.entry, false)
                                : renderOverflow(slot.hidden)}
                        </li>
                    ),
                )}
            </ol>
        </nav>
    );
}
