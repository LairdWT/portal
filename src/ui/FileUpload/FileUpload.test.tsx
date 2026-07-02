import { fireEvent, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { acceptsFile, FileUpload, formatBytes } from './FileUpload';
import { EFileRejection } from './FileUpload.types';

function makeFile(name: string, type: string, bytes: number): File {
    return new File([new Uint8Array(bytes)], name, { type });
}

function UploadHarness({
    accept,
    multiple,
    maxBytes,
    onReject,
}: Readonly<{
    accept?: string;
    multiple?: boolean;
    maxBytes?: number;
    onReject?: (file: File, reason: EFileRejection) => void;
}>): ReactElement {
    const [files, setFiles]: [
        readonly File[],
        Dispatch<SetStateAction<readonly File[]>>,
    ] = useState<readonly File[]>([]);
    return (
        <FileUpload
            label="Mission files"
            files={files}
            onFilesChange={setFiles}
            accept={accept}
            multiple={multiple}
            maxBytes={maxBytes}
            onReject={onReject}
        />
    );
}

describe('acceptsFile', (): void => {
    it('admits everything without an accept list', (): void => {
        expect(acceptsFile(undefined, makeFile('a.bin', '', 1))).toBe(true);
        expect(acceptsFile('  ', makeFile('a.bin', '', 1))).toBe(true);
    });

    it('matches extensions, exact types, and wildcards', (): void => {
        const png: File = makeFile('shot.PNG', 'image/png', 1);
        expect(acceptsFile('.png', png)).toBe(true);
        expect(acceptsFile('image/png', png)).toBe(true);
        expect(acceptsFile('image/*', png)).toBe(true);
        expect(acceptsFile('.jpg,image/gif', png)).toBe(false);
        expect(acceptsFile('text/*', png)).toBe(false);
    });
});

describe('formatBytes', (): void => {
    it('scales through B, KiB, and MiB', (): void => {
        expect(formatBytes(512)).toBe('512 B');
        expect(formatBytes(2048)).toBe('2.0 KiB');
        expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MiB');
    });
});

describe('FileUpload', (): void => {
    it('ingests picked files and lists them with sizes', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<UploadHarness multiple />);
        const input: HTMLElement = screen.getByLabelText('Mission files');
        await user.upload(input, [
            makeFile('brief.txt', 'text/plain', 100),
            makeFile('map.png', 'image/png', 2048),
        ]);
        expect(screen.getByText('brief.txt')).toBeInTheDocument();
        expect(screen.getByText('map.png')).toBeInTheDocument();
        expect(screen.getByText('2.0 KiB')).toBeInTheDocument();
    });

    it('replaces the list when single-select', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<UploadHarness />);
        const input: HTMLElement = screen.getByLabelText('Mission files');
        await user.upload(input, makeFile('first.txt', 'text/plain', 10));
        await user.upload(input, makeFile('second.txt', 'text/plain', 10));
        expect(screen.queryByText('first.txt')).toBeNull();
        expect(screen.getByText('second.txt')).toBeInTheDocument();
    });

    it('rejects oversized and wrong-type files with reasons', (): void => {
        const onReject: Mock = vi.fn();
        render(
            <UploadHarness
                multiple
                accept="image/*"
                maxBytes={1024}
                onReject={onReject}
            />,
        );
        const input: HTMLElement = screen.getByLabelText('Mission files');
        const wrongType: File = makeFile('notes.txt', 'text/plain', 10);
        const tooLarge: File = makeFile('huge.png', 'image/png', 4096);
        // user.upload filters by the accept attribute itself, so drive the
        // change event directly to exercise the component's own gate.
        fireEvent.change(input, {
            target: { files: [wrongType, tooLarge] },
        });
        expect(onReject).toHaveBeenCalledWith(wrongType, EFileRejection.WrongType);
        expect(onReject).toHaveBeenCalledWith(tooLarge, EFileRejection.TooLarge);
        expect(screen.queryByText('huge.png')).toBeNull();
    });

    it('ingests dropped files and clears the drag state', (): void => {
        render(<UploadHarness multiple />);
        const dropzone: HTMLElement | null = screen.getByText(
            'Drop files here or browse',
        ).parentElement;
        if (dropzone === null) {
            throw new Error('Expected the dropzone element.');
        }
        fireEvent.dragOver(dropzone);
        expect(dropzone.getAttribute('data-dragging')).toBe('true');
        fireEvent.drop(dropzone, {
            dataTransfer: { files: [makeFile('drop.txt', 'text/plain', 10)] },
        });
        expect(dropzone.getAttribute('data-dragging')).toBe('false');
        expect(screen.getByText('drop.txt')).toBeInTheDocument();
    });

    it('removes a file from its chip control', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<UploadHarness multiple />);
        const input: HTMLElement = screen.getByLabelText('Mission files');
        await user.upload(input, makeFile('brief.txt', 'text/plain', 100));
        const remove: readonly HTMLElement[] = screen.getAllByRole('button');
        const first: HTMLElement | undefined = remove[0];
        if (first === undefined) {
            throw new Error('Expected a chip remove control.');
        }
        await user.click(first);
        expect(screen.queryByText('brief.txt')).toBeNull();
    });
});
