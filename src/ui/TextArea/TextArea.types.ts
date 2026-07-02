import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';

// How the rendered <textarea> may be resized by the user. Block allows growth
// along the block axis only (the logical `resize: block`); None pins the box.
export const ETextAreaResize: {
    readonly None: 'none';
    readonly Block: 'block';
} = {
    None: 'none',
    Block: 'block',
};
export type ETextAreaResize =
    (typeof ETextAreaResize)[keyof typeof ETextAreaResize];

// Props for the TextArea: the multiline twin of TextField. Controlled (`value`
// in, `onValueChange` out with the string). A programmatic <label> is always
// rendered and associated by id (generated when omitted). `rows` sets the
// resting height; `resize` gates user resizing (default Block); `autoSize`
// opts into content-driven sizing where the browser supports
// `field-sizing: content` (progressive enhancement - `rows` remains the
// floor). `enabled`, `error`, and `tone` behave exactly as on TextField.
export type TextAreaProps = Readonly<
    {
        label: string;
        value: string;
        onValueChange?: (value: string) => void;
        id?: string;
        placeholder?: string;
        rows?: number;
        resize?: ETextAreaResize;
        autoSize?: boolean;
        enabled?: EEnabledState;
        error?: string;
    } & Toned
>;
