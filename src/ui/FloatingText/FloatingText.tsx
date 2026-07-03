import {
    type AnimationEvent,
    type CSSProperties,
    type ReactElement,
    type RefObject,
    useCallback,
    useEffect,
    useRef,
} from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './FloatingText.module.css';
import {
    type FloatingTextEvent,
    type FloatingTextProps,
} from './FloatingText.types';

// Full-motion rise duration; the backstop timer covers reduced motion and a
// missed animationend (the Toast lifecycle).
const RISE_DURATION_MS: number = 900;
const BACKSTOP_MS: number = 400;

// Deterministic horizontal drift per event slot, in px: overlapping events
// fan across three lanes instead of stacking (no randomness - it would
// break render determinism).
const DRIFT_STEP_PX: number = 28;
const DRIFT_LANES: number = 3;

const DRIFT_PROPERTY: string = '--portal-floating-drift';

type FloatingTextItemProps = Readonly<{
    event: FloatingTextEvent;
    lane: number;
    onExpire: ((id: string) => void) | undefined;
}>;

// One mounted event: expires exactly once, through animationend under full
// motion or the backstop timer under reduced motion (where the run is a
// plain timed display).
function FloatingTextItem({
    event,
    lane,
    onExpire,
}: FloatingTextItemProps): ReactElement {
    const expiredRef: RefObject<boolean> = useRef<boolean>(false);
    const onExpireRef: RefObject<((id: string) => void) | undefined> = useRef<
        ((id: string) => void) | undefined
    >(onExpire);
    useEffect((): void => {
        onExpireRef.current = onExpire;
    });

    const expire: () => void = useCallback((): void => {
        if (expiredRef.current) {
            return;
        }
        expiredRef.current = true;
        onExpireRef.current?.(event.id);
    }, [event.id]);

    useEffect((): (() => void) => {
        const timer: number = window.setTimeout(
            expire,
            RISE_DURATION_MS + BACKSTOP_MS,
        );
        return (): void => {
            window.clearTimeout(timer);
        };
    }, [expire]);

    const itemStyle: CSSProperties = {
        [DRIFT_PROPERTY]: `${String((lane - Math.floor(DRIFT_LANES / 2)) * DRIFT_STEP_PX)}px`,
    };

    return (
        <span
            className={styles.event}
            style={itemStyle}
            data-status={event.status}
            data-emphasis={event.emphasis === true ? 'true' : undefined}
            onAnimationEnd={(
                animationEvent: AnimationEvent<HTMLSpanElement>,
            ): void => {
                if (
                    !animationEvent.animationName.includes('portal-floating-rise')
                ) {
                    return;
                }
                expire();
            }}
        >
            {event.text}
        </span>
    );
}

// The FloatingText: a decorative combat-text layer filling its positioned
// container. Every mounted event rises and fades once (transform/opacity
// only) and reports onExpire so the consumer prunes its list; under reduced
// motion the run is a static timed display on the same expiry path. The
// drawing plane is aria-hidden; `announce` adds a polite announcer speaking
// only the NEWEST event (never the remounting plane).
export function FloatingText({
    events,
    onExpire,
    announce = false,
    tone,
}: FloatingTextProps): ReactElement {
    const latest: FloatingTextEvent | undefined = events[events.length - 1];
    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <span className={className} style={toneProperties(tone)}>
            <span className={styles.plane} aria-hidden="true">
                {events.map(
                    (event: FloatingTextEvent, index: number): ReactElement => (
                        <FloatingTextItem
                            key={event.id}
                            event={event}
                            lane={index % DRIFT_LANES}
                            onExpire={onExpire}
                        />
                    ),
                )}
            </span>
            {announce ? (
                <span className={styles.srOnly} aria-live="polite">
                    {latest?.text ?? ''}
                </span>
            ) : null}
        </span>
    );
}
