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
});
