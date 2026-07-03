import { type Toned } from '../tone';

// Presentation variant. The kebab values double as the data-variant
// attribute: Dialogue is the framed narrative panel with the speaker plate;
// Subtitle is the minimal bottom-band treatment (no frame, centered line).
export const EDialogueVariant: {
    readonly Dialogue: 'dialogue';
    readonly Subtitle: 'subtitle';
} = {
    Dialogue: 'dialogue',
    Subtitle: 'subtitle',
};
export type EDialogueVariant =
    (typeof EDialogueVariant)[keyof typeof EDialogueVariant];

// Props for the DialogueBox: the narrative line surface. The consumer owns
// the current line; changing `text` restarts the reveal. The typewriter is
// INTERVAL-DRIVEN TEXT (the Cooldown countdown precedent - never an
// animation): under reduced motion, or with no charactersPerSecond, the
// full line shows immediately. The visible reveal is decorative - a polite
// announcer speaks the complete line once per text change, so a screen
// reader never waits out the typewriter.
//
// Optional props admit `undefined` explicitly so composition wrappers can
// forward their own optional values under exactOptionalPropertyTypes.
export type DialogueBoxProps = Readonly<{
    /**
     * Accessible name for the dialogue region.
     */
    label: string;
    /**
     * The current line. Changing it restarts the reveal.
     */
    text: string;
    /**
     * Speaker name on the plate above the line (also spoken before it).
     */
    speaker?: string | undefined;
    /**
     * Typewriter speed. Omitted or non-positive (or reduced motion) shows
     * the full line immediately.
     */
    charactersPerSecond?: number | undefined;
    /**
     * Renders the continue key. While the reveal is running, the first
     * press completes the line (the genre convention); on a complete line
     * it fires this callback.
     */
    onAdvance?: (() => void) | undefined;
    /**
     * Continue-key label. Default "Continue".
     */
    advanceLabel?: string | undefined;
    variant?: EDialogueVariant | undefined;
}> &
    Toned;
