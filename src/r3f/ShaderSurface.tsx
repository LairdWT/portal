import { Canvas, type RootState, useFrame } from '@react-three/fiber';
import {
    type Dispatch,
    type PointerEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ShaderMaterial } from 'three';

import { useReducedMotion } from '../react/hooks/useReducedMotion';
import type { ShaderDescriptor, ShaderUniforms } from '../shaders/shaderContract';
import { SCENE_DEVICE_PIXEL_RATIO_RANGE } from './sceneConfig';
import styles from './ShaderSurface.module.css';
import type { ShaderSurfaceProps } from './ShaderSurface.types';
import { isWebGlAvailable } from './webglSupport';

function composeClassName(base: string, extra?: string): string {
    return extra === undefined ? base : `${base} ${extra}`;
}

type ShaderFieldProps<TState> = Readonly<{
    shader: ShaderDescriptor<TState>;
    state: TState;
    uniforms: ShaderUniforms;
    timeRef: RefObject<number>;
}>;

// Lives inside the Canvas so useFrame can drive the shader's uniforms.
function ShaderField<TState>({
    shader,
    state,
    uniforms,
    timeRef,
}: ShaderFieldProps<TState>): ReactElement {
    const materialRef: RefObject<ShaderMaterial | null> =
        useRef<ShaderMaterial | null>(null);

    useFrame((rootState: RootState): void => {
        const elapsedSeconds: number = rootState.clock.elapsedTime;
        timeRef.current = elapsedSeconds;
        // Aspect from the live host size (not R3F's measured size, which lags in
        // nested absolute containers), forcing the buffer to match so grid cells
        // stay square instead of stretching with the canvas.
        const canvasElement: HTMLCanvasElement = rootState.gl.domElement;
        const host: HTMLElement | null = canvasElement.parentElement;
        const displayWidth: number = host?.clientWidth ?? rootState.size.width;
        const displayHeight: number = host?.clientHeight ?? rootState.size.height;
        if (displayWidth === 0 || displayHeight === 0) {
            return;
        }
        if (
            Math.round(rootState.size.width) !== displayWidth ||
            Math.round(rootState.size.height) !== displayHeight
        ) {
            rootState.setSize(displayWidth, displayHeight);
        }
        // R3F copies the uniforms prop into fresh wrappers, so the material's
        // uniforms is a different object than ours; mutating ours would never
        // reach the GPU. Point the material at our object once so shader.update
        // and the shared ripple arrays drive the real material uniforms.
        const material: ShaderMaterial | null = materialRef.current;
        if (material !== null && material.uniforms !== uniforms) {
            material.uniforms = uniforms;
        }
        shader.update(uniforms, state, {
            elapsedSeconds,
            aspectRatio: displayWidth / displayHeight,
        });
    });

    return (
        <mesh frustumCulled={false}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={shader.vertexShader}
                fragmentShader={shader.fragmentShader}
                uniforms={uniforms}
            />
        </mesh>
    );
}

export function ShaderSurface<TState>({
    shader,
    className,
    interactive = true,
}: ShaderSurfaceProps<TState>): ReactElement {
    const prefersReducedMotion: boolean = useReducedMotion();
    const state: TState = useMemo((): TState => shader.createState(), [shader]);
    const uniforms: ShaderUniforms = useMemo(
        (): ShaderUniforms => shader.createUniforms(state),
        [shader, state],
    );
    const timeRef: RefObject<number> = useRef<number>(0);
    // WebGL support is static per page, so probe it once via a lazy initializer
    // instead of creating a throwaway context on every render. Reduced motion
    // stays reactive (handled by useReducedMotion) because it can change live.
    const [webglAvailable]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(isWebGlAvailable);

    // Reduced motion (or no WebGL) degrades to a static token-styled panel; the
    // animation loop never starts.
    if (prefersReducedMotion || !webglAvailable) {
        return (
            <div
                className={composeClassName(styles.surface ?? '', className)}
                aria-hidden="true"
            >
                <div className={styles.fallback} />
            </div>
        );
    }

    const pointerHandler: ShaderDescriptor<TState>['handlePointer'] = interactive
        ? shader.handlePointer
        : undefined;

    function spawnFromEvent(event: PointerEvent<HTMLDivElement>): void {
        if (pointerHandler === undefined) {
            return;
        }
        const bounds: DOMRect = event.currentTarget.getBoundingClientRect();
        const u: number = (event.clientX - bounds.left) / bounds.width;
        const v: number = 1 - (event.clientY - bounds.top) / bounds.height;
        pointerHandler({ u, v, timeSeconds: timeRef.current }, state);
    }

    return (
        <div
            className={composeClassName(styles.surface ?? '', className)}
            aria-hidden="true"
            onPointerDown={
                pointerHandler === undefined ? undefined : spawnFromEvent
            }
            onPointerMove={
                pointerHandler === undefined
                    ? undefined
                    : (event: PointerEvent<HTMLDivElement>): void => {
                          if (event.buttons === 0) {
                              return;
                          }
                          spawnFromEvent(event);
                      }
            }
        >
            <Canvas
                className={styles.canvas}
                dpr={[...SCENE_DEVICE_PIXEL_RATIO_RANGE]}
                camera={{ position: [0, 0, 6], fov: 45 }}
                gl={{ antialias: true, powerPreference: 'high-performance' }}
            >
                <ShaderField
                    shader={shader}
                    state={state}
                    uniforms={uniforms}
                    timeRef={timeRef}
                />
            </Canvas>
        </div>
    );
}
