import {
    type KeyboardEvent,
    type ReactElement,
    type RefObject,
    useEffect,
    useRef,
} from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Toolbar.module.css';
import { EToolbarOrientation, type ToolbarProps } from './Toolbar.types';

// The interactive descendants the roving tab stop manages. Disabled controls
// are skipped (they are unreachable by keyboard in a toolbar).
const FOCUSABLE_SELECTOR: string =
    'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex]';

function focusableChildren(root: HTMLElement): readonly HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

// A role=toolbar strip with ONE roving tab stop (the APG toolbar pattern):
// the toolbar re-applies tabindex over its interactive descendants after
// every render, tracks the active stop through focus, and moves it with the
// arrow keys along the orientation.
export function Toolbar({
    label,
    children,
    orientation,
    tone,
}: ToolbarProps): ReactElement {
    const resolvedOrientation: EToolbarOrientation =
        orientation ?? EToolbarOrientation.Horizontal;
    const rootRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
        null,
    );
    // The index of the current tab stop; survives re-renders and clamps when
    // children change.
    const stopIndexRef: RefObject<number> = useRef<number>(0);

    // Re-apply the roving tabindex after every render: children are consumer
    // content, so their set can change under us. Writing tabindex from an
    // effect mutates only attributes the toolbar owns by contract.
    useEffect((): void => {
        const root: HTMLDivElement | null = rootRef.current;
        if (root === null) {
            return;
        }
        const focusables: readonly HTMLElement[] = focusableChildren(root);
        if (focusables.length === 0) {
            return;
        }
        const stop: number = Math.min(stopIndexRef.current, focusables.length - 1);
        stopIndexRef.current = stop;
        focusables.forEach((element: HTMLElement, index: number): void => {
            element.tabIndex = index === stop ? 0 : -1;
        });
    });

    function moveStop(next: number): void {
        const root: HTMLDivElement | null = rootRef.current;
        if (root === null) {
            return;
        }
        const focusables: readonly HTMLElement[] = focusableChildren(root);
        if (focusables.length === 0) {
            return;
        }
        const clamped: number = Math.min(Math.max(next, 0), focusables.length - 1);
        stopIndexRef.current = clamped;
        focusables.forEach((element: HTMLElement, index: number): void => {
            element.tabIndex = index === clamped ? 0 : -1;
        });
        focusables[clamped]?.focus();
    }

    // Track pointer/tab focus landing on a descendant so the roving stop
    // follows the user rather than snapping back.
    function handleFocusCapture(): void {
        const root: HTMLDivElement | null = rootRef.current;
        if (root === null) {
            return;
        }
        const active: Element | null = document.activeElement;
        if (!(active instanceof HTMLElement)) {
            return;
        }
        const focusables: readonly HTMLElement[] = focusableChildren(root);
        const index: number = focusables.indexOf(active);
        if (index < 0) {
            return;
        }
        stopIndexRef.current = index;
        focusables.forEach((element: HTMLElement, i: number): void => {
            element.tabIndex = i === index ? 0 : -1;
        });
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        const horizontal: boolean =
            resolvedOrientation === EToolbarOrientation.Horizontal;
        const forwardKey: string = horizontal ? 'ArrowRight' : 'ArrowDown';
        const backwardKey: string = horizontal ? 'ArrowLeft' : 'ArrowUp';
        switch (event.key) {
            case forwardKey:
                event.preventDefault();
                moveStop(stopIndexRef.current + 1);
                return;
            case backwardKey:
                event.preventDefault();
                moveStop(stopIndexRef.current - 1);
                return;
            case 'Home':
                event.preventDefault();
                moveStop(0);
                return;
            case 'End':
                event.preventDefault();
                moveStop(Number.MAX_SAFE_INTEGER);
                return;
            default:
                return;
        }
    }

    const className: string = [toneStyles.toneScope, styles.toolbar]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <div
            ref={rootRef}
            role="toolbar"
            aria-label={label}
            aria-orientation={resolvedOrientation}
            className={className}
            style={toneProperties(tone)}
            data-orientation={resolvedOrientation}
            onKeyDown={handleKeyDown}
            onFocusCapture={handleFocusCapture}
        >
            {children}
        </div>
    );
}
