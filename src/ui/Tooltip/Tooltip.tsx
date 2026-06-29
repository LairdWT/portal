import {
    cloneElement,
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';

import { Popover } from '../Popover/Popover';
import { EPopoverPlacement, EPopoverRole } from '../Popover/Popover.types';
import styles from './Tooltip.module.css';
import { type TooltipProps } from './Tooltip.types';

// Small grace period before a pointer-out hides the tooltip. It must outlast the
// pointer's transit across the Popover offset gap (Popover default offset 8px) so
// the pointer can reach the panel and the panel's pointer-enter bridge can cancel
// the close - the WCAG 1.4.13 "hoverable" requirement. Keyboard blur uses the
// same path; the short delay is imperceptible there.
const HOVER_BRIDGE_CLOSE_DELAY_MS: number = 120;

// The only trigger prop the Tooltip reads: an existing describedby token list to
// merge with the tooltip id. The pointer/focus handlers live on a wrapper span
// (so the consumer's element keeps its own handlers untouched), and cloneElement
// only ever sets the string aria-describedby on the trigger.
type TriggerProps = Readonly<{
    'aria-describedby'?: string;
}>;

// Join an existing describedby token list with the tooltip id, dropping an absent
// existing value so the result is exactly the tooltip id when none was present.
function joinIds(existing: string | undefined, tooltipId: string): string {
    if (existing === undefined || existing.length === 0) {
        return tooltipId;
    }
    return `${existing} ${tooltipId}`;
}

export function Tooltip({
    children,
    content,
    title,
    placement = EPopoverPlacement.Top,
    openDelayMs = 0,
    closeDelayMs = HOVER_BRIDGE_CLOSE_DELAY_MS,
    tone,
}: TooltipProps): ReactElement {
    // TooltipProps types `children` as a single ReactElement; the component's
    // contract is that the child is a trigger element accepting the trigger props
    // (aria-describedby et al.), so narrowing to ReactElement<TriggerProps> to
    // read and clone those props is sound. The value is wider than the target, so
    // `satisfies` cannot express this React children-typing boundary.
    const element: ReactElement<TriggerProps> =
        children as ReactElement<TriggerProps>;
    const childProps: TriggerProps = element.props;

    const tooltipId: string = useId();
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);

    const openTimerRef: RefObject<number | null> = useRef<number | null>(null);
    const closeTimerRef: RefObject<number | null> = useRef<number | null>(null);

    const clearTimers: () => void = useCallback((): void => {
        if (openTimerRef.current !== null) {
            window.clearTimeout(openTimerRef.current);
            openTimerRef.current = null;
        }
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    // Clear any pending timers when the trigger unmounts so no deferred state
    // update fires against a gone component. clearTimers is stable, so this runs
    // its cleanup exactly once on unmount.
    useEffect((): (() => void) => clearTimers, [clearTimers]);

    function scheduleOpen(): void {
        clearTimers();
        if (openDelayMs <= 0) {
            setOpen(true);
            return;
        }
        openTimerRef.current = window.setTimeout((): void => {
            setOpen(true);
        }, openDelayMs);
    }

    function scheduleClose(): void {
        clearTimers();
        if (closeDelayMs <= 0) {
            setOpen(false);
            return;
        }
        closeTimerRef.current = window.setTimeout((): void => {
            setOpen(false);
        }, closeDelayMs);
    }

    function handleClose(): void {
        clearTimers();
        setOpen(false);
    }

    // Pointer entered the portaled panel: cancel any close scheduled by the
    // trigger's pointer-leave so the panel stays reachable (WCAG 1.4.13). open is
    // already true here; setOpen(true) is idempotent and defensive.
    function handlePanelPointerEnter(): void {
        clearTimers();
        setOpen(true);
    }

    const describedBy: string | undefined = open
        ? joinIds(childProps['aria-describedby'], tooltipId)
        : childProps['aria-describedby'];

    // Clone only to attach the string aria-describedby on the actual focusable
    // trigger; the show/hide handlers stay on the wrapper span below.
    const describedChild: ReactElement = cloneElement(
        element,
        describedBy !== undefined ? { 'aria-describedby': describedBy } : {},
    );

    return (
        <Popover
            open={open}
            onClose={handleClose}
            trigger={
                <span
                    className={styles.triggerWrap}
                    onPointerEnter={scheduleOpen}
                    onPointerLeave={scheduleClose}
                    onFocus={scheduleOpen}
                    onBlur={scheduleClose}
                >
                    {describedChild}
                </span>
            }
            role={EPopoverRole.Tooltip}
            id={tooltipId}
            placement={placement}
            trapFocus={false}
            restoreFocus={false}
            onPanelPointerEnter={handlePanelPointerEnter}
            onPanelPointerLeave={scheduleClose}
            {...(tone !== undefined ? { tone } : {})}
        >
            <div className={styles.tooltip}>
                {title !== undefined ? (
                    <span className={styles.title}>{title}</span>
                ) : null}
                <span className={styles.body}>{content}</span>
            </div>
        </Popover>
    );
}
