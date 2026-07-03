import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { VirtualKeyboard } from './VirtualKeyboard';
import { EKeyAction } from './VirtualKeyboard.types';

type KeyCallback = (text: string) => void;
type ActionCallback = (action: EKeyAction) => void;

describe('VirtualKeyboard', (): void => {
    it('renders the named board with the default QWERTY caps', (): void => {
        const handleKey: Mock<KeyCallback> = vi.fn<KeyCallback>();
        render(<VirtualKeyboard label="On-screen keyboard" onKey={handleKey} />);
        expect(
            screen.getByRole('group', { name: 'On-screen keyboard' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'q' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'SPACE' })).toBeInTheDocument();
    });

    it('emits the base cap on click (keyboard-synthesized, detail 0)', (): void => {
        const handleKey: Mock<KeyCallback> = vi.fn<KeyCallback>();
        render(<VirtualKeyboard label="Keys" onKey={handleKey} />);
        fireEvent.click(screen.getByRole('button', { name: 'q' }));
        expect(handleKey).toHaveBeenCalledTimes(1);
        expect(handleKey).toHaveBeenCalledWith('q');
    });

    it('ignores pointer-derived clicks so pointer presses cannot double-commit', (): void => {
        const handleKey: Mock<KeyCallback> = vi.fn<KeyCallback>();
        render(<VirtualKeyboard label="Keys" onKey={handleKey} />);
        // A real pointer click carries detail >= 1; the commit for that path
        // happens in the press hook on pointerdown instead.
        fireEvent.click(screen.getByRole('button', { name: 'q' }), { detail: 1 });
        expect(handleKey).not.toHaveBeenCalled();
    });

    it('one-shot shifts: SHIFT latches, the next character emits uppercase and drops the layer', (): void => {
        const handleKey: Mock<KeyCallback> = vi.fn<KeyCallback>();
        render(<VirtualKeyboard label="Keys" onKey={handleKey} />);
        const shift: HTMLElement = screen.getByRole('button', { name: 'SHIFT' });
        fireEvent.click(shift);
        expect(shift).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(screen.getByRole('button', { name: 'Q' }));
        expect(handleKey).toHaveBeenCalledWith('Q');
        expect(shift).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: 'q' })).toBeInTheDocument();
    });

    it('latches the symbol layer until toggled back', (): void => {
        const handleKey: Mock<KeyCallback> = vi.fn<KeyCallback>();
        render(<VirtualKeyboard label="Keys" onKey={handleKey} />);
        fireEvent.click(screen.getByRole('button', { name: 'SYM' }));
        fireEvent.click(screen.getByRole('button', { name: '!' }));
        expect(handleKey).toHaveBeenCalledWith('!');
        // The layer persists after input; the toggle now reads ABC.
        expect(screen.getByRole('button', { name: '@' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'ABC' }));
        expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    });

    it('emits a space and routes Backspace/Enter through onAction', (): void => {
        const handleKey: Mock<KeyCallback> = vi.fn<KeyCallback>();
        const handleAction: Mock<ActionCallback> = vi.fn<ActionCallback>();
        render(
            <VirtualKeyboard
                label="Keys"
                onKey={handleKey}
                onAction={handleAction}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'SPACE' }));
        expect(handleKey).toHaveBeenCalledWith(' ');
        fireEvent.click(screen.getByRole('button', { name: 'DEL' }));
        expect(handleAction).toHaveBeenCalledWith(EKeyAction.Backspace);
        fireEvent.click(screen.getByRole('button', { name: 'ENTER' }));
        expect(handleAction).toHaveBeenCalledWith(EKeyAction.Enter);
    });

    it('disables every key when disabled', (): void => {
        const handleKey: Mock<KeyCallback> = vi.fn<KeyCallback>();
        render(
            <VirtualKeyboard
                label="Keys"
                onKey={handleKey}
                enabled={EEnabledState.Disabled}
            />,
        );
        const key: HTMLElement = screen.getByRole('button', { name: 'q' });
        expect(key).toBeDisabled();
        fireEvent.click(key);
        expect(handleKey).not.toHaveBeenCalled();
    });
});

describe('VirtualKeyboard control row and symbols', (): void => {
    function noopKey(): void {
        // The onKey sink for action-only tests.
    }

    it('reports Escape, Tab, and the arrows through onAction', (): void => {
        const handleAction: Mock<ActionCallback> = vi.fn<ActionCallback>();
        render(
            <VirtualKeyboard
                label="Keys"
                onKey={noopKey}
                onAction={handleAction}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'ESC' }));
        expect(handleAction).toHaveBeenLastCalledWith(EKeyAction.Escape);
        fireEvent.click(screen.getByRole('button', { name: 'TAB' }));
        expect(handleAction).toHaveBeenLastCalledWith(EKeyAction.Tab);
        fireEvent.click(screen.getByRole('button', { name: 'Arrow left' }));
        expect(handleAction).toHaveBeenLastCalledWith(EKeyAction.ArrowLeft);
        fireEvent.click(screen.getByRole('button', { name: 'Arrow up' }));
        expect(handleAction).toHaveBeenLastCalledWith(EKeyAction.ArrowUp);
    });

    it('latches Control and Alt visually while reporting each press', (): void => {
        const handleAction: Mock<ActionCallback> = vi.fn<ActionCallback>();
        render(
            <VirtualKeyboard
                label="Keys"
                onKey={noopKey}
                onAction={handleAction}
            />,
        );
        const control: HTMLElement = screen.getByRole('button', { name: 'CTRL' });
        expect(control).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(control);
        expect(control).toHaveAttribute('aria-pressed', 'true');
        expect(handleAction).toHaveBeenLastCalledWith(EKeyAction.Control);
        fireEvent.click(control);
        expect(control).toHaveAttribute('aria-pressed', 'false');
        const alt: HTMLElement = screen.getByRole('button', { name: 'ALT' });
        fireEvent.click(alt);
        expect(alt).toHaveAttribute('aria-pressed', 'true');
        expect(handleAction).toHaveBeenLastCalledWith(EKeyAction.Alt);
    });

    it('emits the fuller punctuation set across the layers', (): void => {
        const handleKey: Mock<KeyCallback> = vi.fn<KeyCallback>();
        render(<VirtualKeyboard label="Keys" onKey={handleKey} />);
        fireEvent.click(screen.getByRole('button', { name: '[' }));
        expect(handleKey).toHaveBeenLastCalledWith('[');
        // SHIFT lifts the punctuation row onto its shifted caps.
        fireEvent.click(screen.getByRole('button', { name: 'SHIFT' }));
        fireEvent.click(screen.getByRole('button', { name: '{' }));
        expect(handleKey).toHaveBeenLastCalledWith('{');
        // SYM surfaces the same shifted set (pipe, tilde, braces...).
        fireEvent.click(screen.getByRole('button', { name: 'SYM' }));
        fireEvent.click(screen.getByRole('button', { name: '|' }));
        expect(handleKey).toHaveBeenLastCalledWith('|');
        fireEvent.click(screen.getByRole('button', { name: '~' }));
        expect(handleKey).toHaveBeenLastCalledWith('~');
    });
});
