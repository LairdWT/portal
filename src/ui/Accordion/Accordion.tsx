import {
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    type ReactNode,
    type RefObject,
    useId,
    useRef,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Accordion.module.css';
import {
    type AccordionHeadingLevel,
    type AccordionItem,
    type AccordionProps,
    EAccordionItemState,
    EAccordionMode,
} from './Accordion.types';

// Pure disclosure predicate over the discriminated props union: an item is
// expanded when it is the single open id, or a member of the multiple open set.
// No default branch, so a new mode is a compile error.
function isExpanded(props: AccordionProps, id: string): boolean {
    switch (props.mode) {
        case EAccordionMode.Single:
            return props.expandedId === id;
        case EAccordionMode.Multiple:
            return props.expandedIds.includes(id);
    }
}

// Render the header button at the configured heading level. The level is
// constrained to 2 | 3 | 4 | 5 | 6 by the prop type, so the switch is exhaustive
// and avoids interpolating a tag name from a string.
function renderHeading(
    level: AccordionHeadingLevel,
    content: ReactNode,
): ReactElement {
    switch (level) {
        case 2:
            return <h2 className={styles.heading}>{content}</h2>;
        case 3:
            return <h3 className={styles.heading}>{content}</h3>;
        case 4:
            return <h4 className={styles.heading}>{content}</h4>;
        case 5:
            return <h5 className={styles.heading}>{content}</h5>;
        case 6:
            return <h6 className={styles.heading}>{content}</h6>;
    }
}

export function Accordion(props: AccordionProps): ReactElement {
    const {
        items,
        headingLevel = 3,
        enabled,
        status = EUiStatus.None,
        tone,
    }: {
        items: readonly AccordionItem[];
        headingLevel?: AccordionHeadingLevel;
        enabled?: EEnabledState;
        status?: EUiStatus;
        tone?: string | undefined;
    } = props;

    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const baseId: string = useId();
    const headerRefs: RefObject<readonly (HTMLButtonElement | null)[]> = useRef<
        readonly (HTMLButtonElement | null)[]
    >([]);
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    // Reports the next open state for the toggled id. Pure over props (no ref
    // access), so it is safe to reach from a directly-assigned named handler.
    function toggle(id: string): void {
        if (isDisabled) {
            return;
        }
        switch (props.mode) {
            case EAccordionMode.Single: {
                const open: boolean = props.expandedId === id;
                if (!open) {
                    props.onExpandedChange(id);
                    return;
                }
                const collapsible: boolean = props.collapsible ?? true;
                if (!collapsible) {
                    return;
                }
                props.onExpandedChange(null);
                return;
            }
            case EAccordionMode.Multiple: {
                const open: boolean = props.expandedIds.includes(id);
                if (!open) {
                    props.onExpandedChange([...props.expandedIds, id]);
                    return;
                }
                props.onExpandedChange(
                    props.expandedIds.filter(
                        (entry: string): boolean => entry !== id,
                    ),
                );
                return;
            }
        }
    }

    // Toggle the activated header. The per-item identity is read from the
    // data-item-id attribute on the button, so no per-item closure is captured.
    function handleHeaderClick(event: MouseEvent<HTMLButtonElement>): void {
        const id: string | undefined = event.currentTarget.dataset.itemId;
        if (id === undefined) {
            return;
        }
        toggle(id);
    }

    // APG convenience focus moves: Arrow Up/Down wrap, Home/End jump. Focus-only
    // (no toggle). Headers are independent tab stops, not a roving group, so this
    // never changes tabindex. Enter/Space are left to the native button click.
    function handleHeaderKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
        if (resolvedEnabled === EEnabledState.Disabled) {
            return;
        }
        if (items.length === 0) {
            return;
        }
        const raw: string | undefined = event.currentTarget.dataset.index;
        if (raw === undefined) {
            return;
        }
        const index: number = Number.parseInt(raw, 10);
        const lastIndex: number = items.length - 1;
        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                const next: number = index === lastIndex ? 0 : index + 1;
                headerRefs.current[next]?.focus();
                return;
            }
            case 'ArrowUp': {
                event.preventDefault();
                const previous: number = index === 0 ? lastIndex : index - 1;
                headerRefs.current[previous]?.focus();
                return;
            }
            case 'Home': {
                event.preventDefault();
                headerRefs.current[0]?.focus();
                return;
            }
            case 'End': {
                event.preventDefault();
                headerRefs.current[lastIndex]?.focus();
                return;
            }
            default:
                return;
        }
    }

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-status={status}
            data-enabled={resolvedEnabled}
        >
            {items.map((item: AccordionItem, index: number): ReactElement => {
                const expanded: boolean = isExpanded(props, item.id);
                const state: EAccordionItemState = expanded
                    ? EAccordionItemState.Expanded
                    : EAccordionItemState.Collapsed;
                const headerId: string = `${baseId}-header-${String(index)}`;
                const panelId: string = `${baseId}-panel-${String(index)}`;
                const headerButton: ReactElement = (
                    <button
                        id={headerId}
                        ref={(element: HTMLButtonElement | null): void => {
                            const next: (HTMLButtonElement | null)[] = [
                                ...headerRefs.current,
                            ];
                            next[index] = element;
                            headerRefs.current = next;
                        }}
                        type="button"
                        className={styles.header}
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        disabled={isDisabled}
                        data-state={state}
                        data-enabled={resolvedEnabled}
                        data-item-id={item.id}
                        data-index={index}
                        onClick={handleHeaderClick}
                        onKeyDown={handleHeaderKeyDown}
                    >
                        <span className={styles.marker} aria-hidden="true">
                            {expanded ? '[-]' : '[+]'}
                        </span>
                        <span className={styles.title}>{item.title}</span>
                    </button>
                );
                return (
                    <div
                        key={item.id}
                        className={styles.section}
                        data-state={state}
                    >
                        {renderHeading(headingLevel, headerButton)}
                        <div
                            id={panelId}
                            role="region"
                            aria-labelledby={headerId}
                            className={styles.panel}
                            data-state={state}
                            inert={expanded ? undefined : true}
                        >
                            <div className={styles.panelClip}>
                                <div className={styles.panelInner}>
                                    {item.content}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
