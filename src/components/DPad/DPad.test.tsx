import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    afterAll,
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    type Mock,
    vi,
} from 'vitest';

import {
    EInputInteraction,
    EInputValueType,
    type InputDescriptor,
    type InputSignal,
    toWireInput,
} from '../../input';
import { EEnabledState } from '../../state/state';
import { DPad } from './DPad';
import { EDpadDirection, EDpadMode } from './DPad.types';

const PAD_LABEL: string = 'Direction';
const ACTIVE_POINTER_ID: number = 11;

// A Digital pad descriptor mirrors the DPad story: onSignal + descriptor opt the
// control into the framework signal path.
const PAD_DESCRIPTOR: InputDescriptor = {
    id: 'pad',
    kind: EInputValueType.Digital,
    label: 'Direction pad',
};

// The pad surface is the first child of the labelled group (a presentation div
// that owns the pointer handlers).
function getSurface(): Element {
    const group: HTMLElement = screen.getByRole('group', { name: PAD_LABEL });
    const surface: Element | null = group.firstElementChild;
    if (surface === null) {
        throw new Error('Expected a pointer surface element.');
    }
    return surface;
}

const PAD_RECT: DOMRect = {
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    left: 0,
    top: 0,
    right: 200,
    bottom: 200,
    toJSON: (): Record<string, never> => ({}),
};

// jsdom does not define the pointer-capture methods; the pointer hook calls
// them on down and up. Define no-op stubs as configurable own properties so
// they can be removed after the suite.
function definePointerCaptureStubs(): void {
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
        configurable: true,
        value: (): void => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
        configurable: true,
        value: (): void => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
        configurable: true,
        value: (): boolean => true,
    });
}

function removePointerCaptureStubs(): void {
    delete (HTMLElement.prototype as Partial<HTMLElement>).setPointerCapture;
    delete (HTMLElement.prototype as Partial<HTMLElement>).releasePointerCapture;
    delete (HTMLElement.prototype as Partial<HTMLElement>).hasPointerCapture;
}

beforeEach((): void => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
        (): DOMRect => PAD_RECT,
    );
    definePointerCaptureStubs();
});

afterEach((): void => {
    vi.restoreAllMocks();
});

// The pointer-capture stubs are removed once, after the whole file, rather than
// per test: a test may leave a gesture active (pointerdown with no pointerup), so
// usePointerControl's unmount cleanup releases the capture during React Testing
// Library's auto-cleanup, which runs AFTER this file's afterEach. Deleting the
// stubs per test would race that cleanup and strip hasPointerCapture before it
// runs. Vitest isolates jsdom per file, so the stubs do not leak across files.
afterAll((): void => {
    removePointerCaptureStubs();
});

describe('DPad', () => {
    it('exposes a labelled group of direction buttons', () => {
        render(<DPad label={PAD_LABEL} mode={EDpadMode.EightWay} />);

        const group: HTMLElement = screen.getByRole('group', {
            name: PAD_LABEL,
        });
        expect(group).toBeInTheDocument();

        const buttons: HTMLElement[] = screen.getAllByRole('button');
        expect(buttons).toHaveLength(8);
    });

    it('renders only the four cardinals in FourWay mode', () => {
        render(<DPad label={PAD_LABEL} mode={EDpadMode.FourWay} />);

        const buttons: HTMLElement[] = screen.getAllByRole('button');
        expect(buttons).toHaveLength(4);
        expect(
            screen.queryByRole('button', { name: 'Up and left' }),
        ).not.toBeInTheDocument();
    });

    it('momentarily presses a direction on Enter and releases on key up', async () => {
        const onDirectionChange: Mock<(direction: EDpadDirection) => void> =
            vi.fn<(direction: EDpadDirection) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.FourWay}
                onDirectionChange={onDirectionChange}
            />,
        );

        const upButton: HTMLElement = screen.getByRole('button', { name: 'Up' });
        expect(upButton).toHaveAttribute('aria-pressed', 'false');

        upButton.focus();
        await user.keyboard('{Enter>}');
        expect(upButton).toHaveAttribute('aria-pressed', 'true');
        expect(onDirectionChange).toHaveBeenLastCalledWith(EDpadDirection.Up);

        await user.keyboard('{/Enter}');
        expect(upButton).toHaveAttribute('aria-pressed', 'false');
        expect(onDirectionChange).toHaveBeenLastCalledWith(EDpadDirection.None);
    });

    it('returns to None when focus leaves the group', async () => {
        const onDirectionChange: Mock<(direction: EDpadDirection) => void> =
            vi.fn<(direction: EDpadDirection) => void>();
        const user: UserEvent = userEvent.setup();
        render(
            <>
                <DPad
                    label={PAD_LABEL}
                    mode={EDpadMode.FourWay}
                    onDirectionChange={onDirectionChange}
                />
                <button type="button">Outside</button>
            </>,
        );

        const rightButton: HTMLElement = screen.getByRole('button', {
            name: 'Right',
        });
        rightButton.focus();
        await user.keyboard('{Enter>}');
        expect(rightButton).toHaveAttribute('aria-pressed', 'true');

        const outside: HTMLElement = screen.getByRole('button', {
            name: 'Outside',
        });
        // Moving focus out of the group updates state via the blur handler;
        // wrap the focus change so React flushes the update before asserting.
        act((): void => {
            outside.focus();
        });
        expect(rightButton).toHaveAttribute('aria-pressed', 'false');
        expect(onDirectionChange).toHaveBeenLastCalledWith(EDpadDirection.None);
    });

    it('still resolves a direction from a pointer gesture on the pad surface', () => {
        const onDirectionChange: Mock<(direction: EDpadDirection) => void> =
            vi.fn<(direction: EDpadDirection) => void>();
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.EightWay}
                onDirectionChange={onDirectionChange}
            />,
        );

        const group: HTMLElement = screen.getByRole('group', {
            name: PAD_LABEL,
        });
        const surface: Element | null = group.firstElementChild;
        if (surface === null) {
            throw new Error('Expected a pointer surface element.');
        }

        // Pointer to the right edge centre resolves to Right via the octant math.
        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 100,
        });

        expect(onDirectionChange).toHaveBeenLastCalledWith(EDpadDirection.Right);

        fireEvent.pointerUp(surface, { pointerId: ACTIVE_POINTER_ID });
        expect(onDirectionChange).toHaveBeenLastCalledWith(EDpadDirection.None);
    });

    it('ignores a secondary-button pointer gesture when primaryButtonOnly is set', () => {
        const onDirectionChange: Mock<(direction: EDpadDirection) => void> =
            vi.fn<(direction: EDpadDirection) => void>();
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.EightWay}
                onDirectionChange={onDirectionChange}
                primaryButtonOnly
            />,
        );

        const group: HTMLElement = screen.getByRole('group', {
            name: PAD_LABEL,
        });
        const surface: Element | null = group.firstElementChild;
        if (surface === null) {
            throw new Error('Expected a pointer surface element.');
        }

        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            button: 2,
            clientX: 200,
            clientY: 100,
        });

        expect(onDirectionChange).not.toHaveBeenCalled();
    });

    it('still resolves a secondary-button pointer gesture by default (primaryButtonOnly unset)', () => {
        const onDirectionChange: Mock<(direction: EDpadDirection) => void> =
            vi.fn<(direction: EDpadDirection) => void>();
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.EightWay}
                onDirectionChange={onDirectionChange}
            />,
        );

        const group: HTMLElement = screen.getByRole('group', {
            name: PAD_LABEL,
        });
        const surface: Element | null = group.firstElementChild;
        if (surface === null) {
            throw new Error('Expected a pointer surface element.');
        }

        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            button: 2,
            clientX: 200,
            clientY: 100,
        });

        expect(onDirectionChange).toHaveBeenLastCalledWith(EDpadDirection.Right);
    });

    it('does not resolve a pointer gesture when disabled', () => {
        const onDirectionChange: Mock<(direction: EDpadDirection) => void> =
            vi.fn<(direction: EDpadDirection) => void>();
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.EightWay}
                enabled={EEnabledState.Disabled}
                onDirectionChange={onDirectionChange}
            />,
        );

        const group: HTMLElement = screen.getByRole('group', {
            name: PAD_LABEL,
        });
        const surface: Element | null = group.firstElementChild;
        if (surface === null) {
            throw new Error('Expected a pointer surface element.');
        }

        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 100,
        });

        expect(onDirectionChange).not.toHaveBeenCalled();
    });
});

describe('DPad default onSignal emission (pinning the 1.x wire shape)', () => {
    it('emits a single pad-level Digital signal per transition (press, direction change, release)', () => {
        const signals: InputSignal[] = [];
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.EightWay}
                descriptor={PAD_DESCRIPTOR}
                onSignal={(signal: InputSignal): void => {
                    signals.push(signal);
                }}
            />,
        );
        const surface: Element = getSurface();

        // Press: right-edge centre resolves to Right -> Press, pressed=true.
        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 100,
        });
        // Direction change: slide to the top edge -> Up. The default stream emits
        // Press again (pressed=true) with NO intervening Release.
        fireEvent.pointerMove(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 100,
            clientY: 0,
        });
        // Release: lift the pointer -> None -> Release, pressed=false.
        fireEvent.pointerUp(surface, { pointerId: ACTIVE_POINTER_ID });

        expect(signals).toHaveLength(3);
        // Every default signal carries the bare pad descriptor id (no suffix).
        for (const signal of signals) {
            expect(signal.descriptor.id).toBe('pad');
            expect(signal.value.valueType).toBe(EInputValueType.Digital);
        }
        expect(signals[0]?.interaction).toBe(EInputInteraction.Press);
        expect(signals[0]?.value).toEqual({
            valueType: EInputValueType.Digital,
            pressed: true,
        });
        expect(signals[1]?.interaction).toBe(EInputInteraction.Press);
        expect(signals[1]?.value).toEqual({
            valueType: EInputValueType.Digital,
            pressed: true,
        });
        expect(signals[2]?.interaction).toBe(EInputInteraction.Release);
        expect(signals[2]?.value).toEqual({
            valueType: EInputValueType.Digital,
            pressed: false,
        });
    });
});

describe('DPad directionSignals opt-in stream', () => {
    it('emits ordered per-direction Release-then-Press signals in EightWay', () => {
        const signals: InputSignal[] = [];
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.EightWay}
                descriptor={PAD_DESCRIPTOR}
                onSignal={(signal: InputSignal): void => {
                    signals.push(signal);
                }}
                directionSignals
            />,
        );
        const surface: Element = getSurface();

        // Press Up.
        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 100,
            clientY: 0,
        });
        // Slide Up -> Right: Release(up) then Press(right), in that order.
        fireEvent.pointerMove(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 100,
        });
        // Release: lift -> Release(right).
        fireEvent.pointerUp(surface, { pointerId: ACTIVE_POINTER_ID });

        const summary: readonly { id: string; interaction: EInputInteraction }[] =
            signals.map(
                (
                    signal: InputSignal,
                ): { id: string; interaction: EInputInteraction } => ({
                    id: signal.descriptor.id,
                    interaction: signal.interaction,
                }),
            );
        expect(summary).toEqual([
            { id: 'pad.up', interaction: EInputInteraction.Press },
            { id: 'pad.up', interaction: EInputInteraction.Release },
            { id: 'pad.right', interaction: EInputInteraction.Press },
            { id: 'pad.right', interaction: EInputInteraction.Release },
        ]);
        expect(signals[0]?.value).toEqual({
            valueType: EInputValueType.Digital,
            pressed: true,
        });
        expect(signals[1]?.value).toEqual({
            valueType: EInputValueType.Digital,
            pressed: false,
        });
    });

    it('derives a hyphenated diagonal id from the EDpadDirection member in EightWay', () => {
        const signals: InputSignal[] = [];
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.EightWay}
                descriptor={PAD_DESCRIPTOR}
                onSignal={(signal: InputSignal): void => {
                    signals.push(signal);
                }}
                directionSignals
            />,
        );
        const surface: Element = getSurface();

        // Top-right corner resolves to the UpRight diagonal.
        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 0,
        });

        expect(signals[0]?.descriptor.id).toBe('pad.up-right');
        expect(signals[0]?.interaction).toBe(EInputInteraction.Press);
    });

    it('collapses a diagonal onto a cardinal per-direction id in FourWay', () => {
        const signals: InputSignal[] = [];
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.FourWay}
                descriptor={PAD_DESCRIPTOR}
                onSignal={(signal: InputSignal): void => {
                    signals.push(signal);
                }}
                directionSignals
            />,
        );
        const surface: Element = getSurface();

        // Top-right corner (UpRight) collapses onto the dominant cardinal: a tie
        // favours the horizontal axis, so Right.
        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 200,
            clientY: 0,
        });
        fireEvent.pointerUp(surface, { pointerId: ACTIVE_POINTER_ID });

        const summary: readonly { id: string; interaction: EInputInteraction }[] =
            signals.map(
                (
                    signal: InputSignal,
                ): { id: string; interaction: EInputInteraction } => ({
                    id: signal.descriptor.id,
                    interaction: signal.interaction,
                }),
            );
        expect(summary).toEqual([
            { id: 'pad.right', interaction: EInputInteraction.Press },
            { id: 'pad.right', interaction: EInputInteraction.Release },
        ]);
    });

    it('emits a per-direction signal the wire codec accepts', () => {
        const signals: InputSignal[] = [];
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.EightWay}
                descriptor={PAD_DESCRIPTOR}
                onSignal={(signal: InputSignal): void => {
                    signals.push(signal);
                }}
                directionSignals
            />,
        );
        const surface: Element = getSurface();

        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 100,
            clientY: 0,
        });

        const first: InputSignal | undefined = signals[0];
        expect(first).toBeDefined();
        if (first === undefined) {
            throw new Error('Expected a per-direction signal.');
        }
        // Digital value on a Digital descriptor satisfies isValueForType, so the
        // wire narrowing does not throw and preserves the per-direction id.
        const wire: ReturnType<typeof toWireInput> = toWireInput(first);
        expect(wire.inputId).toBe('pad.up');
        expect(wire.interaction).toBe(EInputInteraction.Press);
        expect(wire.value).toEqual({
            valueType: EInputValueType.Digital,
            pressed: true,
        });
    });
});

describe('DPad dead zone (single, hook-owned)', () => {
    it('resolves a direction from a raw magnitude just above the hook dead zone', () => {
        const onDirectionChange: Mock<(direction: EDpadDirection) => void> =
            vi.fn<(direction: EDpadDirection) => void>();
        render(
            <DPad
                label={PAD_LABEL}
                mode={EDpadMode.EightWay}
                onDirectionChange={onDirectionChange}
            />,
        );
        const surface: Element = getSurface();

        // clientX 125 on the 200px-wide pad is raw magnitude 0.25, just past the
        // hook's 0.2 dead zone. The hook rescales it to ~0.0625; the old
        // compounded guard re-checked that against 0.2 and swallowed it as None.
        fireEvent.pointerDown(surface, {
            pointerId: ACTIVE_POINTER_ID,
            clientX: 125,
            clientY: 100,
        });

        expect(onDirectionChange).toHaveBeenLastCalledWith(EDpadDirection.Right);
    });
});
