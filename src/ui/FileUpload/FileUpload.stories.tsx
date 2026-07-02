import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { FileUpload } from './FileUpload';
import { type EFileRejection, type FileUploadProps } from './FileUpload.types';

// Controlled harness so every story picks, drops, and removes live.
function UploadDemo(props: FileUploadProps): ReactElement {
    const [files, setFiles]: [
        readonly File[],
        Dispatch<SetStateAction<readonly File[]>>,
    ] = useState<readonly File[]>(props.files);
    return (
        <div style={{ inlineSize: 'min(26rem, 80vw)' }}>
            <FileUpload
                {...props}
                files={files}
                onFilesChange={setFiles}
                onReject={(file: File, reason: EFileRejection): void => {
                    console.log('rejected', file.name, reason);
                }}
            />
        </div>
    );
}

const meta: Meta<typeof FileUpload> = {
    title: 'UI/FileUpload',
    component: FileUpload,
    render: (args: FileUploadProps): ReactElement => <UploadDemo {...args} />,
    args: {
        label: 'Mission files',
        files: [],
        multiple: true,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithFiles: Story = {
    args: {
        files: [
            new File([new Uint8Array(4096)], 'briefing.pdf', {
                type: 'application/pdf',
            }),
            new File([new Uint8Array(1024 * 1024)], 'terrain-map.png', {
                type: 'image/png',
            }),
        ],
    },
};

export const ImagesOnly: Story = {
    args: {
        accept: 'image/*',
        prompt: 'Drop screenshots here or browse',
    },
};

export const SizeCapped: Story = {
    args: { maxBytes: 1024 * 1024 },
};

export const WithError: Story = {
    args: { error: 'The mission archive is full.' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.15 240)' },
};
