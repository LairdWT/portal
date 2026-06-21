# Portal

Portal is a publishable React game-input and virtual-controller component
library. It provides reusable button, input, slider, panel, HUD, and
controller components, a decoupled input core, and an optional React Three
Fiber presentation surface.

## Demo

![Portal mobile controller: HUD readouts, an analog joystick, and action buttons](https://raw.githubusercontent.com/LairdWT/portal/main/docs/portal-controller.png)

Live, interactive Storybook (every control plus the Unity-binding example):
https://lairdwt.github.io/portal/

## Stack

- React and TypeScript.
- Vite in library mode.
- CSS Modules with CSS custom-property theming.
- Anime.js for UI motion.
- React Three Fiber and Drei for the optional 3D surface.
- Storybook, Playwright, and Vitest for review and testing.

## Install

```sh
pnpm add portal
```

React and React DOM are required peer dependencies (version 18 or newer):

```sh
pnpm add react react-dom
```

The React Three Fiber surface is optional. Install the 3D peers only when
you import from `portal/r3f`:

```sh
pnpm add three @react-three/fiber @react-three/drei
```

## Usage

Import components from the package root and load the stylesheet once at your
application entry point:

```tsx
import 'portal/styles.css';

import { CTA } from 'portal';

export function Example(): JSX.Element {
    return <CTA onClick={() => undefined}>Press</CTA>;
}
```

The optional 3D surface lives behind a separate entry point:

```tsx
import { ControllerSurface } from 'portal/r3f';
```

## Theming

Portal exposes design tokens as CSS custom properties namespaced with the
`--portal-` prefix. Override any token on a containing element or on
`:root` to retheme the components:

```css
:root {
    --portal-color-accent: #3da9fc;
    --portal-radius-control: 0.75rem;
    --portal-touch-target-min: 3rem;
}
```

The theme entry point exports the token names and default values for
programmatic use:

```ts
import { portalTokens } from 'portal/theme';
```

Sizing uses `clamp`, `min`, `max`, and intrinsic units rather than fixed
pixels or viewport-stretch units. Layout is safe-area aware through the
`env(safe-area-inset-*)` values, touch targets meet the 3rem minimum, and
motion respects the user `prefers-reduced-motion` setting.

## Input and Unity binding

Portal's input core is decoupled from React and from any game. A control
describes itself with an `InputDescriptor` (an opaque id, a value kind, and a
label) and emits an `InputSignal` carrying the value, the interaction, and a
timestamp. Controls share emit hooks so the wiring is uniform:

- `useDigitalPress` and `useEmitBinding` for button-like inputs.
- `useAxis2DControl` for absolute (joystick) and relative (thumbpad) pads.
- `useScalarControl` for sliders.

Timestamps come from an injectable `TimeProvider` (default `performance.now`).
Override it through `TimeProviderContext` to make emission deterministic in
tests or to align the clock with a host application:

```tsx
import { TimeProviderContext } from 'portal';

<TimeProviderContext.Provider value={() => engineClock.nowMs()}>
    <Controller />
</TimeProviderContext.Provider>;
```

Inputs are mapped to actions by a data-driven registry rather than hard-coded
in the controls. The registry is immutable; each mutator returns a new
registry, and a binding can be scoped to a named context (a profile such as
`menu` or `gameplay`) with a global fallback:

```ts
import { createRegistry } from 'portal';

const registry = createRegistry([
    { inputId: 'fire', actionId: 'weapon.primary' },
    { inputId: 'fire', actionId: 'ui.confirm', context: 'menu' },
]);

registry.resolve('fire').actionId; // 'weapon.primary'
registry.resolve('fire', 'menu').actionId; // 'ui.confirm'
const rebound = registry.rebind('fire', 'weapon.special');
```

At the Unity boundary, `toWireInput` narrows a signal to a serializable
`FInputWirePayload` (the descriptor collapsed to its id, plus the interaction,
value, and timestamp) and throws if a value does not match the descriptor's
declared kind. The `Patterns/Unity Binding` Storybook story wires a binding
profile, a custom `TimeProvider`, and the wire codec together.

## Generic UI components

A domain-agnostic UI layer for click and selection surfaces, separate from the
game-input controllers above: `CTA` (click button), `Panel`, `SelectableTile`,
`StatPill`, `Tabs`, `StepTrack`, `ReadoutPanel`, and `TextField`. These emit
plain callbacks (`onClick`, `onSelect`, `onChange`) and never the input-signal
contract, so they suit any React UI, not only game input.

Colour comes from one opaque `tone` prop rather than a fixed palette. A
component sets `--portal-tone` from it and derives its accent, border, glow, and
fill, so a consumer maps any domain palette without per-component CSS:

```tsx
import { SelectableTile, StatPill } from 'portal';

<SelectableTile id="ship-1" tone="var(--faction-crimson)" onSelect={select}>
    Frigate
</SelectableTile>;
<StatPill label="Energy" value={7} tone="oklch(0.7 0.16 150)" />;
```

With no `tone`, components use the neutral portal accent. An optional
`SelectionProvider` supplies an ambient selection sink so tiles are wired once
rather than per control.

## Scripts

- `pnpm verify` runs typecheck, lint, CSS lint, format check, tests, and
  build.
- `pnpm storybook` starts Storybook for component review.
- `pnpm build` produces the library bundle in `dist`.
