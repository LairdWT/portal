import type { CarouselItem } from '../Carousel/Carousel.types';
import type { Toned } from '../tone';

// Props for the Lightbox: the full-attention media viewer - a modal Dialog
// carrying a Carousel of slides. Dismissal, focus trapping, and scroll lock
// are the Dialog's; slide navigation is the Carousel's. Zoom (1x..4x by
// wheel, double-click, or the toolbar buttons, with grab-pan while zoomed)
// is internal viewer state and resets when the lightbox closes.
export type LightboxProps = Readonly<
    {
        open: boolean;
        onClose: () => void;
        label: string;
        items: readonly CarouselItem[];
    } & Toned
>;
