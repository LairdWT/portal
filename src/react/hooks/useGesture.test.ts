import { fireEvent, render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import type { TimeProvider } from '../../input';
import { TimeProviderContext } from '../TimeProviderContext';
import { useGesture } from './useGesture';
import {
    type EGesture,
    EGesture as EGestureValue,
    type GestureBinding,
    type GestureListener,
} from './useGesture.types';

type GestureSurfaceProps = Readonly<{
    onGesture: GestureListener;
    doubleTapWindowMs: number;
}>;

const SURFACE_TEST_ID: string = 'gesture-surface';

function GestureSurface({
    onGesture,
    doubleTapWindowMs,
}: GestureSurfaceProps): ReactElement {
    const binding: GestureBinding<HTMLDivElement> = useGesture<HTMLDivElement>({
        onGesture,
        doubleTapWindowMs,
    });
    return createElement('div', {
        'data-testid': SURFACE_TEST_ID,
        onPointerDown: binding.onPointerDown,
        onPointerUp: binding.onPointerUp,
        onPointerCancel: binding.onPointerCancel,
    });
}

describe('useGesture', (): void => {
    it('resolves double-tap timing from the injected TimeProvider', (): void => {
        let currentTimeMs: number = 0;
        const timeProvider: TimeProvider = (): number => currentTimeMs;

        const recognized: EGesture[] = [];
        const onGesture: GestureListener = (gesture: EGesture): void => {
            recognized.push(gesture);
        };

        const view: RenderResult = render(
            createElement(
                TimeProviderContext.Provider,
                { value: timeProvider },
                createElement(GestureSurface, {
                    onGesture,
                    doubleTapWindowMs: 100,
                }),
            ),
        );

        const surface: HTMLElement = view.getByTestId(SURFACE_TEST_ID);

        const tap: () => void = (): void => {
            fireEvent.pointerDown(surface, {
                pointerId: 1,
                clientX: 0,
                clientY: 0,
            });
            fireEvent.pointerUp(surface, { pointerId: 1, clientX: 0, clientY: 0 });
        };

        // Two taps 50ms apart: inside the 100ms window, so a double-tap resolves.
        currentTimeMs = 0;
        tap();
        currentTimeMs = 50;
        tap();
        expect(recognized).toContain(EGestureValue.DoubleTap);

        recognized.length = 0;

        // Two taps 150ms apart: outside the window, so no double-tap resolves.
        currentTimeMs = 200;
        tap();
        currentTimeMs = 350;
        tap();
        expect(recognized).not.toContain(EGestureValue.DoubleTap);
    });
});
