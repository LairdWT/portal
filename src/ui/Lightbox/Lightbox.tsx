import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useRef,
    useState,
    type WheelEvent as ReactWheelEvent,
} from 'react';

import {
    type PointerDragBinding,
    type PointerDragState,
    usePointerDrag,
} from '../../react/hooks/usePointerDrag';
import { Carousel } from '../Carousel/Carousel';
import { Dialog } from '../Dialog/Dialog';
import { EDialogSize } from '../Dialog/Dialog.types';
import styles from './Lightbox.module.css';
import type { LightboxProps } from './Lightbox.types';
import {
    clampPanOffset,
    clampZoomScale,
    ZOOM_MAX,
    ZOOM_MIN,
    ZOOM_STEP_FACTOR,
    ZOOM_TOGGLE_SCALE,
    ZOOM_WHEEL_FACTOR,
} from './lightboxZoom';

const SCALE_PROPERTY: string = '--lightbox-scale';
const PAN_X_PROPERTY: string = '--lightbox-pan-x';
const PAN_Y_PROPERTY: string = '--lightbox-pan-y';

// The live magnification: scale about center plus the clamped pan offsets.
type ZoomState = Readonly<{
    scale: number;
    x: number;
    y: number;
}>;

const ZOOM_RESET: ZoomState = { scale: ZOOM_MIN, x: 0, y: 0 };

type ViewerProps = Readonly<{
    label: string;
    items: LightboxProps['items'];
    tone: LightboxProps['tone'];
}>;

// The zoomable viewer body. A child component so its hooks never sit behind
// the parent's closed-state early return, and so the zoom state resets by
// unmounting whenever the lightbox closes.
function LightboxViewer({ label, items, tone }: ViewerProps): ReactElement {
    const frameRef: RefObject<HTMLDivElement | null> =
        useRef<HTMLDivElement | null>(null);
    const panOriginRef: RefObject<{ x: number; y: number }> = useRef<{
        x: number;
        y: number;
    }>({ x: 0, y: 0 });
    const [zoom, setZoom]: [ZoomState, Dispatch<SetStateAction<ZoomState>>] =
        useState<ZoomState>(ZOOM_RESET);
    const zoomed: boolean = zoom.scale > ZOOM_MIN;

    // Apply a new scale and re-clamp the pan into the shrunken (or grown)
    // overhang so the content never detaches from the frame.
    function applyScale(nextScaleRaw: number): void {
        const frame: HTMLDivElement | null = frameRef.current;
        const width: number = frame?.clientWidth ?? 0;
        const height: number = frame?.clientHeight ?? 0;
        const scale: number = clampZoomScale(nextScaleRaw);
        setZoom(
            (prev: ZoomState): ZoomState => ({
                scale,
                x: clampPanOffset(prev.x, width, scale),
                y: clampPanOffset(prev.y, height, scale),
            }),
        );
    }

    const panDrag: PointerDragBinding<HTMLDivElement> =
        usePointerDrag<HTMLDivElement>({
            onDragStart: (): void => {
                panOriginRef.current = { x: zoom.x, y: zoom.y };
            },
            onDrag: (state: PointerDragState): void => {
                setZoom(
                    (prev: ZoomState): ZoomState => ({
                        scale: prev.scale,
                        x: clampPanOffset(
                            panOriginRef.current.x + state.dx,
                            state.bounds.width,
                            prev.scale,
                        ),
                        y: clampPanOffset(
                            panOriginRef.current.y + state.dy,
                            state.bounds.height,
                            prev.scale,
                        ),
                    }),
                );
            },
        });

    function handleWheel(event: ReactWheelEvent<HTMLDivElement>): void {
        if (event.deltaY === 0) {
            return;
        }
        const factor: number =
            event.deltaY < 0 ? ZOOM_WHEEL_FACTOR : 1 / ZOOM_WHEEL_FACTOR;
        applyScale(zoom.scale * factor);
    }

    function handleDoubleClick(): void {
        applyScale(zoomed ? ZOOM_MIN : ZOOM_TOGGLE_SCALE);
    }

    // Wheel and double-click ride spreadable bindings (the SplitPane escape
    // hatch): the frame is a plain presentation surface and the pan layer is
    // role=presentation, so literal handlers would trip jsx-a11y even though
    // the toolbar buttons carry the real keyboard path.
    const frameBinding: Readonly<{
        onDoubleClick: () => void;
        onWheel: (event: ReactWheelEvent<HTMLDivElement>) => void;
    }> = { onDoubleClick: handleDoubleClick, onWheel: handleWheel };
    const panLayerBinding: PointerDragBinding<HTMLDivElement> &
        typeof frameBinding = { ...panDrag, ...frameBinding };

    const canvasStyle: CSSProperties = {
        [SCALE_PROPERTY]: String(zoom.scale),
        [PAN_X_PROPERTY]: `${String(zoom.x)}px`,
        [PAN_Y_PROPERTY]: `${String(zoom.y)}px`,
    };

    return (
        <>
            <div
                ref={frameRef}
                className={styles.frame}
                data-zoomed={zoomed ? 'true' : undefined}
                {...frameBinding}
            >
                <div className={styles.canvas} style={canvasStyle}>
                    <Carousel label={label} items={items} tone={tone} />
                </div>
                {zoomed ? (
                    <div
                        className={styles.panLayer}
                        role="presentation"
                        {...panLayerBinding}
                    />
                ) : null}
            </div>
            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={styles.zoomKey}
                    aria-label="Zoom out"
                    disabled={zoom.scale <= ZOOM_MIN}
                    onClick={(): void => {
                        applyScale(zoom.scale / ZOOM_STEP_FACTOR);
                    }}
                >
                    -
                </button>
                <span className={styles.zoomReadout}>
                    {`${String(Math.round(zoom.scale * 100))}%`}
                </span>
                <button
                    type="button"
                    className={styles.zoomKey}
                    aria-label="Zoom in"
                    disabled={zoom.scale >= ZOOM_MAX}
                    onClick={(): void => {
                        applyScale(zoom.scale * ZOOM_STEP_FACTOR);
                    }}
                >
                    +
                </button>
                <button
                    type="button"
                    className={styles.zoomKey}
                    aria-label="Reset zoom"
                    disabled={!zoomed}
                    onClick={(): void => {
                        setZoom(ZOOM_RESET);
                    }}
                >
                    1:1
                </button>
            </div>
        </>
    );
}

// The media viewer composition: Dialog owns the modal chrome (backdrop, trap,
// Escape, scroll lock), Carousel owns the slides, and the viewer layer owns
// zoom (wheel / double-click / toolbar) with a grab-pan overlay while zoomed.
// While magnified the overlay intercepts the carousel, so slides cannot
// change under a stale zoom; reset (or double-click) returns to the slide
// controls. The frame class caps slide media to the viewport so tall images
// never push the chrome away.
export function Lightbox({
    open,
    onClose,
    label,
    items,
    tone,
}: LightboxProps): ReactElement | null {
    if (!open) {
        return null;
    }
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={label}
            size={EDialogSize.Lg}
            tone={tone}
        >
            <LightboxViewer label={label} items={items} tone={tone} />
        </Dialog>
    );
}
