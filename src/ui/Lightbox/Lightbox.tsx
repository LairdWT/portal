import type { ReactElement } from 'react';

import { Carousel } from '../Carousel/Carousel';
import { Dialog } from '../Dialog/Dialog';
import { EDialogSize } from '../Dialog/Dialog.types';
import styles from './Lightbox.module.css';
import type { LightboxProps } from './Lightbox.types';

// The media viewer composition: Dialog owns the modal chrome (backdrop, trap,
// Escape, scroll lock) and Carousel owns the slides. The frame class caps
// slide media to the viewport so tall images never push the chrome away.
export function Lightbox({
    open,
    onClose,
    label,
    items,
    tone,
}: LightboxProps): ReactElement | null {
    if (!open) {
        return null;
    }
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={label}
            size={EDialogSize.Lg}
            tone={tone}
        >
            <div className={styles.frame}>
                <Carousel label={label} items={items} tone={tone} />
            </div>
        </Dialog>
    );
}
