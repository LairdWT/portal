# Portal Coding Standards

Portal is a publishable React game-input and virtual-controller component
library. These standards are the project authority and override any broader
global preference where they conflict.

## Language and types

- Strict TypeScript. No `any`. No `as unknown as T` chains. No non-null
  assertion without a local justification and a safer alternative considered.
- Explicit return types on every function: exported functions, React
  components, and hooks (the public boundary), and also internal/non-exported
  named functions and const-assigned arrow functions. Inline, contextually-typed
  callbacks (e.g. an argument to `.map`/`addEventListener`) are exempt. Enforced
  by `explicit-module-boundary-types` (the boundary) and
  `explicit-function-return-type` (internal declarations).
- Prefer `type` aliases over `interface` for data, props, and messages.
- Use discriminated unions for multi-state values and messages.
- Enums are banned as a language feature (erasable syntax only). Model named
  member sets as an E-prefixed annotated const object plus a derived union:

    ```ts
    export const EEnabledState: {
        readonly Enabled: 'enabled';
        readonly Disabled: 'disabled';
    } = {
        Enabled: 'enabled',
        Disabled: 'disabled',
    };
    export type EEnabledState = (typeof EEnabledState)[keyof typeof EEnabledState];
    ```

    The type annotation on the const object is required: `@typescript-eslint/typedef`
    runs with `variableDeclaration` enabled, so a bare `as const` object (which
    carries no annotation) is rejected.

- Reserve an `F` prefix for wire-payload structs only.

## Naming

- Idiomatic TypeScript: camelCase for variables and functions, PascalCase for
  components and types, E-prefixed const-object enums.
- Descriptive names; avoid single-letter identifiers.

## Theming and CSS

- Theme exclusively through CSS custom properties namespaced `--portal-*`.
  Components reference tokens, never literal colors or sizes.
- No fixed-pixel layout sizing and no viewport-stretch hacks. Use `clamp()`,
  `min()`, `max()`, intrinsic sizing, `aspect-ratio`, and container queries.
- Dynamic viewport height uses the progressive fallback
  `min-height: 100vh; min-height: 100svh;`.
- CSS Modules for component styles; stylelint config-standard plus
  config-css-modules.

## Accessibility

- Custom interactive elements carry role, label, and disabled state semantics.
- Minimum touch target of 48px (`--portal-touch-target-min: 3rem`). Ratified
  exception: the shared compact header/panel controls (`surfaces.module.css`
  `.compactControl`) restore the 3rem floor on the block axis via a transparent
  `::after` but keep a 2rem inline hit width so adjacent controls (e.g. a Window's
  minimize/maximize/close cluster) stay separately hittable; 2rem (32px) still
  clears the WCAG 2.5.8 (Target Size, Minimum) 24px floor.
- No hover-only interactions.
- Reduced motion: gate all animation behind `useReducedMotion` and
  `@media (prefers-reduced-motion: reduce)`.

## Architecture

- Input and render are decoupled. `src/input` has zero React imports: it owns
  the typed input contract and the pure pointer/dead-zone math.
- `src/react` binds the input spine to React via hooks.
- Components emit raw callbacks for simple consumers and an optional
  `onSignal(InputSignal)` for consumers wiring to game logic.
- In-library stories and examples import from specific module paths, never the
  package root barrel. Pulling the root barrel into the Storybook addon-vitest
  browser project churns Vite's dependency optimizer and fails the story's
  dynamic import.

## Discipline

- Negative-first guards with early return. No silent failure.
- Cleanup for every listener, timer, observer, and pointer capture.
- ASCII only in all files. No emojis. LF line endings.
- Do not modify `C:/dev/signal-runner`; it is a read-only exemplar.

## Exemplars

Patterns are lifted from (read-only):

- `C:/dev/signal-runner/shared/src/InputContract.ts`
- `C:/dev/signal-runner/controller/src/controller/ControllerPad.tsx`
- `C:/dev/signal-runner/controller/src/controller/ActionButton.tsx`
- `C:/dev/signal-runner/controller/src/design-system/state.ts`
- `C:/dev/signal-runner/controller/src/design-system/tokens.css`
