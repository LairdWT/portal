import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { Select } from './Select';
import { type UiSelectOption } from './Select.types';

const OPTIONS: readonly UiSelectOption[] = [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' },
    { id: 'cherry', label: 'Cherry' },
    { id: 'date', label: 'Date' },
];

const WITH_DISABLED: readonly UiSelectOption[] = [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana', disabled: true },
    { id: 'cherry', label: 'Cherry' },
];

afterEach((): void => {
    document.body.innerHTML = '';
});

type HarnessProps = Readonly<{
    initialValue?: string | null;
    clearable?: boolean;
    enabled?: EEnabledState;
    options?: readonly UiSelectOption[];
    onChange?: (id: string | null) => void;
}>;

function Harness(props: HarnessProps): ReactElement {
    const [value, setValue]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(props.initialValue ?? null);
    return (
        <Select
            label="Fruit"
            options={props.options ?? OPTIONS}
            value={value}
            onChange={(id: string | null): void => {
                setValue(id);
                props.onChange?.(id);
            }}
            {...(props.clearable !== undefined
                ? { clearable: props.clearable }
                : {})}
            {...(props.enabled !== undefined ? { enabled: props.enabled } : {})}
        />
    );
}

describe('Select', (): void => {
    it('exposes the trigger as a combobox with listbox popup semantics', (): void => {
        render(<Harness />);

        const trigger: HTMLElement = screen.getByRole('combobox');
        expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens a listbox of options on click', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness />);

        await user.click(screen.getByRole('combobox'));

        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(screen.getAllByRole('option')).toHaveLength(OPTIONS.length);
        expect(screen.getByRole('combobox')).toHaveAttribute(
            'aria-expanded',
            'true',
        );
    });

    it('selects an option, reports its id, closes, and reflects the label', async (): Promise<void> => {
        const onChange: Mock<(id: string | null) => void> =
            vi.fn<(id: string | null) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Harness onChange={onChange} />);

        await user.click(screen.getByRole('combobox'));
        await user.click(screen.getByRole('option', { name: 'Cherry' }));

        expect(onChange).toHaveBeenCalledWith('cherry');
        await waitFor((): void => {
            expect(screen.queryByRole('listbox')).toBeNull();
        });
        expect(screen.getByRole('combobox')).toHaveTextContent('Cherry');
    });

    it('marks the selected value with aria-selected', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness initialValue="banana" />);

        await user.click(screen.getByRole('combobox'));

        expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
            'aria-selected',
            'false',
        );
    });

    it('tracks the active option through Arrow, Home, and End', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness initialValue="apple" />);

        const trigger: HTMLElement = screen.getByRole('combobox');
        trigger.focus();
        await user.keyboard('{Enter}');

        const banana: HTMLElement = screen.getByRole('option', { name: 'Banana' });
        const apple: HTMLElement = screen.getByRole('option', { name: 'Apple' });
        const date: HTMLElement = screen.getByRole('option', { name: 'Date' });

        await user.keyboard('{ArrowDown}');
        expect(trigger).toHaveAttribute('aria-activedescendant', banana.id);

        await user.keyboard('{ArrowUp}');
        expect(trigger).toHaveAttribute('aria-activedescendant', apple.id);

        await user.keyboard('{End}');
        expect(trigger).toHaveAttribute('aria-activedescendant', date.id);

        await user.keyboard('{Home}');
        expect(trigger).toHaveAttribute('aria-activedescendant', apple.id);
    });

    it('selects the active option on Enter', async (): Promise<void> => {
        const onChange: Mock<(id: string | null) => void> =
            vi.fn<(id: string | null) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Harness initialValue="apple" onChange={onChange} />);

        const trigger: HTMLElement = screen.getByRole('combobox');
        trigger.focus();
        await user.keyboard('{Enter}');
        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');

        expect(onChange).toHaveBeenCalledWith('banana');
        await waitFor((): void => {
            expect(screen.queryByRole('listbox')).toBeNull();
        });
    });

    it('closes on Escape without selecting', async (): Promise<void> => {
        const onChange: Mock<(id: string | null) => void> =
            vi.fn<(id: string | null) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Harness onChange={onChange} />);

        const trigger: HTMLElement = screen.getByRole('combobox');
        trigger.focus();
        await user.keyboard('{Enter}');
        expect(screen.getByRole('listbox')).toBeInTheDocument();

        await user.keyboard('{Escape}');
        await waitFor((): void => {
            expect(screen.queryByRole('listbox')).toBeNull();
        });
        expect(onChange).not.toHaveBeenCalled();
    });

    it('jumps to a prefix match on type-ahead', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness initialValue="apple" />);

        const trigger: HTMLElement = screen.getByRole('combobox');
        trigger.focus();
        await user.keyboard('{Enter}');
        await user.keyboard('c');

        expect(trigger).toHaveAttribute(
            'aria-activedescendant',
            screen.getByRole('option', { name: 'Cherry' }).id,
        );
    });

    it('skips disabled options and refuses to select them', async (): Promise<void> => {
        const onChange: Mock<(id: string | null) => void> =
            vi.fn<(id: string | null) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Harness
                options={WITH_DISABLED}
                initialValue="apple"
                onChange={onChange}
            />,
        );

        const trigger: HTMLElement = screen.getByRole('combobox');
        trigger.focus();
        await user.keyboard('{Enter}');
        await user.keyboard('{ArrowDown}');

        expect(trigger).toHaveAttribute(
            'aria-activedescendant',
            screen.getByRole('option', { name: 'Cherry' }).id,
        );

        await user.click(screen.getByRole('option', { name: 'Banana' }));
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('clears to null and refocuses the trigger when clearable', async (): Promise<void> => {
        const onChange: Mock<(id: string | null) => void> =
            vi.fn<(id: string | null) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Harness initialValue="banana" clearable onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: 'Clear selection' }));

        expect(onChange).toHaveBeenCalledWith(null);
        expect(screen.getByRole('combobox')).toHaveFocus();
        expect(
            screen.queryByRole('button', { name: 'Clear selection' }),
        ).toBeNull();
    });

    it('does not open while disabled', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness enabled={EEnabledState.Disabled} />);

        const trigger: HTMLElement = screen.getByRole('combobox');
        await user.click(trigger);

        expect(screen.queryByRole('listbox')).toBeNull();
        expect(trigger).toBeDisabled();
    });
});
