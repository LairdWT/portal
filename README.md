# Portal

Portal is a publishable React game-input and virtual-controller component
library. It provides reusable button, input, slider, panel, HUD, and
controller components, a decoupled input core, and an optional React Three
Fiber presentation surface.

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

import { Button } from 'portal';

export function Example(): JSX.Element {
    return <Button onPress={() => undefined}>Press</Button>;
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

## Scripts

- `pnpm verify` runs typecheck, lint, CSS lint, format check, tests, and
  build.
- `pnpm storybook` starts Storybook for component review.
- `pnpm build` produces the library bundle in `dist`.
