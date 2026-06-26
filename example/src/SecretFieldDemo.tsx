import {
    type CSSProperties,
    type Dispatch,
    type FormEvent,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { ESecretAutocomplete, SecretField } from '@laird-wt/portal';

// A token-driven submit button that clears the 48px touch floor, so the e2e
// "every button" check measures it as a real target alongside the reveal toggle.
const SUBMIT_BUTTON_STYLE: CSSProperties = {
    minBlockSize: 'var(--portal-touch-target-min)',
    minInlineSize: 'var(--portal-touch-target-min)',
    paddingInline: 'var(--portal-space-4)',
    borderRadius: 'var(--portal-radius-md)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    background: 'var(--portal-color-surface-0)',
    color: 'var(--portal-color-text-0)',
    cursor: 'pointer',
};

// A small controlled host that wraps one SecretField in a form whose submit count
// is reflected onto data-submit-count, so the e2e spec can prove submit (Enter)
// versus no-submit (reveal toggle) behaviour in a real browser.
export function SecretFieldDemo(): ReactElement {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('');
    const [submitCount, setSubmitCount]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>(0);

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        setSubmitCount((count: number): number => count + 1);
    }

    return (
        <form onSubmit={handleSubmit} data-submit-count={submitCount}>
            <SecretField
                label="Password"
                value={value}
                onValueChange={setValue}
                autoComplete={ESecretAutocomplete.Current}
                placeholder="Enter your password"
            />
            <button type="submit" style={SUBMIT_BUTTON_STYLE}>
                Sign in
            </button>
        </form>
    );
}
