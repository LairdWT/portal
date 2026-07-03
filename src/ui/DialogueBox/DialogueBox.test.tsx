import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { DialogueBox } from './DialogueBox';
import { EDialogueVariant } from './DialogueBox.types';

const reducedMotion: { value: boolean } = vi.hoisted(() => ({ value: false }));

vi.mock('../../react/hooks/useReducedMotion', () => ({
    useReducedMotion: (): boolean => reducedMotion.value,
}));

type AdvanceCallback = () => void;

const LINE: string = 'The relay is ours.';

// The revealed run is the paragraph text minus the transparent remainder
// span (when nothing is revealed yet, the paragraph's only content IS that
// span, so reading the first child node would grab the remainder).
function revealedText(container: HTMLElement): string {
    const paragraph: Element | null = container.querySelector('p');
    if (paragraph === null) {
        return '';
    }
    const remainder: string = paragraph.querySelector('span')?.textContent ?? '';
    const whole: string = paragraph.textContent;
    return whole.slice(0, whole.length - remainder.length);
}

beforeEach((): void => {
    reducedMotion.value = false;
    vi.useFakeTimers();
});

afterEach((): void => {
    vi.useRealTimers();
});

describe('DialogueBox', (): void => {
    it('shows the full line immediately with no typewriter', (): void => {
        const view: { container: HTMLElement } = render(
            <DialogueBox label="Dialogue" speaker="Vex" text={LINE} />,
        );
        expect(screen.getByRole('group', { name: 'Dialogue' })).toBeInTheDocument();
        expect(revealedText(view.container)).toBe(LINE);
        expect(screen.getByText('Vex')).toBeInTheDocument();
    });

    it('reveals interval-driven text and completes', (): void => {
        const view: { container: HTMLElement } = render(
            <DialogueBox label="Dialogue" text={LINE} charactersPerSecond={20} />,
        );
        expect(revealedText(view.container)).toBe('');
        act((): void => {
            vi.advanceTimersByTime(250);
        });
        const partial: string = revealedText(view.container);
        expect(partial.length).toBeGreaterThan(0);
        expect(partial.length).toBeLessThan(LINE.length);
        act((): void => {
            vi.advanceTimersByTime(2000);
        });
        expect(revealedText(view.container)).toBe(LINE);
    });

    it('shows the full line at once under reduced motion', (): void => {
        reducedMotion.value = true;
        const view: { container: HTMLElement } = render(
            <DialogueBox label="Dialogue" text={LINE} charactersPerSecond={20} />,
        );
        expect(revealedText(view.container)).toBe(LINE);
    });

    it('announces the complete line regardless of the reveal', (): void => {
        const view: { container: HTMLElement } = render(
            <DialogueBox
                label="Dialogue"
                speaker="Vex"
                text={LINE}
                charactersPerSecond={20}
            />,
        );
        const announcer: Element | null = view.container.querySelector(
            '[aria-live="polite"]',
        );
        expect(announcer?.textContent).toBe(`Vex: ${LINE}`);
    });

    it('completes a running line first, then advances', (): void => {
        const onAdvance: Mock<AdvanceCallback> = vi.fn<AdvanceCallback>();
        const view: { container: HTMLElement } = render(
            <DialogueBox
                label="Dialogue"
                text={LINE}
                charactersPerSecond={20}
                onAdvance={onAdvance}
            />,
        );
        const advance: HTMLElement = screen.getByRole('button', {
            name: 'Continue',
        });
        // Mid-reveal: the first press completes the line.
        fireEvent.click(advance);
        expect(onAdvance).not.toHaveBeenCalled();
        expect(revealedText(view.container)).toBe(LINE);
        // The next press advances.
        fireEvent.click(advance);
        expect(onAdvance).toHaveBeenCalledTimes(1);
    });

    it('restarts the reveal when the line changes', (): void => {
        const view: {
            container: HTMLElement;
            rerender: (ui: Parameters<typeof render>[0]) => void;
        } = render(
            <DialogueBox label="Dialogue" text={LINE} charactersPerSecond={20} />,
        );
        act((): void => {
            vi.advanceTimersByTime(2500);
        });
        expect(revealedText(view.container)).toBe(LINE);
        view.rerender(
            <DialogueBox
                label="Dialogue"
                text="New orders."
                charactersPerSecond={20}
            />,
        );
        expect(revealedText(view.container)).toBe('');
        act((): void => {
            vi.advanceTimersByTime(2000);
        });
        expect(revealedText(view.container)).toBe('New orders.');
    });

    it('renders the subtitle variant without the speaker plate', (): void => {
        const view: { container: HTMLElement } = render(
            <DialogueBox
                label="Subtitles"
                speaker="Vex"
                text={LINE}
                variant={EDialogueVariant.Subtitle}
            />,
        );
        expect(
            view.container.querySelector('[data-variant="subtitle"]'),
        ).not.toBeNull();
        expect(screen.queryByText('Vex')).not.toBeInTheDocument();
    });
});
