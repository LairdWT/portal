import { fireEvent, render, screen } from '@testing-library/react';
import { type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { LogConsole } from './LogConsole';
import { ELogSeverity, type LogEntry } from './LogConsole.types';

// jsdom has no layout: after the hook's first live measurement the viewport
// height reads 0, so the rendered window is exactly the overscan band (4).
const JSDOM_WINDOW_ROWS: number = 4;

function buildEntries(count: number): readonly LogEntry[] {
    return Array.from({ length: count }, (_unused: unknown, index: number) => ({
        id: `entry-${String(index)}`,
        message: `line-${String(index)}`,
        timeLabel: `T+${String(index)}`,
    }));
}

// Stub scroll geometry on the viewport (jsdom has no layout): 30 rows of 24px
// content in a 336px (14-row) viewport.
function stubScrollGeometry(viewport: HTMLElement): void {
    Object.defineProperty(viewport, 'scrollHeight', {
        configurable: true,
        value: 720,
    });
    Object.defineProperty(viewport, 'clientHeight', {
        configurable: true,
        value: 336,
    });
}

describe('LogConsole', (): void => {
    it('renders the named log viewport and only the windowed rows', (): void => {
        render(<LogConsole label="Mission log" entries={buildEntries(30)} />);
        expect(screen.getByRole('log', { name: 'Mission log' })).toHaveAttribute(
            'aria-live',
            'off',
        );
        expect(screen.getByText('line-0')).toBeInTheDocument();
        expect(
            screen.getByText(`line-${String(JSDOM_WINDOW_ROWS - 1)}`),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(`line-${String(JSDOM_WINDOW_ROWS)}`),
        ).not.toBeInTheDocument();
    });

    it('keys severity onto the row', (): void => {
        const entries: readonly LogEntry[] = [
            { id: 'a', message: 'core stable', severity: ELogSeverity.Info },
            { id: 'b', message: 'coolant low', severity: ELogSeverity.Warning },
            { id: 'c', message: 'core breach', severity: ELogSeverity.Error },
        ];
        const view: { container: HTMLElement } = render(
            <LogConsole label="Mission log" entries={entries} />,
        );
        expect(
            view.container.querySelector('[data-severity="warning"]'),
        ).not.toBeNull();
        expect(
            view.container.querySelector('[data-severity="error"]'),
        ).not.toBeNull();
    });

    it('follows the tail by default and unpins/repins from scrolling', (): void => {
        render(<LogConsole label="Mission log" entries={buildEntries(30)} />);
        const follow: HTMLElement = screen.getByRole('button', {
            name: 'Follow tail',
        });
        expect(follow).toHaveAttribute('aria-pressed', 'true');
        const viewport: HTMLElement = screen.getByRole('log');
        stubScrollGeometry(viewport);
        // Scroll away from the bottom: 720 - 100 - 336 = 284px of tail left.
        viewport.scrollTop = 100;
        fireEvent.scroll(viewport);
        expect(follow).toHaveAttribute('aria-pressed', 'false');
        // Land back on the bottom edge: distance 0 re-pins.
        viewport.scrollTop = 384;
        fireEvent.scroll(viewport);
        expect(follow).toHaveAttribute('aria-pressed', 'true');
    });

    it('toggles the pin from the follow button', (): void => {
        render(<LogConsole label="Mission log" entries={buildEntries(5)} />);
        const follow: HTMLElement = screen.getByRole('button', {
            name: 'Follow tail',
        });
        fireEvent.click(follow);
        expect(follow).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(follow);
        expect(follow).toHaveAttribute('aria-pressed', 'true');
    });

    it('windows wrapped rows on the measured path', (): void => {
        // jsdom reports zero row heights, which the measured hook ignores:
        // the estimate drives the window, so wrap mode shows the same
        // overscan band as the uniform path.
        render(
            <LogConsole
                label="Mission log"
                entries={buildEntries(30)}
                wrap={true}
            />,
        );
        expect(
            screen.getByRole('log', { name: 'Mission log' }),
        ).toBeInTheDocument();
        expect(screen.getByText('line-0')).toBeInTheDocument();
        expect(
            screen.getByText(`line-${String(JSDOM_WINDOW_ROWS - 1)}`),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(`line-${String(JSDOM_WINDOW_ROWS)}`),
        ).not.toBeInTheDocument();
    });

    it('keeps follow-tail and the announcer under wrap', (): void => {
        const initial: readonly LogEntry[] = buildEntries(30);
        const view: {
            rerender: (element: ReactElement) => void;
        } = render(
            <LogConsole label="Mission log" entries={initial} wrap={true} />,
        );
        const follow: HTMLElement = screen.getByRole('button', {
            name: 'Follow tail',
        });
        expect(follow).toHaveAttribute('aria-pressed', 'true');
        const grown: readonly LogEntry[] = [
            ...initial,
            { id: 'breach', message: 'reactor breach detected' },
        ];
        view.rerender(
            <LogConsole label="Mission log" entries={grown} wrap={true} />,
        );
        expect(screen.getByText('reactor breach detected')).toBeInTheDocument();
    });

    it('announces only the latest appended entry', (): void => {
        const initial: readonly LogEntry[] = buildEntries(30);
        const view: {
            rerender: (element: ReactElement) => void;
        } = render(<LogConsole label="Mission log" entries={initial} />);
        const grown: readonly LogEntry[] = [
            ...initial,
            { id: 'breach', message: 'reactor breach detected' },
        ];
        view.rerender(<LogConsole label="Mission log" entries={grown} />);
        // Row 31 sits outside the fallback window, so the text can only come
        // from the polite announcer.
        expect(screen.getByText('reactor breach detected')).toBeInTheDocument();
    });
});

describe('LogConsole resizable time column', (): void => {
    it('renders the boundary separator with the clamped width value', (): void => {
        render(
            <LogConsole
                label="Mission log"
                entries={buildEntries(10)}
                resizableTime
            />,
        );
        const grip: HTMLElement = screen.getByRole('separator', {
            name: 'Resize time column',
        });
        expect(grip).toHaveAttribute('aria-valuemin', '48');
        expect(grip).toHaveAttribute('aria-valuemax', '320');
        expect(grip).toHaveAttribute('aria-valuenow', '96');
        expect(grip).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('steps and clamps the width from the keyboard', (): void => {
        render(
            <LogConsole
                label="Mission log"
                entries={buildEntries(10)}
                resizableTime
            />,
        );
        const grip: HTMLElement = screen.getByRole('separator');
        fireEvent.keyDown(grip, { key: 'ArrowRight' });
        expect(grip).toHaveAttribute('aria-valuenow', '104');
        fireEvent.keyDown(grip, { key: 'ArrowLeft' });
        expect(grip).toHaveAttribute('aria-valuenow', '96');
        fireEvent.keyDown(grip, { key: 'Home' });
        expect(grip).toHaveAttribute('aria-valuenow', '48');
        fireEvent.keyDown(grip, { key: 'ArrowLeft' });
        expect(grip).toHaveAttribute('aria-valuenow', '48');
        fireEvent.keyDown(grip, { key: 'End' });
        expect(grip).toHaveAttribute('aria-valuenow', '320');
    });

    it('reports a controlled width through the change callback', (): void => {
        const widths: number[] = [];
        render(
            <LogConsole
                label="Mission log"
                entries={buildEntries(10)}
                resizableTime
                timeColumnWidth={120}
                onTimeColumnWidthChange={(width: number): void => {
                    widths.push(width);
                }}
            />,
        );
        const grip: HTMLElement = screen.getByRole('separator');
        expect(grip).toHaveAttribute('aria-valuenow', '120');
        fireEvent.keyDown(grip, { key: 'ArrowRight' });
        expect(widths).toEqual([128]);
        // Controlled: the value follows the prop, not internal state.
        expect(grip).toHaveAttribute('aria-valuenow', '120');
    });

    it('drives the shared row template through the custom property', (): void => {
        const view: { container: HTMLElement } = render(
            <LogConsole
                label="Mission log"
                entries={buildEntries(5)}
                resizableTime
            />,
        );
        const root: Element | null = view.container.querySelector('section');
        if (!(root instanceof HTMLElement)) {
            throw new Error('missing console root');
        }
        expect(root.style.getPropertyValue('--portal-logconsole-time-width')).toBe(
            '96px',
        );
    });
});

describe('LogConsole fill mode', (): void => {
    it('marks the root so a definite-height parent can be filled', (): void => {
        const view: { container: HTMLElement } = render(
            <LogConsole label="Mission log" entries={buildEntries(5)} fill />,
        );
        const root: Element | null = view.container.querySelector('section');
        expect(root).toHaveAttribute('data-fill', 'true');
        // No inline height: the flexed shell owns the viewport size.
        const viewport: HTMLElement = screen.getByRole('log');
        expect(viewport.style.blockSize).toBe('');
    });
});
