import { Canvas, type RootState, useFrame } from '@react-three/fiber';
import {
    type PointerEvent,
    type ReactElement,
    type RefObject,
    useMemo,
    useRef,
} from 'react';

import { useReducedMotion } from '../react/hooks/useReducedMotion';
import type { ShaderDescriptor, ShaderUniforms } from '../shaders/shaderContract';
import styles from './ShaderSurface.module.css';
import type { ShaderSurfaceProps } from './ShaderSurface.types';

function isWebGlAvailable(): boolean {
    if (typeof document === 'undefined') {
        return false;
    }
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    const context: RenderingContext | null =
        canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    return context !== null;
}

function composeClassName(base: string, extra?: string): string {
    return extra === undefined ? base : `${base} ${extra}`;
}

type ShaderFieldProps<TState> = Readonly<{
    shader: ShaderDescriptor<TState>;
    state: TState;
    uniforms: ShaderUniforms;
    timeRef: RefObject<number>;
}>;

// Lives inside the Canvas so useFrame can drive the shader's uniforms. Mutating
// the shared uniforms object is the supported three pattern: values upload on
// the next render.
function ShaderField<TState>({
    shader,
    state,
    uniforms,
    timeRef,
}: ShaderFieldProps<TState>): ReactElement {
    useFrame((rootState: RootState): void => {
        const elapsedSeconds: number = rootState.clock.elapsedTime;
        timeRef.current = elapsedSeconds;
        shader.update(uniforms, state, {
            elapsedSeconds,
            aspectRatio: rootState.size.width / rootState.size.height,
        });
    });

    return (
        <mesh frustumCulled={false}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
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

    // Reduced motion (or no WebGL) degrades to a static token-styled panel; the
    // animation loop never starts.
    if (prefersReducedMotion || !isWebGlAvailable()) {
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
            <Canvas className={styles.canvas} dpr={[1, 1.5]}>
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
