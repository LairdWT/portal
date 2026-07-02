// Pure geometry for the radial surfaces (RadialMenu, RadialPad). No React, no
// DOM: it maps a side count to per-section wedge geometry and center-hub
// geometry the CSS consumes as custom properties. Each section is a true
// wedge - the annular slice between an outer flat-top N-gon and an inner
// N-gon hole - expressed as a clip-path polygon over the full panel box, plus
// a rim-inset face polygon (the machined edge), the label anchor point, and
// the entrance-motion vector. The hub is the matching flat-top N-gon (square
// hub for 4 wedges, hexagon for 6, octagon for 8) - the exact shape of the
// ring's hole, so the moat between them is uniform - split into 1, 2
// (vertical seam), or 4 (2x2) action cells. The polygon primitives live in
// the shared ui/polygonMath module (the DPad cross reuses them); this module
// owns only the radial-specific shapes and constants, kept unit testable on
// their own and shared byte-for-byte between the menu and controller
// variants.

import {
    clipPolygonToHalfPlane,
    formatCoordinate,
    formatPercent,
    insetConvexPolygon,
    offsetPolygonEdges,
    type Point,
    polarPoint,
    polygonAreaCentroid,
    polygonPath,
    RADIANS_PER_DEGREE,
    roundCoordinate,
} from '../polygonMath';

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
// panel center; the wedge animates outward to rest and back inward on close).
export type RadialWedge = Readonly<{
    clipPath: string;
    faceClipPath: string;
    anchorX: string;
    anchorY: string;
    enterX: string;
    enterY: string;
}>;

// One hub action cell: its clip polygon (relative to the hub box) and the
// anchor its glyph centers on.
export type RadialHubCell = Readonly<{
    clipPath: string;
    anchorX: string;
    anchorY: string;
}>;

// The center hub: the hole-matching N-gon outline (the rim silhouette), the
// rim-inset action cells, and the hub box size as a fraction of the panel.
// A count of 0 still returns one cell - the non-interactive center panel
// face.
export type RadialHubGeometry = Readonly<{
    clipPath: string;
    cells: readonly RadialHubCell[];
    sizeFraction: string;
}>;

// The full turn in degrees. Named so the angle step is not a bare 360 literal.
const FULL_TURN_DEGREES: number = 360;

// Outer N-gon circumradius as a fraction of the half-panel. Slightly inside
// 1 so the wedge tips never touch the panel edge and the hover/focus glow has
// room to render.
const OUTER_RADIUS_FRACTION: number = 0.98;

// Inner N-gon (hub hole) circumradius per side count, as a fraction of the
// half-panel. The hub is the SAME flat-top N-gon as the hole, so their edges
// are parallel and the moat between them is uniform by construction; each
// value is pulled in to the limit where a 2x2 hub cell still clears the 3rem
// touch floor at the panel's minimum size (the hexagon letterboxes
// vertically, so its hole cannot shrink as far).
const INNER_RADIUS_FRACTION: Readonly<Record<RadialSides, number>> = {
    4: 0.49,
    6: 0.39,
    8: 0.37,
};

// Half of the LINEAR gap between adjacent wedges, in unit space. The seam is
// cut by offsetting each wedge's side edges inward by this constant distance
// (not by trimming an angle), so the gap is identical at the inner and outer
// corners - a constant-width machined seam along the whole shared edge.
const SEAM_HALF_FRACTION: number = 0.008;

// Rim thickness in unit space: the face polygon is the wedge outline inset by
// this amount, so the outline shows through as the machined edge. At the
// panel's size range this lands on ~2px, matching the HUD edge width.
const RIM_INSET_FRACTION: number = 0.012;

// How far (in percent of the panel box) a wedge starts toward the center
// before the entrance animation slides it out to rest at its edge (and back
// in when closing).
const ENTER_DISTANCE_PERCENT: number = 8;

// Hub rim thickness in hub unit space (~2px at the hub's rendered size): the
// cells are inset by this amount so the hub background shows through as the
// themed edge.
const HUB_RIM_FRACTION: number = 0.04;

// Half of the seam between hub cells, in hub unit space. Two adjacent cells
// are separated by twice this (~2px), reading as the same machined seam
// weight as the rim.
const HUB_SEAM_HALF_FRACTION: number = 0.02;

// The hub caps at a 2x2 grid of cells.
const MAX_HUB_CELLS: number = 4;

// Normalizes an arbitrary runtime side count onto the supported geometry.
// The compile-time type already restricts `sides` to 4 | 6 | 8, but values
// can arrive from untyped surfaces (Storybook controls, JS consumers); an
// unsupported count would otherwise produce NaN clip polygons and an
// unclipped render. Non-finite input falls back to the octagon default.
export function resolveRadialSides(sides: number): RadialSides {
    if (!Number.isFinite(sides)) {
        return 8;
    }
    if (sides <= 4) {
        return 4;
    }
    if (sides <= 6) {
        return 6;
    }
    return 8;
}

// The per-section wedge geometry for a flat-top N-gon with section 0 at the
// top, stepping clockwise one polygon edge per section. Each wedge is the
// quadrilateral between the inner and outer N-gon chords of its edge; its
// side edges are then offset inward by the constant linear seam half-width,
// so adjacent wedges are separated by a uniform machined gap along the whole
// shared edge (identical at the inner and outer corners). The outer boundary
// IS the polygon's straight edge, so the assembled sections read as the N-gon
// itself. The returned array has one entry per side; a consumer with fewer
// items simply uses the leading wedges.
export function radialWedges(sides: RadialSides): readonly RadialWedge[] {
    const step: number = FULL_TURN_DEGREES / sides;
    const halfStep: number = step / 2;
    const innerRadius: number = INNER_RADIUS_FRACTION[sides];
    // Both boundary chords cut across the wedge at cos(halfStep) of their
    // circumradius along the center direction, so the visual center (label
    // anchor, transform origin) sits midway between the two apothems.
    const anchorRadius: number =
        ((innerRadius + OUTER_RADIUS_FRACTION) / 2) *
        Math.cos(halfStep * RADIANS_PER_DEGREE);
    const wedges: RadialWedge[] = [];
    for (let index: number = 0; index < sides; index += 1) {
        const centerAngle: number = index * step;
        const leftAngle: number = centerAngle - halfStep;
        const rightAngle: number = centerAngle + halfStep;
        // Full sector quad: [inner-left, outer-left, outer-right, inner-right].
        // Edges are left side, outer chord, right side, inner chord; only the
        // side edges take the seam offset.
        const sector: readonly Point[] = [
            polarPoint(innerRadius, leftAngle),
            polarPoint(OUTER_RADIUS_FRACTION, leftAngle),
            polarPoint(OUTER_RADIUS_FRACTION, rightAngle),
            polarPoint(innerRadius, rightAngle),
        ];
        const outline: readonly Point[] = offsetPolygonEdges(sector, [
            SEAM_HALF_FRACTION,
            0,
            SEAM_HALF_FRACTION,
            0,
        ]);
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

// Largest axis extent of the unit-circumradius hub N-gon; the polygon is
// scaled by its inverse so it fits the square hub box (a hexagon letterboxes
// vertically).
function hubVertexExtent(sides: RadialSides): number {
    const step: number = FULL_TURN_DEGREES / sides;
    let maxExtent: number = 0;
    for (let index: number = 0; index < sides; index += 1) {
        const vertex: Point = polarPoint(1, (index + 0.5) * step);
        maxExtent = Math.max(maxExtent, Math.abs(vertex.x), Math.abs(vertex.y));
    }
    return maxExtent;
}

// Hub box size as a fraction of the panel. The hub polygon's apothem lands
// exactly one wedge-seam width inside the ring's inner hole (the hub and the
// hole are the same flat-top N-gon, so their edges are parallel and the moat
// is uniform): the gap around the hub reads as the same machined seam that
// separates the wedges, not a void.
function hubSizeFraction(sides: RadialSides): number {
    const halfStep: number = ((FULL_TURN_DEGREES / sides) * RADIANS_PER_DEGREE) / 2;
    const holeApothem: number = INNER_RADIUS_FRACTION[sides] * Math.cos(halfStep);
    const hubApothem: number = holeApothem - 2 * SEAM_HALF_FRACTION;
    return (hubApothem * hubVertexExtent(sides)) / Math.cos(halfStep);
}

// The hub outline: EXACTLY the ring's inner-hole N-gon (flat-top, same
// orientation), scaled uniformly to fit the square hub box (a hexagon
// letterboxes vertically). Deliberately un-chamfered: the hole has plain
// vertices, so any extra corner cut on the hub would read as a second bevel
// and widen the moat at the corners - hub and hole stay parallel everywhere.
function hubOutline(sides: RadialSides): readonly Point[] {
    const step: number = FULL_TURN_DEGREES / sides;
    const vertices: Point[] = [];
    for (let index: number = 0; index < sides; index += 1) {
        vertices.push(polarPoint(1, (index + 0.5) * step));
    }
    const maxExtent: number = hubVertexExtent(sides);
    return vertices.map(
        (point: Point): Point => ({
            x: point.x / maxExtent,
            y: point.y / maxExtent,
        }),
    );
}

function toHubCell(points: readonly Point[]): RadialHubCell {
    const centroid: Point = polygonAreaCentroid(points);
    return {
        clipPath: polygonPath(points),
        anchorX: formatCoordinate(centroid.x),
        anchorY: formatCoordinate(centroid.y),
    };
}

// Hub cell layout vocabulary, derived from the action count. This is the hub
// button-area contract as a state enum: Single is the full face (both the
// 0-action panel and the 1-action full-bevel button), Split is the vertical
// two-way split, Grid is the 2x2; Triple covers a stray count of 3 (top row
// plus a bottom cell spanning the width).
const EHubLayout: {
    readonly Single: 'single';
    readonly Split: 'split';
    readonly Triple: 'triple';
    readonly Grid: 'grid';
} = {
    Single: 'single',
    Split: 'split',
    Triple: 'triple',
    Grid: 'grid',
};
type EHubLayout = (typeof EHubLayout)[keyof typeof EHubLayout];

function hubLayoutForCount(count: number): EHubLayout {
    if (count <= 1) {
        return EHubLayout.Single;
    }
    if (count === 2) {
        return EHubLayout.Split;
    }
    if (count === 3) {
        return EHubLayout.Triple;
    }
    return EHubLayout.Grid;
}

// Splits the rim-inset hub face into the layout's cells by clipping against
// the seam half-planes, so the hub background reads through as the machined
// seams between the action faces.
function hubCellsForLayout(
    face: readonly Point[],
    layout: EHubLayout,
): readonly (readonly Point[])[] {
    if (layout === EHubLayout.Single) {
        return [face];
    }
    const seam: number = HUB_SEAM_HALF_FRACTION;
    const left: readonly Point[] = clipPolygonToHalfPlane(face, 'x', -seam, true);
    const right: readonly Point[] = clipPolygonToHalfPlane(face, 'x', seam, false);
    if (layout === EHubLayout.Split) {
        return [left, right];
    }
    const topLeft: readonly Point[] = clipPolygonToHalfPlane(
        left,
        'y',
        -seam,
        true,
    );
    const topRight: readonly Point[] = clipPolygonToHalfPlane(
        right,
        'y',
        -seam,
        true,
    );
    if (layout === EHubLayout.Triple) {
        return [topLeft, topRight, clipPolygonToHalfPlane(face, 'y', seam, false)];
    }
    return [
        topLeft,
        topRight,
        clipPolygonToHalfPlane(left, 'y', seam, false),
        clipPolygonToHalfPlane(right, 'y', seam, false),
    ];
}

// The center hub geometry for a given side count and action count. The cell
// layout implements the hub contract: 0 -> one non-interactive panel cell,
// 1 -> one cell filling the whole face, 2 -> a vertical split (side-by-side
// halves), 4 -> a 2x2 grid.
export function radialHubGeometry(
    sides: RadialSides,
    count: number,
): RadialHubGeometry {
    const outline: readonly Point[] = hubOutline(sides);
    const face: readonly Point[] = insetConvexPolygon(outline, HUB_RIM_FRACTION);
    const cellCount: number = Math.max(
        0,
        Math.min(MAX_HUB_CELLS, Math.trunc(count)),
    );
    const layout: EHubLayout = hubLayoutForCount(cellCount);
    return {
        clipPath: polygonPath(outline),
        cells: hubCellsForLayout(face, layout).map(toHubCell),
        sizeFraction: String(roundCoordinate(hubSizeFraction(sides))),
    };
}
