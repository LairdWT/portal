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

// One log line. `message` renders on a SINGLE fixed-height row (the
// virtualization precondition - long lines ellipsize, wrapping is a
// deliberate non-goal in v1); `timeLabel` is a preformatted timestamp string
// (the console never formats dates).
export type LogEntry = Readonly<{
    id: string;
    message: string;
    severity?: ELogSeverity | undefined;
    timeLabel?: string | undefined;
}>;

// Props for the LogConsole: a virtualized mono scrollback (useVirtualWindow,
// so ten thousand entries mount a handful of rows) with a follow-tail toggle.
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
}> &
    Toned;
