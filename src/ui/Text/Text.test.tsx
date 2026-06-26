import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Text } from './Text';
import styles from './Text.module.css';
import { ETextRole } from './Text.types';

describe('Text', (): void => {
    it('renders its children as text', (): void => {
        render(<Text>Body copy</Text>);

        expect(screen.getByText('Body copy')).toBeInTheDocument();
    });

    it('defaults the body role to a paragraph element', (): void => {
        render(<Text>Body copy</Text>);

        const element: HTMLElement = screen.getByText('Body copy');
        expect(element.tagName).toBe('P');
        expect(element).toHaveAttribute('data-role', ETextRole.Body);
    });

    it('renders the heading role as a heading at the default level', (): void => {
        render(<Text role={ETextRole.Heading}>Section heading</Text>);

        const heading: HTMLElement = screen.getByRole('heading', { level: 2 });
        expect(heading).toHaveTextContent('Section heading');
    });

    it('honours the heading level prop', (): void => {
        render(
            <Text role={ETextRole.Heading} level={1}>
                Top heading
            </Text>,
        );

        const heading: HTMLElement = screen.getByRole('heading', { level: 1 });
        expect(heading.tagName).toBe('H1');
    });

    it('renders the mono role as a code element', (): void => {
        render(<Text role={ETextRole.Mono}>const x = 1;</Text>);

        const element: HTMLElement = screen.getByText('const x = 1;');
        expect(element.tagName).toBe('CODE');
        expect(element).toHaveAttribute('data-role', ETextRole.Mono);
    });

    it('overrides the element with the polymorphic as prop', (): void => {
        render(
            <Text role={ETextRole.Body} as="span">
                Inline body
            </Text>,
        );

        const element: HTMLElement = screen.getByText('Inline body');
        expect(element.tagName).toBe('SPAN');
        expect(element).toHaveAttribute('data-role', ETextRole.Body);
    });

    it('keeps the heading role on data-role when as overrides the element', (): void => {
        render(
            <Text role={ETextRole.Heading} as="div">
                Heading as div
            </Text>,
        );

        const element: HTMLElement = screen.getByText('Heading as div');
        expect(element.tagName).toBe('DIV');
        expect(element).toHaveAttribute('data-role', ETextRole.Heading);
        // A div carries no implicit heading semantics, so the override drops the
        // heading role even though the styling role is retained.
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('exposes data-role for the secondary, dim, and styled roles', (): void => {
        render(
            <>
                <Text role={ETextRole.Secondary}>Secondary copy</Text>
                <Text role={ETextRole.Dim}>Dim copy</Text>
                <Text role={ETextRole.Styled}>Styled copy</Text>
            </>,
        );

        expect(screen.getByText('Secondary copy')).toHaveAttribute(
            'data-role',
            ETextRole.Secondary,
        );
        expect(screen.getByText('Dim copy')).toHaveAttribute(
            'data-role',
            ETextRole.Dim,
        );
        expect(screen.getByText('Styled copy')).toHaveAttribute(
            'data-role',
            ETextRole.Styled,
        );
    });

    it('carries the tone scope class on the root', (): void => {
        render(<Text>Body copy</Text>);

        const rootClass: string | undefined = styles.root;
        expect(rootClass).toBeDefined();

        const element: HTMLElement = screen.getByText('Body copy');
        expect(element).toHaveClass(rootClass ?? '');
    });

    it('applies the tone style to the root for the accent role', (): void => {
        const toneColor: string = 'rgb(0, 128, 255)';
        render(
            <Text role={ETextRole.Accent} tone={toneColor}>
                Accent text
            </Text>,
        );

        const element: HTMLElement = screen.getByText('Accent text');
        expect(element.style.getPropertyValue('--portal-tone')).toBe(toneColor);
        expect(element).toHaveAttribute('data-role', ETextRole.Accent);
    });
});
