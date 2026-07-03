import { type ReactElement } from 'react';

import { toneProperties } from '../tone';
import toneStyles from '../tone.module.css';
import {
    MINIMAP_VIEWBOX_CENTER,
    type MinimapProjection,
    projectMarker,
} from './mapMath';
import styles from './Minimap.module.css';
import {
    EMapMarkerKind,
    EMinimapShape,
    type MapMarker,
    type MinimapProps,
} from './Minimap.types';

// Ring radii for the decorative range graticule.
const GRATICULE_RADII: readonly number[] = [15, 30, 45];

// Marker glyph half-size in viewBox units.
const MARKER_SIZE: number = 3;

// The player chevron at the map center (points up; rotated by heading on a
// north-up map).
const CHEVRON_PATH: string = 'M 50 45.5 L 53.5 53 L 50 51 L 46.5 53 Z';

// One marker glyph per kind, drawn about the local origin: contact dot,
// ally ring, hostile triangle, objective diamond - shape carries the
// category, color only echoes it.
function markerGlyph(kind: EMapMarkerKind): ReactElement {
    switch (kind) {
        case EMapMarkerKind.Ally:
            return (
                <circle
                    className={styles.glyph}
                    r={MARKER_SIZE - 0.75}
                    fill="none"
                />
            );
        case EMapMarkerKind.Hostile:
            return (
                <path
                    className={styles.glyph}
                    d={`M 0 ${String(-MARKER_SIZE)} L ${String(MARKER_SIZE)} ${String(MARKER_SIZE)} L ${String(-MARKER_SIZE)} ${String(MARKER_SIZE)} Z`}
                />
            );
        case EMapMarkerKind.Objective:
            return (
                <path
                    className={styles.glyph}
                    d={`M 0 ${String(-MARKER_SIZE)} L ${String(MARKER_SIZE)} 0 L 0 ${String(MARKER_SIZE)} L ${String(-MARKER_SIZE)} 0 Z`}
                />
            );
        case EMapMarkerKind.Contact:
            return <circle className={styles.glyph} r={MARKER_SIZE - 1.5} />;
    }
}

// The Minimap: a non-interactive machined-HUD radar instrument. The frame
// and caption follow the Chart family; the drawing is decorative and a
// role=img summary carries the accessible surface. Markers project through
// the pure mapMath (heading-up rotation, edge pinning); the optional sweep
// is an infinite TRANSFORM rotation per the Spinner rule and disappears
// under reduced motion.
export function Minimap({
    label,
    markers,
    center,
    range,
    heading = 0,
    headingUp = false,
    sweep = false,
    shape = EMinimapShape.Circle,
    tone,
}: MinimapProps): ReactElement {
    const square: boolean = shape === EMinimapShape.Square;
    const mapRotation: number = headingUp ? heading : 0;
    const chevronRotation: number = headingUp ? 0 : heading;

    const className: string = [toneStyles.toneScope, styles.root]
        .filter((entry: string | undefined): entry is string => entry !== undefined)
        .join(' ');

    const summary: string = `${label}: ${String(markers.length)} ${
        markers.length === 1 ? 'marker' : 'markers'
    } within ${String(range)} range`;

    return (
        <figure className={className} style={toneProperties(tone)}>
            <figcaption className={styles.caption}>{label}</figcaption>
            <div
                className={styles.frame}
                data-shape={shape}
                role="img"
                aria-label={summary}
            >
                <svg
                    className={styles.map}
                    viewBox="0 0 100 100"
                    aria-hidden="true"
                >
                    {GRATICULE_RADII.map(
                        (radius: number): ReactElement =>
                            square ? (
                                <rect
                                    key={radius}
                                    className={styles.graticule}
                                    x={MINIMAP_VIEWBOX_CENTER - radius}
                                    y={MINIMAP_VIEWBOX_CENTER - radius}
                                    width={radius * 2}
                                    height={radius * 2}
                                />
                            ) : (
                                <circle
                                    key={radius}
                                    className={styles.graticule}
                                    cx={MINIMAP_VIEWBOX_CENTER}
                                    cy={MINIMAP_VIEWBOX_CENTER}
                                    r={radius}
                                />
                            ),
                    )}
                    <line
                        className={styles.graticule}
                        x1={MINIMAP_VIEWBOX_CENTER}
                        y1={5}
                        x2={MINIMAP_VIEWBOX_CENTER}
                        y2={95}
                    />
                    <line
                        className={styles.graticule}
                        x1={5}
                        y1={MINIMAP_VIEWBOX_CENTER}
                        x2={95}
                        y2={MINIMAP_VIEWBOX_CENTER}
                    />
                    {markers.map((marker: MapMarker): ReactElement => {
                        const projected: MinimapProjection = projectMarker(
                            { x: marker.x, y: marker.y },
                            center,
                            range,
                            mapRotation,
                            square,
                        );
                        return (
                            <g
                                key={marker.id}
                                className={styles.marker}
                                data-marker-id={marker.id}
                                data-kind={marker.kind ?? EMapMarkerKind.Contact}
                                data-clamped={
                                    projected.clamped ? 'true' : undefined
                                }
                                transform={`translate(${String(projected.x)} ${String(projected.y)})`}
                            >
                                <title>{marker.label}</title>
                                {markerGlyph(marker.kind ?? EMapMarkerKind.Contact)}
                            </g>
                        );
                    })}
                    <path
                        className={styles.chevron}
                        d={CHEVRON_PATH}
                        transform={`rotate(${String(chevronRotation)} ${String(MINIMAP_VIEWBOX_CENTER)} ${String(MINIMAP_VIEWBOX_CENTER)})`}
                    />
                </svg>
                {sweep ? <div className={styles.sweep} /> : null}
            </div>
        </figure>
    );
}
