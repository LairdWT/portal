import { type ReactElement, type ReactNode } from 'react';

import { type EPopoverPlacement } from '../Popover/Popover.types';
import { type Toned } from '../tone';

// Props for the Tooltip: a hover/focus help bubble built on the Popover overlay.
//
// `children` is the single trigger element the tooltip describes; it must accept
// a ref and aria-* props, because the Tooltip clones it to attach the anchor ref,
// the open/close handlers, and an `aria-describedby` pointing at the bubble while
// it is shown. `content` is the bubble body (the described text); `title` is the
// optional accent heading rendered above the body (the titled variant). The
// bubble appears on pointer-enter AND focus and hides on pointer-leave, blur, or
// Escape - it is never hover-only, so keyboard users get the same help. `placement`
// is the preferred side (default Top). `openDelayMs` / `closeDelayMs` debounce the
// show/hide; both default to 0 (immediate) and are cleared on unmount. `tone`
// flows through the shared tone scope. The Tooltip neither traps nor restores
// focus: it only describes the still-focused trigger.
export type TooltipProps = Readonly<{
    children: ReactElement;
    content: ReactNode;
    title?: ReactNode;
    placement?: EPopoverPlacement;
    openDelayMs?: number;
    closeDelayMs?: number;
}> &
    Toned;
