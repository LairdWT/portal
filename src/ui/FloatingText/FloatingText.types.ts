import { type EUiStatus, type Toned } from '../tone';

// One floating combat-text event. `id` keys the mounted instance (re-firing
// the same text needs a new id - the Cooldown cast-instance contract);
// `status` tints the text through the universal status tokens (mixed toward
// text-0 so the fill stays AA on the dark HUD); `emphasis` renders the
// crit treatment (larger, bolder).
export type FloatingTextEvent = Readonly<{
    id: string;
    text: string;
    status?: EUiStatus | undefined;
    emphasis?: boolean | undefined;
}>;

// Props for the FloatingText: a decorative combat-text layer. The consumer
// owns the event list; each mounted event rises and fades once (a bounded
// transform/opacity animation; a plain timed display under reduced motion)
// and reports `onExpire(id)` exactly once so the consumer can prune it.
// The layer is aria-hidden by default - combat feedback must also exist as
// real UI (health bars, logs); `announce` opts into a polite announcement
// of each newest event for consumers that want it spoken.
export type FloatingTextProps = Readonly<{
    events: readonly FloatingTextEvent[];
    /**
     * Fired exactly once per event when its display run ends (animationend
     * plus a backstop timer - the Toast lifecycle). Prune the event here.
     */
    onExpire?: ((id: string) => void) | undefined;
    /**
     * Politely announce each NEWEST event's text. Default false: the layer
     * is silent decoration.
     */
    announce?: boolean | undefined;
}> &
    Toned;
