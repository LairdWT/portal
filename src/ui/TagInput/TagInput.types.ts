import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';

// Props for the TagInput: multi-value token entry. The committed tags and the
// in-progress draft text are BOTH controlled (`tags`/`onTagsChange` and
// `value`/`onValueChange`), so a consumer owns normalization. Enter or a
// comma commits the trimmed draft (duplicates clear the draft without
// re-adding); Backspace in an empty draft removes the last tag; each tag
// renders as a removable Chip. Optional `suggestions` open in a fuzzy-ranked
// listbox as the draft is typed (already-committed tags are excluded);
// committing a suggestion adds it directly.
export type TagInputProps = Readonly<
    {
        label: string;
        tags: readonly string[];
        onTagsChange: (tags: readonly string[]) => void;
        value: string;
        onValueChange: (value: string) => void;
        suggestions?: readonly string[] | undefined;
        placeholder?: string | undefined;
        id?: string | undefined;
        enabled?: EEnabledState | undefined;
        error?: string | undefined;
    } & Toned
>;
