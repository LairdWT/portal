import {
    fireEvent,
    render,
    type RenderResult,
    screen,
} from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EUiStatus } from '../tone';
import { Avatar } from './Avatar';
import styles from './Avatar.module.css';
import {
    deriveInitials,
    EAvatarContent,
    EAvatarShape,
    EAvatarSize,
} from './Avatar.types';

// A tiny ASCII data URI so the image cases have a concrete src attribute.
const IMAGE_SRC: string =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E";

function rootOf(view: RenderResult): HTMLElement {
    const root: Element | null = view.container.firstElementChild;
    expect(root).not.toBeNull();
    return root as HTMLElement;
}

describe('Avatar', (): void => {
    it('renders an image named from the name when src loads', (): void => {
        const view: RenderResult = render(
            <Avatar src={IMAGE_SRC} name="Jane Doe" />,
        );

        const image: HTMLElement = screen.getByRole('img', { name: 'Jane Doe' });
        expect(image.tagName).toBe('IMG');
        expect(rootOf(view)).toHaveAttribute('data-content', EAvatarContent.Image);
    });

    it('prefers an explicit alt over the name for the image', (): void => {
        render(<Avatar src={IMAGE_SRC} name="Jane Doe" alt="Profile photo" />);

        expect(
            screen.getByRole('img', { name: 'Profile photo' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('img', { name: 'Jane Doe' })).toBeNull();
    });

    it('falls back to initials when the image errors', (): void => {
        const view: RenderResult = render(
            <Avatar src={IMAGE_SRC} name="Jane Doe" />,
        );

        const image: HTMLElement = screen.getByRole('img', { name: 'Jane Doe' });
        fireEvent.error(image);

        expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument();
        expect(screen.getByText('JD')).toBeInTheDocument();
        expect(rootOf(view)).toHaveAttribute(
            'data-content',
            EAvatarContent.Initials,
        );
    });

    it('renders initials immediately when no src is supplied', (): void => {
        const view: RenderResult = render(<Avatar name="Jane Doe" />);

        expect(view.container.querySelector('img')).toBeNull();
        expect(screen.getByText('JD')).toBeInTheDocument();
        expect(rootOf(view)).toHaveAttribute(
            'data-content',
            EAvatarContent.Initials,
        );
    });

    it('renders the icon link when there is no src and no name', (): void => {
        const view: RenderResult = render(
            <Avatar icon={<svg data-testid="custom-icon" />} />,
        );

        expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Avatar' })).toBeInTheDocument();
        expect(rootOf(view)).toHaveAttribute('data-content', EAvatarContent.Icon);
    });

    it('renders the generic glyph as the last-resort link', (): void => {
        const view: RenderResult = render(<Avatar />);

        expect(screen.getByRole('img', { name: 'Avatar' })).toBeInTheDocument();
        expect(screen.getByText('?')).toBeInTheDocument();
        expect(rootOf(view)).toHaveAttribute('data-content', EAvatarContent.Glyph);
    });

    it('removes the identity from the a11y tree when decorative', (): void => {
        const view: RenderResult = render(
            <Avatar src={IMAGE_SRC} name="Jane Doe" decorative />,
        );

        expect(screen.queryByRole('img')).toBeNull();
        const image: HTMLImageElement | null = view.container.querySelector('img');
        expect(image).not.toBeNull();
        expect(image?.getAttribute('alt')).toBe('');
    });

    it('announces presence as a sibling label alongside the identity', (): void => {
        const view: RenderResult = render(
            <Avatar
                src={IMAGE_SRC}
                name="Jane Doe"
                status={{ status: EUiStatus.Success, label: 'Online' }}
            />,
        );

        expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument();

        const label: HTMLElement = screen.getByText('Online');
        expect(label).toBeInTheDocument();

        const presence: Element | null = view.container.querySelector(
            `[data-status='${EUiStatus.Success}']`,
        );
        expect(presence).not.toBeNull();

        const dotClass: string | undefined = styles.dot;
        expect(dotClass).toBeDefined();
        const dot: Element | null = view.container.querySelector(
            `.${dotClass ?? ''}`,
        );
        expect(dot).not.toBeNull();
        expect(dot).toHaveAttribute('aria-hidden', 'true');
    });

    it('keeps the presence label even when decorative hides the identity', (): void => {
        render(
            <Avatar
                src={IMAGE_SRC}
                name="Jane Doe"
                decorative
                status={{ status: EUiStatus.Danger, label: 'Busy' }}
            />,
        );

        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText('Busy')).toBeInTheDocument();
    });

    it('reflects size and shape as data attributes with the shape class', (): void => {
        const view: RenderResult = render(
            <Avatar
                name="Jane Doe"
                size={EAvatarSize.Lg}
                shape={EAvatarShape.Bevel}
            />,
        );

        const root: HTMLElement = rootOf(view);
        expect(root).toHaveAttribute('data-size', EAvatarSize.Lg);
        expect(root).toHaveAttribute('data-shape', EAvatarShape.Bevel);

        const bevelClass: string | undefined = styles.shapeBevel;
        expect(bevelClass).toBeDefined();
        const figure: Element | null = view.container.querySelector(
            `.${bevelClass ?? ''}`,
        );
        expect(figure).not.toBeNull();
    });

    it('applies the circle shape class by default', (): void => {
        const view: RenderResult = render(<Avatar name="Jane Doe" />);

        const root: HTMLElement = rootOf(view);
        expect(root).toHaveAttribute('data-shape', EAvatarShape.Circle);

        const circleClass: string | undefined = styles.shapeCircle;
        expect(circleClass).toBeDefined();
        expect(
            view.container.querySelector(`.${circleClass ?? ''}`),
        ).not.toBeNull();
    });

    it('applies the tone style to the root', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        const view: RenderResult = render(
            <Avatar name="Jane Doe" tone={toneColor} />,
        );

        expect(rootOf(view).style.getPropertyValue('--portal-tone')).toBe(
            toneColor,
        );
    });

    it('is not interactive', (): void => {
        const view: RenderResult = render(<Avatar name="Jane Doe" />);

        expect(rootOf(view)).not.toHaveAttribute('tabindex');
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('retries the image when the src changes after an error', (): void => {
        const view: RenderResult = render(
            <Avatar src={IMAGE_SRC} name="Jane Doe" />,
        );

        fireEvent.error(screen.getByRole('img', { name: 'Jane Doe' }));
        expect(rootOf(view)).toHaveAttribute(
            'data-content',
            EAvatarContent.Initials,
        );

        const nextSrc: string = `${IMAGE_SRC}%3C!--retry--%3E`;
        view.rerender(<Avatar src={nextSrc} name="Jane Doe" />);

        expect(rootOf(view)).toHaveAttribute('data-content', EAvatarContent.Image);
    });

    describe('deriveInitials', (): void => {
        it('folds a two-word name to first and last initials', (): void => {
            expect(deriveInitials('Jane Doe')).toBe('JD');
        });

        it('uses a single initial for a one-word name', (): void => {
            expect(deriveInitials('Madonna')).toBe('M');
        });

        it('yields an empty string for a whitespace-only name', (): void => {
            expect(deriveInitials('  ')).toBe('');
        });

        it('uses the first and last words of a multi-word name', (): void => {
            expect(deriveInitials('jane mary doe')).toBe('JD');
        });

        it('does not split a surrogate pair or non-Latin grapheme', (): void => {
            // Two astral-plane words written as escapes to keep the source ASCII.
            const first: string = '\u{1F600}';
            const last: string = '\u{1F680}';
            const name: string = `${first} ${last}`;
            const expected: string = `${
                Array.from(first)[0] ?? ''
            }${Array.from(last)[0] ?? ''}`.toUpperCase();

            expect(deriveInitials(name)).toBe(expected);
        });
    });
});
