import {
    type Dispatch,
    type FocusEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { Banner } from '../Banner/Banner';
import { EBannerKind } from '../Banner/Banner.types';
import { EOverlayMotion } from '../overlayMotion';
import { ensureOverlayRoot } from '../overlayRoot';
import styles from './Toast.module.css';
import {
    EToastKind,
    EToastPlacement,
    type ToastContextValue,
    type ToastInput,
    type ToastProviderProps,
    type ToastRecord,
} from './Toast.types';
import { ToastContext } from './useToast';

const DEFAULT_DURATION_MS: number = 6000;
const DEFAULT_MAX: number = 4;
const VIEWPORT_LABEL: string = 'Notifications';

// The exit keyframe name (CSS modules scope it with a suffix, so the
// animationend handler matches by inclusion) and the removal backstop while a
// card is leaving, covering the exit duration (ui-base) plus generous
// headroom for a throttled frame.
const EXIT_ANIMATION_NAME: string = 'portal-toast-out';
const EXIT_FALLBACK_MS: number = 600;

// A live auto-dismiss timer plus the bookkeeping needed to pause and resume it:
// `remaining` is the time left when the timer was (re)armed and `startedAt` the
// moment it was armed, so a pause can bank the unused remainder exactly. A null
// timerId marks a paused (or sticky-but-tracked) entry with no live timeout.
type TimerEntry = {
    timerId: number | null;
    remaining: number;
    startedAt: number;
};

// Map a toast severity onto the Banner severity. The values are identical, but
// the explicit exhaustive switch keeps the two enums independently typed (no
// shared ESeverity is hoisted into the shipped Banner).
function toBannerKind(kind: EToastKind): EBannerKind {
    switch (kind) {
        case EToastKind.Info:
            return EBannerKind.Info;
        case EToastKind.Success:
            return EBannerKind.Success;
        case EToastKind.Warning:
            return EBannerKind.Warning;
        case EToastKind.Danger:
            return EBannerKind.Danger;
    }
}

type ToastCardProps = Readonly<{
    toast: ToastRecord;
    reducedMotion: boolean;
    leaving: boolean;
    onDismiss: (id: string) => void;
    onGone: (id: string) => void;
}>;

// One toast card. The Banner provides the tinted severity surface, the
// status/alert live-region role, and the labelled dismiss button; this wrapper
// carries the reduced-motion-gated entrance/exit and the optional title. A
// dismissed card stays mounted in the `leaving` state so the exit animation
// can play; it reports itself gone on the exit animation's end - a NATIVE
// animationend listener (works identically in the browser and jsdom) with a
// timer backstop for a throttled frame.
function ToastCard({
    toast,
    reducedMotion,
    leaving,
    onDismiss,
    onGone,
}: ToastCardProps): ReactElement {
    const cardRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
        null,
    );

    useEffect((): (() => void) | undefined => {
        if (!leaving) {
            return undefined;
        }
        const timer: number = window.setTimeout((): void => {
            onGone(toast.id);
        }, EXIT_FALLBACK_MS);
        const card: HTMLDivElement | null = cardRef.current;
        if (card === null) {
            return (): void => {
                window.clearTimeout(timer);
            };
        }
        const handleAnimationEnd: (event: AnimationEvent) => void = (
            event: AnimationEvent,
        ): void => {
            // CSS modules scope the keyframe name, so match by inclusion.
            if (!event.animationName.includes(EXIT_ANIMATION_NAME)) {
                return;
            }
            onGone(toast.id);
        };
        card.addEventListener('animationend', handleAnimationEnd);
        return (): void => {
            window.clearTimeout(timer);
            card.removeEventListener('animationend', handleAnimationEnd);
        };
    }, [leaving, onGone, toast.id]);

    function handleDismiss(): void {
        onDismiss(toast.id);
    }
    return (
        <div
            ref={cardRef}
            className={styles.card}
            data-kind={toast.kind}
            data-state={leaving ? 'leaving' : 'open'}
            data-motion={
                reducedMotion ? EOverlayMotion.Reduced : EOverlayMotion.Full
            }
        >
            <Banner
                kind={toBannerKind(toast.kind)}
                icon={toast.icon}
                tone={toast.tone}
                onDismiss={handleDismiss}
            >
                {toast.title !== undefined ? (
                    <span className={styles.title}>{toast.title}</span>
                ) : null}
                <span className={styles.message}>{toast.message}</span>
            </Banner>
        </div>
    );
}

type ToastViewportProps = Readonly<{
    toasts: readonly ToastRecord[];
    leavingIds: ReadonlySet<string>;
    placement: EToastPlacement;
    reducedMotion: boolean;
    onDismiss: (id: string) => void;
    onGone: (id: string) => void;
    onPointerPause: () => void;
    onPointerRelease: () => void;
    onFocusPause: () => void;
    onFocusRelease: () => void;
}>;

// The portaled, corner-anchored stack. It is a labelled region whose cards are
// the per-severity live regions. Pointer-over and focus-within are two
// INDEPENDENT pause sources: whichever engages first pauses the auto-dismiss
// timers (so a reader is not cut off) and the timers only resume once BOTH have
// cleared. Leaving with the pointer while a control stays focused - or blurring
// while the pointer still rests over the stack - must not resume.
function ToastViewport({
    toasts,
    leavingIds,
    placement,
    reducedMotion,
    onDismiss,
    onGone,
    onPointerPause,
    onPointerRelease,
    onFocusPause,
    onFocusRelease,
}: ToastViewportProps): ReactElement | null {
    const [overlayRoot]: [
        HTMLElement | null,
        Dispatch<SetStateAction<HTMLElement | null>>,
    ] = useState<HTMLElement | null>((): HTMLElement | null => ensureOverlayRoot());
    if (overlayRoot === null) {
        return null;
    }

    // A blur whose focus target is still inside the viewport is focus moving
    // between two cards (or their controls), not focus leaving: keep the focus
    // source engaged and release only when focus truly exits the stack.
    function handleBlur(event: FocusEvent<HTMLDivElement>): void {
        const next: Node | null =
            event.relatedTarget instanceof Node ? event.relatedTarget : null;
        if (next !== null && event.currentTarget.contains(next)) {
            return;
        }
        onFocusRelease();
    }

    return createPortal(
        <div
            className={styles.viewport}
            role="region"
            aria-label={VIEWPORT_LABEL}
            data-placement={placement}
            onPointerEnter={onPointerPause}
            onPointerLeave={onPointerRelease}
            onFocus={onFocusPause}
            onBlur={handleBlur}
        >
            {toasts.map(
                (toast: ToastRecord): ReactElement => (
                    <ToastCard
                        key={toast.id}
                        toast={toast}
                        reducedMotion={reducedMotion}
                        leaving={leavingIds.has(toast.id)}
                        onDismiss={onDismiss}
                        onGone={onGone}
                    />
                ),
            )}
        </div>,
        overlayRoot,
    );
}

export function ToastProvider({
    children,
    placement = EToastPlacement.BottomRight,
    defaultDurationMs = DEFAULT_DURATION_MS,
    max = DEFAULT_MAX,
}: ToastProviderProps): ReactElement {
    const [toasts, setToasts]: [
        readonly ToastRecord[],
        Dispatch<SetStateAction<readonly ToastRecord[]>>,
    ] = useState<readonly ToastRecord[]>([]);
    // Ids of dismissed toasts still playing their exit animation. They stay in
    // `toasts` (so the leaving card keeps rendering) until the card reports
    // itself gone; under reduced motion this set stays empty and dismissal
    // removes immediately.
    const [leavingIds, setLeavingIds]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(new Set<string>());
    const prefersReducedMotion: boolean = useReducedMotion();

    const timersRef: RefObject<Map<string, TimerEntry>> = useRef<
        Map<string, TimerEntry>
    >(new Map<string, TimerEntry>());
    // Auto-dismiss can be paused by two independent sources: the pointer resting
    // over the stack and focus resting within it. `pausedRef` records whether the
    // shared timers are currently banked (the FIRST source to engage banks them),
    // while the two source refs record which sources still hold the pause open so
    // a resume runs only once BOTH have cleared. Blur events carry no pointer
    // data, so pointer-inside is tracked here rather than read off the event.
    const pausedRef: RefObject<boolean> = useRef<boolean>(false);
    const pointerInsideRef: RefObject<boolean> = useRef<boolean>(false);
    const focusInsideRef: RefObject<boolean> = useRef<boolean>(false);
    const idPrefix: string = useId();
    const counterRef: RefObject<number> = useRef<number>(0);

    const clearTimer: (id: string) => void = useCallback((id: string): void => {
        const entry: TimerEntry | undefined = timersRef.current.get(id);
        if (entry === undefined) {
            return;
        }
        if (entry.timerId !== null) {
            window.clearTimeout(entry.timerId);
        }
        timersRef.current.delete(id);
    }, []);

    // Final removal: drop the toast and clear its leaving mark. This is the
    // card's onGone callback and the direct path for reduced motion / clear().
    const settle: (id: string) => void = useCallback((id: string): void => {
        setToasts((prev: readonly ToastRecord[]): readonly ToastRecord[] =>
            prev.filter((toast: ToastRecord): boolean => toast.id !== id),
        );
        setLeavingIds((prev: ReadonlySet<string>): ReadonlySet<string> => {
            if (!prev.has(id)) {
                return prev;
            }
            const next: Set<string> = new Set<string>(prev);
            next.delete(id);
            return next;
        });
    }, []);

    // Dismissal is two-phase under full motion: mark the card leaving so its
    // exit animation plays, then the card settles itself on animationend (or
    // the backstop timer). Reduced motion removes immediately - the leaving
    // state exists only to be animated.
    const dismiss: (id: string) => void = useCallback(
        (id: string): void => {
            clearTimer(id);
            if (prefersReducedMotion) {
                settle(id);
                return;
            }
            setLeavingIds((prev: ReadonlySet<string>): ReadonlySet<string> => {
                if (prev.has(id)) {
                    return prev;
                }
                const next: Set<string> = new Set<string>(prev);
                next.add(id);
                return next;
            });
        },
        [clearTimer, prefersReducedMotion, settle],
    );

    const scheduleTimer: (id: string, duration: number) => void = useCallback(
        (id: string, duration: number): void => {
            if (duration <= 0) {
                return;
            }
            const startedAt: number = performance.now();
            const timerId: number = window.setTimeout((): void => {
                dismiss(id);
            }, duration);
            timersRef.current.set(id, { timerId, remaining: duration, startedAt });
        },
        [dismiss],
    );

    const notify: (input: ToastInput) => string = useCallback(
        (input: ToastInput): string => {
            counterRef.current += 1;
            const id: string = `${idPrefix}toast-${String(counterRef.current)}`;
            const record: ToastRecord = { ...input, id };
            setToasts((prev: readonly ToastRecord[]): readonly ToastRecord[] => {
                const next: readonly ToastRecord[] = [...prev, record];
                if (max > 0 && next.length > max) {
                    return next.slice(next.length - max);
                }
                return next;
            });
            const duration: number = input.durationMs ?? defaultDurationMs;
            if (pausedRef.current) {
                if (duration > 0) {
                    timersRef.current.set(id, {
                        timerId: null,
                        remaining: duration,
                        startedAt: performance.now(),
                    });
                }
            } else {
                scheduleTimer(id, duration);
            }
            return id;
        },
        [defaultDurationMs, idPrefix, max, scheduleTimer],
    );

    const clear: () => void = useCallback((): void => {
        timersRef.current.forEach((entry: TimerEntry): void => {
            if (entry.timerId !== null) {
                window.clearTimeout(entry.timerId);
            }
        });
        timersRef.current.clear();
        setToasts([]);
        setLeavingIds(new Set<string>());
    }, []);

    const pauseAll: () => void = useCallback((): void => {
        if (pausedRef.current) {
            return;
        }
        pausedRef.current = true;
        const now: number = performance.now();
        timersRef.current.forEach((entry: TimerEntry, id: string): void => {
            if (entry.timerId !== null) {
                window.clearTimeout(entry.timerId);
            }
            const elapsed: number = now - entry.startedAt;
            const remaining: number = Math.max(0, entry.remaining - elapsed);
            timersRef.current.set(id, { timerId: null, remaining, startedAt: now });
        });
    }, []);

    const resumeAll: () => void = useCallback((): void => {
        if (!pausedRef.current) {
            return;
        }
        pausedRef.current = false;
        const entries: readonly [string, TimerEntry][] = Array.from(
            timersRef.current.entries(),
        );
        entries.forEach(([id, entry]: [string, TimerEntry]): void => {
            if (entry.remaining <= 0) {
                dismiss(id);
                return;
            }
            scheduleTimer(id, entry.remaining);
        });
    }, [dismiss, scheduleTimer]);

    // The pointer entered the stack: engage the pointer source and pause. The
    // shared pause is idempotent, so focus engaging afterwards is a no-op that
    // leaves the banked remainder untouched.
    const pausePointer: () => void = useCallback((): void => {
        pointerInsideRef.current = true;
        pauseAll();
    }, [pauseAll]);

    // The pointer left: clear only the pointer source. Do not resume while focus
    // still holds the stack, otherwise a keyboard user on a Dismiss button would
    // lose the toast the moment the mouse drifts off the viewport.
    const releasePointer: () => void = useCallback((): void => {
        pointerInsideRef.current = false;
        if (focusInsideRef.current) {
            return;
        }
        resumeAll();
    }, [resumeAll]);

    // Focus entered the stack: engage the focus source and pause (idempotent
    // alongside the pointer source).
    const pauseFocus: () => void = useCallback((): void => {
        focusInsideRef.current = true;
        pauseAll();
    }, [pauseAll]);

    // Focus left the stack for outside it: clear only the focus source. Do not
    // resume while the pointer is still resting over the stack.
    const releaseFocus: () => void = useCallback((): void => {
        focusInsideRef.current = false;
        if (pointerInsideRef.current) {
            return;
        }
        resumeAll();
    }, [resumeAll]);

    // Drop the timers of any toast that left the queue (for example trimmed by
    // `max`), so an overflowed toast never fires a stale auto-dismiss.
    useEffect((): void => {
        const liveIds: ReadonlySet<string> = new Set<string>(
            toasts.map((toast: ToastRecord): string => toast.id),
        );
        timersRef.current.forEach((entry: TimerEntry, id: string): void => {
            if (!liveIds.has(id)) {
                if (entry.timerId !== null) {
                    window.clearTimeout(entry.timerId);
                }
                timersRef.current.delete(id);
            }
        });
    }, [toasts]);

    // Clear every live timer on unmount so no deferred dismiss fires against a
    // gone provider.
    useEffect((): (() => void) => {
        const timers: Map<string, TimerEntry> = timersRef.current;
        return (): void => {
            timers.forEach((entry: TimerEntry): void => {
                if (entry.timerId !== null) {
                    window.clearTimeout(entry.timerId);
                }
            });
            timers.clear();
        };
    }, []);

    const api: ToastContextValue = useMemo<ToastContextValue>(
        (): ToastContextValue => ({ notify, dismiss, clear }),
        [notify, dismiss, clear],
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <ToastViewport
                toasts={toasts}
                leavingIds={leavingIds}
                placement={placement}
                reducedMotion={prefersReducedMotion}
                onDismiss={dismiss}
                onGone={settle}
                onPointerPause={pausePointer}
                onPointerRelease={releasePointer}
                onFocusPause={pauseFocus}
                onFocusRelease={releaseFocus}
            />
        </ToastContext.Provider>
    );
}
