import {
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useId,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

import { useDismiss } from '../../react/hooks/useDismiss';
import { useFocusTrap } from '../../react/hooks/useFocusTrap';
import { useReducedMotion } from '../../react/hooks/useReducedMotion';
import { useScrollLock } from '../../react/hooks/useScrollLock';
import { ensureOverlayRoot } from '../overlayRoot';
import { EUiStatus, toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './Dialog.module.css';
import { type DialogProps, EDialogSize } from './Dialog.types';

const MOTION_FULL: string = 'full';
const MOTION_REDUCED: string = 'reduced';

export function Dialog({
    open,
    onClose,
    title,
    children,
    description,
    size = EDialogSize.Md,
    closeOnEscape = true,
    closeOnBackdrop = true,
    initialFocusRef,
    status = EUiStatus.None,
    tone,
}: DialogProps): ReactElement | null {
    const panelRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const prefersReducedMotion: boolean = useReducedMotion();
    const [overlayRoot]: [
        HTMLElement | null,
        Dispatch<SetStateAction<HTMLElement | null>>,
    ] = useState<HTMLElement | null>((): HTMLElement | null => ensureOverlayRoot());
    const titleId: string = useId();
    const descriptionId: string = useId();

    // Lock the page scroll, trap focus inside the panel, and listen for the two
    // ambient dismissals - all from the same primitives Popover uses. The hooks
    // are no-ops while closed (active/enabled gated on `open`).
    useScrollLock({ locked: open });
    useFocusTrap({
        active: open,
        containerRef: panelRef,
        ...(initialFocusRef !== undefined ? { initialFocusRef } : {}),
        restoreFocus: true,
    });
    useDismiss({
        enabled: open,
        onDismiss: onClose,
        refs: [panelRef],
        escapeKey: closeOnEscape,
        outsidePointer: closeOnBackdrop,
    });

    if (!open) {
        return null;
    }
    if (overlayRoot === null) {
        return null;
    }

    const motion: string = prefersReducedMotion ? MOTION_REDUCED : MOTION_FULL;
    const panelClassName: string = [toneStyles.toneScope, styles.panel]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return createPortal(
        <>
            <div
                className={styles.backdrop}
                data-motion={motion}
                aria-hidden="true"
            />
            <div className={styles.positioner}>
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-modal={true}
                    tabIndex={-1}
                    className={panelClassName}
                    style={toneProperties(tone)}
                    data-size={size}
                    data-status={status}
                    data-motion={motion}
                    aria-labelledby={titleId}
                    {...(description !== undefined
                        ? { 'aria-describedby': descriptionId }
                        : {})}
                >
                    <h2 id={titleId} className={styles.title}>
                        {title}
                    </h2>
                    {description !== undefined ? (
                        <p id={descriptionId} className={styles.description}>
                            {description}
                        </p>
                    ) : null}
                    <div className={styles.body}>{children}</div>
                </div>
            </div>
        </>,
        overlayRoot,
    );
}
