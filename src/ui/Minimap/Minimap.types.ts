import { type Toned } from '../tone';
import { type MapPoint } from './mapMath';

// Marker category. The kebab values double as the data-kind attribute the
// CSS color map keys off; each kind ALSO draws a distinct glyph shape
// (contact dot, ally ring, hostile triangle, objective diamond) so meaning
// never rides color alone.
export const EMapMarkerKind: {
    readonly Contact: 'contact';
    readonly Ally: 'ally';
    readonly Hostile: 'hostile';
    readonly Objective: 'objective';
} = {
    Contact: 'contact',
    Ally: 'ally',
    Hostile: 'hostile',
    Objective: 'objective',
};
export type EMapMarkerKind = (typeof EMapMarkerKind)[keyof typeof EMapMarkerKind];

// The frame silhouette. The kebab values double as the data-shape attribute;
// out-of-range markers pin to the matching boundary (ring or square).
export const EMinimapShape: {
    readonly Circle: 'circle';
    readonly Square: 'square';
} = {
    Circle: 'circle',
    Square: 'square',
};
export type EMinimapShape = (typeof EMinimapShape)[keyof typeof EMinimapShape];

// One world entity on the map. `x`/`y` are world coordinates (+x east,
// +y north); `label` names the marker for the spoken summary and the SVG
// title. Out-of-range markers pin to the frame edge at reduced strength.
export type MapMarker = Readonly<{
    id: string;
    x: number;
    y: number;
    label: string;
    kind?: EMapMarkerKind | undefined;
}>;

// Props for the Minimap: a NON-interactive radar/map instrument in the
// Chart-family chrome (figure/figcaption frame). The consumer owns the world
// state (center, heading, markers); the map only draws it. The drawing is
// decorative (aria-hidden); a role=img summary speaks the label and the
// marker count.
//
// Optional props admit `undefined` explicitly so composition wrappers can
// forward their own optional values under exactOptionalPropertyTypes.
export type MinimapProps = Readonly<{
    /**
     * Caption text above the map; also the accessible summary's subject.
     */
    label: string;
    markers: readonly MapMarker[];
    /**
     * World position at the map center (the player).
     */
    center: MapPoint;
    /**
     * World distance mapped to the frame edge. Must be > 0; a degenerate
     * range collapses every marker to the center.
     */
    range: number;
    /**
     * Facing in degrees clockwise from north. Rotates the player chevron on
     * a north-up map, or the whole map under `headingUp`. Default 0.
     */
    heading?: number | undefined;
    /**
     * Rotate the map so the heading points up (markers counter-rotate; the
     * chevron stays fixed up). Default false: north-up.
     */
    headingUp?: boolean | undefined;
    /**
     * Radar sweep overlay - an infinite transform rotation (the Spinner
     * rule), decorative, and removed entirely under reduced motion.
     * Default false.
     */
    sweep?: boolean | undefined;
    shape?: EMinimapShape | undefined;
}> &
    Toned;
