// Shared overlay-root accessor for the portal overlay layer (Popover, and the
// Toast and Dialog primitives built on top of it). Every overlay portals into the
// same managed mount point appended to <body> and marked with
// OVERLAY_ROOT_ATTRIBUTE, so all overlays share one stacking context and read the
// --portal-z-overlay token. The element is a bare mount point: panels are
// position: fixed and carry the z-index token, so the root adds no layout or
// stacking of its own.
//
// This module is internal infra and is deliberately NOT re-exported from the
// package barrel. Callers acquire the root from an effect, never during render,
// because creating and appending the element is a DOM side effect.

export const OVERLAY_ROOT_ATTRIBUTE: string = 'data-portal-overlay-root';

// Find or lazily create the single overlay root on <body>. The lookup is by the
// marker attribute, so repeated calls return the same element and never churn the
// singleton. Returns null when there is no document (SSR), in which case the
// caller simply does not portal.
export function ensureOverlayRoot(): HTMLElement | null {
    if (typeof document === 'undefined') {
        return null;
    }
    const existing: Element | null = document.querySelector(
        `[${OVERLAY_ROOT_ATTRIBUTE}]`,
    );
    if (existing instanceof HTMLElement) {
        return existing;
    }
    const root: HTMLElement = document.createElement('div');
    root.setAttribute(OVERLAY_ROOT_ATTRIBUTE, '');
    document.body.appendChild(root);
    return root;
}
