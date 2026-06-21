import { Float, Stars } from '@react-three/drei';
import type { Frameloop } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import { Component, lazy, Suspense, useMemo } from 'react';
import type { ColorRepresentation } from 'three';

import { useReducedMotion } from '../react/hooks/useReducedMotion';
import styles from './SceneBackdrop.module.css';
import type {
    BackdropBoundaryProps,
    BackdropBoundaryState,
    SceneBackdropProps,
} from './SceneBackdrop.types';
import { ERenderState } from './SceneBackdrop.types';

// Pixel-ratio cap. A two-entry tuple lets fiber pick within the range while
// never exceeding 2x, which keeps fragment cost bounded on dense displays.
const DPR_MIN: number = 1;
const DPR_MAX: number = 2;

const ACCENT_COLOR: ColorRepresentation = '#5f6dac';
const HIGHLIGHT_COLOR: ColorRepresentation = '#92a1e4';

// Class error boundary. This is the single sanctioned class in the surface:
// React requires componentDidCatch / getDerivedStateFromError on a class, and
// a decorative backdrop must never surface a WebGL failure to the consumer. On
// any child error the boundary renders null, so the page degrades silently.
class BackdropBoundary extends Component<
    BackdropBoundaryProps,
    BackdropBoundaryState
> {
    public constructor(props: BackdropBoundaryProps) {
        super(props);
        this.state = { renderState: ERenderState.Active };
    }

    public static getDerivedStateFromError(): BackdropBoundaryState {
        return { renderState: ERenderState.Failed };
    }

    public componentDidCatch(): void {
        // Decorative backdrop: swallow the error so a WebGL or asset failure
        // never surfaces to the consumer or the console as an unhandled crash.
    }

    public render(): ReactNode {
        switch (this.state.renderState) {
            case ERenderState.Failed:
                return null;
            case ERenderState.Active:
                return this.props.children;
        }
    }
}

// The 3D contents of the backdrop. Kept module-local so the component file
// exports only SceneBackdrop, preserving Fast Refresh purity. Stars supply an
// ambient starfield; a Float-ed icosahedron adds slow drifting motion. Float
// is disabled under reduced motion so nothing animates.
function BackdropScene({
    motionEnabled,
}: Readonly<{ motionEnabled: boolean }>): ReactElement {
    return (
        <>
            <ambientLight intensity={0.6} />
            <pointLight
                position={[4, 6, 4]}
                intensity={18}
                color={HIGHLIGHT_COLOR}
            />
            <Stars
                radius={80}
                depth={40}
                count={1200}
                factor={3}
                saturation={0}
                fade
                speed={motionEnabled ? 0.4 : 0}
            />
            <Float
                enabled={motionEnabled}
                speed={1.2}
                rotationIntensity={0.6}
                floatIntensity={1.1}
            >
                <mesh>
                    <icosahedronGeometry args={[1.4, 0]} />
                    <meshStandardMaterial
                        color={ACCENT_COLOR}
                        emissive={ACCENT_COLOR}
                        emissiveIntensity={0.25}
                        roughness={0.4}
                        metalness={0.1}
                        flatShading
                    />
                </mesh>
            </Float>
        </>
    );
}

// Dev-only performance overlay. In the published library build import.meta.env.DEV
// is statically false, so this ternary folds to the null component and the dynamic
// import is eliminated - r3f-perf never enters dist. In Storybook and dev it
// lazy-loads inside the Canvas.
const CanvasDevtools: ComponentType = import.meta.env.DEV
    ? lazy(
          async (): Promise<{ default: ComponentType }> => ({
              default: (await import('./CanvasDevtools')).CanvasDevtools,
          }),
      )
    : (): null => null;

export function SceneBackdrop({ className }: SceneBackdropProps): ReactElement {
    const prefersReducedMotion: boolean = useReducedMotion();
    const motionEnabled: boolean = !prefersReducedMotion;

    // Reduced motion freezes the render loop entirely so the GPU goes idle
    // after the first frame. Otherwise the loop runs continuously.
    const frameloop: Frameloop = motionEnabled ? 'always' : 'never';

    const baseClassName: string = styles.backdrop ?? '';
    const wrapperClassName: string =
        className === undefined ? baseClassName : `${baseClassName} ${className}`;

    const sceneContent: ReactElement = useMemo(
        (): ReactElement => <BackdropScene motionEnabled={motionEnabled} />,
        [motionEnabled],
    );

    return (
        <div className={wrapperClassName} aria-hidden="true">
            <BackdropBoundary>
                <Canvas
                    className={styles.canvas}
                    frameloop={frameloop}
                    dpr={[DPR_MIN, DPR_MAX]}
                    gl={{
                        antialias: true,
                        alpha: true,
                        powerPreference: 'low-power',
                    }}
                    camera={{ position: [0, 0, 6], fov: 50 }}
                >
                    <Suspense fallback={null}>
                        <CanvasDevtools />
                    </Suspense>
                    {sceneContent}
                </Canvas>
            </BackdropBoundary>
        </div>
    );
}
