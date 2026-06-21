// Public prop and internal state contracts for the SceneBackdrop surface.
//
// The backdrop is purely decorative, so the public surface is intentionally
// minimal: a single optional className for layout placement by the consumer.
// Boolean-like internal state is modeled as an E-prefixed const-object enum
// per the Portal standards rather than a raw boolean.

import type { ReactNode } from 'react';

export type SceneBackdropProps = Readonly<{
    className?: string;
}>;

// Render lifecycle of the error boundary that guards the WebGL surface.
// Active: children render normally. Failed: a child threw, so the boundary
// renders nothing and the backdrop is silently absent.
export const ERenderState: {
    readonly Active: 'active';
    readonly Failed: 'failed';
} = {
    Active: 'active',
    Failed: 'failed',
};
export type ERenderState = (typeof ERenderState)[keyof typeof ERenderState];

export type BackdropBoundaryProps = Readonly<{
    children: ReactNode;
}>;

export type BackdropBoundaryState = Readonly<{
    renderState: ERenderState;
}>;
