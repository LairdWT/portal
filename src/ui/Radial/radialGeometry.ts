// Pure geometry for the radial surfaces (RadialMenu, RadialPad). No React, no
// DOM: it maps a side count to per-section wedge geometry the CSS consumes as
// custom properties. Each section is a true wedge - the annular slice between
// an outer flat-top N-gon and an inner N-gon hole (which clears the center
// hub) - expressed as a clip-path polygon over the full panel box, plus a
// rim-inset face polygon (the machined edge), the label anchor point, and the
// entrance-motion vector. Kept separate so the math is unit testable on its
// own and shared byte-for-byte between the menu and controller variants.

// Supported polygon side counts. A radial has one section wedge per edge, so
// the side count is also the maximum section count. Modeled as a numeric
// literal union (not an E-prefixed const object): the members are geometry,
// not a named domain vocabulary, and 4 | 6 | 8 reads directly at every call
// site.
export type RadialSides = 4 | 6 | 8;

// Everything the CSS needs to draw one section wedge. All strings are CSS
// values relative to the panel box: the two clip paths are polygon()
// functions in percent coordinates, the anchor is the wedge's visual center
// (label position and transform origin), and the enter offsets are the
// translate() start point of the edge-emergence animation (pulled toward the
// panel center; the wedge animates outward to rest).
export type RadialWedge = Readonly<{
    clipPath: string;
    faceClipPath: string;
    anchorX: string;
    anchorY: string;
    enterX: string;
    enterY: string;
}>;

// An x/y pair in unit space: the panel center is the origin and 1 is half the
// panel size, so a point converts to percent as 50 + value * 50.
type Point = Readonly<{ x: number; y: number }>;

// A directed offset edge used while insetting the wedge outline.
type OffsetEdge = Readonly<{ origin: Point; direction: Point }>;

// The full turn in degrees. Named so the angle step is not a bare 360 literal.
const FULL_TURN_DEGREES: number = 360;

// Degrees-to-radians factor for the polar conversions below.
const RADIANS_PER_DEGREE: number = Math.PI / 180;

// Outer N-gon circumradius as a fraction of the half-panel. Slightly inside
// 1 so the wedge tips never touch the panel edge and the hover/focus glow has
// room to render.
const OUTER_RADIUS_FRACTION: number = 0.98;

// Inner N-gon (hub hole) circumradius per side count, as a fraction of the
// half-panel. Each value keeps the hole boundary clear of the fixed-size
// center hub (including its beveled corners) at the panel's minimum size; the
// binding direction differs per side count (a hub corner meets a hole vertex
// on the square, but a hole edge on the octagon), hence the per-N values.
const INNER_RADIUS_FRACTION: Readonly<Record<RadialSides, number>> = {
    4: 0.46,
    6: 0.5,
    8: 0.48,
};

// Half-angle (degrees) removed from each side of a wedge so adjacent wedges
// are separated by a machined seam radiating from the center.
const SEAM_HALF_ANGLE_DEGREES: number = 0.75;

// Rim thickness in unit space: the face polygon is the wedge outline inset by
// this amount, so the outline shows through as the machined metal edge. At
// the panel's size range this lands on ~2px, matching the HUD edge width.
const RIM_INSET_FRACTION: number = 0.012;

// How far (in percent of the panel box) a wedge starts toward the center
// before the entrance animation slides it out to rest at its edge.
const ENTER_DISTANCE_PERCENT: number = 8;

// Rounding scale for emitted coordinates (three decimals), so the generated
// CSS strings stay short and deterministic.
const COORDINATE_PRECISION: number = 1000;

// Guard for parallel-line intersection; adjacent wedge edges are never
// parallel, so this only defends against degenerate inputs.
const PARALLEL_EPSILON: number = 1e-9;

// Point at `radius` in the direction `angleDegrees`, measured clockwise from
// straight up (screen coordinates: +y is down), matching the section-0-at-top
// convention.
function polarPoint(radius: number, angleDegrees: number): Point {
    const radians: number = angleDegrees * RADIANS_PER_DEGREE;
    return {
        x: radius * Math.sin(radians),
        y: -radius * Math.cos(radians),
    };
}

// Rounds to the emitted precision and normalizes negative zero so the
// generated strings never carry a cosmetic minus sign.
function roundCoordinate(value: number): number {
    const rounded: number =
        Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;
    if (rounded === 0) {
        return 0;
    }
    return rounded;
}

// Unit-space coordinate (-1..1) to a percent string of the panel box (0..100%).
function formatCoordinate(value: number): string {
    const HALF_PERCENT: number = 50;
    return `${String(roundCoordinate(HALF_PERCENT + value * HALF_PERCENT))}%`;
}

// A value already expressed in percent units (e.g. the entrance offset) to a
// percent string.
function formatPercent(value: number): string {
    return `${String(roundCoordinate(value))}%`;
}

function polygonPath(points: readonly Point[]): string {
    const coordinates: string = points
        .map(
            (point: Point): string =>
                `${formatCoordinate(point.x)} ${formatCoordinate(point.y)}`,
        )
        .join(', ');
    return `polygon(${coordinates})`;
}

// Intersection of two offset edges treated as infinite lines. The parallel
// fall-through returns the second edge's origin: adjacent wedge edges are
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

// Insets a convex polygon by offsetting every edge toward the centroid and
// re-intersecting adjacent edges. Winding-agnostic: the inward normal is
// chosen per edge by testing against the centroid.
function insetConvexPolygon(
    points: readonly Point[],
    inset: number,
): readonly Point[] {
    const count: number = points.length;
    const centroid: Point = {
        x:
            points.reduce((sum: number, point: Point): number => sum + point.x, 0) /
            count,
        y:
            points.reduce((sum: number, point: Point): number => sum + point.y, 0) /
            count,
    };
    const edges: readonly OffsetEdge[] = points.map(
        (point: Point, index: number): OffsetEdge => {
            const next: Point = points[(index + 1) % count] ?? point;
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
                    x: point.x + inwardX * sign * inset,
                    y: point.y + inwardY * sign * inset,
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

// The per-section wedge geometry for a flat-top N-gon with section 0 at the
// top, stepping clockwise one polygon edge per section. Each wedge is the
// quadrilateral between the inner and outer N-gon chords of its edge, with
// the seam half-angle trimmed from both sides; its outer boundary IS the
// polygon's straight edge, so the assembled sections read as the N-gon
// itself. The returned array has one entry per side; a consumer with fewer
// items simply uses the leading wedges.
export function radialWedges(sides: RadialSides): readonly RadialWedge[] {
    const step: number = FULL_TURN_DEGREES / sides;
    const halfSpan: number = step / 2 - SEAM_HALF_ANGLE_DEGREES;
    const innerRadius: number = INNER_RADIUS_FRACTION[sides];
    // Both boundary chords cut across the wedge at cos(halfSpan) of their
    // circumradius along the center direction, so the visual center (label
    // anchor, transform origin) sits midway between the two apothems.
    const anchorRadius: number =
        ((innerRadius + OUTER_RADIUS_FRACTION) / 2) *
        Math.cos(halfSpan * RADIANS_PER_DEGREE);
    const wedges: RadialWedge[] = [];
    for (let index: number = 0; index < sides; index += 1) {
        const centerAngle: number = index * step;
        const leftAngle: number = centerAngle - halfSpan;
        const rightAngle: number = centerAngle + halfSpan;
        const outline: readonly Point[] = [
            polarPoint(innerRadius, leftAngle),
            polarPoint(OUTER_RADIUS_FRACTION, leftAngle),
            polarPoint(OUTER_RADIUS_FRACTION, rightAngle),
            polarPoint(innerRadius, rightAngle),
        ];
        const face: readonly Point[] = insetConvexPolygon(
            outline,
            RIM_INSET_FRACTION,
        );
        const anchor: Point = polarPoint(anchorRadius, centerAngle);
        const outward: Point = polarPoint(1, centerAngle);
        wedges.push({
            clipPath: polygonPath(outline),
            faceClipPath: polygonPath(face),
            anchorX: formatCoordinate(anchor.x),
            anchorY: formatCoordinate(anchor.y),
            enterX: formatPercent(-outward.x * ENTER_DISTANCE_PERCENT),
            enterY: formatPercent(-outward.y * ENTER_DISTANCE_PERCENT),
        });
    }
    return wedges;
}
