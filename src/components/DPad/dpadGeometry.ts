// Pure geometry for the DPad cross. No React, no DOM: four axis-aligned arm
// keys around a passive beveled center cap - the classic plus-shaped
// directional cross - plus four corner keys for EightWay, all expressed as
// clip-path polygons over the full pad box in the same machined language as
// the radial wedges (rim silhouette + inset face + glyph anchor). Coordinates
// live in unit space (the pad center is the origin, 1 is half the pad); the
// shared ui/polygonMath primitives do the rim insetting and anchor math.

import {
    formatCoordinate,
    insetConvexPolygon,
    type Point,
    polygonAreaCentroid,
    polygonPath,
} from '../../ui/polygonMath';
import { EDpadDirection } from './DPad.types';

// Everything the CSS needs to draw one directional key: the key silhouette,
// the rim-inset face, and the glyph anchor (the key's visual center).
export type DpadKeyGeometry = Readonly<{
    clipPath: string;
    faceClipPath: string;
    anchorX: string;
    anchorY: string;
}>;

// The full cross: one key per operable direction plus the passive center cap
// (its own silhouette and rim-inset face).
export type DpadGeometry = Readonly<{
    keys: Readonly<Partial<Record<EDpadDirection, DpadKeyGeometry>>>;
    capClipPath: string;
    capFaceClipPath: string;
}>;

// Half-width of a cardinal arm (and of the center cap, so the cross reads as
// one continuous plus shape). 0.32 of the half-pad = an arm ~46-48px wide at
// the pad's minimum size, on the touch floor.
const ARM_HALF_WIDTH: number = 0.32;

// The cap is the arm-width beveled square at the center.
const CAP_HALF: number = 0.32;

// Machined seam between the cap and each arm (and between arms and the
// EightWay corner keys), in unit space (~2-3px at the pad's size range).
const SEAM_FRACTION: number = 0.03;

// Outer extent of every key. Slightly inside 1 so the tone glow has room.
const OUTER_FRACTION: number = 0.97;

// Chamfer cut on the outward corners - the bevel corner identity at cross
// scale.
const CHAMFER_FRACTION: number = 0.1;

// Outer extent of the EightWay corner keys. Deliberately SHORT of the arms'
// outer edge so the plus-shaped cross stays the pad's silhouette and the
// diagonals read as tucked-in auxiliary keys. Their visible size is not a
// touch surface: pointer input rides the full-pad octant gesture, the keys
// are keyboard/AT-only.
const CORNER_OUTER_FRACTION: number = 0.82;

// Smaller chamfer on a corner key's corners, echoing the cap bevel.
const INNER_CHAMFER_FRACTION: number = 0.06;

// Rim thickness (the sliver between silhouette and face), ~2px at pad scale.
const RIM_INSET_FRACTION: number = 0.018;

// Rotates a point 90 degrees clockwise in screen space (+y down).
function rotateQuarter(point: Point): Point {
    return { x: -point.y, y: point.x };
}

function rotatePolygon(
    points: readonly Point[],
    quarterTurns: number,
): readonly Point[] {
    let rotated: readonly Point[] = points;
    for (let turn: number = 0; turn < quarterTurns; turn += 1) {
        rotated = rotated.map(rotateQuarter);
    }
    return rotated;
}

function toKeyGeometry(points: readonly Point[]): DpadKeyGeometry {
    const face: readonly Point[] = insetConvexPolygon(points, RIM_INSET_FRACTION);
    const anchor: Point = polygonAreaCentroid(points);
    return {
        clipPath: polygonPath(points),
        faceClipPath: polygonPath(face),
        anchorX: formatCoordinate(anchor.x),
        anchorY: formatCoordinate(anchor.y),
    };
}

// The UP arm: a rectangle from the cap seam to the outer edge with its two
// outward corners chamfered. The other cardinals are quarter rotations.
function upArm(): readonly Point[] {
    const w: number = ARM_HALF_WIDTH;
    const inner: number = CAP_HALF + SEAM_FRACTION;
    const outer: number = OUTER_FRACTION;
    const c: number = CHAMFER_FRACTION;
    return [
        { x: -w, y: -inner },
        { x: -w, y: -(outer - c) },
        { x: -(w - c), y: -outer },
        { x: w - c, y: -outer },
        { x: w, y: -(outer - c) },
        { x: w, y: -inner },
    ];
}

// The UP-RIGHT corner key: the block between the up and right arms, its
// outward corner chamfered like the arms and its inward corner lightly
// chamfered toward the cap. The other corners are quarter rotations.
function upRightCorner(): readonly Point[] {
    const start: number = ARM_HALF_WIDTH + SEAM_FRACTION;
    const outer: number = CORNER_OUTER_FRACTION;
    const c: number = CHAMFER_FRACTION;
    const ci: number = INNER_CHAMFER_FRACTION;
    return [
        { x: start, y: -outer },
        { x: outer - c, y: -outer },
        { x: outer, y: -(outer - c) },
        { x: outer, y: -start },
        { x: start + ci, y: -start },
        { x: start, y: -(start + ci) },
    ];
}

// The beveled center cap: the arm-width square with all four corners
// chamfered (a small octagon - the corner-shape bevel identity as geometry).
function centerCap(): readonly Point[] {
    const h: number = CAP_HALF;
    const c: number = CHAMFER_FRACTION;
    return [
        { x: -(h - c), y: -h },
        { x: h - c, y: -h },
        { x: h, y: -(h - c) },
        { x: h, y: h - c },
        { x: h - c, y: h },
        { x: -(h - c), y: h },
        { x: -h, y: h - c },
        { x: -h, y: -(h - c) },
    ];
}

// The full cross geometry. Static (the cross has one shape); computed once by
// the component at module scope.
export function dpadGeometry(): DpadGeometry {
    const up: readonly Point[] = upArm();
    const upRight: readonly Point[] = upRightCorner();
    const cap: readonly Point[] = centerCap();
    return {
        keys: {
            [EDpadDirection.Up]: toKeyGeometry(up),
            [EDpadDirection.Right]: toKeyGeometry(rotatePolygon(up, 1)),
            [EDpadDirection.Down]: toKeyGeometry(rotatePolygon(up, 2)),
            [EDpadDirection.Left]: toKeyGeometry(rotatePolygon(up, 3)),
            [EDpadDirection.UpRight]: toKeyGeometry(upRight),
            [EDpadDirection.DownRight]: toKeyGeometry(rotatePolygon(upRight, 1)),
            [EDpadDirection.DownLeft]: toKeyGeometry(rotatePolygon(upRight, 2)),
            [EDpadDirection.UpLeft]: toKeyGeometry(rotatePolygon(upRight, 3)),
        },
        capClipPath: polygonPath(cap),
        capFaceClipPath: polygonPath(insetConvexPolygon(cap, RIM_INSET_FRACTION)),
    };
}
