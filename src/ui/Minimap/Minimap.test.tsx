import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Minimap } from './Minimap';
import { EMapMarkerKind, EMinimapShape, type MapMarker } from './Minimap.types';

const MARKERS: readonly MapMarker[] = [
    { id: 'self-echo', x: 0, y: 0, label: 'Echo', kind: EMapMarkerKind.Ally },
    {
        id: 'raider',
        x: 0,
        y: 100,
        label: 'Raider',
        kind: EMapMarkerKind.Hostile,
    },
    { id: 'beacon', x: 300, y: 0, label: 'Beacon', kind: EMapMarkerKind.Objective },
];

function markerOf(container: HTMLElement, id: string): Element {
    const marker: Element | null = container.querySelector(
        `[data-marker-id="${id}"]`,
    );
    expect(marker).not.toBeNull();
    if (marker === null) {
        throw new Error(`missing marker ${id}`);
    }
    return marker;
}

describe('Minimap', (): void => {
    it('speaks a labelled summary and keeps the drawing decorative', (): void => {
        const view: { container: HTMLElement } = render(
            <Minimap
                label="Tactical"
                markers={MARKERS}
                center={{ x: 0, y: 0 }}
                range={100}
            />,
        );
        expect(
            screen.getByRole('img', {
                name: 'Tactical: 3 markers within 100 range',
            }),
        ).toBeInTheDocument();
        expect(
            view.container.querySelector('svg[aria-hidden="true"]'),
        ).not.toBeNull();
        expect(screen.getByText('Tactical')).toBeInTheDocument();
    });

    it('projects markers into the viewBox with kind attributes', (): void => {
        const view: { container: HTMLElement } = render(
            <Minimap
                label="Tactical"
                markers={MARKERS}
                center={{ x: 0, y: 0 }}
                range={100}
            />,
        );
        // The co-located ally sits at center.
        expect(
            markerOf(view.container, 'self-echo').getAttribute('transform'),
        ).toBe('translate(50 50)');
        // Due north maps straight up to the ring radius.
        const raider: Element = markerOf(view.container, 'raider');
        expect(raider.getAttribute('transform')).toBe('translate(50 5)');
        expect(raider.getAttribute('data-kind')).toBe('hostile');
        expect(raider.getAttribute('data-clamped')).toBeNull();
        // Out of range east pins to the ring edge, dimmed.
        const beacon: Element = markerOf(view.container, 'beacon');
        expect(beacon.getAttribute('transform')).toBe('translate(95 50)');
        expect(beacon.getAttribute('data-clamped')).toBe('true');
    });

    it('rotates markers under headingUp and the chevron on north-up', (): void => {
        // Facing east, heading-up: the northern raider swings to the left rim.
        const headingUp: { container: HTMLElement } = render(
            <Minimap
                label="Tactical"
                markers={MARKERS}
                center={{ x: 0, y: 0 }}
                range={100}
                heading={90}
                headingUp={true}
            />,
        );
        expect(
            markerOf(headingUp.container, 'raider').getAttribute('transform'),
        ).toBe('translate(5 50)');
        expect(
            headingUp.container.querySelector('path[transform*="rotate(0 "]'),
        ).not.toBeNull();
        headingUp.container.remove();

        // North-up: markers stay put and the chevron rotates instead.
        const northUp: { container: HTMLElement } = render(
            <Minimap
                label="Tactical"
                markers={MARKERS}
                center={{ x: 0, y: 0 }}
                range={100}
                heading={90}
            />,
        );
        expect(
            markerOf(northUp.container, 'raider').getAttribute('transform'),
        ).toBe('translate(50 5)');
        expect(
            northUp.container.querySelector('path[transform*="rotate(90 "]'),
        ).not.toBeNull();
    });

    it('renders the square frame with square graticules', (): void => {
        const view: { container: HTMLElement } = render(
            <Minimap
                label="Tactical"
                markers={[]}
                center={{ x: 0, y: 0 }}
                range={100}
                shape={EMinimapShape.Square}
            />,
        );
        expect(
            view.container.querySelector('[data-shape="square"]'),
        ).not.toBeNull();
        expect(view.container.querySelectorAll('rect').length).toBeGreaterThan(0);
        expect(
            screen.getByRole('img', {
                name: 'Tactical: 0 markers within 100 range',
            }),
        ).toBeInTheDocument();
    });

    it('mounts the sweep only when requested', (): void => {
        const without: { container: HTMLElement; unmount: () => void } = render(
            <Minimap
                label="Tactical"
                markers={[]}
                center={{ x: 0, y: 0 }}
                range={100}
            />,
        );
        const frameChildren: number =
            without.container.querySelectorAll('div > div').length;
        without.unmount();
        const withSweep: { container: HTMLElement } = render(
            <Minimap
                label="Tactical"
                markers={[]}
                center={{ x: 0, y: 0 }}
                range={100}
                sweep={true}
            />,
        );
        expect(
            withSweep.container.querySelectorAll('div > div').length,
        ).toBeGreaterThan(frameChildren);
    });
});
