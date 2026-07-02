// Shared pure polygon math for the machined clip-path controls (the Radial
// surfaces and the DPad cross). Coordinates live in unit space: the element
// box center is the origin and 1 is half the box, so a point converts to
// percent as 50 + value * 50. No React, no DOM - extracted from
// radialGeometry so the same rim/face/anchor techniques back every clipped
// control without re-deriving the math.

// An x/y pair in unit space.
export type Point = Readonly<{ x: number; y: number }>;

// A directed offset edge used while insetting polygons.
type OffsetEdge = Readonly<{ origin: Point; direction: Point }>;

// The clipping axis for axis-aligned polygon splits.
export type ClipAxis = 'x' | 'y';

// Degrees-to-radians factor for the polar conversions.
export const RADIANS_PER_DEGREE: number = Math.PI / 180;

// Rounding scale for emitted coordinates (three decimals), so the generated
// CSS strings stay short and deterministic.
const COORDINATE_PRECISION: number = 1000;

// Guard for parallel-line intersection; adjacent polygon edges are never
// parallel, so this only defends against degenerate inputs.
const PARALLEL_EPSILON: number = 1e-9;

// Point at `radius` in the direction `angleDegrees`, measured clockwise from
// straight up (screen coordinates: +y is down).
export function polarPoint(radius: number, angleDegrees: number): Point {
    const radians: number = angleDegrees * RADIANS_PER_DEGREE;
    return {
        x: radius * Math.sin(radians),
        y: -radius * Math.cos(radians),
    };
}

// Rounds to the emitted precision and normalizes negative zero so the
// generated strings never carry a cosmetic minus sign.
export function roundCoordinate(value: number): number {
    const rounded: number =
        Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;
    if (rounded === 0) {
        return 0;
    }
    return rounded;
}

// Unit-space coordinate (-1..1) to a percent string of the box (0..100%).
export function formatCoordinate(value: number): string {
    const HALF_PERCENT: number = 50;
    return `${String(roundCoordinate(HALF_PERCENT + value * HALF_PERCENT))}%`;
}

// A value already expressed in percent units (e.g. an entrance offset) to a
// percent string.
export function formatPercent(value: number): string {
    return `${String(roundCoordinate(value))}%`;
}

export function polygonPath(points: readonly Point[]): string {
    const coordinates: string = points
        .map(
            (point: Point): string =>
                `${formatCoordinate(point.x)} ${formatCoordinate(point.y)}`,
        )
        .join(', ');
    return `polygon(${coordinates})`;
}

// Vertex-average centroid: used only to orient the inward normals while
// offsetting edges (any interior point works for that).
function polygonCentroid(points: readonly Point[]): Point {
    const count: number = points.length;
    if (count === 0) {
        return { x: 0, y: 0 };
    }
    return {
        x:
            points.reduce((sum: number, point: Point): number => sum + point.x, 0) /
            count,
        y:
            points.reduce((sum: number, point: Point): number => sum + point.y, 0) /
            count,
    };
}

// Shoelace (area-weighted) centroid: the true visual center of a polygon.
// Glyph anchors use this, NOT the vertex average - a clipped shape has more
// vertices along its cut edges, so averaging vertices would drag the anchor
// toward them and the glyph would sit off the perceived middle.
export function polygonAreaCentroid(points: readonly Point[]): Point {
    const count: number = points.length;
    let doubleArea: number = 0;
    let momentX: number = 0;
    let momentY: number = 0;
    for (let index: number = 0; index < count; index += 1) {
        const current: Point = points[index] ?? { x: 0, y: 0 };
        const next: Point = points[(index + 1) % count] ?? current;
        const cross: number = current.x * next.y - next.x * current.y;
        doubleArea += cross;
        momentX += (current.x + next.x) * cross;
        momentY += (current.y + next.y) * cross;
    }
    if (Math.abs(doubleArea) < PARALLEL_EPSILON) {
        return polygonCentroid(points);
    }
    return {
        x: momentX / (3 * doubleArea),
        y: momentY / (3 * doubleArea),
    };
}

// Intersection of two offset edges treated as infinite lines. The parallel
// fall-through returns the second edge's origin: adjacent polygon edges are
// never parallel, so this branch only defends degenerate inputs.
function intersectEdges(first: OffsetEdge, second: OffsetEdge): Point {
    const cross: number =
        first.direction.x * second.direction.y -
        first.direction.y * second.direction.x;
    if (Math.abs(cross) < PARALLEL_EPSILON) {
        return second.origin;
    }
    const deltaX: number = second.origin.x - first.origin.x;
    const deltaY: number = second.origin.y - first.origin.y;
    const along: number =
        (deltaX * second.direction.y - deltaY * second.direction.x) / cross;
    return {
        x: first.origin.x + along * first.direction.x,
        y: first.origin.y + along * first.direction.y,
    };
}

// Offsets each polygon edge inward (toward the centroid) by its own distance
// and re-intersects adjacent edges to rebuild the vertices. Winding-agnostic:
// the inward normal is chosen per edge by testing against the centroid. An
// offset of 0 leaves that edge's line untouched.
export function offsetPolygonEdges(
    points: readonly Point[],
    offsets: readonly number[],
): readonly Point[] {
    const count: number = points.length;
    const centroid: Point = polygonCentroid(points);
    const edges: readonly OffsetEdge[] = points.map(
        (point: Point, index: number): OffsetEdge => {
            const next: Point = points[(index + 1) % count] ?? point;
            const offset: number = offsets[index] ?? 0;
            const edgeX: number = next.x - point.x;
            const edgeY: number = next.y - point.y;
            const length: number = Math.hypot(edgeX, edgeY);
            const direction: Point = { x: edgeX / length, y: edgeY / length };
            const inwardX: number = -direction.y;
            const inwardY: number = direction.x;
            const towardCentroid: number =
                (centroid.x - point.x) * inwardX + (centroid.y - point.y) * inwardY;
            const sign: number = towardCentroid < 0 ? -1 : 1;
            return {
                origin: {
                    x: point.x + inwardX * sign * offset,
                    y: point.y + inwardY * sign * offset,
                },
                direction,
            };
        },
    );
    return edges.map((edge: OffsetEdge, index: number): Point => {
        const previous: OffsetEdge = edges[(index + count - 1) % count] ?? edge;
        return intersectEdges(previous, edge);
    });
}

// Uniform inset: every edge moves inward by the same distance.
export function insetConvexPolygon(
    points: readonly Point[],
    inset: number,
): readonly Point[] {
    return offsetPolygonEdges(
        points,
        points.map((): number => inset),
    );
}

// Sutherland-Hodgman clip of a convex polygon against one axis-aligned
// half-plane.
export function clipPolygonToHalfPlane(
    points: readonly Point[],
    axis: ClipAxis,
    limit: number,
    keepLess: boolean,
): readonly Point[] {
    const count: number = points.length;
    const result: Point[] = [];
    for (let index: number = 0; index < count; index += 1) {
        const current: Point = points[index] ?? { x: 0, y: 0 };
        const next: Point = points[(index + 1) % count] ?? current;
        const currentValue: number = axis === 'x' ? current.x : current.y;
        const nextValue: number = axis === 'x' ? next.x : next.y;
        const currentInside: boolean = keepLess
            ? currentValue <= limit
            : currentValue >= limit;
        const nextInside: boolean = keepLess
            ? nextValue <= limit
            : nextValue >= limit;
        if (currentInside) {
            result.push(current);
        }
        if (currentInside === nextInside) {
            continue;
        }
        const towardLimit: number =
            (limit - currentValue) / (nextValue - currentValue);
        result.push({
            x: current.x + (next.x - current.x) * towardLimit,
            y: current.y + (next.y - current.y) * towardLimit,
        });
    }
    return result;
}
