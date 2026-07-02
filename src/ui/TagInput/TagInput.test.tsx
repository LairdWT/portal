import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { describe, expect, it } from 'vitest';

import { TagInput } from './TagInput';

// Controlled harness: both the tag list and the draft flow through state.
function TagHarness({
    initialTags,
    suggestions,
}: Readonly<{
    initialTags?: readonly string[];
    suggestions?: readonly string[];
}>): ReactElement {
    const [tags, setTags]: [
        readonly string[],
        Dispatch<SetStateAction<readonly string[]>>,
    ] = useState<readonly string[]>(initialTags ?? []);
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>('');
    return (
        <TagInput
            label="Squad tags"
            tags={tags}
            onTagsChange={setTags}
            value={value}
            onValueChange={setValue}
            suggestions={suggestions}
        />
    );
}

describe('TagInput', (): void => {
    it('commits the trimmed draft with Enter and clears it', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<TagHarness />);
        const input: HTMLElement = screen.getByLabelText('Squad tags');
        await user.type(input, '  vanguard  ');
        await user.keyboard('{Enter}');
        expect(screen.getByText('vanguard')).toBeInTheDocument();
        expect(input).toHaveValue('');
    });

    it('commits with a comma and never re-adds a duplicate', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<TagHarness initialTags={['recon']} />);
        const input: HTMLElement = screen.getByLabelText('Squad tags');
        await user.type(input, 'recon');
        await user.keyboard(',');
        // Still exactly one 'recon' chip, draft cleared.
        expect(screen.getAllByText('recon')).toHaveLength(1);
        expect(input).toHaveValue('');
    });

    it('removes the last tag with Backspace in an empty draft', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<TagHarness initialTags={['recon', 'vanguard']} />);
        const input: HTMLElement = screen.getByLabelText('Squad tags');
        await user.click(input);
        await user.keyboard('{Backspace}');
        expect(screen.queryByText('vanguard')).toBeNull();
        expect(screen.getByText('recon')).toBeInTheDocument();
    });

    it('removes a tag from its chip remove control', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<TagHarness initialTags={['recon', 'vanguard']} />);
        const removeButtons: readonly HTMLElement[] = screen.getAllByRole('button');
        const first: HTMLElement | undefined = removeButtons[0];
        if (first === undefined) {
            throw new Error('Expected a chip remove control.');
        }
        await user.click(first);
        expect(screen.queryByText('recon')).toBeNull();
        expect(screen.getByText('vanguard')).toBeInTheDocument();
    });

    it('opens fuzzy suggestions excluding committed tags and commits the active one', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <TagHarness
                initialTags={['recon']}
                suggestions={['recon', 'vanguard', 'rearguard']}
            />,
        );
        const input: HTMLElement = screen.getByRole('combobox', {
            name: 'Squad tags',
        });
        await user.type(input, 'gu');
        const options: readonly HTMLElement[] = screen.getAllByRole('option');
        // 'recon' is committed, so only the two *guard suggestions remain.
        expect(options).toHaveLength(2);
        expect(screen.queryByRole('option', { name: 'recon' })).toBeNull();
        await user.keyboard('{Enter}');
        expect(input).toHaveValue('');
        expect(screen.queryByRole('listbox')).toBeNull();
        // One of the suggestions landed as a chip.
        expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
    });

    it('carries no listbox wiring when suggestions are absent', (): void => {
        render(<TagHarness />);
        expect(screen.queryByRole('combobox')).toBeNull();
        expect(screen.getByLabelText('Squad tags')).not.toHaveAttribute(
            'aria-haspopup',
        );
    });
});
