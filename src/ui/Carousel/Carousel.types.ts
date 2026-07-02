import type { ReactNode } from 'react';

import type { Toned } from '../tone';

// One slide. `label` names the slide for assistive tech; omitted, the
// carousel derives "Slide n of N".
export type CarouselItem = Readonly<{
    id: string;
    content: ReactNode;
    label?: string | undefined;
}>;

// Props for the Carousel: a scroll-snap slide strip with previous/next keys
// and a dot rail (the APG basic carousel: no auto-rotation, the live region
// announces slide changes). The track itself scrolls natively - swipe,
// trackpad, and keyboard scrolling all work - and the controls drive the
// same scroll position; smoothing rides CSS scroll-behavior under full
// motion and snaps instantly under reduced motion.
export type CarouselProps = Readonly<
    {
        label: string;
        items: readonly CarouselItem[];
        previousLabel?: string | undefined;
        nextLabel?: string | undefined;
    } & Toned
>;
