import { describe, expect, it } from 'vitest';

import {
    clampSize,
    edgeAxis,
    edgeOrientation,
    resizeSign,
    sizeFromDrag,
    sizeFromKey,
} from './Drawer.geometry';
import { EDrawerEdge } from './Drawer.types';

describe('Drawer.geometry', (): void => {
    describe('edgeAxis', (): void => {
        it('locks the side edges to x and the bottom edge to y', (): void => {
            expect(edgeAxis(EDrawerEdge.InlineStart)).toBe('x');
            expect(edgeAxis(EDrawerEdge.InlineEnd)).toBe('x');
            expect(edgeAxis(EDrawerEdge.BlockEnd)).toBe('y');
        });
    });

    describe('edgeOrientation', (): void => {
        it('reports a vertical separator for side edges, horizontal for bottom', (): void => {
            expect(edgeOrientation(EDrawerEdge.InlineStart)).toBe('vertical');
            expect(edgeOrientation(EDrawerEdge.InlineEnd)).toBe('vertical');
            expect(edgeOrientation(EDrawerEdge.BlockEnd)).toBe('horizontal');
        });
    });

    describe('resizeSign', (): void => {
        it('grows a start-docked panel toward the positive axis and end-docked toward the negative', (): void => {
            expect(resizeSign(EDrawerEdge.InlineStart)).toBe(1);
            expect(resizeSign(EDrawerEdge.InlineEnd)).toBe(-1);
            expect(resizeSign(EDrawerEdge.BlockEnd)).toBe(-1);
        });
    });

    describe('clampSize', (): void => {
        it('clamps into the inclusive range', (): void => {
            expect(clampSize(150, 100, 200)).toBe(150);
            expect(clampSize(50, 100, 200)).toBe(100);
            expect(clampSize(250, 100, 200)).toBe(200);
        });

        it('collapses an inverted range to the floor', (): void => {
            expect(clampSize(150, 200, 100)).toBe(200);
        });
    });

    describe('sizeFromDrag', (): void => {
        it('a rightward drag GROWS an InlineStart panel', (): void => {
            expect(
                sizeFromDrag(EDrawerEdge.InlineStart, 300, 40, 0, 100, 500),
            ).toBe(340);
        });

        it('a rightward drag SHRINKS an InlineEnd panel', (): void => {
            expect(sizeFromDrag(EDrawerEdge.InlineEnd, 300, 40, 0, 100, 500)).toBe(
                260,
            );
        });

        it('an upward drag GROWS a BlockEnd panel and uses only the y delta', (): void => {
            expect(sizeFromDrag(EDrawerEdge.BlockEnd, 200, 999, -30, 80, 400)).toBe(
                230,
            );
        });

        it('clamps the dragged size to the bounds', (): void => {
            expect(
                sizeFromDrag(EDrawerEdge.InlineStart, 480, 100, 0, 100, 500),
            ).toBe(500);
            expect(
                sizeFromDrag(EDrawerEdge.InlineStart, 120, -100, 0, 100, 500),
            ).toBe(100);
        });
    });

    describe('sizeFromKey', (): void => {
        it('ArrowRight grows InlineStart and ArrowLeft shrinks it', (): void => {
            expect(
                sizeFromKey(
                    EDrawerEdge.InlineStart,
                    300,
                    'ArrowRight',
                    16,
                    100,
                    500,
                ),
            ).toBe(316);
            expect(
                sizeFromKey(
                    EDrawerEdge.InlineStart,
                    300,
                    'ArrowLeft',
                    16,
                    100,
                    500,
                ),
            ).toBe(284);
        });

        it('ArrowRight shrinks InlineEnd (mirrored sign)', (): void => {
            expect(
                sizeFromKey(EDrawerEdge.InlineEnd, 300, 'ArrowRight', 16, 100, 500),
            ).toBe(284);
        });

        it('ArrowUp grows BlockEnd and ArrowDown shrinks it', (): void => {
            expect(
                sizeFromKey(EDrawerEdge.BlockEnd, 200, 'ArrowUp', 16, 80, 400),
            ).toBe(216);
            expect(
                sizeFromKey(EDrawerEdge.BlockEnd, 200, 'ArrowDown', 16, 80, 400),
            ).toBe(184);
        });

        it('Home jumps to min and End to max', (): void => {
            expect(
                sizeFromKey(EDrawerEdge.InlineStart, 300, 'Home', 16, 100, 500),
            ).toBe(100);
            expect(
                sizeFromKey(EDrawerEdge.InlineStart, 300, 'End', 16, 100, 500),
            ).toBe(500);
        });

        it('ignores cross-axis and unrelated keys', (): void => {
            expect(
                sizeFromKey(EDrawerEdge.InlineStart, 300, 'ArrowUp', 16, 100, 500),
            ).toBeNull();
            expect(
                sizeFromKey(EDrawerEdge.BlockEnd, 200, 'ArrowLeft', 16, 80, 400),
            ).toBeNull();
            expect(
                sizeFromKey(EDrawerEdge.InlineStart, 300, 'a', 16, 100, 500),
            ).toBeNull();
        });

        it('ignores End when the panel has no finite maximum', (): void => {
            expect(
                sizeFromKey(
                    EDrawerEdge.InlineStart,
                    300,
                    'End',
                    16,
                    100,
                    Number.POSITIVE_INFINITY,
                ),
            ).toBeNull();
        });

        it('clamps stepped keyboard resize to the bounds', (): void => {
            expect(
                sizeFromKey(
                    EDrawerEdge.InlineStart,
                    495,
                    'ArrowRight',
                    16,
                    100,
                    500,
                ),
            ).toBe(500);
        });
    });
});
