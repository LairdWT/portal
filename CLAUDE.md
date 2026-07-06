<!--
Lean agent root (see adr:project-adopts-the-agent-enhanced-project-layout
in docs/adr/). Keep under ~4KB; detail belongs in CODE.md and docs/adr/.
-->

# portal agent rules

Publishable React game-input and virtual-controller component library
(TypeScript, Vite, Storybook, Vitest, Playwright; pnpm). Repo:
github.com/LairdWT/portal, trunk = main.

## Read first

1. CODE.md - standards manifest (binding; read before writing code).
   Portal-specific rules there override the pinned web conventions.
2. docs/adr/ - decisions (binding; supersede, never edit history;
   uuid-named files, adr:<slug> references).
3. README.md + CHANGELOG.md - public API surface and release history.

## Commands

- Full gate (proves a change): `pnpm verify` (typecheck, lint, css lint,
  format check, unit + story tests, build).
- Faster loops: `pnpm typecheck`, `pnpm lint`, `pnpm test:run`,
  `pnpm e2e` (Playwright), `pnpm dev` (Storybook on 6006).
- Noisy output (vitest, playwright, vite build): route through
  `agent-code-skills logstrip run -- <cmd>` and analyze the stripped
  diagnostic, not raw logs.

## Hard rules

- Strict TypeScript per CODE.md: explicit return types, no `any`, no
  language enums - E-prefixed annotated const objects + derived unions.
- Negative-first guards with early return; no silent failure; cleanup
  for every listener, timer, observer, and pointer capture.
- `src/input` stays free of React imports (input/render decoupling).
- Theme only through `--portal-*` CSS custom properties; no fixed-pixel
  layout sizing; respect reduced motion.
- ASCII only, LF endings, no emojis. `C:/dev/signal-runner` is a
  read-only exemplar - never modify it.
- Import from specific module paths in stories/examples, never the
  package root barrel (Vite optimizer churn).

## Workflow

- Run `pnpm verify` before claiming a change works; CI (verify.yml,
  e2e.yml, adr-gate.yml) must stay green.
- Code intelligence: with typescript-lsp installed, fix post-edit
  diagnostics in the same turn.
- Pre-merge review: /aep:code-review (adversarial multi-agent review).
- New decision locked -> `python docs/adr/new-adr.py "Title"` (or
  /aep:adr-new), fill it, move the INDEX entry on acceptance.
- Conventional commits, subject <= 64 chars; reference adr:<slug> when
  implementing a decision. Version bumps follow CHANGELOG.md discipline.
