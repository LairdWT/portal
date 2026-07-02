import {
    act,
    fireEvent,
    render,
    type RenderResult,
    screen,
} from '@testing-library/react';
import { type ReactElement, type RefObject, useRef } from 'react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    type MockInstance,
    vi,
} from 'vitest';

import { EToastKind, type ToastProviderProps } from './Toast.types';
import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';

function Controls(): ReactElement {
    const { notify, clear }: ReturnType<typeof useToast> = useToast();
    const countRef: RefObject<number> = useRef<number>(0);
    return (
        <div>
            <button
                type="button"
                onClick={(): void => {
                    countRef.current += 1;
                    notify({
                        kind: EToastKind.Info,
                        message: `Toast ${String(countRef.current)}`,
                        durationMs: 4000,
                    });
                }}
            >
                add
            </button>
            <button
                type="button"
                onClick={(): void => {
                    notify({
                        kind: EToastKind.Danger,
                        message: 'Danger toast',
                        durationMs: 0,
                    });
                }}
            >
                add danger
            </button>
            <button type="button" onClick={clear}>
                clear
            </button>
        </div>
    );
}

function renderProvider(props?: Partial<ToastProviderProps>): RenderResult {
    return render(
        <ToastProvider {...props}>
            <Controls />
        </ToastProvider>,
    );
}

beforeEach((): void => {
    vi.useFakeTimers();
});

afterEach((): void => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
});

describe('ToastProvider', (): void => {
    it('renders a card with the notified message', (): void => {
        renderProvider();

        fireEvent.click(screen.getByRole('button', { name: 'add' }));

        expect(screen.getByText('Toast 1')).toBeInTheDocument();
    });

    it('auto-dismisses a toast after its duration', (): void => {
        renderProvider();

        fireEvent.click(screen.getByRole('button', { name: 'add' }));
        expect(screen.getByText('Toast 1')).toBeInTheDocument();

        act((): void => {
            vi.advanceTimersByTime(4000);
        });

        expect(screen.queryByText('Toast 1')).toBeNull();
    });

    it('removes a toast immediately when its dismiss button is pressed', (): void => {
        renderProvider();

        fireEvent.click(screen.getByRole('button', { name: 'add' }));
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

        expect(screen.queryByText('Toast 1')).toBeNull();
    });

    it('uses a labelled region and the per-kind live role', (): void => {
        renderProvider();

        fireEvent.click(screen.getByRole('button', { name: 'add' }));
        fireEvent.click(screen.getByRole('button', { name: 'add danger' }));

        expect(
            screen.getByRole('region', { name: 'Notifications' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Toast 1');
        expect(screen.getByRole('alert')).toHaveTextContent('Danger toast');
    });

    it('stacks notifies in order and trims the oldest beyond max', (): void => {
        renderProvider({ max: 2 });

        const add: HTMLElement = screen.getByRole('button', { name: 'add' });
        fireEvent.click(add);
        fireEvent.click(add);
        fireEvent.click(add);

        expect(screen.queryByText('Toast 1')).toBeNull();
        expect(screen.getByText('Toast 2')).toBeInTheDocument();
        expect(screen.getByText('Toast 3')).toBeInTheDocument();
        expect(screen.getAllByRole('status')).toHaveLength(2);
    });

    it('clears every toast on clear()', (): void => {
        renderProvider();

        const add: HTMLElement = screen.getByRole('button', { name: 'add' });
        fireEvent.click(add);
        fireEvent.click(add);
        fireEvent.click(screen.getByRole('button', { name: 'clear' }));

        expect(screen.queryByRole('status')).toBeNull();
    });

    it('clears outstanding timers on provider unmount', (): void => {
        const clearSpy: MockInstance<typeof window.clearTimeout> = vi.spyOn(
            window,
            'clearTimeout',
        );
        const view: RenderResult = renderProvider();

        fireEvent.click(screen.getByRole('button', { name: 'add' }));
        clearSpy.mockClear();
        view.unmount();

        expect(clearSpy).toHaveBeenCalled();
    });

    // The pointer and focus pause sources are independent: the FIRST to engage
    // banks the auto-dismiss remainder and the timers resume only once BOTH have
    // cleared. These cover both single sources and, critically, the mixed cases
    // where ending one source must not resume while the other still holds.
    describe('auto-dismiss pause sources', (): void => {
        // The 'add' control notifies with this auto-dismiss duration.
        const ADD_DURATION_MS: number = 4000;
        // Time burned before pausing, so the banked remainder (2500ms) is a
        // partial value rather than simply the full duration.
        const ELAPSED_BEFORE_PAUSE_MS: number = 1500;
        const BANKED_REMAINDER_MS: number =
            ADD_DURATION_MS - ELAPSED_BEFORE_PAUSE_MS;

        it('pauses on pointer enter and resumes with the banked remainder on pointer leave', (): void => {
            renderProvider();
            fireEvent.click(screen.getByRole('button', { name: 'add' }));
            const viewport: HTMLElement = screen.getByRole('region', {
                name: 'Notifications',
            });

            act((): void => {
                vi.advanceTimersByTime(ELAPSED_BEFORE_PAUSE_MS);
            });
            fireEvent.pointerOver(viewport);

            // Paused: advancing past the whole duration must not dismiss.
            act((): void => {
                vi.advanceTimersByTime(ADD_DURATION_MS);
            });
            expect(screen.getByText('Toast 1')).toBeInTheDocument();

            // Resumed: the banked remainder runs down, not the full duration.
            fireEvent.pointerOut(viewport, { relatedTarget: document.body });
            act((): void => {
                vi.advanceTimersByTime(BANKED_REMAINDER_MS - 1);
            });
            expect(screen.getByText('Toast 1')).toBeInTheDocument();
            act((): void => {
                vi.advanceTimersByTime(1);
            });
            expect(screen.queryByText('Toast 1')).toBeNull();
        });

        it('pauses on focus and resumes with the banked remainder on blur to outside', (): void => {
            renderProvider();
            fireEvent.click(screen.getByRole('button', { name: 'add' }));

            act((): void => {
                vi.advanceTimersByTime(ELAPSED_BEFORE_PAUSE_MS);
            });
            fireEvent.focusIn(screen.getByRole('button', { name: 'Dismiss' }));

            act((): void => {
                vi.advanceTimersByTime(ADD_DURATION_MS);
            });
            expect(screen.getByText('Toast 1')).toBeInTheDocument();

            fireEvent.focusOut(screen.getByRole('button', { name: 'Dismiss' }), {
                relatedTarget: document.body,
            });
            act((): void => {
                vi.advanceTimersByTime(BANKED_REMAINDER_MS - 1);
            });
            expect(screen.getByText('Toast 1')).toBeInTheDocument();
            act((): void => {
                vi.advanceTimersByTime(1);
            });
            expect(screen.queryByText('Toast 1')).toBeNull();
        });

        it('stays paused when the pointer leaves while focus is still inside, then resumes on blur to outside', (): void => {
            renderProvider();
            fireEvent.click(screen.getByRole('button', { name: 'add' }));
            const viewport: HTMLElement = screen.getByRole('region', {
                name: 'Notifications',
            });

            act((): void => {
                vi.advanceTimersByTime(ELAPSED_BEFORE_PAUSE_MS);
            });
            // Both sources engage: pointer over, then focus lands on a control.
            fireEvent.pointerOver(viewport);
            fireEvent.focusIn(screen.getByRole('button', { name: 'Dismiss' }));

            // Pointer leaves, but focus still holds the stack: must stay paused.
            fireEvent.pointerOut(viewport, { relatedTarget: document.body });
            act((): void => {
                vi.advanceTimersByTime(ADD_DURATION_MS);
            });
            expect(screen.getByText('Toast 1')).toBeInTheDocument();

            // Focus finally leaves to outside: now the banked remainder runs.
            fireEvent.focusOut(screen.getByRole('button', { name: 'Dismiss' }), {
                relatedTarget: document.body,
            });
            act((): void => {
                vi.advanceTimersByTime(BANKED_REMAINDER_MS - 1);
            });
            expect(screen.getByText('Toast 1')).toBeInTheDocument();
            act((): void => {
                vi.advanceTimersByTime(1);
            });
            expect(screen.queryByText('Toast 1')).toBeNull();
        });

        it('stays paused when focus leaves while the pointer is still inside, then resumes on pointer leave', (): void => {
            renderProvider();
            fireEvent.click(screen.getByRole('button', { name: 'add' }));
            const viewport: HTMLElement = screen.getByRole('region', {
                name: 'Notifications',
            });

            act((): void => {
                vi.advanceTimersByTime(ELAPSED_BEFORE_PAUSE_MS);
            });
            // Both sources engage, this time focus first then pointer.
            fireEvent.focusIn(screen.getByRole('button', { name: 'Dismiss' }));
            fireEvent.pointerOver(viewport);

            // Focus leaves to outside, but the pointer still rests over the stack.
            fireEvent.focusOut(screen.getByRole('button', { name: 'Dismiss' }), {
                relatedTarget: document.body,
            });
            act((): void => {
                vi.advanceTimersByTime(ADD_DURATION_MS);
            });
            expect(screen.getByText('Toast 1')).toBeInTheDocument();

            // Pointer finally leaves: the banked remainder runs down.
            fireEvent.pointerOut(viewport, { relatedTarget: document.body });
            act((): void => {
                vi.advanceTimersByTime(BANKED_REMAINDER_MS - 1);
            });
            expect(screen.getByText('Toast 1')).toBeInTheDocument();
            act((): void => {
                vi.advanceTimersByTime(1);
            });
            expect(screen.queryByText('Toast 1')).toBeNull();
        });

        it('does not resume when focus moves between two controls inside the viewport', (): void => {
            renderProvider();
            const add: HTMLElement = screen.getByRole('button', { name: 'add' });
            fireEvent.click(add);
            fireEvent.click(add);

            const dismissButtons: readonly HTMLElement[] = screen.getAllByRole(
                'button',
                { name: 'Dismiss' },
            );
            const firstDismiss: HTMLElement | undefined = dismissButtons[0];
            const secondDismiss: HTMLElement | undefined = dismissButtons[1];
            if (firstDismiss === undefined || secondDismiss === undefined) {
                throw new Error('expected two dismiss buttons in the viewport');
            }

            // Focus enters the first control and pauses the stack.
            fireEvent.focusIn(firstDismiss);
            // Focus moves to the second control INSIDE the viewport: the blur's
            // relatedTarget is contained, so this must not resume the timers.
            fireEvent.focusOut(firstDismiss, { relatedTarget: secondDismiss });
            fireEvent.focusIn(secondDismiss);

            act((): void => {
                vi.advanceTimersByTime(ADD_DURATION_MS * 2);
            });
            expect(screen.getByText('Toast 1')).toBeInTheDocument();
            expect(screen.getByText('Toast 2')).toBeInTheDocument();
        });
    });
});
