import { type Toned } from '../tone';

// Per-entry severity. The kebab values double as the data-severity attribute
// the CSS keys row color off (Debug dims, Warning/Error recolor through the
// universal status tokens; message text itself stays AA-legible).
export const ELogSeverity: {
    readonly Debug: 'debug';
    readonly Info: 'info';
    readonly Warning: 'warning';
    readonly Error: 'error';
} = {
    Debug: 'debug',
    Info: 'info',
    Warning: 'warning',
    Error: 'error',
};
export type ELogSeverity = (typeof ELogSeverity)[keyof typeof ELogSeverity];

// One log line. `message` renders on a single fixed-height row by default
// (long lines ellipsize; the uniform-height virtualization precondition) -
// the console-level `wrap` prop opts into measured multi-line rows.
// `timeLabel` is a preformatted timestamp string (the console never formats
// dates).
export type LogEntry = Readonly<{
    id: string;
    message: string;
    severity?: ELogSeverity | undefined;
    timeLabel?: string | undefined;
}>;

// Props for the LogConsole: a virtualized mono scrollback (useVirtualWindow
// on the uniform default path, useMeasuredWindow when `wrap` opts into
// variable-height rows - either way ten thousand entries mount a handful of
// rows) with a follow-tail toggle.
// While following, new entries pin the view to the bottom; scrolling away
// unpins, and scrolling back to the bottom (or the toggle) re-pins. A polite
// live announcer speaks only the LATEST entry, never the scroll window (a
// virtualized role=log would announce remounted rows on every scroll).
export type LogConsoleProps = Readonly<{
    /**
     * Accessible name for the console region; also the header title.
     */
    label: string;
    entries: readonly LogEntry[];
    /**
     * Viewport block-size as a CSS length/token string. Default a
     * token-derived ~14-row height.
     */
    blockSize?: string | undefined;
    /**
     * Accessible label for the follow-tail toggle. Default "Follow tail".
     */
    followLabel?: string | undefined;
    /**
     * Render the CRT scanline overlay. Default true.
     */
    scanlines?: boolean | undefined;
    /**
     * Wrap long messages onto multiple lines. Opting in switches the
     * virtualization to measured (variable) row heights; the default keeps
     * the uniform fixed-height fast path with single-line ellipsized rows.
     */
    wrap?: boolean | undefined;
    /**
     * Renders a draggable/keyboard-operable separator on the time|message
     * boundary (the DataTable resize recipe, styled on the unified divider
     * standard) and lays every row on ONE shared two-column grid so the
     * columns align. The width is component-owned by default; pass
     * timeColumnWidth (px, clamped 48..320) with onTimeColumnWidthChange to
     * own it.
     */
    resizableTime?: boolean | undefined;
    timeColumnWidth?: number | undefined;
    onTimeColumnWidthChange?: ((width: number) => void) | undefined;
    /**
     * Sizes the console to FILL a definite-height parent (a DockLayout
     * panel or any docked host): the root stretches to 100% block-size and
     * the viewport flexes instead of taking the fixed blockSize.
     */
    fill?: boolean | undefined;
}> &
    Toned;
