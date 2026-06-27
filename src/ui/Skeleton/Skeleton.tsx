import { type CSSProperties, type ReactElement } from 'react';

import styles from './Skeleton.module.css';
import {
    ESkeletonAnimation,
    ESkeletonVariant,
    type SkeletonProps,
} from './Skeleton.types';

// Skeleton is a domain-agnostic, non-interactive loading placeholder for the
// generic UI layer. It paints a low-contrast machined block (its own neutral
// --portal-skeleton-* fill, NOT the tone ramp) while real content loads. Three
// shape variants (Text / Block / Circle) and three animation modes
// (Shimmer / Pulse / None).
//
// Helicon parity: Helicon ships an immediate-mode loading rectangle with no
// semantic layer; this React primitive adds the variant set, the multi-line
// Text composition, the reduced-motion-gated shimmer/pulse, and the opt-in
// role="status" polite announcement.
//
// a11y: decorative by default (aria-hidden removes the subtree from the a11y
// tree); passing `label` opts into a single polite live region (role="status",
// the implicit aria-live="polite" loading announcement) whose only exposed
// content is a visually-hidden copy of `label`. No aria-busy is set: a
// permanent aria-busy="true" would defer assistive-tech processing of the
// region indefinitely (it never flips to false - the Skeleton unmounts when
// content loads), suppressing the very announcement the label opts into. The
// bare role="status" is the house live-region pattern (see StatusFooter /
// Badge). The painted nodes are ALWAYS aria-hidden. Skeleton is
// non-interactive, so the >= 3rem hit-target rule does not apply (no
// interactive target). Both animations are pure CSS gated behind
// prefers-reduced-motion; the static base fill is the reduced-motion fallback,
// so no useReducedMotion JS hook is needed. Tone is out of scope: skeletons
// ride their own neutral fill. No listeners/timers/observers/rAF are created,
// so there is nothing to clean up.

// Default Text bar count when `lines` is omitted.
const DEFAULT_LINE_COUNT: number = 3;

// Normalize the requested Text bar count to an integer floor of 1, so a stray
// 0 / negative / fractional value never renders an empty or partial paragraph.
function resolveLineCount(lines: number | undefined): number {
    return Math.max(1, Math.floor(lines ?? DEFAULT_LINE_COUNT));
}

// The ordered bar indices 0..count-1 (same allocation-free shape Rating uses
// for marks), so the Text branch maps without an index anti-pattern in the JSX.
function lineIndices(count: number): readonly number[] {
    return Array.from(
        { length: count },
        (_unused: unknown, index: number): number => index,
    );
}

// Build the inline geometry style, omitting any dimension the consumer did not
// supply (exactOptionalPropertyTypes-safe: never write an `undefined` value).
// The per-variant CSS class owns the fallback size.
function buildBoxStyle(
    width: string | undefined,
    height: string | undefined,
    radius: string | undefined,
): CSSProperties {
    const style: CSSProperties = {};
    if (width !== undefined) {
        style.inlineSize = width;
    }
    if (height !== undefined) {
        style.blockSize = height;
    }
    if (radius !== undefined) {
        style.borderRadius = radius;
    }
    return style;
}

// Join class names, dropping the absent last-bar modifier (the repo's
// filter/join idiom). Keeps the Text branch free of conditional className soup.
function joinClasses(...names: readonly (string | false | undefined)[]): string {
    return names
        .filter(
            (name: string | false | undefined): name is string =>
                name !== false && name !== undefined,
        )
        .join(' ');
}

// The painted visual subtree for a variant. ALWAYS aria-hidden, so the
// decorative bars never reach assistive tech whether the root is decorative or
// a live region. Exhaustive switch with NO default (the Banner resolveRole
// pattern), so a future variant is a compile error rather than a silent
// fall-through.
function renderVisual(
    variant: ESkeletonVariant,
    width: string | undefined,
    height: string | undefined,
    radius: string | undefined,
    lines: number | undefined,
    animation: ESkeletonAnimation,
): ReactElement {
    const boxStyle: CSSProperties = buildBoxStyle(width, height, radius);
    switch (variant) {
        case ESkeletonVariant.Text: {
            const count: number = resolveLineCount(lines);
            return (
                <>
                    {lineIndices(count).map((index: number): ReactElement => {
                        const isLast: boolean = index === count - 1;
                        // The last bar omits the inline width so the .lineLast
                        // CSS trim (60%) governs it and renders a ragged
                        // paragraph end relative to the full-width bars. An
                        // inline width would override the class rule (inline
                        // styles beat author stylesheet rules) and defeat the
                        // trim, leaving every bar the same length.
                        const barStyle: CSSProperties = buildBoxStyle(
                            isLast ? undefined : width,
                            height,
                            radius,
                        );
                        return (
                            <span
                                key={index}
                                className={joinClasses(
                                    styles.line,
                                    isLast && styles.lineLast,
                                )}
                                data-animation={animation}
                                aria-hidden="true"
                                style={barStyle}
                            />
                        );
                    })}
                </>
            );
        }
        case ESkeletonVariant.Block:
            return (
                <span
                    className={styles.block}
                    data-animation={animation}
                    aria-hidden="true"
                    style={boxStyle}
                />
            );
        case ESkeletonVariant.Circle:
            return (
                <span
                    className={styles.circle}
                    data-animation={animation}
                    aria-hidden="true"
                    style={boxStyle}
                />
            );
    }
}

export function Skeleton({
    variant = ESkeletonVariant.Block,
    width,
    height,
    radius,
    lines,
    animation = ESkeletonAnimation.Shimmer,
    label,
}: SkeletonProps): ReactElement {
    // The painted visual nodes - ALWAYS aria-hidden, so they never reach
    // assistive tech whether the root is decorative or a live region.
    const visual: ReactElement = renderVisual(
        variant,
        width,
        height,
        radius,
        lines,
        animation,
    );
    // Decorative by default: aria-hidden removes the whole subtree from the a11y
    // tree. Negative-first: the no-label decorative path is the early return;
    // the announced (role=status polite live region) path is the unindented
    // work below.
    if (label === undefined) {
        return (
            <div className={styles.root} aria-hidden="true">
                {visual}
            </div>
        );
    }
    return (
        <div className={styles.root} role="status">
            {visual}
            <span className={styles.visuallyHidden}>{label}</span>
        </div>
    );
}
