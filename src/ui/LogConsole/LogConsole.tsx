import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    type UIEvent,
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    useVirtualWindow,
    type VirtualWindowState,
} from '../../react/hooks/useVirtualWindow';
import { Scanlines } from '../Scanlines/Scanlines';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './LogConsole.module.css';
import { type LogConsoleProps, type LogEntry } from './LogConsole.types';

// Fixed virtualization row height in px. 24 equals --portal-space-5 (1.5rem),
// the .row block-size in LogConsole.module.css (the DataTable 48/3rem
// pattern). Rows are single-line by contract.
const ROW_HEIGHT_PX: number = 24;

// Default viewport height: ~14 rows of scrollback.
const DEFAULT_BLOCK_SIZE: string = 'calc(var(--portal-space-5) * 14)';

// How close to the bottom (px) still counts as pinned when a scroll lands.
const PIN_THRESHOLD_PX: number = ROW_HEIGHT_PX / 2;

// The focusable-scroll-window binding for the log viewport. role="log" is
// the WAI-ARIA scrollable-log pattern, whose keyboard affordance is a
// focusable scroll window - but aria-query models log as structure-only, so
// a LITERAL tabIndex would be flagged by jsx-a11y. Spreading the binding
// (SplitPane's separator precedent) keeps the canonical role and the
// keyboard scroll without an eslint-disable.
const SCROLL_FOCUS_BINDING: { readonly tabIndex: number } = { tabIndex: 0 };

// The LogConsole: a virtualized mono scrollback. useVirtualWindow renders
// only the visible slice over a full-height spacer; follow-tail pins the
// viewport to the bottom as entries arrive (scroll away to unpin, scroll
// back or toggle to re-pin). The viewport carries role=log for the semantic
// but with aria-live OFF: virtualization remounts rows on every scroll, and
// a live window would narrate each remount. The polite sr-only announcer
// speaks only the latest entry instead.
export function LogConsole({
    label,
    entries,
    blockSize,
    followLabel,
    scanlines = true,
    tone,
}: LogConsoleProps): ReactElement {
    const scrollRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const [pinned, setPinned]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);

    const virtualWindow: VirtualWindowState = useVirtualWindow({
        rowCount: entries.length,
        rowHeight: ROW_HEIGHT_PX,
        scrollRef,
    });

    // Latest-entry announcement, re-derived when the tail grows
    // (render-phase sync, the DatePicker pattern).
    const [prevCount, setPrevCount]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(entries.length);
    const [announcement, setAnnouncement]: [
        string,
        Dispatch<SetStateAction<string>>,
    ] = useState<string>('');
    if (entries.length !== prevCount) {
        setPrevCount(entries.length);
        const latest: LogEntry | undefined = entries[entries.length - 1];
        if (entries.length > prevCount && latest !== undefined) {
            setAnnouncement(latest.message);
        }
    }

    // Follow-tail: while pinned, every entries change lands the viewport on
    // the bottom edge.
    useEffect((): void => {
        if (!pinned) {
            return;
        }
        const viewport: HTMLDivElement | null = scrollRef.current;
        if (viewport === null) {
            return;
        }
        viewport.scrollTop = viewport.scrollHeight;
    }, [pinned, entries]);

    // Manual scrolling drives the pin: away from the bottom unpins, landing
    // back on the bottom re-pins (the programmatic follow scroll lands at 0
    // distance, so following can never unpin itself).
    function handleScroll(event: UIEvent<HTMLDivElement>): void {
        const viewport: HTMLDivElement = event.currentTarget;
        const distance: number =
            viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
        const atBottom: boolean = distance <= PIN_THRESHOLD_PX;
        if (atBottom === pinned) {
            return;
        }
        setPinned(atBottom);
    }

    const windowed: readonly LogEntry[] = entries.slice(
        virtualWindow.startIndex,
        virtualWindow.endIndex,
    );

    const viewportStyle: CSSProperties = {
        blockSize: blockSize ?? DEFAULT_BLOCK_SIZE,
    };
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <section className={className} style={toneProperties(tone)}>
            <header className={styles.bar}>
                <span className={styles.title}>{label}</span>
                <button
                    type="button"
                    className={styles.followKey}
                    aria-pressed={pinned}
                    onClick={(): void => {
                        setPinned((prev: boolean): boolean => !prev);
                    }}
                >
                    {followLabel ?? 'Follow tail'}
                </button>
            </header>
            {/* The shell is the positioned, NON-scrolling host, so the
                contained Scanlines overlay stays pinned over the viewport
                instead of scrolling away with the content. */}
            <div className={styles.shell}>
                <div
                    ref={scrollRef}
                    className={styles.viewport}
                    style={viewportStyle}
                    role="log"
                    aria-live="off"
                    aria-label={label}
                    {...SCROLL_FOCUS_BINDING}
                    onScroll={handleScroll}
                >
                    <div
                        className={styles.spacer}
                        style={{
                            blockSize: `${String(virtualWindow.totalSize)}px`,
                        }}
                    >
                        <div
                            className={styles.window}
                            style={{
                                transform: `translateY(${String(virtualWindow.offsetStart)}px)`,
                            }}
                        >
                            {windowed.map(
                                (entry: LogEntry): ReactElement => (
                                    <div
                                        key={entry.id}
                                        className={styles.row}
                                        data-severity={entry.severity}
                                    >
                                        {entry.timeLabel !== undefined ? (
                                            <span className={styles.time}>
                                                {entry.timeLabel}
                                            </span>
                                        ) : null}
                                        <span className={styles.message}>
                                            {entry.message}
                                        </span>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                </div>
                {scanlines ? <Scanlines /> : null}
            </div>
            <span className={styles.srOnly} aria-live="polite">
                {announcement}
            </span>
        </section>
    );
}
