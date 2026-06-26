import { describe, expect, it } from 'vitest';

import { resolvePopoverPosition, toRect } from './Popover.position';
import { EPopoverPlacement } from './Popover.types';

describe('resolvePopoverPosition', (): void => {
    const viewport: { width: number; height: number } = {
        width: 1000,
        height: 800,
    };

    it('places the panel below the anchor for the bottom placement', (): void => {
        const coords: ReturnType<typeof resolvePopoverPosition> =
            resolvePopoverPosition({
                anchor: { top: 300, left: 400, width: 100, height: 40 },
                panel: { top: 0, left: 0, width: 200, height: 100 },
                viewport,
                placement: EPopoverPlacement.Bottom,
                offset: 8,
                padding: 8,
            });
        expect(coords).toEqual({
            top: 348,
            left: 400,
            placement: EPopoverPlacement.Bottom,
        });
    });

    it('flips to the top when there is no room below', (): void => {
        const coords: ReturnType<typeof resolvePopoverPosition> =
            resolvePopoverPosition({
                anchor: { top: 740, left: 400, width: 100, height: 40 },
                panel: { top: 0, left: 0, width: 200, height: 100 },
                viewport,
                placement: EPopoverPlacement.Bottom,
                offset: 8,
                padding: 8,
            });
        expect(coords.placement).toBe(EPopoverPlacement.Top);
        expect(coords.top).toBe(632);
    });

    it('shifts left to keep a right-overflowing panel in view', (): void => {
        const coords: ReturnType<typeof resolvePopoverPosition> =
            resolvePopoverPosition({
                anchor: { top: 300, left: 900, width: 80, height: 40 },
                panel: { top: 0, left: 0, width: 200, height: 100 },
                viewport,
                placement: EPopoverPlacement.Bottom,
                offset: 8,
                padding: 8,
            });
        expect(coords.left).toBe(792);
    });

    it('clamps a left-overflowing panel to the viewport padding', (): void => {
        const coords: ReturnType<typeof resolvePopoverPosition> =
            resolvePopoverPosition({
                anchor: { top: 300, left: -20, width: 80, height: 40 },
                panel: { top: 0, left: 0, width: 200, height: 100 },
                viewport,
                placement: EPopoverPlacement.Bottom,
                offset: 8,
                padding: 8,
            });
        expect(coords.left).toBe(8);
    });

    it('flips a right placement to the left near the right edge', (): void => {
        const coords: ReturnType<typeof resolvePopoverPosition> =
            resolvePopoverPosition({
                anchor: { top: 300, left: 850, width: 100, height: 40 },
                panel: { top: 0, left: 0, width: 200, height: 100 },
                viewport,
                placement: EPopoverPlacement.Right,
                offset: 8,
                padding: 8,
            });
        expect(coords.placement).toBe(EPopoverPlacement.Left);
        expect(coords.left).toBe(642);
    });
});

describe('toRect', (): void => {
    it('narrows a DOMRect to the positioning rectangle', (): void => {
        const domRect: DOMRect = {
            top: 12,
            left: 34,
            width: 56,
            height: 78,
            right: 90,
            bottom: 90,
            x: 34,
            y: 12,
            toJSON: (): unknown => ({}),
        };
        expect(toRect(domRect)).toEqual({
            top: 12,
            left: 34,
            width: 56,
            height: 78,
        });
    });
});
