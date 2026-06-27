import { render, type RenderResult, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { Pagination } from './Pagination';

type ChangeMock = Mock<(page: number) => void>;

describe('Pagination', (): void => {
    it('renders a navigation landmark with the default accessible name', (): void => {
        render(<Pagination currentPage={1} pageCount={5} />);

        expect(
            screen.getByRole('navigation', { name: 'Pagination' }),
        ).toBeInTheDocument();
    });

    it('names the landmark through labelledBy', (): void => {
        render(
            <>
                <h2 id="results-heading">Results</h2>
                <Pagination
                    labelledBy="results-heading"
                    currentPage={1}
                    pageCount={5}
                />
            </>,
        );

        expect(
            screen.getByRole('navigation', { name: 'Results' }),
        ).toBeInTheDocument();
    });

    it('renders previous, next, and one button per visible page', (): void => {
        render(<Pagination currentPage={3} pageCount={5} />);

        const buttons: readonly HTMLElement[] = screen.getAllByRole('button');
        expect(buttons).toHaveLength(7);
        expect(
            screen.getByRole('button', { name: 'Go to previous page' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Go to next page' }),
        ).toBeInTheDocument();
    });

    it('marks the current page with aria-current and data-state', (): void => {
        render(<Pagination currentPage={3} pageCount={5} />);

        const current: HTMLElement = screen.getByRole('button', {
            current: 'page',
        });
        expect(current).toHaveAccessibleName('Page 3');
        expect(current).toHaveAttribute('data-state', 'current');
    });

    it('shows a gap for a large count and hides it from assistive tech', (): void => {
        render(<Pagination currentPage={1} pageCount={20} />);

        const gap: HTMLElement = screen.getByText('...');
        expect(gap).toHaveAttribute('aria-hidden', 'true');
        expect(screen.queryByRole('button', { name: '...' })).toBeNull();
    });

    it('renders both leading and trailing gaps, each hidden from assistive tech', (): void => {
        render(<Pagination currentPage={12} pageCount={24} />);

        const gaps: readonly HTMLElement[] = screen.getAllByText('...');
        expect(gaps).toHaveLength(2);
        gaps.forEach((gap: HTMLElement): void => {
            expect(gap).toHaveAttribute('aria-hidden', 'true');
        });
    });

    it('disables previous on the first page', (): void => {
        render(<Pagination currentPage={1} pageCount={5} />);

        expect(
            screen.getByRole('button', { name: 'Go to previous page' }),
        ).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Go to next page' }),
        ).toBeEnabled();
    });

    it('disables next on the last page', (): void => {
        render(<Pagination currentPage={5} pageCount={5} />);

        expect(
            screen.getByRole('button', { name: 'Go to next page' }),
        ).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Go to previous page' }),
        ).toBeEnabled();
    });

    it('disables both controls on a single page', (): void => {
        render(<Pagination currentPage={1} pageCount={1} />);

        expect(
            screen.getByRole('button', { name: 'Go to previous page' }),
        ).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Go to next page' }),
        ).toBeDisabled();
        expect(
            screen.getByRole('button', { current: 'page' }),
        ).toHaveAccessibleName('Page 1');
    });

    it('renders nothing for an empty page count', (): void => {
        const view: RenderResult = render(
            <Pagination currentPage={1} pageCount={0} />,
        );

        expect(screen.queryByRole('navigation')).toBeNull();
        expect(view.container).toBeEmptyDOMElement();
    });

    it('reports the target page on a page click', async (): Promise<void> => {
        const onChange: ChangeMock = vi.fn<(page: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Pagination currentPage={3} pageCount={5} onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: 'Go to page 5' }));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(5);
    });

    it('reports the previous page on a previous click', async (): Promise<void> => {
        const onChange: ChangeMock = vi.fn<(page: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Pagination currentPage={3} pageCount={5} onChange={onChange} />);

        await user.click(
            screen.getByRole('button', { name: 'Go to previous page' }),
        );

        expect(onChange).toHaveBeenCalledWith(2);
    });

    it('reports the next page on a next click', async (): Promise<void> => {
        const onChange: ChangeMock = vi.fn<(page: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Pagination currentPage={3} pageCount={5} onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: 'Go to next page' }));

        expect(onChange).toHaveBeenCalledWith(4);
    });

    it('does not report a click on the current page (D2)', async (): Promise<void> => {
        const onChange: ChangeMock = vi.fn<(page: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Pagination currentPage={3} pageCount={5} onChange={onChange} />);

        const current: HTMLElement = screen.getByRole('button', {
            current: 'page',
        });
        await user.click(current);

        expect(onChange).not.toHaveBeenCalled();
        // D2: unlike Helicon (which disables the current page), this keeps it a
        // real, focusable button - the load-bearing half of the divergence.
        expect(current).toBeEnabled();
    });

    it('ignores a click on a disabled control', async (): Promise<void> => {
        const onChange: ChangeMock = vi.fn<(page: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Pagination currentPage={1} pageCount={5} onChange={onChange} />);

        await user.click(
            screen.getByRole('button', { name: 'Go to previous page' }),
        );

        expect(onChange).not.toHaveBeenCalled();
    });

    it('disables every control and ignores clicks when disabled', async (): Promise<void> => {
        const onChange: ChangeMock = vi.fn<(page: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <Pagination
                currentPage={3}
                pageCount={5}
                onChange={onChange}
                enabled={EEnabledState.Disabled}
            />,
        );

        const pageButton: HTMLElement = screen.getByRole('button', {
            name: 'Go to page 5',
        });
        expect(pageButton).toBeDisabled();

        await user.click(pageButton);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('clamps an out-of-range current page through the model', (): void => {
        render(<Pagination currentPage={99} pageCount={5} />);

        expect(
            screen.getByRole('button', { current: 'page' }),
        ).toHaveAccessibleName('Page 5');
        expect(
            screen.getByRole('button', { name: 'Go to next page' }),
        ).toBeDisabled();
    });

    it('activates a page button with Enter', async (): Promise<void> => {
        const onChange: ChangeMock = vi.fn<(page: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Pagination currentPage={3} pageCount={5} onChange={onChange} />);

        screen.getByRole('button', { name: 'Go to page 5' }).focus();
        await user.keyboard('{Enter}');

        expect(onChange).toHaveBeenCalledWith(5);
    });

    it('activates a page button with Space', async (): Promise<void> => {
        const onChange: ChangeMock = vi.fn<(page: number) => void>();
        const user: UserEvent = userEvent.setup();
        render(<Pagination currentPage={3} pageCount={5} onChange={onChange} />);

        screen.getByRole('button', { name: 'Go to page 1' }).focus();
        await user.keyboard(' ');

        expect(onChange).toHaveBeenCalledWith(1);
    });

    it('applies the tone style to the nav', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(<Pagination currentPage={2} pageCount={5} tone={toneColor} />);

        const nav: HTMLElement = screen.getByRole('navigation');
        expect(nav.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });
});
