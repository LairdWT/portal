import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type ReactElement,
    type RefObject,
    useEffect,
    useRef,
} from 'react';

import {
    EToastKind,
    EToastPlacement,
    type ToastInput,
    type ToastProviderProps,
} from './Toast.types';
import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';

const BUTTON_STYLE: CSSProperties = {
    minBlockSize: 'var(--portal-touch-target-min)',
    paddingInline: 'var(--portal-space-4)',
    borderRadius: 'var(--portal-radius-md)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    background: 'var(--portal-color-surface-0)',
    color: 'var(--portal-color-text-0)',
    cursor: 'pointer',
};

// A button wired to the toast sink: clicking it enqueues the supplied toast, the
// imperative pattern a consumer uses from any handler inside the provider.
function NotifyButton({
    input,
    label,
}: Readonly<{ input: ToastInput; label: string }>): ReactElement {
    const { notify }: ReturnType<typeof useToast> = useToast();
    return (
        <button
            type="button"
            style={BUTTON_STYLE}
            onClick={(): void => {
                notify(input);
            }}
        >
            {label}
        </button>
    );
}

// Seeds one sticky toast of each kind on mount (guarded against a double mount)
// so a static, timer-free stack is present for the axe accessibility scan.
function SeedKinds(): ReactElement {
    const { notify }: ReturnType<typeof useToast> = useToast();
    const seeded: RefObject<boolean> = useRef<boolean>(false);
    useEffect((): void => {
        if (seeded.current) {
            return;
        }
        seeded.current = true;
        notify({
            kind: EToastKind.Info,
            message: 'Telemetry sync completed.',
            durationMs: 0,
        });
        notify({
            kind: EToastKind.Success,
            message: 'Loadout saved to the cloud profile.',
            durationMs: 0,
        });
        notify({
            kind: EToastKind.Warning,
            message: 'Connection is degraded; controls may lag.',
            durationMs: 0,
        });
        notify({
            kind: EToastKind.Danger,
            message: 'Hull integrity critical.',
            durationMs: 0,
        });
    }, [notify]);
    return <span>Four sticky toasts seeded for review.</span>;
}

const meta: Meta<typeof ToastProvider> = {
    title: 'UI/Toast',
    component: ToastProvider,
    args: {
        placement: EToastPlacement.BottomRight,
    },
    render: (args: ToastProviderProps): ReactElement => (
        <ToastProvider {...args}>
            <NotifyButton
                input={{
                    kind: EToastKind.Info,
                    message: 'Telemetry sync completed.',
                }}
                label="Notify"
            />
        </ToastProvider>
    ),
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Static one-of-each stack so axe evaluates every severity's live region.
export const Kinds: Story = {
    render: (args: ToastProviderProps): ReactElement => (
        <ToastProvider {...args}>
            <SeedKinds />
        </ToastProvider>
    ),
};

export const Toned: Story = {
    render: (args: ToastProviderProps): ReactElement => (
        <ToastProvider {...args}>
            <NotifyButton
                input={{
                    kind: EToastKind.Info,
                    message: 'Faction channel opened on a custom tone.',
                    tone: 'oklch(0.7 0.15 280)',
                }}
                label="Notify toned"
            />
        </ToastProvider>
    ),
};

export const Sticky: Story = {
    render: (args: ToastProviderProps): ReactElement => (
        <ToastProvider {...args}>
            <NotifyButton
                input={{
                    kind: EToastKind.Warning,
                    message: 'Stays until dismissed.',
                    durationMs: 0,
                }}
                label="Notify sticky"
            />
        </ToastProvider>
    ),
};

export const Placement: Story = {
    args: {
        placement: EToastPlacement.TopRight,
    },
    render: (args: ToastProviderProps): ReactElement => (
        <ToastProvider {...args}>
            <NotifyButton
                input={{
                    kind: EToastKind.Success,
                    message: 'Pinned to the chosen corner.',
                    durationMs: 0,
                }}
                label="Notify"
            />
        </ToastProvider>
    ),
};
