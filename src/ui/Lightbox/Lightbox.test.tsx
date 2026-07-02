import { render, screen } from '@testing-library/react';
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
});
