// Injectable monotonic clock for input timestamps: a function returning the
// current time in milliseconds. Kept React-free so the input core stays pure.
// `performance` is a standard global (not a DOM-element lookup like document or
// window), so the default browser clock lives here alongside the type, and this
// is the single place performance.now() is read.

export type TimeProvider = () => number;

export const performanceNowTimeProvider: TimeProvider = (): number =>
    performance.now();
