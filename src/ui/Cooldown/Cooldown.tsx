import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react';

import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Cooldown.module.css';
import { type CooldownProps } from './Cooldown.types';

// The reveal keyframe name (CSS modules scope it with a suffix, so the
// animationend handler matches by inclusion) and the completion backstop
// headroom over the remaining time (the Toast exit pattern).
const REVEAL_ANIMATION_NAME: string = 'portal-cooldown-reveal';
const FALLBACK_HEADROOM_MS: number = 400;
const COUNTDOWN_TICK_MS: number = 1000;
const ANGLE_PROPERTY: string = '--portal-cooldown-angle';
const DURATION_PROPERTY: string = '--portal-cooldown-duration';
const FULL_TURN_DEGREES: number = 360;
const MS_PER_SECOND: number = 1000;

// The Cooldown: a clockwise-unwinding radial scrim wrapping arbitrary
// children. Under full motion the registered angle property carries the
// remainder autonomously (one CSS animation; completion is observed via
// animationend plus a timer backstop). Under reduced motion the sweep is
// static and a one-second numeric countdown carries the remainder instead;
// both paths report onComplete exactly once per armed countdown.
export function Cooldown({
    label,
    durationMs,
    remainingMs,
    onComplete,
    children,
    tone,
}: CooldownProps): ReactElement {
    const reducedMotion: boolean = useReducedMotion();
    const scrimRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);

    // Latest completion callback behind a ref so the arming effects never
    // re-run on a new callback identity.
    const onCompleteRef: RefObject<(() => void) | undefined> = useRef<
        (() => void) | undefined
    >(onComplete);
    useEffect((): void => {
        onCompleteRef.current = onComplete;
    });

    const isArmed: boolean = durationMs > 0 && remainingMs > 0;
    const safeRemaining: number = isArmed ? Math.min(remainingMs, durationMs) : 0;
    const inputs: string = `${String(durationMs)}:${String(remainingMs)}`;

    // `completed` is the component's own belief that a LIVE countdown
    // finished (the controlled props may never change on completion);
    // `tickRemaining` is the reduced-motion clock. Both re-seed when the
    // controlled inputs change (render-phase sync, the DatePicker pattern).
    const [completed, setCompleted]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [tickRemaining, setTickRemaining]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>(safeRemaining);
    const [prevInputs, setPrevInputs]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(inputs);
    if (inputs !== prevInputs) {
        setPrevInputs(inputs);
        setCompleted(false);
        setTickRemaining(safeRemaining);
    }

    // Full-motion completion: the scoped reveal animation ends (or the
    // backstop timer covers a throttled frame) and the countdown settles.
    useEffect((): (() => void) | undefined => {
        if (reducedMotion) {
            return undefined;
        }
        if (!isArmed || completed) {
            return undefined;
        }
        const scrim: HTMLDivElement | null = scrimRef.current;
        if (scrim === null) {
            return undefined;
        }
        let finished: boolean = false;
        function finish(): void {
            if (finished) {
                return;
            }
            finished = true;
            setCompleted(true);
            onCompleteRef.current?.();
        }
        function handleAnimationEnd(event: AnimationEvent): void {
            if (!event.animationName.includes(REVEAL_ANIMATION_NAME)) {
                return;
            }
            finish();
        }
        scrim.addEventListener('animationend', handleAnimationEnd);
        const timer: number = window.setTimeout(
            finish,
            safeRemaining + FALLBACK_HEADROOM_MS,
        );
        return (): void => {
            scrim.removeEventListener('animationend', handleAnimationEnd);
            window.clearTimeout(timer);
        };
    }, [reducedMotion, isArmed, completed, safeRemaining, prevInputs]);

    // Reduced-motion clock: a one-second tick drives the countdown text and
    // the static sweep angle, and the tick reaching zero settles the countdown
    // inside the timer callback (the external-system seam, so no synchronous
    // effect-body setState).
    useEffect((): (() => void) | undefined => {
        if (!reducedMotion) {
            return undefined;
        }
        if (!isArmed || completed) {
            return undefined;
        }
        let remaining: number = safeRemaining;
        const timer: number = window.setInterval((): void => {
            remaining -= COUNTDOWN_TICK_MS;
            setTickRemaining(remaining);
            if (remaining > 0) {
                return;
            }
            window.clearInterval(timer);
            setCompleted(true);
            onCompleteRef.current?.();
        }, COUNTDOWN_TICK_MS);
        return (): void => {
            window.clearInterval(timer);
        };
    }, [reducedMotion, isArmed, completed, safeRemaining, prevInputs]);

    const cooling: boolean = isArmed && !completed;
    const displayRemaining: number = reducedMotion
        ? Math.min(Math.max(tickRemaining, 0), safeRemaining)
        : safeRemaining;
    const revealFraction: number =
        durationMs > 0
            ? Math.min(1, Math.max(0, 1 - displayRemaining / durationMs))
            : 1;
    const secondsText: string = `${String(Math.ceil(displayRemaining / MS_PER_SECOND))}s`;

    const rootStyle: CSSProperties = {
        ...toneProperties(tone),
        [ANGLE_PROPERTY]: `${String(revealFraction * FULL_TURN_DEGREES)}deg`,
        [DURATION_PROPERTY]: `${String(safeRemaining)}ms`,
    };
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <div
            className={className}
            style={rootStyle}
            role="timer"
            aria-label={label}
            data-state={cooling ? 'cooling' : 'ready'}
            data-flash={completed ? 'true' : undefined}
        >
            <div className={styles.content}>{children}</div>
            {cooling ? (
                // Keyed by the controlled inputs so a re-arm always restarts
                // the one-shot reveal animation from the fresh angle.
                <div
                    key={inputs}
                    ref={scrimRef}
                    className={styles.scrim}
                    aria-hidden="true"
                >
                    {reducedMotion ? (
                        <span className={styles.count}>{secondsText}</span>
                    ) : (
                        <span className={styles.edge} />
                    )}
                </div>
            ) : null}
        </div>
    );
}
