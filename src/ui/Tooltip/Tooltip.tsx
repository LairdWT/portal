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
    closeDelayMs = 0,
    tone,
}: TooltipProps): ReactElement {
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
