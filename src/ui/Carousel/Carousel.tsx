import {
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    type UIEvent,
    useId,
    useRef,
    useState,
} from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Carousel.module.css';
import type { CarouselItem, CarouselProps } from './Carousel.types';

// The scroll-snap carousel in the APG TABBED pattern: the dot rail is a
// tablist whose tabs select slides, each slide is the matching tabpanel, and
// the internal index mirrors the track's scroll position (native swipes
// included). The keys and dots scroll to a slide; CSS owns the smoothing.
export function Carousel({
    label,
    items,
    previousLabel,
    nextLabel,
    tone,
}: CarouselProps): ReactElement {
    const baseId: string = useId();
    const trackRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const tablistRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const [index, setIndex]: [number, (index: number) => void] =
        useState<number>(0);
    const clampedIndex: number = Math.min(index, Math.max(0, items.length - 1));

    function tabId(position: number): string {
        return `${baseId}-tab-${String(position)}`;
    }

    function panelId(position: number): string {
        return `${baseId}-panel-${String(position)}`;
    }

    function slideName(item: CarouselItem, position: number): string {
        return (
            item.label ?? `Slide ${String(position + 1)} of ${String(items.length)}`
        );
    }

    function goTo(nextIndex: number): void {
        const clamped: number = Math.min(
            Math.max(nextIndex, 0),
            Math.max(0, items.length - 1),
        );
        setIndex(clamped);
        const track: HTMLDivElement | null = trackRef.current;
        if (track === null) {
            return;
        }
        const slide: Element | undefined = track.children[clamped];
        if (!(slide instanceof HTMLElement)) {
            return;
        }
        // scrollIntoView is direction-safe (RTL included) and rides the CSS
        // scroll-behavior for smoothing (jsdom stubs it in tests).
        slide.scrollIntoView({ inline: 'center', block: 'nearest' });
    }

    // Native scrolling (swipe, trackpad) drives the same index so the dots
    // and key gating follow the user.
    function handleScroll(event: UIEvent<HTMLDivElement>): void {
        const track: HTMLDivElement = event.currentTarget;
        if (track.clientWidth <= 0) {
            return;
        }
        const nearest: number = Math.round(
            Math.abs(track.scrollLeft) / track.clientWidth,
        );
        const clamped: number = Math.min(
            Math.max(nearest, 0),
            Math.max(0, items.length - 1),
        );
        if (clamped !== clampedIndex) {
            setIndex(clamped);
        }
    }

    // The roving arrows, attached to every tab (keydown fires on the focused
    // tab): move selection and carry DOM focus to the newly active tab.
    function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
        let next: number;
        switch (event.key) {
            case 'ArrowRight':
                next = clampedIndex + 1;
                break;
            case 'ArrowLeft':
                next = clampedIndex - 1;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = items.length - 1;
                break;
            default:
                return;
        }
        event.preventDefault();
        const clamped: number = Math.min(
            Math.max(next, 0),
            Math.max(0, items.length - 1),
        );
        goTo(clamped);
        const tablist: HTMLDivElement | null = tablistRef.current;
        const tab: Element | undefined = tablist?.children[clamped];
        if (tab instanceof HTMLElement) {
            tab.focus();
        }
    }

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <section
            className={className}
            style={toneProperties(tone)}
            aria-roledescription="carousel"
            aria-label={label}
        >
            <div ref={trackRef} className={styles.track} onScroll={handleScroll}>
                {items.map(
                    (item: CarouselItem, position: number): ReactElement => (
                        <div
                            key={item.id}
                            id={panelId(position)}
                            className={styles.slide}
                            role="tabpanel"
                            aria-roledescription="slide"
                            aria-labelledby={tabId(position)}
                            aria-hidden={
                                position === clampedIndex ? undefined : true
                            }
                            tabIndex={position === clampedIndex ? 0 : -1}
                        >
                            {item.content}
                        </div>
                    ),
                )}
            </div>
            <div className={styles.controls}>
                <button
                    type="button"
                    className={styles.turnKey}
                    aria-label={previousLabel ?? 'Previous slide'}
                    disabled={clampedIndex <= 0}
                    onClick={(): void => {
                        goTo(clampedIndex - 1);
                    }}
                >
                    <span
                        className={styles.turnGlyph}
                        data-direction="previous"
                        aria-hidden="true"
                    />
                </button>
                <div
                    ref={tablistRef}
                    className={styles.dots}
                    role="tablist"
                    aria-label={`${label} slides`}
                >
                    {items.map(
                        (item: CarouselItem, position: number): ReactElement => (
                            <button
                                key={item.id}
                                type="button"
                                id={tabId(position)}
                                className={styles.dot}
                                role="tab"
                                aria-label={slideName(item, position)}
                                aria-selected={position === clampedIndex}
                                aria-controls={panelId(position)}
                                tabIndex={position === clampedIndex ? 0 : -1}
                                data-active={
                                    position === clampedIndex ? 'true' : 'false'
                                }
                                onClick={(): void => {
                                    goTo(position);
                                }}
                                onKeyDown={handleTabKeyDown}
                            />
                        ),
                    )}
                </div>
                <button
                    type="button"
                    className={styles.turnKey}
                    aria-label={nextLabel ?? 'Next slide'}
                    disabled={clampedIndex >= items.length - 1}
                    onClick={(): void => {
                        goTo(clampedIndex + 1);
                    }}
                >
                    <span
                        className={styles.turnGlyph}
                        data-direction="next"
                        aria-hidden="true"
                    />
                </button>
            </div>
        </section>
    );
}
