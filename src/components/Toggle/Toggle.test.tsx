import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { Toggle } from './Toggle';
import { ECheckedState } from './Toggle.types';

const TOGGLE_LABEL: string = 'Mute';

describe('Toggle', (): void => {
    it('flips its own state on click when uncontrolled', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Toggle label={TOGGLE_LABEL} />);

        const toggle: HTMLElement = screen.getByRole('switch', {
            name: TOGGLE_LABEL,
        });
        expect(toggle).not.toBeChecked();

        await user.click(toggle);
        expect(toggle).toBeChecked();

        await user.click(toggle);
        expect(toggle).not.toBeChecked();
    });

    it('starts from defaultChecked when uncontrolled', (): void => {
        render(
            <Toggle label={TOGGLE_LABEL} defaultChecked={ECheckedState.Checked} />,
        );

        expect(screen.getByRole('switch', { name: TOGGLE_LABEL })).toBeChecked();
    });

    it('reports changes via onChange and holds its prop state when controlled', async (): Promise<void> => {
        const onChange: Mock<(checked: ECheckedState) => void> =
            vi.fn<(checked: ECheckedState) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Toggle
                label={TOGGLE_LABEL}
                checked={ECheckedState.Unchecked}
                onChange={onChange}
            />,
        );

        const toggle: HTMLElement = screen.getByRole('switch', {
            name: TOGGLE_LABEL,
        });
        await user.click(toggle);

        expect(onChange).toHaveBeenCalledWith(ECheckedState.Checked);
        // Controlled: the prop did not change, so the rendered state holds.
        expect(toggle).not.toBeChecked();
    });

    it('does not toggle or emit when disabled', async (): Promise<void> => {
        const onChange: Mock<(checked: ECheckedState) => void> =
            vi.fn<(checked: ECheckedState) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Toggle
                label={TOGGLE_LABEL}
                enabled={EEnabledState.Disabled}
                onChange={onChange}
            />,
        );

        const toggle: HTMLElement = screen.getByRole('switch', {
            name: TOGGLE_LABEL,
        });
        expect(toggle).toBeDisabled();

        await user.click(toggle);
        expect(onChange).not.toHaveBeenCalled();
    });
});
