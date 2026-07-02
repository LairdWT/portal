import { describe, expect, it } from 'vitest';

import { type RadialSides, type RadialWedge, radialWedges } from './radialGeometry';

const ALL_SIDES: readonly RadialSides[] = [4, 6, 8];

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

function distanceFromCenter(point: ParsedPoint): number {
    return Math.hypot(point.x - 50, point.y - 50);
}

describe('radialWedges', (): void => {
    it('returns one four-point wedge per side', (): void => {
        for (const sides of ALL_SIDES) {
            const wedges: readonly RadialWedge[] = radialWedges(sides);
            expect(wedges).toHaveLength(sides);
            for (const wedge of wedges) {
                expect(polygonPoints(wedge.clipPath)).toHaveLength(4);
                expect(polygonPoints(wedge.faceClipPath)).toHaveLength(4);
            }
        }
    });

    it('centers wedge 0 on the top edge, symmetric about the vertical axis', (): void => {
        for (const sides of ALL_SIDES) {
            const wedges: readonly RadialWedge[] = radialWedges(sides);
            const top: RadialWedge | undefined = wedges[0];
            expect(top).toBeDefined();
            if (top === undefined) {
                continue;
            }
            expect(percentValue(top.anchorX)).toBeCloseTo(50, 3);
            expect(percentValue(top.anchorY)).toBeLessThan(50);
            const points: readonly ParsedPoint[] = polygonPoints(top.clipPath);
            // The four silhouette points pair off as mirror images across x=50
            // (inner-left/inner-right, outer-left/outer-right), all above center.
            for (const point of points) {
                const mirrored: boolean = points.some(
                    (other: ParsedPoint): boolean =>
                        Math.abs(other.x - (100 - point.x)) < 0.01 &&
                        Math.abs(other.y - point.y) < 0.01,
                );
                expect(mirrored).toBe(true);
                expect(point.y).toBeLessThan(50);
            }
        }
    });

    it('keeps every silhouette inside the panel and outside the hub hole', (): void => {
        for (const sides of ALL_SIDES) {
            for (const wedge of radialWedges(sides)) {
                for (const point of polygonPoints(wedge.clipPath)) {
                    expect(point.x).toBeGreaterThanOrEqual(0);
                    expect(point.x).toBeLessThanOrEqual(100);
                    expect(point.y).toBeGreaterThanOrEqual(0);
                    expect(point.y).toBeLessThanOrEqual(100);
                    // Inside the outer boundary, clear of the center hub area
                    // (the hub occupies well under 40% of the half-size).
                    expect(distanceFromCenter(point)).toBeLessThanOrEqual(49.001);
                    expect(distanceFromCenter(point)).toBeGreaterThanOrEqual(20);
                }
            }
        }
    });

    it('insets the face strictly inside the silhouette so the rim shows', (): void => {
        for (const sides of ALL_SIDES) {
            for (const wedge of radialWedges(sides)) {
                const outline: readonly ParsedPoint[] = polygonPoints(
                    wedge.clipPath,
                );
                const face: readonly ParsedPoint[] = polygonPoints(
                    wedge.faceClipPath,
                );
                const outlineCenterX: number =
                    outline.reduce(
                        (sum: number, point: ParsedPoint): number => sum + point.x,
                        0,
                    ) / outline.length;
                const outlineCenterY: number =
                    outline.reduce(
                        (sum: number, point: ParsedPoint): number => sum + point.y,
                        0,
                    ) / outline.length;
                for (let index: number = 0; index < face.length; index += 1) {
                    const facePoint: ParsedPoint | undefined = face[index];
                    const outlinePoint: ParsedPoint | undefined = outline[index];
                    expect(facePoint).toBeDefined();
                    expect(outlinePoint).toBeDefined();
                    if (facePoint === undefined || outlinePoint === undefined) {
                        continue;
                    }
                    // Each face vertex moves inward: strictly closer to the
                    // wedge's own centroid than its silhouette counterpart.
                    const faceDistance: number = Math.hypot(
                        facePoint.x - outlineCenterX,
                        facePoint.y - outlineCenterY,
                    );
                    const outlineDistance: number = Math.hypot(
                        outlinePoint.x - outlineCenterX,
                        outlinePoint.y - outlineCenterY,
                    );
                    expect(faceDistance).toBeLessThan(outlineDistance);
                }
            }
        }
    });

    it('emits entrance offsets pointing from the center toward each edge', (): void => {
        const wedges: readonly RadialWedge[] = radialWedges(4);
        const [top, right, bottom, left]: readonly (RadialWedge | undefined)[] =
            wedges;
        expect(top).toBeDefined();
        expect(right).toBeDefined();
        expect(bottom).toBeDefined();
        expect(left).toBeDefined();
        if (
            top === undefined ||
            right === undefined ||
            bottom === undefined ||
            left === undefined
        ) {
            return;
        }
        // The start offset pulls each wedge TOWARD the center; the animation
        // plays it back out to rest. Top starts displaced down, right starts
        // displaced left, and so on. Zero components carry no minus sign.
        expect(percentValue(top.enterX)).toBeCloseTo(0, 3);
        expect(top.enterX).not.toContain('-');
        expect(percentValue(top.enterY)).toBeGreaterThan(0);
        expect(percentValue(right.enterX)).toBeLessThan(0);
        expect(percentValue(bottom.enterY)).toBeLessThan(0);
        expect(percentValue(left.enterX)).toBeGreaterThan(0);
    });
});
