// Shared reduced-motion vocabulary for the overlay surfaces (Popover, Dialog,
// Toast). The two members mirror the user's motion PREFERENCE: `Full` plays the
// entrance animation, `Reduced` is the resting, animation-free state. The
// lowercase values double as the data-motion attribute the overlay CSS reads
// (`[data-motion='full']`), so the emitted strings are load-bearing and must
// stay 'full' / 'reduced'.
//
// Modeled as an E-prefixed annotated const object (not a bare `as const`) per
// the project standard, replacing the bare MOTION_FULL/MOTION_REDUCED string
// constants the overlay components previously inlined. It is deliberately NOT
// unified with Progress's animate|static vocabulary: that pair is a render
// PLAY-STATE, a distinct concept from this preference mirror, and one enum over
// two meanings would be the wrong abstraction.
export const EOverlayMotion: {
    readonly Full: 'full';
    readonly Reduced: 'reduced';
} = {
    Full: 'full',
    Reduced: 'reduced',
};
export type EOverlayMotion = (typeof EOverlayMotion)[keyof typeof EOverlayMotion];
