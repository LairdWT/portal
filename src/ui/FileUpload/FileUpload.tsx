import {
    type ChangeEvent,
    type DragEvent,
    type ReactElement,
    useId,
    useState,
} from 'react';

import { useResolvedEnabled } from '../../react/hooks/useResolvedEnabled';
import { EEnabledState } from '../../state/state';
import { Chip } from '../Chip/Chip';
import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import styles from './FileUpload.module.css';
import { EFileRejection, type FileUploadProps } from './FileUpload.types';

const BYTES_PER_KIBI: number = 1024;

// Native accept-attribute matching: ".ext", exact "type/subtype", and
// "type/*" wildcards, comma-separated. An absent accept admits everything.
export function acceptsFile(accept: string | undefined, file: File): boolean {
    if (accept === undefined || accept.trim().length === 0) {
        return true;
    }
    const fileType: string = file.type.toLowerCase();
    const fileName: string = file.name.toLowerCase();
    const patterns: readonly string[] = accept
        .split(',')
        .map((entry: string): string => entry.trim().toLowerCase())
        .filter((entry: string): boolean => entry.length > 0);
    for (const pattern of patterns) {
        if (pattern.startsWith('.')) {
            if (fileName.endsWith(pattern)) {
                return true;
            }
            continue;
        }
        if (pattern.endsWith('/*')) {
            if (fileType.startsWith(pattern.slice(0, -1))) {
                return true;
            }
            continue;
        }
        if (fileType === pattern) {
            return true;
        }
    }
    return false;
}

// A compact human-readable size for the file rows.
export function formatBytes(bytes: number): string {
    if (bytes < BYTES_PER_KIBI) {
        return `${String(bytes)} B`;
    }
    const kibi: number = bytes / BYTES_PER_KIBI;
    if (kibi < BYTES_PER_KIBI) {
        return `${kibi.toFixed(1)} KiB`;
    }
    return `${(kibi / BYTES_PER_KIBI).toFixed(1)} MiB`;
}

export function FileUpload({
    label,
    files,
    onFilesChange,
    onReject,
    accept,
    multiple,
    maxBytes,
    prompt,
    id,
    enabled,
    error,
    tone,
}: FileUploadProps): ReactElement {
    const resolvedEnabled: EEnabledState = useResolvedEnabled(enabled);
    const isDisabled: boolean = resolvedEnabled === EEnabledState.Disabled;
    const hasError: boolean = error !== undefined;

    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const errorId: string = useId();

    const [dragging, setDragging]: [boolean, (dragging: boolean) => void] =
        useState<boolean>(false);

    // Gate a candidate batch through accept/maxBytes, reporting each refusal;
    // accepted files append (or replace, when single-select).
    function ingest(candidates: FileList | null): void {
        if (candidates === null || candidates.length === 0) {
            return;
        }
        const accepted: File[] = [];
        for (const file of Array.from(candidates)) {
            if (!acceptsFile(accept, file)) {
                onReject?.(file, EFileRejection.WrongType);
                continue;
            }
            if (maxBytes !== undefined && file.size > maxBytes) {
                onReject?.(file, EFileRejection.TooLarge);
                continue;
            }
            accepted.push(file);
        }
        if (accepted.length === 0) {
            return;
        }
        if (multiple === true) {
            onFilesChange([...files, ...accepted]);
            return;
        }
        const first: File | undefined = accepted[0];
        if (first === undefined) {
            return;
        }
        onFilesChange([first]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
        ingest(event.currentTarget.files);
        // Reset so re-picking the same file fires change again.
        event.currentTarget.value = '';
    }

    function handleDragOver(event: DragEvent<HTMLElement>): void {
        if (isDisabled) {
            return;
        }
        event.preventDefault();
        setDragging(true);
    }

    function handleDragLeave(): void {
        setDragging(false);
    }

    function handleDrop(event: DragEvent<HTMLElement>): void {
        setDragging(false);
        if (isDisabled) {
            return;
        }
        event.preventDefault();
        ingest(event.dataTransfer.files);
    }

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    return (
        <div
            className={className}
            style={toneProperties(tone)}
            data-enabled={resolvedEnabled}
            data-invalid={hasError ? 'true' : 'false'}
        >
            <label className={styles.label} htmlFor={inputId}>
                {label}
            </label>
            {/* The dropzone is itself a label for the hidden input: a press
                anywhere opens the native picker, and the drag events land on
                the same surface. */}
            <label
                className={styles.dropzone}
                htmlFor={inputId}
                data-dragging={dragging ? 'true' : 'false'}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    id={inputId}
                    className={styles.input}
                    type="file"
                    {...(accept !== undefined ? { accept } : {})}
                    multiple={multiple === true}
                    disabled={isDisabled}
                    aria-invalid={hasError ? true : undefined}
                    aria-describedby={hasError ? errorId : undefined}
                    onChange={handleInputChange}
                />
                <span className={styles.promptGlyph} aria-hidden="true" />
                <span className={styles.prompt}>
                    {prompt ?? 'Drop files here or browse'}
                </span>
            </label>
            {hasError ? (
                <span id={errorId} className={styles.error}>
                    {error}
                </span>
            ) : null}
            {files.length > 0 ? (
                <ul className={styles.files}>
                    {files.map(
                        (file: File): ReactElement => (
                            <li
                                key={`${file.name}-${String(file.size)}`}
                                className={styles.fileRow}
                            >
                                <Chip
                                    label={file.name}
                                    {...(enabled !== undefined ? { enabled } : {})}
                                    onRemove={(): void => {
                                        onFilesChange(
                                            files.filter(
                                                (entry: File): boolean =>
                                                    entry !== file,
                                            ),
                                        );
                                    }}
                                >
                                    {file.name}
                                    <span className={styles.fileSize}>
                                        {formatBytes(file.size)}
                                    </span>
                                </Chip>
                            </li>
                        ),
                    )}
                </ul>
            ) : null}
        </div>
    );
}
