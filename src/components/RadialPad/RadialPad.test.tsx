import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
} from '../../input';
import { EEnabledState } from '../../state/state';
import { ERadialAction, type RadialItem } from '../../ui/Radial/Radial.types';
import { RadialPad } from './RadialPad';

const SECTIONS: readonly RadialItem[] = [
    { id: 'pistol', label: 'Pistol' },
    { id: 'rifle', label: 'Rifle' },
    { id: 'shotgun', label: 'Shotgun' },
    { id: 'grenade', label: 'Grenade' },
];

const PAD_DESCRIPTOR: InputDescriptor = {
    id: 'radial',
    kind: EInputValueType.Digital,
    label: 'Radial selection',
};

function noop(): void {
    // Intentionally empty: a stand-in handler where the call is not asserted.
}

afterEach((): void => {
    document.body.innerHTML = '';
});

describe('RadialPad', (): void => {
    it('renders the collapsible inline controller by default with one section per side', (): void => {
        render(
            <RadialPad
                open
                onClose={noop}
                label="Weapon wheel"
                sections={SECTIONS}
                sides={4}
            />,
        );
        expect(
            screen.getByRole('group', { name: 'Weapon wheel' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Pistol' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Grenade' })).toBeInTheDocument();
    });

    it('keeps the hub mounted as the toggle while collapsed and requests expansion through onOpen', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onOpen: Mock = vi.fn();
        render(
            <RadialPad
                open={false}
                onClose={noop}
                onOpen={onOpen}
                label="Weapon wheel"
                sections={SECTIONS}
                sides={4}
            />,
        );
        const toggle: HTMLElement = screen.getByRole('button', {
            name: 'Weapon wheel',
        });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(
            screen.queryByRole('button', { name: 'Pistol' }),
        ).not.toBeInTheDocument();
        await user.click(toggle);
        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('never emits an InputSignal from the collapsed hub toggle', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const signals: InputSignal[] = [];
        render(
            <RadialPad
                open={false}
                onClose={noop}
                onOpen={noop}
                label="Weapon wheel"
                sections={SECTIONS}
                sides={4}
                descriptor={PAD_DESCRIPTOR}
                onSignal={(signal: InputSignal): void => {
                    signals.push(signal);
                }}
            />,
        );
        await user.click(screen.getByRole('button', { name: 'Weapon wheel' }));
        expect(signals).toHaveLength(0);
    });

    it('renders the portaled modal overlay form when collapsible is false', (): void => {
        render(
            <RadialPad
                open
                onClose={noop}
                label="Weapon wheel"
                sections={SECTIONS}
                sides={4}
                collapsible={false}
            />,
        );
        expect(
            screen.getByRole('dialog', { name: 'Weapon wheel' }),
        ).toBeInTheDocument();
    });

    it('reports the selected section id and index through onSelect', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onSelect: Mock = vi.fn();
        render(
            <RadialPad
                open
                onClose={noop}
                label="Weapon wheel"
                sections={SECTIONS}
                sides={4}
                onSelect={onSelect}
            />,
        );
        await user.click(screen.getByRole('button', { name: 'Shotgun' }));
        expect(onSelect).toHaveBeenCalledWith('shotgun', 2);
    });

    it('emits a per-target Digital signal pulse with the id suffix when wired', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const signals: InputSignal[] = [];
        const onSignal: (signal: InputSignal) => void = (
            signal: InputSignal,
        ): void => {
            signals.push(signal);
        };
        render(
            <RadialPad
                open
                onClose={noop}
                label="Weapon wheel"
                sections={SECTIONS}
                sides={4}
                descriptor={PAD_DESCRIPTOR}
                onSignal={onSignal}
                centerActions={[ERadialAction.Confirm]}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Pistol' }));
        // A momentary select is a Press then a Release, both carrying the
        // section's index-suffixed id.
        const sectionSignals: readonly InputSignal[] = signals.filter(
            (signal: InputSignal): boolean =>
                JSON.stringify(signal).includes('radial.section-0'),
        );
        expect(sectionSignals.length).toBe(2);

        await user.click(screen.getByRole('button', { name: 'Confirm' }));
        const confirmSignals: readonly InputSignal[] = signals.filter(
            (signal: InputSignal): boolean =>
                JSON.stringify(signal).includes('radial.confirm'),
        );
        expect(confirmSignals.length).toBe(2);
    });

    it('does not activate a section while disabled', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onSelect: Mock = vi.fn();
        render(
            <RadialPad
                open
                onClose={noop}
                label="Weapon wheel"
                sections={SECTIONS}
                sides={4}
                enabled={EEnabledState.Disabled}
                onSelect={onSelect}
            />,
        );
        const section: HTMLElement = screen.getByRole('button', {
            name: 'Pistol',
        });
        expect(section).toBeDisabled();
        await user.click(section);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('fires onCenterAction and closes when cancel is pressed', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onCenterAction: Mock = vi.fn();
        const onClose: Mock = vi.fn();
        render(
            <RadialPad
                open
                onClose={onClose}
                label="Weapon wheel"
                sections={SECTIONS}
                sides={4}
                centerActions={[ERadialAction.Confirm, ERadialAction.Cancel]}
                onCenterAction={onCenterAction}
            />,
        );
        await user.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onCenterAction).toHaveBeenCalledWith(ERadialAction.Cancel);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
