import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { TextArea } from './TextArea';
import { ETextAreaResize } from './TextArea.types';

describe('TextArea', (): void => {
    it('renders a labelled multiline control with the default rows', (): void => {
        render(<TextArea label="Notes" value="" />);
        const area: HTMLElement = screen.getByLabelText('Notes');
        expect(area.tagName).toBe('TEXTAREA');
        expect(area).toHaveAttribute('rows', '3');
    });

    it('reports typed values through onValueChange', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onValueChange: Mock = vi.fn();
        render(<TextArea label="Notes" value="" onValueChange={onValueChange} />);
        await user.type(screen.getByLabelText('Notes'), 'a');
        expect(onValueChange).toHaveBeenCalledWith('a');
    });

    it('honors rows, resize, and autoSize presentation props', (): void => {
        render(
            <TextArea
                label="Notes"
                value=""
                rows={6}
                resize={ETextAreaResize.None}
                autoSize
            />,
        );
        const area: HTMLElement = screen.getByLabelText('Notes');
        expect(area).toHaveAttribute('rows', '6');
        expect(area.getAttribute('data-resize')).toBe('none');
        expect(area.getAttribute('data-autosize')).toBe('true');
    });

    it('marks the control invalid and described by the error message', (): void => {
        render(<TextArea label="Notes" value="" error="Too long." />);
        const area: HTMLElement = screen.getByLabelText('Notes');
        expect(area).toHaveAttribute('aria-invalid', 'true');
        const describedBy: string = area.getAttribute('aria-describedby') ?? '';
        expect(describedBy).toBe(screen.getByText('Too long.').id);
    });

    it('disables the control from the enabled enum', (): void => {
        render(
            <TextArea label="Notes" value="" enabled={EEnabledState.Disabled} />,
        );
        expect(screen.getByLabelText('Notes')).toBeDisabled();
    });
});
