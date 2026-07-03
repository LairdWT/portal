import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useEffect,
    useState,
} from 'react';

import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './DialogueBox.module.css';
import { type DialogueBoxProps, EDialogueVariant } from './DialogueBox.types';

// Interval floor so a huge charactersPerSecond cannot busy-spin the tab.
const MIN_TICK_MS: number = 16;

// The DialogueBox: the narrative line surface. The typewriter reveal is
// interval-driven TEXT (state ticks inside the interval callback - the
// Cooldown countdown seam), with the unrevealed remainder rendered
// transparent so the box never reflows mid-line. Reduced motion (or no
// charactersPerSecond) shows the whole line at once; either way a polite
// announcer speaks the COMPLETE line once per text change, so assistive
// tech never waits out the reveal. The continue key completes a running
// line first, then advances (the genre convention).
export function DialogueBox({
    label,
    text,
    speaker,
    charactersPerSecond,
    onAdvance,
    advanceLabel,
    variant = EDialogueVariant.Dialogue,
    tone,
}: DialogueBoxProps): ReactElement {
    const reducedMotion: boolean = useReducedMotion();
    const instant: boolean =
        reducedMotion ||
        charactersPerSecond === undefined ||
        !Number.isFinite(charactersPerSecond) ||
        charactersPerSecond <= 0;

    const [revealCount, setRevealCount]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>(instant ? text.length : 0);
    // Restart the reveal when the line changes (render-phase sync, the
    // DatePicker pattern).
    const [prevText, setPrevText]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(text);
    if (text !== prevText) {
        setPrevText(text);
        setRevealCount(instant ? text.length : 0);
    }

    const complete: boolean = instant || revealCount >= text.length;

    useEffect((): (() => void) | undefined => {
        if (instant) {
            return undefined;
        }
        const tickMs: number = Math.max(
            MIN_TICK_MS,
            1000 / (charactersPerSecond ?? 1),
        );
        // The interval is the external-system seam: it ticks the reveal
        // forward and retires itself at the end of the line (an early
        // completion via the continue key just leaves it to self-retire on
        // the next tick).
        const timer: number = window.setInterval((): void => {
            setRevealCount((prev: number): number => {
                if (prev >= text.length) {
                    window.clearInterval(timer);
                    return prev;
                }
                return prev + 1;
            });
        }, tickMs);
        return (): void => {
            window.clearInterval(timer);
        };
    }, [text, instant, charactersPerSecond]);

    function handleAdvance(): void {
        if (!complete) {
            setRevealCount(text.length);
            return;
        }
        onAdvance?.();
    }

    const shown: number = instant
        ? text.length
        : Math.min(revealCount, text.length);
    const revealed: string = text.slice(0, shown);
    const remainder: string = text.slice(shown);
    const spokenLine: string = speaker !== undefined ? `${speaker}: ${text}` : text;

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <section
            className={className}
            style={toneProperties(tone)}
            data-variant={variant}
            data-state={complete ? 'complete' : 'revealing'}
            role="group"
            aria-label={label}
        >
            {speaker !== undefined && variant === EDialogueVariant.Dialogue ? (
                <span className={styles.speaker}>{speaker}</span>
            ) : null}
            {/* The visible reveal is decorative; the announcer below carries
                the line. The transparent remainder keeps the box size fixed
                for the whole reveal. */}
            <p className={styles.line} aria-hidden="true">
                {revealed}
                <span className={styles.unrevealed}>{remainder}</span>
            </p>
            <span className={styles.srOnly} aria-live="polite">
                {spokenLine}
            </span>
            {onAdvance !== undefined ? (
                <button
                    type="button"
                    className={styles.advance}
                    onClick={handleAdvance}
                >
                    {advanceLabel ?? 'Continue'}
                    <span className={styles.chevron} aria-hidden="true" />
                </button>
            ) : null}
        </section>
    );
}
