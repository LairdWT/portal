import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import {
    afterEach,
    describe,
    expect,
    it,
    type Mock,
    type MockInstance,
    vi,
} from 'vitest';

import { ESecretAutocomplete } from '../SecretField/SecretField.types';
import { PromptDialog } from './PromptDialog';

afterEach((): void => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
});

type HarnessProps = Readonly<{
    onSubmit: (value: string) => void;
    onClose: () => void;
    onCancel?: () => void;
}>;

function Harness(props: HarnessProps): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('');
    return (
        <PromptDialog
            open
            onClose={props.onClose}
            title="Name this loadout"
            label="Loadout name"
            value={value}
            onValueChange={setValue}
            onSubmit={props.onSubmit}
            placeholder="name"
            {...(props.onCancel !== undefined ? { onCancel: props.onCancel } : {})}
        />
    );
}

// The masked variant: passing `secret` swaps the prompt's TextField for a
// SecretField while keeping the same form contract.
function SecretHarness(props: HarnessProps): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('');
    return (
        <PromptDialog
            open
            onClose={props.onClose}
            title="Set a password"
            label="Password"
            value={value}
            onValueChange={setValue}
            onSubmit={props.onSubmit}
            secret={{ autoComplete: ESecretAutocomplete.Current }}
            {...(props.onCancel !== undefined ? { onCancel: props.onCancel } : {})}
        />
    );
}

describe('PromptDialog', (): void => {
    it('updates the controlled value as the user types', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                onSubmit={vi.fn<(value: string) => void>()}
                onClose={vi.fn<() => void>()}
            />,
        );

        const input: HTMLElement = screen.getByLabelText('Loadout name');
        await user.type(input, 'Aggro');

        expect(input).toHaveValue('Aggro');
    });

    it('submits the value through the OK button', async (): Promise<void> => {
        const onSubmit: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Harness onSubmit={onSubmit} onClose={vi.fn<() => void>()} />);

        await user.type(screen.getByLabelText('Loadout name'), 'Aggro');
        await user.click(screen.getByRole('button', { name: 'OK' }));

        expect(onSubmit).toHaveBeenCalledWith('Aggro');
    });

    it('submits the value when Enter is pressed in the field', async (): Promise<void> => {
        const onSubmit: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Harness onSubmit={onSubmit} onClose={vi.fn<() => void>()} />);

        await user.type(screen.getByLabelText('Loadout name'), 'Aggro{Enter}');

        expect(onSubmit).toHaveBeenCalledWith('Aggro');
    });

    it('invokes onCancel when the cancel action is pressed', async (): Promise<void> => {
        const onCancel: Mock<() => void> = vi.fn<() => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                onSubmit={vi.fn<(value: string) => void>()}
                onClose={vi.fn<() => void>()}
                onCancel={onCancel}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('places initial focus in the field', async (): Promise<void> => {
        render(
            <Harness
                onSubmit={vi.fn<(value: string) => void>()}
                onClose={vi.fn<() => void>()}
            />,
        );

        await waitFor((): void => {
            expect(screen.getByLabelText('Loadout name')).toHaveFocus();
        });
    });

    it('renders a masked secret field when secret is set', (): void => {
        render(
            <SecretHarness
                onSubmit={vi.fn<(value: string) => void>()}
                onClose={vi.fn<() => void>()}
            />,
        );

        const input: HTMLElement = screen.getByLabelText('Password');
        expect(input).toHaveAttribute('type', 'password');
        expect(input).toHaveAttribute('autocomplete', 'current-password');
    });

    it('reveals the masked prompt without submitting it', async (): Promise<void> => {
        const onSubmit: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<SecretHarness onSubmit={onSubmit} onClose={vi.fn<() => void>()} />);

        await user.click(screen.getByRole('button', { name: 'Reveal password' }));

        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits the secret value when Enter is pressed in the field', async (): Promise<void> => {
        const onSubmit: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<SecretHarness onSubmit={onSubmit} onClose={vi.fn<() => void>()} />);

        await user.type(screen.getByLabelText('Password'), 's3cret{Enter}');

        expect(onSubmit).toHaveBeenCalledWith('s3cret');
    });

    it('never logs the secret across the dialog cycle', async (): Promise<void> => {
        const dialogSecret: string = 'd1alog-secret-value';
        const logSpy: MockInstance<typeof console.log> = vi.spyOn(console, 'log');
        const infoSpy: MockInstance<typeof console.info> = vi.spyOn(
            console,
            'info',
        );
        const warnSpy: MockInstance<typeof console.warn> = vi.spyOn(
            console,
            'warn',
        );
        const errorSpy: MockInstance<typeof console.error> = vi.spyOn(
            console,
            'error',
        );
        const debugSpy: MockInstance<typeof console.debug> = vi.spyOn(
            console,
            'debug',
        );
        const user: UserEvent = userEvent.setup();
        render(
            <SecretHarness
                onSubmit={vi.fn<(value: string) => void>()}
                onClose={vi.fn<() => void>()}
            />,
        );

        await user.type(screen.getByLabelText('Password'), dialogSecret);
        const toggle: HTMLElement = screen.getByRole('button', {
            name: 'Reveal password',
        });
        await user.click(toggle);
        await user.click(toggle);
        await user.click(screen.getByRole('button', { name: 'OK' }));

        const loggedCalls: string = JSON.stringify([
            logSpy.mock.calls,
            infoSpy.mock.calls,
            warnSpy.mock.calls,
            errorSpy.mock.calls,
            debugSpy.mock.calls,
        ]);
        expect(loggedCalls).not.toContain(dialogSecret);
    });
});
