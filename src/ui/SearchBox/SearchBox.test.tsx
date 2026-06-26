import {
    fireEvent,
    render,
    type RenderResult,
    screen,
} from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { SearchBox } from './SearchBox';
import { ESearchBoxState, type SearchBoxProps } from './SearchBox.types';

const FIELD_LABEL: string = 'Search cards';
const CLEAR_LABEL: string = 'Clear search';

// A controlled host so userEvent.type drives a real, updating value while still
// exercising the onChange contract.
function ControlledHost(props: SearchBoxProps): ReturnType<typeof SearchBox> {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(props.value);
    function handleChange(next: string): void {
        setValue(next);
        props.onChange?.(next);
    }
    return <SearchBox {...props} value={value} onChange={handleChange} />;
}

describe('SearchBox', (): void => {
    it('renders a labelled searchbox input', (): void => {
        render(<SearchBox label={FIELD_LABEL} value="" />);

        const input: HTMLElement = screen.getByRole('searchbox', {
            name: FIELD_LABEL,
        });
        expect(input).toBeInTheDocument();
        expect(input.tagName).toBe('INPUT');
    });

    it('calls onChange with the typed string', async (): Promise<void> => {
        const onChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<ControlledHost label={FIELD_LABEL} value="" onChange={onChange} />);

        await user.type(screen.getByRole('searchbox'), 'orc');

        expect(onChange).toHaveBeenCalledTimes(3);
        expect(onChange).toHaveBeenLastCalledWith('orc');
    });

    it('fires onSubmit with the current value on Enter', async (): Promise<void> => {
        const onSubmit: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(<ControlledHost label={FIELD_LABEL} value="" onSubmit={onSubmit} />);

        await user.type(screen.getByRole('searchbox'), 'troll{Enter}');

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenLastCalledWith('troll');
    });

    it('does not fire onSubmit on Enter when disabled', (): void => {
        const onSubmit: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        render(
            <SearchBox
                label={FIELD_LABEL}
                value="troll"
                enabled={EEnabledState.Disabled}
                onSubmit={onSubmit}
            />,
        );

        // fireEvent dispatches straight to the handler so the disabled guard in
        // handleKeyDown is exercised even though a disabled input is unfocusable.
        fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' });

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('hides the clear button while the value is empty', (): void => {
        render(<SearchBox label={FIELD_LABEL} value="" />);

        expect(
            screen.queryByRole('button', { name: CLEAR_LABEL }),
        ).not.toBeInTheDocument();
    });

    it('clears the value and exposes the clear label when filled', async (): Promise<void> => {
        const onChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <ControlledHost
                label={FIELD_LABEL}
                value="goblin"
                onChange={onChange}
            />,
        );

        const clear: HTMLElement = screen.getByRole('button', {
            name: CLEAR_LABEL,
        });
        await user.click(clear);

        expect(onChange).toHaveBeenLastCalledWith('');
        expect(
            screen.queryByRole('button', { name: CLEAR_LABEL }),
        ).not.toBeInTheDocument();
    });

    it('surfaces the fill state through data-state', (): void => {
        const { rerender }: RenderResult = render(
            <SearchBox label={FIELD_LABEL} value="" />,
        );

        const emptyRoot: HTMLElement | null = screen
            .getByRole('searchbox')
            .closest<HTMLElement>('[data-state]');
        expect(emptyRoot).not.toBeNull();
        expect(emptyRoot).toHaveAttribute('data-state', ESearchBoxState.Empty);

        rerender(<SearchBox label={FIELD_LABEL} value="mage" />);
        const filledRoot: HTMLElement | null = screen
            .getByRole('searchbox')
            .closest<HTMLElement>('[data-state]');
        expect(filledRoot).toHaveAttribute('data-state', ESearchBoxState.Filled);
    });

    it('applies the tone style to the root', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(<SearchBox label={FIELD_LABEL} value="" tone={toneColor} />);

        const root: HTMLElement | null = screen
            .getByRole('searchbox')
            .closest<HTMLElement>('[data-status]');
        expect(root).not.toBeNull();
        expect(root?.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('blocks editing and clearing when disabled', async (): Promise<void> => {
        const onChange: Mock<(value: string) => void> =
            vi.fn<(value: string) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <SearchBox
                label={FIELD_LABEL}
                value="goblin"
                enabled={EEnabledState.Disabled}
                onChange={onChange}
            />,
        );

        const input: HTMLElement = screen.getByRole('searchbox');
        expect(input).toBeDisabled();

        await user.type(input, 'x');
        expect(onChange).not.toHaveBeenCalled();

        const clear: HTMLElement = screen.getByRole('button', {
            name: CLEAR_LABEL,
        });
        expect(clear).toBeDisabled();
        await user.click(clear);
        expect(onChange).not.toHaveBeenCalled();
    });
});
