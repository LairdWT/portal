import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';
import { ESkeletonAnimation, ESkeletonVariant } from './Skeleton.types';

describe('Skeleton', (): void => {
    it('is decorative (aria-hidden, not in the a11y tree) by default', (): void => {
        const { container }: { container: HTMLElement } = render(<Skeleton />);

        const root: Element | null = container.firstElementChild;
        expect(root).not.toBeNull();
        expect(root).toHaveAttribute('aria-hidden', 'true');
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('defaults to a single Block painted node', (): void => {
        const { container }: { container: HTMLElement } = render(<Skeleton />);

        const painted: NodeListOf<Element> =
            container.querySelectorAll('[data-animation]');
        expect(painted).toHaveLength(1);
        expect(painted[0]).toHaveClass('block');
    });

    it('defaults to the Shimmer animation', (): void => {
        const { container }: { container: HTMLElement } = render(<Skeleton />);

        const painted: Element | null = container.querySelector('[data-animation]');
        expect(painted).toHaveAttribute('data-animation', 'shimmer');
    });

    it('opts into an announced live region when label is set', (): void => {
        render(<Skeleton label="Loading profile" />);

        const status: HTMLElement = screen.getByRole('status');
        expect(status).toHaveAttribute('aria-busy', 'true');
        expect(status).not.toHaveAttribute('aria-hidden');
        expect(screen.getByText('Loading profile')).toBeInTheDocument();
    });

    it('renders Text lines with a shorter last bar', (): void => {
        const { container }: { container: HTMLElement } = render(
            <Skeleton variant={ESkeletonVariant.Text} lines={4} />,
        );

        const lines: NodeListOf<Element> = container.querySelectorAll('.line');
        expect(lines).toHaveLength(4);
        lines.forEach((line: Element, index: number): void => {
            const isLast: boolean = index === lines.length - 1;
            expect(line.classList.contains('lineLast')).toBe(isLast);
        });
    });

    it('defaults the Text bar count to 3 when lines is omitted', (): void => {
        const { container }: { container: HTMLElement } = render(
            <Skeleton variant={ESkeletonVariant.Text} />,
        );

        expect(container.querySelectorAll('.line')).toHaveLength(3);
    });

    it('floors a degenerate Text line count to 1', (): void => {
        const zero: { container: HTMLElement } = render(
            <Skeleton variant={ESkeletonVariant.Text} lines={0} />,
        );
        expect(zero.container.querySelectorAll('.line')).toHaveLength(1);

        const negative: { container: HTMLElement } = render(
            <Skeleton variant={ESkeletonVariant.Text} lines={-2} />,
        );
        expect(negative.container.querySelectorAll('.line')).toHaveLength(1);
    });

    it('paints a Circle node distinct from the Block shape', (): void => {
        const { container }: { container: HTMLElement } = render(
            <Skeleton variant={ESkeletonVariant.Circle} />,
        );

        const painted: Element | null = container.querySelector('[data-animation]');
        expect(painted).toHaveClass('circle');
        expect(painted).not.toHaveClass('block');
    });

    it('applies width / height / radius inline', (): void => {
        const { container }: { container: HTMLElement } = render(
            <Skeleton width="12rem" height="3rem" radius="0.25rem" />,
        );

        const painted: HTMLElement | null =
            container.querySelector<HTMLElement>('[data-animation]');
        expect(painted).not.toBeNull();
        expect(painted?.style.inlineSize).toBe('12rem');
        expect(painted?.style.blockSize).toBe('3rem');
        expect(painted?.style.borderRadius).toBe('0.25rem');
    });

    it('writes no inline dimension when none is supplied', (): void => {
        const { container }: { container: HTMLElement } = render(<Skeleton />);

        const painted: HTMLElement | null =
            container.querySelector<HTMLElement>('[data-animation]');
        expect(painted).not.toBeNull();
        expect(painted?.style.inlineSize).toBe('');
        expect(painted?.style.blockSize).toBe('');
    });

    it('sets the static attribute for animation None', (): void => {
        const { container }: { container: HTMLElement } = render(
            <Skeleton animation={ESkeletonAnimation.None} />,
        );

        const painted: Element | null = container.querySelector('[data-animation]');
        expect(painted).toHaveAttribute('data-animation', 'none');
    });

    it('sets the Pulse attribute', (): void => {
        const { container }: { container: HTMLElement } = render(
            <Skeleton animation={ESkeletonAnimation.Pulse} />,
        );

        const painted: Element | null = container.querySelector('[data-animation]');
        expect(painted).toHaveAttribute('data-animation', 'pulse');
    });

    it('keeps every Text bar aria-hidden inside the status region', (): void => {
        const { container }: { container: HTMLElement } = render(
            <Skeleton
                variant={ESkeletonVariant.Text}
                lines={2}
                label="Loading list"
            />,
        );

        const lines: NodeListOf<Element> = container.querySelectorAll('.line');
        expect(lines).toHaveLength(2);
        lines.forEach((line: Element): void => {
            expect(line).toHaveAttribute('aria-hidden', 'true');
        });
        expect(screen.getByText('Loading list')).toBeInTheDocument();
    });
});
