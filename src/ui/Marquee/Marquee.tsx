import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useRef,
    useState,
} from 'react';

import { useElementSize } from '../../react/hooks/useElementSize';
import { type ElementSize } from '../../react/hooks/useElementSize';
import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Marquee.module.css';
import {
    EMarqueeDirection,
    EMarqueePlayState,
    type MarqueeProps,
} from './Marquee.types';

// The two inline custom properties Marquee feeds the CSS module: the consumer's
// token-valued gap and the JS-computed constant-speed duration. String-typed
// keys (not string literals) so the computed keys satisfy CSSProperties, the
// same pattern tone.ts uses for --portal-tone.
const GAP_PROPERTY: string = '--portal-marquee-gap';
const DURATION_PROPERTY: string = '--portal-marquee-duration';

// Helicon clamps a negative speed to zero (no motion). Mirror that with a pure
// guard so a negative prop renders static instead of reversing.
function clampSpeed(speed: number): number {
    return Math.max(0, speed);
}

// Constant-SPEED duration: the seamless loop travels exactly one copy plus its
// gap (the -50% of the two-copy track) per cycle, so duration = distance /
// speed. Returns undefined when there is nothing to animate, so the static path
// never carries an animation-duration custom property.
function computeDurationSeconds(
    distancePx: number,
    speedPxPerSecond: number,
): string | undefined {
    if (speedPxPerSecond <= 0) {
        return undefined;
    }
    if (distancePx <= 0) {
        return undefined;
    }
    return `${String(distancePx / speedPxPerSecond)}s`;
}

// Builds the root inline style: the tone seed plus the gap, and the duration
// only when the strip actually animates (kept off the static path).
function marqueeStyle(
    tone: string | undefined,
    gap: string,
    durationSeconds: string | undefined,
): CSSProperties {
    const withGap: CSSProperties = {
        ...toneProperties(tone),
        [GAP_PROPERTY]: gap,
    };
    if (durationSeconds === undefined) {
        return withGap;
    }
    return { ...withGap, [DURATION_PROPERTY]: durationSeconds };
}

export function Marquee({
    children,
    speed = 60,
    gap = 'var(--portal-space-6)',
    direction = EMarqueeDirection.Start,
    pauseOnHover = true,
    pauseOnFocus = true,
    autoPlay = true,
    onPlayStateChange,
    pauseLabel = 'Pause ticker',
    resumeLabel = 'Resume ticker',
    enabled,
    status = EUiStatus.None,
    tone,
    label,
    labelledBy,
}: MarqueeProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const reducedMotion: boolean = useReducedMotion();

    // Three live measurements drive the fits-vs-overflow decision and the
    // constant-speed duration: the strip's inner width, the first copy's text
    // width (its padding-inline-end gap is excluded, so this is text-only), and
    // a hidden probe sized to the gap token (so the gap reaches JS as px).
    const viewportRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const copyRef: RefObject<HTMLSpanElement | null> =
        useRef<HTMLSpanElement | null>(null);
    const gapProbeRef: RefObject<HTMLSpanElement | null> =
        useRef<HTMLSpanElement | null>(null);
    const stripSize: ElementSize = useElementSize(viewportRef);
    const copySize: ElementSize = useElementSize(copyRef);
    const gapSize: ElementSize = useElementSize(gapProbeRef);

    const clampedSpeed: number = clampSpeed(speed);
    const overflowing: boolean =
        copySize.inlineSize > 0 && copySize.inlineSize > stripSize.inlineSize;
    // motionAllowed: the strip is in an animating configuration (a real button
    // and pause hooks are warranted). isAnimating: it is actually scrolling now.
    const motionAllowed: boolean =
        overflowing && clampedSpeed > 0 && !reducedMotion;
    const isAnimating: boolean = motionAllowed && !isDisabled;
    // The static-but-overflowing strip (reduced motion or speed 0) becomes a
    // focusable manual scroll region so the text stays readable; a disabled or
    // fitting strip never gets a useless tab stop.
    const scrollRegion: boolean = overflowing && !motionAllowed && !isDisabled;

    const distancePx: number = copySize.inlineSize + gapSize.inlineSize;
    const durationSeconds: string | undefined = isAnimating
        ? computeDurationSeconds(distancePx, clampedSpeed)
        : undefined;

    const [playState, setPlayState]: [
        EMarqueePlayState,
        Dispatch<SetStateAction<EMarqueePlayState>>,
    ] = useState<EMarqueePlayState>(
        autoPlay ? EMarqueePlayState.Running : EMarqueePlayState.Paused,
    );
    const paused: boolean = playState === EMarqueePlayState.Paused;

    const rootClassName: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    // A manual scroll region must be keyboard-focusable (WCAG 2.1.1 / axe
    // scrollable-region-focusable). The tab stop is applied as a spread binding
    // so the operable attribute lands without forcing a per-element interactive
    // role the ticker should not carry, and never as a useless tab stop on the
    // fitting or animating paths.
    const scrollBinding: Readonly<{ tabIndex?: number }> = scrollRegion
        ? { tabIndex: 0 }
        : {};

    function togglePlay(): void {
        if (isDisabled) {
            return;
        }
        const next: EMarqueePlayState = paused
            ? EMarqueePlayState.Running
            : EMarqueePlayState.Paused;
        setPlayState(next);
        onPlayStateChange?.(next);
    }

    return (
        <div
            className={rootClassName}
            style={marqueeStyle(tone, gap, durationSeconds)}
            role="group"
            data-status={status}
            data-enabled={resolvedEnabled}
            data-play-state={playState}
            data-overflowing={overflowing ? 'true' : 'false'}
            data-pause-on-hover={pauseOnHover ? 'true' : 'false'}
            data-pause-on-focus={pauseOnFocus ? 'true' : 'false'}
            {...(label !== undefined ? { 'aria-label': label } : {})}
            {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
        >
            <div
                ref={viewportRef}
                className={styles.viewport}
                data-animating={isAnimating ? 'true' : 'false'}
                data-scrollable={scrollRegion ? 'true' : 'false'}
                {...scrollBinding}
            >
                <div className={styles.track} data-direction={direction}>
                    <span ref={copyRef} className={styles.copy}>
                        {children}
                    </span>
                    {isAnimating ? (
                        <span className={styles.copy} aria-hidden="true">
                            {children}
                        </span>
                    ) : null}
                </div>
                <span
                    ref={gapProbeRef}
                    className={styles.gapProbe}
                    aria-hidden="true"
                />
            </div>
            {motionAllowed ? (
                <button
                    type="button"
                    className={styles.control}
                    aria-pressed={paused}
                    disabled={isDisabled}
                    onClick={togglePlay}
                >
                    <span className={styles.marker} aria-hidden="true">
                        {paused ? '[>]' : '[||]'}
                    </span>
                    <span className={styles.controlLabel}>
                        {paused ? resumeLabel : pauseLabel}
                    </span>
                </button>
            ) : null}
        </div>
    );
}
