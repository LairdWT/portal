import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { Hotbar } from './Hotbar';
import { type HotbarSlot } from './Hotbar.types';

type ActivateCallback = (id: string) => void;

const SLOTS: readonly HotbarSlot[] = [
    { id: 'blink', label: 'Blink', keybind: 'Q', content: <span>BLNK</span> },
    { id: 'barrage', label: 'Barrage', keybind: 'E', content: <span>BRRG</span> },
    { id: 'shield', label: 'Shield', content: <span>SHLD</span> },
];

describe('Hotbar', (): void => {
    it('renders the named group of keys with keybind shortcuts', (): void => {
        render(<Hotbar label="Abilities" slots={SLOTS} />);
        expect(
            screen.getByRole('group', { name: 'Abilities' }),
        ).toBeInTheDocument();
        const blink: HTMLElement = screen.getByRole('button', { name: 'Blink' });
        expect(blink).toHaveAttribute('aria-keyshortcuts', 'Q');
        expect(screen.getByRole('button', { name: 'Shield' })).not.toHaveAttribute(
            'aria-keyshortcuts',
        );
    });

    it('marks the active slot pressed', (): void => {
        render(<Hotbar label="Abilities" slots={SLOTS} activeId="barrage" />);
        expect(screen.getByRole('button', { name: 'Barrage' })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        expect(screen.getByRole('button', { name: 'Blink' })).toHaveAttribute(
            'aria-pressed',
            'false',
        );
    });

    it('activates on click exactly once', (): void => {
        const handleActivate: Mock<ActivateCallback> = vi.fn<ActivateCallback>();
        render(
            <Hotbar label="Abilities" slots={SLOTS} onActivate={handleActivate} />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Blink' }));
        expect(handleActivate).toHaveBeenCalledTimes(1);
        expect(handleActivate).toHaveBeenCalledWith('blink');
    });

    it('disables every key when disabled', (): void => {
        const handleActivate: Mock<ActivateCallback> = vi.fn<ActivateCallback>();
        render(
            <Hotbar
                label="Abilities"
                slots={SLOTS}
                onActivate={handleActivate}
                enabled={EEnabledState.Disabled}
            />,
        );
        const blink: HTMLElement = screen.getByRole('button', { name: 'Blink' });
        expect(blink).toBeDisabled();
        fireEvent.click(blink);
        expect(handleActivate).not.toHaveBeenCalled();
    });
});
