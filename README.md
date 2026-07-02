# Portal

Portal is a publishable React game-input and virtual-controller component
library. It provides reusable button, input, slider, panel, HUD, and
controller components, a decoupled input core, and an optional React Three
Fiber presentation surface.

## Demo

![Portal RadialMenu: an octagonal radial menu of eight machined wedge sections (Attack, Defend, Item, Magic, Talk, Flee, Wait, Scan) around an octagonal center hub carrying a bold green confirm ring, a red cancel cross, and previous/next triangles, all framed in a lit accent rim over dark HUD glass.](https://raw.githubusercontent.com/LairdWT/portal/main/docs/portal-radial-menu.png)

The `RadialMenu` above is the flagship control: true wedge-shaped sections
computed as clip-path geometry around a center hub that holds 0, 1, 2, or 4
drawn action symbols, with staggered open/close animation, paging through the
center previous/next actions, and an inline collapsible form whose hub
persists as the toggle. Its Tier-1 sibling `RadialPad` shares the same
geometry and emits per-section input signals.

![Portal mobile controller: a beveled HUD readout band over a deep shader backdrop, and a metal-trimmed deck holding Start and Select keys, an analog stick, and an A/B/X/Y action grid. The live Storybook adds an animated distort orb over an interactive rippleGrid shader.](https://raw.githubusercontent.com/LairdWT/portal/main/docs/portal-controller.png)

Live, interactive Storybook (every control, the controller showcase with the
R3F orb backdrop, and the Unity-binding example):
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
pnpm add @laird-wt/portal
```

React, React DOM, and Anime.js are required peer dependencies (React 18 or
newer, Anime.js 4 or newer). Anime.js powers the motion presets exported from
the package root, so it is required even if you do not use the 3D surface:

```sh
pnpm add react react-dom animejs
```

The shader core depends on `three` (it imports `Color` and the `IUniform`
type), so `three` is a required peer whenever you import either `portal/shaders`
or `portal/r3f`. The `@react-three/fiber` and `@react-three/drei` peers are
needed only for the `portal/r3f` surface:

```sh
pnpm add three
pnpm add @react-three/fiber @react-three/drei
```

Portal is ESM-only. Use a bundler (Vite, webpack, Rollup, esbuild) or Node with
ESM enabled, and a TypeScript `moduleResolution` of `bundler`, `node16`, or
`nodenext` so the `exports` subpaths (`./theme`, `./r3f`, `./shaders`) resolve.

## Usage

Import components from the package root and load the stylesheet once at your
application entry point. The flagship `RadialMenu` in a few lines - an
octagonal action wheel with a confirm/cancel hub:

```tsx
import { type ReactElement, useState } from 'react';

import { ERadialAction, RadialMenu } from '@laird-wt/portal';
import '@laird-wt/portal/styles.css';

export function Example(): ReactElement {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button type="button" onClick={() => setOpen(true)}>
                Battle actions
            </button>
            <RadialMenu
                open={open}
                onClose={() => setOpen(false)}
                label="Battle actions"
                sides={8}
                items={[
                    { id: 'attack', label: 'Attack' },
                    { id: 'defend', label: 'Defend' },
                    { id: 'item', label: 'Item' },
                    { id: 'magic', label: 'Magic' },
                    { id: 'talk', label: 'Talk' },
                    { id: 'flee', label: 'Flee' },
                    { id: 'wait', label: 'Wait' },
                    { id: 'scan', label: 'Scan' },
                ]}
                centerActions={[ERadialAction.Confirm, ERadialAction.Cancel]}
                onSelect={(id) => console.log('selected', id)}
            />
        </>
    );
}
```

The radial also pages: pass more items than sides plus the
`ERadialAction.Previous` / `ERadialAction.Next` center actions and the wheel
pages through them. Pass `collapsible` (with `onOpen`) for the inline
disclosure form - the center hub stays mounted as the open/close toggle and
the wedges fan out around it in place. Sections take an optional `icon`
(with `iconOnly` for pure glyph keys), and every mode honors the user's
reduced-motion preference.

The optional 3D surface lives behind a separate entry point. Mount it inside a
React Three Fiber `<Canvas>` (the 3D peers above must be installed):

```tsx
import { Canvas } from '@react-three/fiber';

import { OrbBackdrop } from '@laird-wt/portal/r3f';

export function Backdrop(): ReactElement {
    return (
        <Canvas>
            <OrbBackdrop />
        </Canvas>
    );
}
```

## Theming

Portal exposes design tokens as CSS custom properties namespaced with the
`--portal-` prefix. Override any token on a containing element or on
`:root` to retheme the components:

```css
:root {
    --portal-color-accent: #3da9fc;
    --portal-radius-md: 0.75rem;
    --portal-touch-target-min: 3rem;
}
```

The theme entry point exports the token names (as `var()` references) for
programmatic use - for example to feed a React Three Fiber material the same
color the DOM uses:

```ts
import { PORTAL_TOKENS, type PortalTokens } from '@laird-wt/portal/theme';
```

Sizing uses `clamp`, `min`, `max`, and intrinsic units rather than fixed
pixels or viewport-stretch units. Layout is safe-area aware through the
`env(safe-area-inset-*)` values, touch targets meet the 3rem minimum, and
motion respects the user `prefers-reduced-motion` setting.

## Entry points

Portal ships several ESM subpath exports:

- `@laird-wt/portal` - the component library and React hooks.
- `@laird-wt/portal/styles.css` - the stylesheet; import once at your entry.
- `@laird-wt/portal/theme` - `PORTAL_TOKENS` and the `PortalTokens` type.
- `@laird-wt/portal/r3f` - the optional React Three Fiber surface
  (`OrbBackdrop`, `ShaderSurface`, `isWebGlAvailable`); requires the 3D peers.
- `@laird-wt/portal/shaders` - the shader core behind the R3F surface
  (`rippleGridShader`, `createRippleField`, and the `ShaderDescriptor` contract)
  for consumers wiring their own renderer. It needs only the `three` peer, not
  the full `@react-three/fiber`/`@react-three/drei` stack.

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
import { TimeProviderContext } from '@laird-wt/portal';

<TimeProviderContext.Provider value={() => engineClock.nowMs()}>
    <Controller />
</TimeProviderContext.Provider>;
```

Inputs are mapped to actions by a data-driven registry rather than hard-coded
in the controls. The registry is immutable; each mutator returns a new
registry, and a binding can be scoped to a named context (a profile such as
`menu` or `gameplay`) with a global fallback:

```ts
import { createRegistry } from '@laird-wt/portal';

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

A domain-agnostic UI layer, separate from the game-input controllers above. It
emits plain value and selection callbacks and never the input-signal contract,
so it suits any React UI, not only game input. It spans, among others:

- Inputs and forms: `CTA`, `TextField`, `SecretField`, `SearchBox`, `Select`,
  `Checkbox`, `RadioGroup`, `SegmentedControl`, `NumberStepper`, `Rating`,
  `ColorPicker`, `Toggle`.
- Data and navigation: `List` / `SearchableList`, `DataTable`, `TreeView`,
  `Accordion`, `Tabs`, `Breadcrumb`, `Pagination`, `NavRail`,
  `Menu` / `MenuBar` / `ContextMenu`, `CommandPalette`, `RadialMenu` (the
  flagship radial action wheel; `RadialPad` is its game-input sibling).
- Surfaces and overlays: `Panel`, `ReadoutPanel`, `Section`, `Dialog`,
  `Drawer`, `Popover`, `Tooltip`, `Toast`, `Window`, `SplitPane`.
- Display and feedback: `Text`, `Badge`, `Chip`, `StatPill`, `StatTile`,
  `KeyValue`, the `Chart` family, `Progress`, `Banner`, `Avatar`, `Skeleton`,
  `EmptyState`, `Marquee`, `Scanlines`, `StepTrack`, `TitleBar`, `StatusFooter`,
  `SelectableTile`.

See the live Storybook (linked above) for the full, current catalogue with
interactive examples.

Colour comes from one opaque `tone` prop rather than a fixed palette. A
component sets `--portal-tone` from it and derives its accent, border, glow, and
fill, so a consumer maps any domain palette without per-component CSS:

```tsx
import { SelectableTile, StatPill } from '@laird-wt/portal';

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

## Example app

A runnable Vite demo lives in `example/`. Run `pnpm -C example dev` to start it
locally (it renders `ControlSurface` with behavior fixtures selectable via a
`?fixture=` query), and `pnpm example:typecheck` to typecheck the demo against
the workspace package.
