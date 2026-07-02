import type { EEnabledState } from '../../state/state';
import type { Toned } from '../tone';

// Why an offered file was refused. Reported per file through onReject so a
// consumer can message precisely; accepted files flow through onFilesChange.
export const EFileRejection: {
    readonly WrongType: 'wrong-type';
    readonly TooLarge: 'too-large';
} = {
    WrongType: 'wrong-type',
    TooLarge: 'too-large',
};
export type EFileRejection = (typeof EFileRejection)[keyof typeof EFileRejection];

// Props for the FileUpload: a dropzone + browse control over a real hidden
// <input type=file> (the Checkbox sr-only pattern), so keyboard and the
// native picker come free. The accepted file list is controlled
// (`files`/`onFilesChange`); dropping or picking ingests candidates through
// the same gate - `accept` (native accept syntax: extensions, exact MIME
// types, and type/* wildcards) and `maxBytes` - rejecting failures through
// `onReject`. Without `multiple`, a new pick replaces the list.
export type FileUploadProps = Readonly<
    {
        label: string;
        files: readonly File[];
        onFilesChange: (files: readonly File[]) => void;
        onReject?: ((file: File, reason: EFileRejection) => void) | undefined;
        accept?: string | undefined;
        multiple?: boolean | undefined;
        maxBytes?: number | undefined;
        prompt?: string | undefined;
        id?: string | undefined;
        enabled?: EEnabledState | undefined;
        error?: string | undefined;
    } & Toned
>;
