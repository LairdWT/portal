import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { PromptDialog } from './PromptDialog';

afterEach((): void => {
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
});
