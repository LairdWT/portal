import { describe, expect, it } from 'vitest';

import { EDpadDirection } from './DPad.types';
import {
    type DpadGeometry,
    dpadGeometry,
    type DpadKeyGeometry,
} from './dpadGeometry';

type ParsedPoint = Readonly<{ x: number; y: number }>;

// Parses a `polygon(x% y%, ...)` string back into numeric percent pairs.
function polygonPoints(path: string): readonly ParsedPoint[] {
    const inner: string = path.replace('polygon(', '').replace(')', '');
    return inner.split(', ').map((pair: string): ParsedPoint => {
        const parts: readonly string[] = pair.split(' ');
        return {
            x: Number.parseFloat(parts[0] ?? ''),
            y: Number.parseFloat(parts[1] ?? ''),
        };
    });
}

function percentValue(value: string): number {
    return Number.parseFloat(value);
}

const CARDINALS: readonly EDpadDirection[] = [
    EDpadDirection.Up,
    EDpadDirection.Down,
    EDpadDirection.Left,
    EDpadDirection.Right,
];

const DIAGONALS: readonly EDpadDirection[] = [
    EDpadDirection.UpLeft,
    EDpadDirection.UpRight,
    EDpadDirection.DownLeft,
    EDpadDirection.DownRight,
];

describe('dpadGeometry', (): void => {
    it('provides a key shape for every operable direction plus the cap', (): void => {
        const geometry: DpadGeometry = dpadGeometry();
        for (const direction of [...CARDINALS, ...DIAGONALS]) {
            const key: DpadKeyGeometry | undefined = geometry.keys[direction];
            expect(key).toBeDefined();
            if (key === undefined) {
                continue;
            }
            expect(polygonPoints(key.clipPath).length).toBeGreaterThanOrEqual(5);
            for (const point of polygonPoints(key.clipPath)) {
                expect(point.x).toBeGreaterThanOrEqual(0);
                expect(point.x).toBeLessThanOrEqual(100);
                expect(point.y).toBeGreaterThanOrEqual(0);
                expect(point.y).toBeLessThanOrEqual(100);
            }
        }
        expect(polygonPoints(geometry.capClipPath)).toHaveLength(8);
    });

    it('anchors the cardinal glyphs on their axes, outward of center', (): void => {
        const geometry: DpadGeometry = dpadGeometry();
        const up: DpadKeyGeometry | undefined = geometry.keys[EDpadDirection.Up];
        const right: DpadKeyGeometry | undefined =
            geometry.keys[EDpadDirection.Right];
        expect(up).toBeDefined();
        expect(right).toBeDefined();
        if (up === undefined || right === undefined) {
            return;
        }
        expect(percentValue(up.anchorX)).toBeCloseTo(50, 1);
        expect(percentValue(up.anchorY)).toBeLessThan(40);
        expect(percentValue(right.anchorY)).toBeCloseTo(50, 1);
        expect(percentValue(right.anchorX)).toBeGreaterThan(60);
    });

    it('keeps the cardinal arms as quarter rotations of each other', (): void => {
        const geometry: DpadGeometry = dpadGeometry();
        const up: DpadKeyGeometry | undefined = geometry.keys[EDpadDirection.Up];
        const down: DpadKeyGeometry | undefined =
            geometry.keys[EDpadDirection.Down];
        expect(up).toBeDefined();
        expect(down).toBeDefined();
        if (up === undefined || down === undefined) {
            return;
        }
        // The down arm is the up arm rotated 180deg: every up point (x, y)
        // has a down counterpart at (100-x, 100-y).
        const upPoints: readonly ParsedPoint[] = polygonPoints(up.clipPath);
        const downPoints: readonly ParsedPoint[] = polygonPoints(down.clipPath);
        for (const point of upPoints) {
            const mirrored: boolean = downPoints.some(
                (other: ParsedPoint): boolean =>
                    Math.abs(other.x - (100 - point.x)) < 0.01 &&
                    Math.abs(other.y - (100 - point.y)) < 0.01,
            );
            expect(mirrored).toBe(true);
        }
    });

    it('insets every face strictly inside its silhouette so the rim shows', (): void => {
        const geometry: DpadGeometry = dpadGeometry();
        for (const direction of [...CARDINALS, ...DIAGONALS]) {
            const key: DpadKeyGeometry | undefined = geometry.keys[direction];
            if (key === undefined) {
                continue;
            }
            const outline: readonly ParsedPoint[] = polygonPoints(key.clipPath);
            const face: readonly ParsedPoint[] = polygonPoints(key.faceClipPath);
            const minX: number = Math.min(
                ...outline.map((point: ParsedPoint): number => point.x),
            );
            const maxX: number = Math.max(
                ...outline.map((point: ParsedPoint): number => point.x),
            );
            for (const point of face) {
                expect(point.x).toBeGreaterThan(minX - 0.001);
                expect(point.x).toBeLessThan(maxX + 0.001);
            }
        }
    });
});
