import {
    fireEvent,
    render,
    type RenderResult,
    screen,
} from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type SetStateAction,
    type SyntheticEvent,
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

import { EEnabledState } from '../../state/state';
import { SecretField } from './SecretField';
import { ESecretAutocomplete, type SecretFieldProps } from './SecretField.types';

const FIELD_LABEL: string = 'Password';
const REVEAL_LABEL: string = 'Show password';
const CONCEAL_LABEL: string = 'Hide password';
const CAPS_WARNING: string = 'Caps Lock is on';
const SECRET: string = 'hunter2-correct-horse';

// A controlled host so userEvent.type drives a real, updating value while still
// exercising the onValueChange contract.
function ControlledHost(props: SecretFieldProps): ReturnType<typeof SecretField> {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.value);
    function handleChange(next: string): void {
        setValue(next);
        props.onValueChange?.(next);
    }
    return <SecretField {...props} value={value} onValueChange={handleChange} />;
}

afterEach((): void => {
    vi.restoreAllMocks();
});

describe('SecretField', (): void => {
    it('renders the label associated with the input', (): void => {
        render(
            <SecretField
                label={FIELD_LABEL}
                value=""
                autoComplete={ESecretAutocomplete.Current}
            />,
        );

        const input: HTMLElement = screen.getByLabelText(FIELD_LABEL);
        expect(input).toBeInTheDocument();
        expect(input.tagName).toBe('INPUT');
    });

    it('masks the secret with a password input by default', (): void => {
        render(
            <SecretField
                label={FIELD_LABEL}
                value=""
                autoComplete={ESecretAutocomplete.Current}
            />,
        );

        expect(screen.getByLabelText(FIELD_LABEL)).toHaveAttribute(
            'type',
            'password',
        );
    });

    it('forwards the current-password autocomplete intent', (): void => {
        render(
            <SecretField
                label={FIELD_LABEL}
                value=""
                autoComplete={ESecretAutocomplete.Current}
            />,
        );

        expect(screen.getByLabelText(FIELD_LABEL)).toHaveAttribute(
            'autocomplete',
            'current-password',
        );
    });

    it('forwards the new-password autocomplete intent', (): void => {
        render(
            <SecretField
                label={FIELD_LABEL}
                value=""
                autoComplete={ESecretAutocomplete.New}
            />,
        );

        expect(screen.getByLabelText(FIELD_LABEL)).toHaveAttribute(
            'autocomplete',
            'new-password',
        );
    });

    it('reveals and re-masks the secret through the toggle', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <ControlledHost
                label={FIELD_LABEL}
                value=""
                autoComplete={ESecretAutocomplete.Current}
            />,
        );

        const toggle: HTMLElement = screen.getByRole('button', {
            name: REVEAL_LABEL,
        });
        expect(toggle).toHaveAttribute('aria-pressed', 'false');

        await user.click(toggle);
        expect(screen.getByLabelText(FIELD_LABEL)).toHaveAttribute('type', 'text');
        const concealToggle: HTMLElement = screen.getByRole('button', {
            name: CONCEAL_LABEL,
        });
        expect(concealToggle).toHaveAttribute('aria-pressed', 'true');

        await user.click(concealToggle);
        expect(screen.getByLabelText(FIELD_LABEL)).toHaveAttribute(
            'type',
            'password',
        );
        expect(
            screen.getByRole('button', { name: REVEAL_LABEL }),
        ).toBeInTheDocument();
    });

    it('does not submit a surrounding form when the toggle is pressed', async (): Promise<void> => {
        const onSubmit: Mock<(event: SyntheticEvent<HTMLFormElement>) => void> =
            vi.fn<(event: SyntheticEvent<HTMLFormElement>) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <form onSubmit={onSubmit}>
                <SecretField
                    label={FIELD_LABEL}
                    value=""
                    autoComplete={ESecretAutocomplete.Current}
                />
            </form>,
        );

        await user.click(screen.getByRole('button', { name: REVEAL_LABEL }));

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onValueChange with the typed string', async (): Promise<void> => {
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <ControlledHost
                label={FIELD_LABEL}
                value=""
                autoComplete={ESecretAutocomplete.Current}
                onValueChange={onValueChange}
            />,
        );

        await user.type(screen.getByLabelText(FIELD_LABEL), 'abc');

        expect(onValueChange).toHaveBeenCalledTimes(3);
        expect(onValueChange).toHaveBeenLastCalledWith('abc');
    });

    it('blocks editing and reveal when disabled', async (): Promise<void> => {
        const onValueChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <SecretField
                label={FIELD_LABEL}
                value=""
                autoComplete={ESecretAutocomplete.Current}
                enabled={EEnabledState.Disabled}
                onValueChange={onValueChange}
            />,
        );

        const input: HTMLElement = screen.getByLabelText(FIELD_LABEL);
        expect(input).toBeDisabled();
        await user.type(input, 'x');
        expect(onValueChange).not.toHaveBeenCalled();

        const toggle: HTMLElement = screen.getByRole('button', {
            name: REVEAL_LABEL,
        });
        expect(toggle).toBeDisabled();
        await user.click(toggle);
        expect(screen.getByLabelText(FIELD_LABEL)).toHaveAttribute(
            'type',
            'password',
        );
    });

    it('warns about caps lock while focused and clears it on blur', (): void => {
        render(
            <SecretField
                label={FIELD_LABEL}
                value=""
                autoComplete={ESecretAutocomplete.Current}
            />,
        );

        const input: HTMLElement = screen.getByLabelText(FIELD_LABEL);
        // The caps advisory is a persistent live region: present from mount so
        // assistive tech announces it reliably, empty (and unreferenced) until
        // caps lock is detected.
        const hint: HTMLElement = screen.getByRole('status');
        expect(hint).toBeEmptyDOMElement();
        expect(input).not.toHaveAttribute('aria-describedby');

        fireEvent.keyDown(input, { modifierCapsLock: true });

        expect(hint).toHaveTextContent(CAPS_WARNING);
        expect(input.getAttribute('aria-describedby')).toContain(hint.id);

        fireEvent.blur(input);
        expect(hint).toBeEmptyDOMElement();
        expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('never logs the secret value across a full reveal-and-submit cycle', async (): Promise<void> => {
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
            <form
                onSubmit={(event: SyntheticEvent<HTMLFormElement>): void => {
                    event.preventDefault();
                }}
            >
                <ControlledHost
                    label={FIELD_LABEL}
                    value=""
                    autoComplete={ESecretAutocomplete.Current}
                />
                <button type="submit">Submit</button>
            </form>,
        );

        await user.type(screen.getByLabelText(FIELD_LABEL), SECRET);
        await user.click(screen.getByRole('button', { name: REVEAL_LABEL }));
        await user.click(screen.getByRole('button', { name: CONCEAL_LABEL }));
        await user.click(screen.getByRole('button', { name: 'Submit' }));

        const loggedCalls: string = JSON.stringify([
            logSpy.mock.calls,
            infoSpy.mock.calls,
            warnSpy.mock.calls,
            errorSpy.mock.calls,
            debugSpy.mock.calls,
        ]);
        expect(loggedCalls).not.toContain(SECRET);
    });

    it('reflects the secret nowhere but the input value property', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const { container }: RenderResult = render(
            <ControlledHost
                label={FIELD_LABEL}
                value=""
                autoComplete={ESecretAutocomplete.Current}
            />,
        );

        const input: HTMLInputElement =
            screen.getByLabelText<HTMLInputElement>(FIELD_LABEL);
        await user.type(input, SECRET);
        await user.click(screen.getByRole('button', { name: REVEAL_LABEL }));

        // The value lives only in the input's own value property; native masking is
        // visual, not a value copy.
        expect(input.value).toBe(SECRET);

        const elements: readonly Element[] = Array.from(
            container.querySelectorAll('*'),
        );
        elements.forEach((element: Element): void => {
            Array.from(element.attributes).forEach((attribute: Attr): void => {
                const isInputValueAttribute: boolean =
                    element === input && attribute.name === 'value';
                if (isInputValueAttribute) {
                    return;
                }
                expect(attribute.value).not.toContain(SECRET);
            });
        });
        expect(container.textContent).not.toContain(SECRET);
    });
});
