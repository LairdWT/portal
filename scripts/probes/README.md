# Visual probes

The story/axe gate proves semantics in a real browser, but only a probe
LOOKS at the rendered pixels and drives real pointer gestures - and because
development happens with the OS reduced-motion setting on, a probe is the
only place the full-motion paths are ever seen. These scripts make that
ritual repeatable instead of ad hoc.

Every probe is zero-arg, serves the existing `storybook-static` build on
its own local port, drives headless Chromium through `@playwright/test`
(already a devDependency), prints PASS/FAIL per check, exits non-zero on
any failure, and drops its screenshots in an OS-temp folder whose path it
prints. Build the Storybook first:

```sh
pnpm build-storybook
pnpm probe:hud   # the Patterns/Game HUD integration wiring
pnpm probe:rtl   # the dir="rtl" audit of direction-sensitive surfaces
```

Review the screenshots before claiming any visual behavior works - the
assertions catch wiring, but only eyes catch a clipped control or a
squeezed layout (both have happened).

Conventions for new probes: take the next free port (614x), reuse
`probeServer.mjs`, keep checks as `check(boolean, name)` so the exit code
stays honest, and never write artifacts into the repo.
