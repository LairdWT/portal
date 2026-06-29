import { type CSSProperties, type ReactElement } from 'react';

import { Tooltip } from '@laird-wt/portal';

// Tooltip hover fixture: a Tooltip wrapping a visible button, with content long
// enough that a pointer can travel onto the bubble. The spec verifies WCAG 1.4.13
// (Content on Hover or Focus): appear-on-hover/focus and Escape/blur dismissal run
// today; the "hoverable" assertion (pointer can move onto the panel without it
// vanishing) is marked test.fixme because the Tooltip hover-bridge is Track-6 P2
// and is intentionally not implemented here (Tooltip.tsx is out of scope).

const TRIGGER_STYLE: CSSProperties = {
    minBlockSize: 'var(--portal-touch-target-min)',
    paddingInline: 'var(--portal-space-4)',
    borderRadius: 'var(--portal-radius-md)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    background: 'var(--portal-color-surface-0)',
    color: 'var(--portal-color-text-0)',
    cursor: 'pointer',
};

export function TooltipHover(): ReactElement {
    return (
        <main>
            <section aria-label="Tooltip scenario">
                <Tooltip content="Re-run the query against the live database connection.">
                    <button type="button" style={TRIGGER_STYLE}>
                        Run query
                    </button>
                </Tooltip>
            </section>
        </main>
    );
}
