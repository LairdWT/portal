import { describe, expect, it } from 'vitest';

import {
    type RadialHubGeometry,
    radialHubGeometry,
    type RadialSides,
    type RadialWedge,
    radialWedges,
    resolveRadialSides,
} from './radialGeometry';

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
                    // (the tightest inner hole sits at 39% of the half-size).
                    expect(distanceFromCenter(point)).toBeLessThanOrEqual(49.001);
                    expect(distanceFromCenter(point)).toBeGreaterThanOrEqual(15);
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

    it('keeps a uniform linear gap between adjacent wedges', (): void => {
        // Perpendicular distance from a point to the infinite line through
        // lineStart -> lineEnd.
        function distanceToLine(
            point: ParsedPoint,
            lineStart: ParsedPoint,
            lineEnd: ParsedPoint,
        ): number {
            const edgeX: number = lineEnd.x - lineStart.x;
            const edgeY: number = lineEnd.y - lineStart.y;
            const cross: number =
                edgeX * (point.y - lineStart.y) - edgeY * (point.x - lineStart.x);
            return Math.abs(cross) / Math.hypot(edgeX, edgeY);
        }
        for (const sides of ALL_SIDES) {
            const wedges: readonly RadialWedge[] = radialWedges(sides);
            for (let index: number = 0; index < sides; index += 1) {
                const current: RadialWedge | undefined = wedges[index];
                const neighbor: RadialWedge | undefined =
                    wedges[(index + 1) % sides];
                expect(current).toBeDefined();
                expect(neighbor).toBeDefined();
                if (current === undefined || neighbor === undefined) {
                    continue;
                }
                // Silhouette order is [inner-left, outer-left, outer-right,
                // inner-right]: the current wedge's right side faces the
                // neighbor's left side across the seam.
                const currentPoints: readonly ParsedPoint[] = polygonPoints(
                    current.clipPath,
                );
                const neighborPoints: readonly ParsedPoint[] = polygonPoints(
                    neighbor.clipPath,
                );
                const outerCorner: ParsedPoint | undefined = currentPoints[2];
                const innerCorner: ParsedPoint | undefined = currentPoints[3];
                const neighborInner: ParsedPoint | undefined = neighborPoints[0];
                const neighborOuter: ParsedPoint | undefined = neighborPoints[1];
                if (
                    outerCorner === undefined ||
                    innerCorner === undefined ||
                    neighborInner === undefined ||
                    neighborOuter === undefined
                ) {
                    continue;
                }
                const outerGap: number = distanceToLine(
                    outerCorner,
                    neighborInner,
                    neighborOuter,
                );
                const innerGap: number = distanceToLine(
                    innerCorner,
                    neighborInner,
                    neighborOuter,
                );
                // The seam is a constant-width machined gap: identical at the
                // outer and inner corners (the old angular trim made the
                // outer gap roughly double the inner one).
                expect(outerGap).toBeCloseTo(innerGap, 2);
                expect(outerGap).toBeGreaterThan(0);
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

describe('resolveRadialSides', (): void => {
    it('passes supported counts through unchanged', (): void => {
        expect(resolveRadialSides(4)).toBe(4);
        expect(resolveRadialSides(6)).toBe(6);
        expect(resolveRadialSides(8)).toBe(8);
    });

    it('normalizes out-of-range counts onto the supported geometry', (): void => {
        expect(resolveRadialSides(0)).toBe(4);
        expect(resolveRadialSides(3)).toBe(4);
        expect(resolveRadialSides(5)).toBe(6);
        expect(resolveRadialSides(7)).toBe(8);
        expect(resolveRadialSides(12)).toBe(8);
        expect(resolveRadialSides(Number.NaN)).toBe(8);
    });
});

describe('radialHubGeometry', (): void => {
    it('matches the ring: the exact hole N-gon per side count', (): void => {
        for (const sides of ALL_SIDES) {
            const hub: RadialHubGeometry = radialHubGeometry(sides, 4);
            // The hub outline is the plain hole polygon - one point per
            // vertex, no extra chamfer cuts (a second bevel would misalign
            // the hub with the wedges).
            expect(polygonPoints(hub.clipPath)).toHaveLength(sides);
            for (const point of polygonPoints(hub.clipPath)) {
                expect(point.x).toBeGreaterThanOrEqual(0);
                expect(point.x).toBeLessThanOrEqual(100);
                expect(point.y).toBeGreaterThanOrEqual(0);
                expect(point.y).toBeLessThanOrEqual(100);
            }
        }
    });

    it('implements the cell contract: 0/1 fill, 2 split vertically, 4 grid', (): void => {
        const panel: RadialHubGeometry = radialHubGeometry(8, 0);
        expect(panel.cells).toHaveLength(1);
        expect(percentValue(panel.cells[0]?.anchorX ?? '')).toBeCloseTo(50, 1);

        const single: RadialHubGeometry = radialHubGeometry(8, 1);
        expect(single.cells).toHaveLength(1);

        const split: RadialHubGeometry = radialHubGeometry(8, 2);
        expect(split.cells).toHaveLength(2);
        // Side-by-side halves: anchors sit left and right of center on one row.
        expect(percentValue(split.cells[0]?.anchorX ?? '')).toBeLessThan(50);
        expect(percentValue(split.cells[1]?.anchorX ?? '')).toBeGreaterThan(50);
        expect(percentValue(split.cells[0]?.anchorY ?? '')).toBeCloseTo(50, 1);

        const grid: RadialHubGeometry = radialHubGeometry(8, 4);
        expect(grid.cells).toHaveLength(4);
        expect(percentValue(grid.cells[0]?.anchorX ?? '')).toBeLessThan(50);
        expect(percentValue(grid.cells[0]?.anchorY ?? '')).toBeLessThan(50);
        expect(percentValue(grid.cells[3]?.anchorX ?? '')).toBeGreaterThan(50);
        expect(percentValue(grid.cells[3]?.anchorY ?? '')).toBeGreaterThan(50);
    });

    it('sizes the hub so its moat matches the wedge seam width', (): void => {
        for (const sides of ALL_SIDES) {
            const fraction: number = Number.parseFloat(
                radialHubGeometry(sides, 4).sizeFraction,
            );
            // The hub fills its hole up to a seam-width moat: roughly a third
            // of the panel for every side count, and always clear of the
            // 2x2 touch floor at the panel's minimum size (19.5rem * 0.36 >
            // 2 * 3rem + seams).
            expect(fraction).toBeGreaterThan(0.3);
            expect(fraction).toBeLessThan(0.4);
        }
    });

    it('clamps a stray action count into the 2x2 grid', (): void => {
        expect(radialHubGeometry(8, 9).cells).toHaveLength(4);
        expect(radialHubGeometry(8, 3).cells).toHaveLength(3);
        expect(radialHubGeometry(8, -1).cells).toHaveLength(1);
    });

    it('insets every cell inside the hub outline', (): void => {
        for (const sides of ALL_SIDES) {
            const hub: RadialHubGeometry = radialHubGeometry(sides, 4);
            const outline: readonly ParsedPoint[] = polygonPoints(hub.clipPath);
            const minX: number = Math.min(
                ...outline.map((point: ParsedPoint): number => point.x),
            );
            const maxX: number = Math.max(
                ...outline.map((point: ParsedPoint): number => point.x),
            );
            const minY: number = Math.min(
                ...outline.map((point: ParsedPoint): number => point.y),
            );
            const maxY: number = Math.max(
                ...outline.map((point: ParsedPoint): number => point.y),
            );
            for (const cell of hub.cells) {
                for (const point of polygonPoints(cell.clipPath)) {
                    expect(point.x).toBeGreaterThan(minX);
                    expect(point.x).toBeLessThan(maxX);
                    expect(point.y).toBeGreaterThan(minY);
                    expect(point.y).toBeLessThan(maxY);
                }
            }
        }
    });
});
