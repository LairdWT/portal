import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { ESecretAutocomplete } from '../SecretField/SecretField.types';
import { EUiStatus } from '../tone';
import { ConfirmDialog } from './ConfirmDialog';
import { Dialog } from './Dialog';
import { EDialogSize } from './Dialog.types';
import { PromptDialog } from './PromptDialog';

const OPENER_STYLE: CSSProperties = {
    minBlockSize: 'var(--portal-touch-target-min)',
    paddingInline: 'var(--portal-space-4)',
    borderRadius: 'var(--portal-radius-md)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    background: 'var(--portal-color-surface-0)',
    color: 'var(--portal-color-text-0)',
    cursor: 'pointer',
};

function BaseDialogDemo(
    props: Readonly<{ initialOpen?: boolean; size?: EDialogSize }>,
): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(props.initialOpen ?? true);
    return (
        <>
            <button
                type="button"
                style={OPENER_STYLE}
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open dialog
            </button>
            <Dialog
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
                title="Connection details"
                description="Review the link parameters before continuing."
                {...(props.size !== undefined ? { size: props.size } : {})}
            >
                <p>The controller link is active and streaming input.</p>
            </Dialog>
        </>
    );
}

function ConfirmDemo(
    props: Readonly<{
        initialOpen?: boolean;
        status?: EUiStatus;
        withCancel?: boolean;
    }>,
): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(props.initialOpen ?? true);
    return (
        <>
            <button
                type="button"
                style={OPENER_STYLE}
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open confirm
            </button>
            <ConfirmDialog
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
                title="Discard changes?"
                message="Your unsaved loadout will be lost."
                onConfirm={(): void => {
                    setOpen(false);
                }}
                {...(props.withCancel === true
                    ? {
                          onCancel: (): void => {
                              setOpen(false);
                          },
                      }
                    : {})}
                {...(props.status !== undefined ? { status: props.status } : {})}
            />
        </>
    );
}

function PromptDemo(props: Readonly<{ initialOpen?: boolean }>): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(props.initialOpen ?? true);
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('');
    return (
        <>
            <button
                type="button"
                style={OPENER_STYLE}
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open prompt
            </button>
            <PromptDialog
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
                title="Name this loadout"
                label="Loadout name"
                value={value}
                onValueChange={setValue}
                onSubmit={(): void => {
                    setOpen(false);
                }}
                onCancel={(): void => {
                    setOpen(false);
                }}
                placeholder="e.g. Aggro"
            />
        </>
    );
}

function SecretPromptDemo(
    props: Readonly<{ initialOpen?: boolean }>,
): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(props.initialOpen ?? true);
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('');
    return (
        <>
            <button
                type="button"
                style={OPENER_STYLE}
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open secret prompt
            </button>
            <PromptDialog
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
                title="Enter your password"
                label="Password"
                value={value}
                onValueChange={setValue}
                onSubmit={(): void => {
                    setOpen(false);
                }}
                onCancel={(): void => {
                    setOpen(false);
                }}
                placeholder="Enter your password"
                secret={{ autoComplete: ESecretAutocomplete.Current }}
            />
        </>
    );
}

const meta: Meta<typeof Dialog> = {
    title: 'UI/Dialog',
    component: Dialog,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (): ReactElement => <BaseDialogDemo />,
};

export const Confirm: Story = {
    render: (): ReactElement => <ConfirmDemo withCancel />,
};

export const DangerConfirm: Story = {
    render: (): ReactElement => (
        <ConfirmDemo withCancel status={EUiStatus.Danger} />
    ),
};

export const Acknowledge: Story = {
    render: (): ReactElement => <ConfirmDemo />,
};

export const Prompt: Story = {
    render: (): ReactElement => <PromptDemo />,
};

export const SecretPrompt: Story = {
    render: (): ReactElement => <SecretPromptDemo />,
};

export const Sized: Story = {
    render: (): ReactElement => (
        <div style={{ display: 'flex', gap: 'var(--portal-space-4)' }}>
            <BaseDialogDemo initialOpen={false} size={EDialogSize.Sm} />
            <BaseDialogDemo initialOpen={false} size={EDialogSize.Md} />
            <BaseDialogDemo initialOpen={false} size={EDialogSize.Lg} />
        </div>
    ),
};
