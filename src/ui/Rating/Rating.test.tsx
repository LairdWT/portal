import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { type ReactElement } from 'react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { Rating } from './Rating';
import { type ERatingMarkState } from './Rating.types';

// Rating is controlled; tests that do not assert the report pass this inert
// handler as an explicit (now-optional) onChange so the controlled value is held
// steady without exercising the read-only-display path covered separately.
function noop(): void {
    // Intentionally empty: the controlled value is not advanced in these cases.
}

// Programmatic focus triggers the focus-preview state update, so wrap it in act to
// keep the update inside React's batching (the sync act overload returns void).
function focusMark(mark: HTMLElement): void {
    act((): void => {
        mark.focus();
    });
}

describe('Rating', (): void => {
    describe('interactive', (): void => {
        it('renders a radiogroup named by label with one radio per mark', (): void => {
            render(<Rating value={3} label="Rating" onChange={noop} />);

            expect(
                screen.getByRole('radiogroup', { name: 'Rating' }),
            ).toBeInTheDocument();
            expect(screen.getAllByRole('radio')).toHaveLength(5);
            expect(
                screen.getByRole('radio', { name: '3 of 5' }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole('radio', { name: '1 of 5' }),
            ).toBeInTheDocument();
        });

        it('renders an interactive value with no onChange as a read-only display', async (): Promise<void> => {
            // onChange is optional: a controlled value with no handler is a
            // legitimate read-only display, and activating a mark must not throw.
            const user: UserEvent = userEvent.setup();
            render(<Rating value={3} max={5} label="Rating" />);

            const group: HTMLElement = screen.getByRole('radiogroup', {
                name: 'Rating',
            });
            expect(group).toBeInTheDocument();

            await user.click(screen.getByRole('radio', { name: '5 of 5' }));
            // The value is consumer-owned and stays put with no handler wired.
            expect(
                screen.getByRole('radio', { name: '3 of 5', checked: true }),
            ).toBeInTheDocument();
        });

        it('names the radiogroup through labelledBy without an aria-label', (): void => {
            render(
                <>
                    <span id="rating-heading">Difficulty</span>
                    <Rating value={3} labelledBy="rating-heading" onChange={noop} />
                </>,
            );

            const group: HTMLElement = screen.getByRole('radiogroup', {
                name: 'Difficulty',
            });
            expect(group).toHaveAttribute('aria-labelledby', 'rating-heading');
            expect(group).not.toHaveAttribute('aria-label');
        });

        it('tracks the controlled value through aria-checked', (): void => {
            render(<Rating value={3} max={5} label="Rating" onChange={noop} />);

            expect(
                screen.getByRole('radio', { name: '3 of 5', checked: true }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole('radio', { name: '2 of 5', checked: false }),
            ).toBeInTheDocument();
        });

        it('leaves nothing checked when unrated but keeps mark 1 as the roving target', (): void => {
            render(<Rating value={0} max={5} label="Rating" onChange={noop} />);

            expect(
                screen.queryByRole('radio', { checked: true }),
            ).not.toBeInTheDocument();
            expect(screen.getByRole('radio', { name: '1 of 5' })).toHaveAttribute(
                'tabindex',
                '0',
            );
        });

        it('applies roving tabindex with the selected mark focusable', (): void => {
            render(<Rating value={3} max={5} label="Rating" onChange={noop} />);

            expect(screen.getByRole('radio', { name: '3 of 5' })).toHaveAttribute(
                'tabindex',
                '0',
            );
            expect(screen.getByRole('radio', { name: '1 of 5' })).toHaveAttribute(
                'tabindex',
                '-1',
            );
            expect(screen.getByRole('radio', { name: '5 of 5' })).toHaveAttribute(
                'tabindex',
                '-1',
            );
        });

        it('reflects filled versus empty through data-state for the committed value', (): void => {
            render(<Rating value={2} max={5} label="Rating" onChange={noop} />);

            expect(screen.getByRole('radio', { name: '1 of 5' })).toHaveAttribute(
                'data-state',
                'filled',
            );
            expect(screen.getByRole('radio', { name: '2 of 5' })).toHaveAttribute(
                'data-state',
                'filled',
            );
            expect(screen.getByRole('radio', { name: '3 of 5' })).toHaveAttribute(
                'data-state',
                'empty',
            );
        });

        it('calls onChange with the one-based count on click', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(<Rating value={2} max={5} label="Rating" onChange={onChange} />);

            await user.click(screen.getByRole('radio', { name: '4 of 5' }));

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(4);
        });

        it('reports the same count when re-clicking the active mark without allowClear', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(<Rating value={3} max={5} label="Rating" onChange={onChange} />);

            await user.click(screen.getByRole('radio', { name: '3 of 5' }));

            expect(onChange).toHaveBeenCalledWith(3);
        });

        it('reports 0 when re-activating the active mark with allowClear', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(
                <Rating
                    value={3}
                    max={5}
                    label="Rating"
                    allowClear
                    onChange={onChange}
                />,
            );

            await user.click(screen.getByRole('radio', { name: '3 of 5' }));

            expect(onChange).toHaveBeenCalledWith(0);
        });

        it('increments and clamps at max on ArrowRight', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(<Rating value={2} max={5} label="Rating" onChange={onChange} />);

            focusMark(screen.getByRole('radio', { name: '2 of 5' }));
            await user.keyboard('{ArrowRight}');
            expect(onChange).toHaveBeenLastCalledWith(3);

            focusMark(screen.getByRole('radio', { name: '5 of 5' }));
            await user.keyboard('{ArrowRight}');
            expect(onChange).toHaveBeenLastCalledWith(5);
        });

        it('increments on ArrowUp', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(<Rating value={2} max={5} label="Rating" onChange={onChange} />);

            focusMark(screen.getByRole('radio', { name: '2 of 5' }));
            await user.keyboard('{ArrowUp}');

            expect(onChange).toHaveBeenLastCalledWith(3);
        });

        it('decrements and clamps at 1 on ArrowLeft without allowClear', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(<Rating value={2} max={5} label="Rating" onChange={onChange} />);

            focusMark(screen.getByRole('radio', { name: '2 of 5' }));
            await user.keyboard('{ArrowLeft}');
            expect(onChange).toHaveBeenLastCalledWith(1);

            focusMark(screen.getByRole('radio', { name: '1 of 5' }));
            await user.keyboard('{ArrowLeft}');
            expect(onChange).toHaveBeenLastCalledWith(1);
        });

        it('decrements to 0 on ArrowDown when allowClear is set', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(
                <Rating
                    value={1}
                    max={5}
                    label="Rating"
                    allowClear
                    onChange={onChange}
                />,
            );

            focusMark(screen.getByRole('radio', { name: '1 of 5' }));
            await user.keyboard('{ArrowDown}');

            expect(onChange).toHaveBeenLastCalledWith(0);
        });

        it('keeps the value at max on ArrowRight with allowClear (no nav toggle-clear)', async (): Promise<void> => {
            // Clamped navigation routes through select with the clamped value; with
            // allowClear set, value=max focus on the last mark, ArrowRight clamps to
            // max again. That must COMMIT max, never toggle-clear to 0 (the contract
            // restricts clearing to direct re-activation or arrowing below 1).
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(
                <Rating
                    value={5}
                    max={5}
                    label="Rating"
                    allowClear
                    onChange={onChange}
                />,
            );

            focusMark(screen.getByRole('radio', { name: '5 of 5' }));
            await user.keyboard('{ArrowRight}');

            expect(onChange).toHaveBeenLastCalledWith(5);
            expect(onChange).not.toHaveBeenCalledWith(0);
        });

        it('keeps the value at max on ArrowUp with allowClear (no nav toggle-clear)', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(
                <Rating
                    value={5}
                    max={5}
                    label="Rating"
                    allowClear
                    onChange={onChange}
                />,
            );

            focusMark(screen.getByRole('radio', { name: '5 of 5' }));
            await user.keyboard('{ArrowUp}');

            expect(onChange).toHaveBeenLastCalledWith(5);
            expect(onChange).not.toHaveBeenCalledWith(0);
        });

        it('keeps the value at max on End with allowClear (no nav toggle-clear)', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(
                <Rating
                    value={5}
                    max={5}
                    label="Rating"
                    allowClear
                    onChange={onChange}
                />,
            );

            focusMark(screen.getByRole('radio', { name: '5 of 5' }));
            await user.keyboard('{End}');

            expect(onChange).toHaveBeenLastCalledWith(5);
            expect(onChange).not.toHaveBeenCalledWith(0);
        });

        it('keeps the value at 1 on Home with allowClear (no nav toggle-clear)', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(
                <Rating
                    value={1}
                    max={5}
                    label="Rating"
                    allowClear
                    onChange={onChange}
                />,
            );

            focusMark(screen.getByRole('radio', { name: '1 of 5' }));
            await user.keyboard('{Home}');

            expect(onChange).toHaveBeenLastCalledWith(1);
            expect(onChange).not.toHaveBeenCalledWith(0);
        });

        it('jumps to the first and last mark on Home and End', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(<Rating value={3} max={5} label="Rating" onChange={onChange} />);

            focusMark(screen.getByRole('radio', { name: '3 of 5' }));
            await user.keyboard('{End}');
            expect(onChange).toHaveBeenLastCalledWith(5);

            await user.keyboard('{Home}');
            expect(onChange).toHaveBeenLastCalledWith(1);
        });

        it('selects the focused mark on Enter and Space', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(<Rating value={0} max={5} label="Rating" onChange={onChange} />);

            focusMark(screen.getByRole('radio', { name: '3 of 5' }));
            await user.keyboard('{Enter}');
            expect(onChange).toHaveBeenLastCalledWith(3);

            focusMark(screen.getByRole('radio', { name: '4 of 5' }));
            await user.keyboard(' ');
            expect(onChange).toHaveBeenLastCalledWith(4);
        });

        it('previews via focus and clears on blur without committing', (): void => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            render(<Rating value={2} max={5} label="Rating" onChange={onChange} />);

            const mark4: HTMLElement = screen.getByRole('radio', {
                name: '4 of 5',
            });
            fireEvent.focusIn(mark4);

            // Preview is additive ABOVE the committed run: the committed marks (1, 2)
            // stay solid Filled while the provisional marks (3, 4) read as preview.
            expect(mark4).toHaveAttribute('data-state', 'preview');
            expect(screen.getByRole('radio', { name: '3 of 5' })).toHaveAttribute(
                'data-state',
                'preview',
            );
            expect(screen.getByRole('radio', { name: '1 of 5' })).toHaveAttribute(
                'data-state',
                'filled',
            );
            expect(screen.getByRole('radio', { name: '2 of 5' })).toHaveAttribute(
                'data-state',
                'filled',
            );
            expect(screen.getByRole('radio', { name: '5 of 5' })).toHaveAttribute(
                'data-state',
                'empty',
            );
            expect(onChange).not.toHaveBeenCalled();
            expect(
                screen.getByRole('radio', { name: '2 of 5', checked: true }),
            ).toBeInTheDocument();

            fireEvent.focusOut(mark4);

            expect(mark4).toHaveAttribute('data-state', 'empty');
            expect(screen.getByRole('radio', { name: '2 of 5' })).toHaveAttribute(
                'data-state',
                'filled',
            );
        });

        it('previews via pointer enter and clears on pointer leave', (): void => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            render(<Rating value={2} max={5} label="Rating" onChange={onChange} />);

            const mark4: HTMLElement = screen.getByRole('radio', {
                name: '4 of 5',
            });
            fireEvent.pointerOver(mark4);

            expect(mark4).toHaveAttribute('data-state', 'preview');
            expect(onChange).not.toHaveBeenCalled();
            expect(
                screen.getByRole('radio', { name: '2 of 5', checked: true }),
            ).toBeInTheDocument();

            fireEvent.pointerOut(screen.getByRole('radiogroup'), {
                relatedTarget: document.body,
            });

            expect(mark4).toHaveAttribute('data-state', 'empty');
        });

        it('does not change when disabled', async (): Promise<void> => {
            const onChange: Mock<(next: number) => void> =
                vi.fn<(next: number) => void>();
            const user: UserEvent = userEvent.setup();
            render(
                <Rating
                    value={2}
                    max={5}
                    label="Rating"
                    enabled={EEnabledState.Disabled}
                    onChange={onChange}
                />,
            );

            const mark4: HTMLElement = screen.getByRole('radio', {
                name: '4 of 5',
            });
            expect(mark4).toBeDisabled();

            await user.click(mark4);
            expect(onChange).not.toHaveBeenCalled();

            // fireEvent reaches the handler directly; the disabled guard in
            // handleKeyDown returns before any selection occurs.
            fireEvent.keyDown(screen.getByRole('radio', { name: '2 of 5' }), {
                key: 'ArrowRight',
            });
            expect(onChange).not.toHaveBeenCalled();
        });

        it('applies the tone seed custom property to the root', (): void => {
            render(
                <Rating
                    value={3}
                    max={5}
                    label="Rating"
                    tone="oklch(0.7 0.18 25)"
                    onChange={noop}
                />,
            );

            const group: HTMLElement = screen.getByRole('radiogroup');
            expect(group.style.getPropertyValue('--portal-tone')).toBe(
                'oklch(0.7 0.18 25)',
            );
        });

        it('renders a custom interactive mark node with the resolved state and index', (): void => {
            render(
                <Rating
                    value={2}
                    max={3}
                    label="Rating"
                    onChange={noop}
                    renderMark={(
                        state: ERatingMarkState,
                        index: number,
                    ): ReactElement => (
                        <span
                            data-testid={`mark-${String(index)}`}
                            data-mark-state={state}
                        />
                    )}
                />,
            );

            expect(screen.getByTestId('mark-0')).toHaveAttribute(
                'data-mark-state',
                'filled',
            );
            expect(screen.getByTestId('mark-1')).toHaveAttribute(
                'data-mark-state',
                'filled',
            );
            expect(screen.getByTestId('mark-2')).toHaveAttribute(
                'data-mark-state',
                'empty',
            );
        });

        it('reflects a custom formatMarkLabel in each radio accessible name', (): void => {
            render(
                <Rating
                    value={2}
                    max={3}
                    label="Rating"
                    onChange={noop}
                    formatMarkLabel={(count: number, total: number): string =>
                        `star ${String(count)} of ${String(total)}`
                    }
                />,
            );

            expect(
                screen.getByRole('radio', { name: 'star 1 of 3' }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole('radio', { name: 'star 3 of 3' }),
            ).toBeInTheDocument();
        });

        it('floors max at one mark when max is zero', (): void => {
            render(<Rating value={0} max={0} label="Rating" onChange={noop} />);

            expect(screen.getAllByRole('radio')).toHaveLength(1);
        });

        it('clamps an interactive value above max to the last mark', (): void => {
            render(<Rating value={9} max={5} label="Rating" onChange={noop} />);

            expect(
                screen.getByRole('radio', { name: '5 of 5', checked: true }),
            ).toBeInTheDocument();
        });
    });

    describe('readonly', (): void => {
        it('renders a role=img with the formatted whole-value label and no controls', (): void => {
            render(<Rating readOnly value={4} max={5} />);

            const image: HTMLElement = screen.getByRole('img', {
                name: 'Rated 4 of 5',
            });
            expect(image).toBeInTheDocument();
            expect(image).not.toHaveAttribute('tabindex');
            expect(screen.queryByRole('radio')).not.toBeInTheDocument();
            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });

        it('clamps the value to max in the label', (): void => {
            render(<Rating readOnly value={7} max={5} />);

            expect(
                screen.getByRole('img', { name: 'Rated 5 of 5' }),
            ).toBeInTheDocument();
        });

        it('renders a fractional value as a clipped partial pip', (): void => {
            render(<Rating readOnly value={3.5} max={5} />);

            expect(
                screen.getByRole('img', { name: 'Rated 3.5 of 5' }),
            ).toBeInTheDocument();

            const partialPip: Element | null = document.querySelector(
                "[data-state='partial']",
            );
            expect(partialPip).toBeInstanceOf(HTMLElement);
            if (!(partialPip instanceof HTMLElement)) {
                throw new Error('expected a partial pip');
            }
            expect(partialPip.style.getPropertyValue('--portal-rating-fill')).toBe(
                '0.5',
            );
        });

        it('renders a custom readonly mark node, including the partial state', (): void => {
            render(
                <Rating
                    readOnly
                    value={1.5}
                    max={3}
                    renderMark={(
                        state: ERatingMarkState,
                        index: number,
                    ): ReactElement => (
                        <span
                            data-testid={`ro-${String(index)}`}
                            data-mark-state={state}
                        />
                    )}
                />,
            );

            expect(screen.getByTestId('ro-0')).toHaveAttribute(
                'data-mark-state',
                'filled',
            );
            expect(screen.getByTestId('ro-1')).toHaveAttribute(
                'data-mark-state',
                'partial',
            );
            expect(screen.getByTestId('ro-2')).toHaveAttribute(
                'data-mark-state',
                'empty',
            );
        });

        it('reflects a custom formatValueLabel in the readonly accessible name', (): void => {
            render(
                <Rating
                    readOnly
                    value={2}
                    max={3}
                    formatValueLabel={(value: number, total: number): string =>
                        `score ${String(value)}/${String(total)}`
                    }
                />,
            );

            expect(
                screen.getByRole('img', { name: 'score 2/3' }),
            ).toBeInTheDocument();
        });
    });
});
