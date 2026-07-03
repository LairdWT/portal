import {
    type CSSProperties,
    type Dispatch,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    type UIEvent,
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    type MeasuredWindowState,
    useMeasuredWindow,
} from '../../react/hooks/useMeasuredWindow';
import {
    type PointerDragBinding,
    type PointerDragState,
    usePointerDrag,
} from '../../react/hooks/usePointerDrag';
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

// Time-column resize bounds (the DataTable clamp pattern) and the custom
// property the row grid template reads.
const TIME_WIDTH_PROPERTY: string = '--portal-logconsole-time-width';
const TIME_WIDTH_DEFAULT_PX: number = 96;
const TIME_WIDTH_MIN_PX: number = 48;
const TIME_WIDTH_MAX_PX: number = 320;
const TIME_RESIZE_STEP_PX: number = 8;

function clampTimeWidth(width: number): number {
    if (!Number.isFinite(width)) {
        return TIME_WIDTH_DEFAULT_PX;
    }
    return Math.min(TIME_WIDTH_MAX_PX, Math.max(TIME_WIDTH_MIN_PX, width));
}

// The LogConsole: a virtualized mono scrollback. useVirtualWindow (uniform
// single-line rows, the default) or useMeasuredWindow (the wrap opt-in, rows
// measured per entry) renders only the visible slice over a full-height
// spacer; follow-tail pins the viewport to the bottom as entries arrive
// (scroll away to unpin, scroll back or toggle to re-pin). The viewport
// carries role=log for the semantic but with aria-live OFF: virtualization
// remounts rows on every scroll, and a live window would narrate each
// remount. The polite sr-only announcer speaks only the latest entry instead.
export function LogConsole({
    label,
    entries,
    blockSize,
    followLabel,
    scanlines = true,
    wrap = false,
    resizableTime = false,
    timeColumnWidth,
    onTimeColumnWidthChange,
    fill = false,
    tone,
}: LogConsoleProps): ReactElement {
    const scrollRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const [pinned, setPinned]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);

    // The time-column width: controlled when the consumer passes it,
    // component-owned otherwise (the DataTable controlled-width pattern).
    const [internalTimeWidth, setInternalTimeWidth]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>(TIME_WIDTH_DEFAULT_PX);
    const resolvedTimeWidth: number = clampTimeWidth(
        timeColumnWidth ?? internalTimeWidth,
    );
    const [resizing, setResizing]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const resizeBaseRef: RefObject<number> = useRef<number>(0);
    const resizeDirectionRef: RefObject<number> = useRef<number>(1);

    function commitTimeWidth(next: number): void {
        const clamped: number = clampTimeWidth(next);
        if (clamped === resolvedTimeWidth) {
            return;
        }
        if (timeColumnWidth === undefined) {
            setInternalTimeWidth(clamped);
        }
        onTimeColumnWidthChange?.(clamped);
    }

    const resizeDrag: PointerDragBinding<HTMLDivElement> =
        usePointerDrag<HTMLDivElement>({
            disabled: !resizableTime,
            axisLock: 'x',
            onDrag: (state: PointerDragState): void => {
                commitTimeWidth(
                    resizeBaseRef.current + state.dx * resizeDirectionRef.current,
                );
            },
            onDragEnd: (): void => {
                setResizing(false);
            },
        });

    // Keyboard resize on the focused separator: logical arrows (Right/Up
    // widen, Left/Down narrow), Home/End jump to the clamps.
    function handleTimeGripKeyDown(
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void {
        let next: number;
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                next = resolvedTimeWidth + TIME_RESIZE_STEP_PX;
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                next = resolvedTimeWidth - TIME_RESIZE_STEP_PX;
                break;
            case 'Home':
                next = TIME_WIDTH_MIN_PX;
                break;
            case 'End':
                next = TIME_WIDTH_MAX_PX;
                break;
            default:
                return;
        }
        event.preventDefault();
        event.stopPropagation();
        commitTimeWidth(next);
    }

    // The separator's operable handlers ride a spreadable binding (the
    // SplitPane/DataTable precedent): aria-query models separator as
    // structure-only, so literal handlers would trip jsx-a11y even though
    // the APG sanctions the focusable widget.
    const timeGripHandlers: Readonly<{
        onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
        onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
        tabIndex: number;
    }> = {
        onPointerDown: (event: ReactPointerEvent<HTMLDivElement>): void => {
            resizeBaseRef.current = resolvedTimeWidth;
            resizeDirectionRef.current =
                getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1;
            setResizing(true);
            resizeDrag.onPointerDown(event);
        },
        onKeyDown: handleTimeGripKeyDown,
        tabIndex: 0,
    };

    // Both windowing hooks run unconditionally (rules of hooks); the
    // inactive one gets zero rows and returns its degenerate empty window.
    const uniformWindow: VirtualWindowState = useVirtualWindow({
        rowCount: wrap ? 0 : entries.length,
        rowHeight: ROW_HEIGHT_PX,
        scrollRef,
    });
    const measuredWindow: MeasuredWindowState = useMeasuredWindow({
        rowCount: wrap ? entries.length : 0,
        estimatedRowHeight: ROW_HEIGHT_PX,
        scrollRef,
    });
    const virtualWindow: VirtualWindowState = wrap
        ? {
              startIndex: measuredWindow.startIndex,
              endIndex: measuredWindow.endIndex,
              offsetStart: measuredWindow.offsetStart,
              totalSize: measuredWindow.totalSize,
          }
        : uniformWindow;

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
    // the bottom edge. The spacer size joins the deps because in wrap mode it
    // also moves on measurement flushes (rows re-measuring taller shift the
    // bottom), and the pin must re-land after each one.
    const spacerSize: number = virtualWindow.totalSize;
    useEffect((): void => {
        if (!pinned) {
            return;
        }
        const viewport: HTMLDivElement | null = scrollRef.current;
        if (viewport === null) {
            return;
        }
        viewport.scrollTop = Math.max(viewport.scrollHeight, spacerSize);
    }, [pinned, entries, spacerSize]);

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

    // Fill mode sets NO inline height: the flexed shell owns the viewport
    // size (an inline 100% would re-enter the flex-basis resolution and
    // collapse the viewport).
    const viewportStyle: CSSProperties | undefined = fill
        ? undefined
        : { blockSize: blockSize ?? DEFAULT_BLOCK_SIZE };
    const rowClassName: string = [styles.row, wrap ? styles.rowWrap : undefined]
        .filter((name: string | undefined): name is string => name !== undefined)
        .join(' ');
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');
    const rootStyle: CSSProperties = {
        ...toneProperties(tone),
        ...(resizableTime
            ? { [TIME_WIDTH_PROPERTY]: `${String(resolvedTimeWidth)}px` }
            : {}),
    };

    return (
        <section
            className={className}
            style={rootStyle}
            data-fill={fill ? 'true' : undefined}
        >
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
                                (
                                    entry: LogEntry,
                                    offsetIndex: number,
                                ): ReactElement => (
                                    <div
                                        key={entry.id}
                                        className={rowClassName}
                                        data-severity={entry.severity}
                                        {...(wrap
                                            ? {
                                                  ref: measuredWindow.measureRow(
                                                      virtualWindow.startIndex +
                                                          offsetIndex,
                                                  ),
                                              }
                                            : {})}
                                    >
                                        {/* Always mounted so the two-column
                                            grid keeps the message column
                                            aligned on label-less entries. */}
                                        <span className={styles.time}>
                                            {entry.timeLabel}
                                        </span>
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
                {resizableTime ? (
                    <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize time column"
                        aria-valuemin={TIME_WIDTH_MIN_PX}
                        aria-valuemax={TIME_WIDTH_MAX_PX}
                        aria-valuenow={resolvedTimeWidth}
                        className={styles.timeGrip}
                        data-active={resizing ? 'true' : undefined}
                        {...timeGripHandlers}
                    />
                ) : null}
            </div>
            <span className={styles.srOnly} aria-live="polite">
                {announcement}
            </span>
        </section>
    );
}
