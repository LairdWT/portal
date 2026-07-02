import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';

import { Carousel } from './Carousel';
import type { CarouselItem } from './Carousel.types';

const ITEMS: readonly CarouselItem[] = [
    { id: 'a', content: <p>Alpha</p> },
    { id: 'b', content: <p>Bravo</p>, label: 'Bravo frame' },
    { id: 'c', content: <p>Charlie</p> },
];

beforeAll((): void => {
    // jsdom does not implement scrollIntoView; the carousel calls it on
    // every programmatic slide change, so stub it for the state-path tests.
    Element.prototype.scrollIntoView = function scrollIntoViewStub(): void {
        // Intentionally empty: jsdom has no layout to scroll.
    };
});

describe('Carousel', (): void => {
    it('renders the tabbed carousel with derived and custom slide names', (): void => {
        render(<Carousel label="Mission shots" items={ITEMS} />);
        expect(
            screen.getByRole('tablist', { name: 'Mission shots slides' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Slide 1 of 3' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        expect(screen.getByRole('tab', { name: 'Bravo frame' })).toHaveAttribute(
            'aria-selected',
            'false',
        );
        expect(screen.getByRole('tabpanel')).toContainElement(
            screen.getByText('Alpha'),
        );
    });

    it('gates the turn keys at the ends and advances the selection', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Carousel label="Mission shots" items={ITEMS} />);
        const previous: HTMLElement = screen.getByRole('button', {
            name: 'Previous slide',
        });
        const next: HTMLElement = screen.getByRole('button', {
            name: 'Next slide',
        });
        expect(previous).toBeDisabled();
        await user.click(next);
        expect(previous).toBeEnabled();
        expect(screen.getByRole('tab', { name: 'Bravo frame' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        await user.click(next);
        expect(next).toBeDisabled();
    });

    it('jumps from a dot and hides off-screen slides', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const view: { container: HTMLElement } = render(
            <Carousel label="Mission shots" items={ITEMS} />,
        );
        await user.click(screen.getByRole('tab', { name: 'Slide 3 of 3' }));
        expect(screen.getByRole('tab', { name: 'Slide 3 of 3' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        // Off-screen slides are hidden from assistive tech.
        const hidden: NodeListOf<Element> = view.container.querySelectorAll(
            '[role="tabpanel"][aria-hidden="true"]',
        );
        expect(hidden).toHaveLength(2);
    });

    it('roves the tablist with arrows, Home, and End', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Carousel label="Mission shots" items={ITEMS} />);
        const first: HTMLElement = screen.getByRole('tab', {
            name: 'Slide 1 of 3',
        });
        first.focus();
        await user.keyboard('{ArrowRight}');
        const second: HTMLElement = screen.getByRole('tab', {
            name: 'Bravo frame',
        });
        expect(second).toHaveFocus();
        expect(second).toHaveAttribute('aria-selected', 'true');
        await user.keyboard('{End}');
        expect(screen.getByRole('tab', { name: 'Slide 3 of 3' })).toHaveFocus();
        await user.keyboard('{Home}');
        expect(first).toHaveFocus();
    });
});
