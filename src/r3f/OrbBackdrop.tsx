import { MeshDistortMaterial } from '@react-three/drei';
import { Canvas, type RootState, useFrame } from '@react-three/fiber';
import {
    type ComponentRef,
    type Dispatch,
    type PointerEvent,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useMemo,
    useRef,
    useState,
} from 'react';
import { type Mesh, PerspectiveCamera, type ShaderMaterial } from 'three';

import { useReducedMotion } from '../react/hooks/useReducedMotion';
import type { ShaderDescriptor, ShaderUniforms } from '../shaders/shaderContract';
import styles from './OrbBackdrop.module.css';
import type { OrbBackdropProps } from './OrbBackdrop.types';
import { SCENE_DEVICE_PIXEL_RATIO_RANGE } from './sceneConfig';
import { isWebGlAvailable } from './webglSupport';

// Concrete mirror of --portal-color-accent-highlight; three needs a real colour,
// not a CSS var() reference. A bright highlight keeps the orb glossy.
const DEFAULT_ORB_COLOR: string = '#92a1e4';
const ORB_REST_SCALE: number = 0.3;
const ORB_REST_DISTORT: number = 0.4;

function composeClassName(base: string, extra?: string): string {
    return extra === undefined ? base : `${base} ${extra}`;
}

// Pointer-driven orb target the backdrop writes and the scene eases toward, so
// the orb leans toward contact and pulses on press without coupling to any
// controller state. x/y are centred -1..1; energy is bumped on press and decays.
type OrbControl = { x: number; y: number; energy: number };

type SceneProps<TState> = Readonly<{
    shader: ShaderDescriptor<TState>;
    state: TState;
    uniforms: ShaderUniforms;
    timeRef: RefObject<number>;
    controlRef: RefObject<OrbControl>;
    orbColor: string;
}>;

// Lives inside the Canvas so useFrame can drive the shader uniforms and the orb.
// The shader plane renders first (renderOrder -1, no depth write) as the
// backdrop; the centred orb sits in front and is the focal point.
function Scene<TState>({
    shader,
    state,
    uniforms,
    timeRef,
    controlRef,
    orbColor,
}: SceneProps<TState>): ReactElement {
    const orbRef: RefObject<Mesh | null> = useRef<Mesh | null>(null);
    const materialRef: RefObject<ComponentRef<typeof MeshDistortMaterial> | null> =
        useRef<ComponentRef<typeof MeshDistortMaterial> | null>(null);
    const gridMaterialRef: RefObject<ShaderMaterial | null> =
        useRef<ShaderMaterial | null>(null);

    useFrame((rootState: RootState): void => {
        const elapsedSeconds: number = rootState.clock.elapsedTime;
        timeRef.current = elapsedSeconds;

        // Drive the aspect from the live canvas host size read straight from the
        // DOM, not R3F's measured size, which mis-settles inside nested
        // absolutely-positioned containers and leaves the buffer a wrong shape
        // that stretches both the grid cells and the orb. Force the renderer,
        // camera, and shader uAspect to the true displayed aspect so grid cells
        // stay square and the orb stays round at any viewport ratio.
        const canvasElement: HTMLCanvasElement = rootState.gl.domElement;
        const host: HTMLElement | null = canvasElement.parentElement;
        const displayWidth: number = host?.clientWidth ?? rootState.size.width;
        const displayHeight: number = host?.clientHeight ?? rootState.size.height;
        if (displayWidth === 0 || displayHeight === 0) {
            return;
        }
        const aspectRatio: number = displayWidth / displayHeight;
        if (
            Math.round(rootState.size.width) !== displayWidth ||
            Math.round(rootState.size.height) !== displayHeight
        ) {
            rootState.setSize(displayWidth, displayHeight);
        }
        const camera: RootState['camera'] = rootState.camera;
        if (camera instanceof PerspectiveCamera && camera.aspect !== aspectRatio) {
            camera.aspect = aspectRatio;
            camera.updateProjectionMatrix();
        }

        // R3F copies the uniforms prop into fresh wrappers, so the material's
        // uniforms is a different object than the descriptor's (confirmed at
        // runtime: same=false). Mutating the descriptor object then never reaches
        // the GPU, which froze uAspect at 1 (stretched grid) and uTime at 0 (dead
        // ripples). Point the material at our object once so shader.update and the
        // shared ripple arrays drive the real material uniforms.
        const gridMaterial: ShaderMaterial | null = gridMaterialRef.current;
        if (gridMaterial !== null && gridMaterial.uniforms !== uniforms) {
            gridMaterial.uniforms = uniforms;
        }

        shader.update(uniforms, state, { elapsedSeconds, aspectRatio });

        const orb: Mesh | null = orbRef.current;
        if (orb === null) {
            return;
        }
        const control: OrbControl = controlRef.current;
        // Lean and drift toward the latest pointer target, with a gentle base
        // spin and a slow breathe so the orb is alive even at rest.
        orb.rotation.x += (-control.y * 0.5 - orb.rotation.x) * 0.08;
        orb.rotation.y += (control.x * 0.5 - orb.rotation.y) * 0.08;
        orb.rotation.z += 0.004;
        orb.position.x += (control.x * 0.6 - orb.position.x) * 0.08;
        orb.position.y += (control.y * 0.6 - orb.position.y) * 0.08;
        const breathe: number = Math.sin(elapsedSeconds * 1.4) * 0.04;
        const targetScale: number =
            ORB_REST_SCALE + breathe + control.energy * 0.12;
        orb.scale.setScalar(orb.scale.x + (targetScale - orb.scale.x) * 0.1);

        const material: ComponentRef<typeof MeshDistortMaterial> | null =
            materialRef.current;
        if (material !== null) {
            const targetDistort: number = ORB_REST_DISTORT + control.energy * 0.35;
            material.distort += (targetDistort - material.distort) * 0.1;
        }
        // The press pulse settles back to rest.
        control.energy *= 0.94;
    });

    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 4, 5]} intensity={1.4} />
            <mesh ref={orbRef} scale={ORB_REST_SCALE}>
                <icosahedronGeometry args={[1, 16]} />
                <MeshDistortMaterial
                    ref={materialRef}
                    color={orbColor}
                    distort={ORB_REST_DISTORT}
                    speed={1}
                    roughness={0.1}
                    metalness={0}
                />
            </mesh>
            <mesh frustumCulled={false} renderOrder={-1}>
                <planeGeometry args={[2, 2]} />
                <shaderMaterial
                    ref={gridMaterialRef}
                    vertexShader={shader.vertexShader}
                    fragmentShader={shader.fragmentShader}
                    uniforms={uniforms}
                    depthTest={false}
                    depthWrite={false}
                />
            </mesh>
        </>
    );
}

export function OrbBackdrop<TState>({
    shader,
    className,
    interactive = true,
    orbColor = DEFAULT_ORB_COLOR,
}: OrbBackdropProps<TState>): ReactElement {
    const prefersReducedMotion: boolean = useReducedMotion();
    const state: TState = useMemo((): TState => shader.createState(), [shader]);
    const uniforms: ShaderUniforms = useMemo(
        (): ShaderUniforms => shader.createUniforms(state),
        [shader, state],
    );
    const timeRef: RefObject<number> = useRef<number>(0);
    const controlRef: RefObject<OrbControl> = useRef<OrbControl>({
        x: 0,
        y: 0,
        energy: 0,
    });
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
                className={composeClassName(styles.backdrop ?? '', className)}
                aria-hidden="true"
            >
                <div className={styles.fallback} />
            </div>
        );
    }

    function applyPointer(event: PointerEvent<HTMLDivElement>): void {
        const bounds: DOMRect = event.currentTarget.getBoundingClientRect();
        const u: number = (event.clientX - bounds.left) / bounds.width;
        const v: number = 1 - (event.clientY - bounds.top) / bounds.height;
        const control: OrbControl = controlRef.current;
        control.x = (u - 0.5) * 2;
        control.y = (v - 0.5) * 2;
        if (shader.handlePointer !== undefined) {
            shader.handlePointer({ u, v, timeSeconds: timeRef.current }, state);
        }
    }

    return (
        <div
            className={composeClassName(styles.backdrop ?? '', className)}
            aria-hidden="true"
            onPointerDown={
                interactive
                    ? (event: PointerEvent<HTMLDivElement>): void => {
                          controlRef.current.energy = 1;
                          applyPointer(event);
                      }
                    : undefined
            }
            onPointerMove={
                interactive
                    ? (event: PointerEvent<HTMLDivElement>): void => {
                          if (event.buttons === 0) {
                              return;
                          }
                          applyPointer(event);
                      }
                    : undefined
            }
        >
            <Canvas
                className={styles.canvas}
                dpr={[...SCENE_DEVICE_PIXEL_RATIO_RANGE]}
                camera={{ position: [0, 0, 6], fov: 45 }}
                gl={{ antialias: true, powerPreference: 'high-performance' }}
            >
                <Scene
                    shader={shader}
                    state={state}
                    uniforms={uniforms}
                    timeRef={timeRef}
                    controlRef={controlRef}
                    orbColor={orbColor}
                />
            </Canvas>
        </div>
    );
}
