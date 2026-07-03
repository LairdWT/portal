import { fireEvent, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import type { CarouselItem } from '../Carousel/Carousel.types';
import { Lightbox } from './Lightbox';

const ITEMS: readonly CarouselItem[] = [
    { id: 'a', content: <p>Alpha frame</p> },
    { id: 'b', content: <p>Bravo frame</p> },
];

describe('Lightbox', (): void => {
    it('renders nothing while closed', (): void => {
        const view: { container: HTMLElement } = render(
            <Lightbox
                open={false}
                onClose={(): void => {
                    // Closed: no dismissal can occur.
                }}
                label="Mission gallery"
                items={ITEMS}
            />,
        );
        expect(view.container).toBeEmptyDOMElement();
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('opens a titled dialog carrying the carousel', (): void => {
        render(
            <Lightbox
                open
                onClose={(): void => {
                    // No dismissal in this assertion.
                }}
                label="Mission gallery"
                items={ITEMS}
            />,
        );
        expect(
            screen.getByRole('dialog', { name: 'Mission gallery' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Alpha frame')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Next slide' }),
        ).toBeInTheDocument();
    });

    it('dismisses through the dialog on Escape', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const onClose: Mock = vi.fn();
        render(
            <Lightbox
                open
                onClose={onClose}
                label="Mission gallery"
                items={ITEMS}
            />,
        );
        await user.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('zooms through the toolbar and resets', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <Lightbox
                open
                onClose={(): void => {
                    // No dismissal in this assertion.
                }}
                label="Mission gallery"
                items={ITEMS}
            />,
        );
        // Fitted view: out and reset are inert, the readout reads 100%.
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Reset zoom' })).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Zoom in' }));
        expect(screen.getByText('150%')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Zoom out' })).not.toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Reset zoom' }));
        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('zooms with the wheel and toggles with double-click', (): void => {
        render(
            <Lightbox
                open
                onClose={(): void => {
                    // No dismissal in this assertion.
                }}
                label="Mission gallery"
                items={ITEMS}
            />,
        );
        const slide: HTMLElement = screen.getByText('Alpha frame');
        // A wheel notch up multiplies the scale by the wheel factor.
        fireEvent.wheel(slide, { deltaY: -100 });
        expect(screen.getByText('120%')).toBeInTheDocument();
        // Double-click toggles between fit and the 2x target.
        fireEvent.doubleClick(slide);
        expect(screen.getByText('100%')).toBeInTheDocument();
        fireEvent.doubleClick(slide);
        expect(screen.getByText('200%')).toBeInTheDocument();
    });
});
