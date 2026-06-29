# Changelog

All notable changes to this project are documented in this file. The format is
based on Keep a Changelog, and the project follows Semantic Versioning with the
0.x caveat that, before 1.0, a minor version may carry a breaking change.

## [1.0.0] - 2026-06-29

The first stable release. Following a 1.0-readiness audit, the public API is
frozen: a set of pre-1.0 breaking corrections (below) make the surface
internally consistent, and a compile-time freeze contract
(`src/index.contract.test.ts`) plus a barrel export-name snapshot
(`src/index.barrel.test.ts`) guard it. From here, 1.x follows semver - breaking
changes will be major. Also folds in the deferred-backlog quality work.

### Breaking

Pre-1.0 public-API corrections, made now while they are cheap, so the 1.0
surface is internally consistent. A compile-time freeze contract
(`src/index.contract.test.ts`) and a barrel export-name snapshot
(`src/index.barrel.test.ts`) now lock these decisions.

- The controlled single-select prop is `value` everywhere: `NavRail` renamed
  `active` -> `value` (matching RadioGroup/SegmentedControl/Tabs/Select).
- The "set of ids" contract is `ReadonlySet<string>` everywhere: `List`
  selection and `Accordion` (multiple) expansion move from `readonly string[]`
  to `ReadonlySet<string>`, matching DataTable/TreeView. The two selection-mode
  enums are collapsed into one canonical `ESelectionMode` (`'multi'` literal),
  now exported from `./ui/selectionMode`; `EListSelectionMode` is removed.
- Per-item types drop the inconsistent `Ui` prefix: `UiRadioItem` -> `RadioItem`,
  `UiSegmentItem` -> `SegmentItem`, `UiSelectOption` -> `SelectOption`,
  `UiStep` -> `Step`, `UiTabItem` -> `TabItem`, `UiCommand` -> `Command`,
  `UiReadout` -> `Readout`, and the `UiMenu*Node` family -> `Menu*Node`.
  (The `EUiStatus` enum is unchanged - its name is not the per-item prefix.)
- `Tabs` now requires an accessible name (`AccessibleName`: `label` XOR
  `labelledBy`) - a nameless tablist is a compile error - and emits a
  deterministic per-tab `id` plus optional `controls` for the APG tab/tabpanel
  relationship.
- Value-string editors report through `onValueChange`: `SearchBox` and
  `ColorPicker` renamed `onChange` -> `onValueChange` (matching
  TextField/SecretField/PromptDialog).
- `ECtaButtonType` renamed to `CtaButtonType` - it is a bare string-union type
  and the `E` prefix is reserved for const-object enums.

### Fixed

- `StepTrack` no longer conveys step state by color alone: each step carries a
  visually-hidden status word (completed / current / not started) (WCAG 1.4.1).
- Tone layer: a universal `data-status` (danger/success) is now authoritative
  over an inline `--portal-tone` seed. Previously a component given BOTH a tone
  and a danger/success status rendered the tone (an inline custom property beats
  a stylesheet selector), silently dropping the status. The derived tone vars
  now read an intermediate `--portal-tone-resolved` seed that the `[data-status]`
  selector overrides and that the inline tone cannot reach, so status wins while
  plain tone is unchanged. A browser-project precedence-lock test guards it.

### Added

- `SearchableList` now wires `aria-controls` from its search input to the list
  it filters, via new optional, additive props: `id` on `List` (applied to its
  list/listbox root) and `ariaControls` on `SearchBox` (forwarded to the input).
  Existing `List`/`SearchBox` consumers are unaffected.
- `DataTable` and `Breadcrumb` accept `labelledBy` (the shared `AccessibleName`
  arm), so they can be named by a visible caption or heading without an inline
  `label`. A backward-compatible widening; existing `label` callers are
  unaffected.

### Changed

- `Select` and interactive `Rating` make `onChange` optional, matching the other
  controlled families (a controlled value with no `onChange` is a valid
  read-only display).
- Internal: the shared `.pressScale` surface utility's `scale()` factor moved
  from a literal to a `--portal-press-scale` token (mirrored in `PORTAL_TOKENS`),
  removing the last magic number from `surfaces.module.css`.
- Packaging: the published tarball no longer includes the non-public example or
  typecheck-only declarations (the example `.d.ts` and the stray `tsc` emit are
  excluded from `dist`). The README import samples and the component catalogue
  are corrected, the required `animejs` peer and the ESM-only resolver
  requirement are documented, and the `./shaders` entry point is documented. A
  package entry-point smoke test guards the `exports`-map subpaths.

## [0.12.0] - 2026-06-27

Adds the four standard web primitives a full-coverage component library expects
but Helicon does not model as discrete widgets, all in the machined-HUD bevel
language and under the established generic-UI patterns.

### Added

- `Checkbox` - a controlled, tri-aware boolean control over a real native
  checkbox input visually replaced by a beveled box. `indeterminate` is set
  imperatively on the DOM node (it is a property, not an attribute); a
  `CheckboxNaming` XOR union (a visible `label` or a `labelledBy` id) makes the
  accessible name a compile-time guarantee. Native focus, Space-to-toggle, and
  optional `name`/`value`/`required` form participation are preserved.
- `RadioGroup` - a controlled single-select radiogroup modeled on
  `SegmentedControl` (items array, roving tabindex, selection-follows-focus,
  Home/End, required `AccessibleName`) rendering circular radio markers, with
  per-item `disabled` that roving navigation skips and an `ERadioOrientation`
  (vertical default / horizontal) that sets the announced axis and layout.
- `Avatar` - a static identity marker with an image -> initials -> icon ->
  glyph fallback chain (declarative `onError` recovery), `EAvatarShape`
  Circle/Bevel, three token-driven `EAvatarSize` sizes, and an optional
  presence dot that carries a required visually-hidden label. Initials are
  derived by a pure, surrogate-pair-safe helper.
- `Skeleton` - a decorative loading placeholder with `ESkeletonVariant`
  Text/Block/Circle (multi-line Text with a ragged last bar) and
  `ESkeletonAnimation` Shimmer/Pulse/None. It is `aria-hidden` by default with
  an opt-in `label` that switches to a `role="status"` polite live region; both
  animations are gated behind `prefers-reduced-motion` with a static fallback.

### Changed

- New shared tokens for the additions: `--portal-avatar-size-sm/md/lg` and
  `--portal-skeleton-base` / `--portal-skeleton-highlight` /
  `--portal-skeleton-shimmer-duration` (mirrored into `PORTAL_TOKENS`). The
  skeleton shimmer duration sits outside the `--portal-duration-*` intent
  families by design (decorative looping motion, not an affordance timing).

## [0.11.0] - 2026-06-27

Completes Helicon component-type parity for the P3 (shells / advanced /
aesthetic) tier - eight new component types plus two shared hooks, all in the
machined-HUD bevel language.

### Added

- `usePointerDrag` - a dependency-free pointer drag/resize primitive (single
  active pointer with capture, a primary-button guard, an optional axis lock, a
  cumulative-delta callback model, and full cleanup on drag end and on unmount
  mid-drag). `useElementSize` - a ResizeObserver content-box measurement hook.
- `SplitPane` - a controlled resizable two-pane split with a role=separator
  divider (integer-percent aria-valuenow/min/max, full keyboard resize, a 3rem
  touch hit-zone).
- `Drawer` - an edge-docked panel with an `EDrawerMode` union (overlay modal
  sheet with focus-trap + scroll-lock, or in-flow docked) over `EDrawerEdge`
  (logical, RTL-aware), with a keyboard-resizable grip.
- `Window` - a draggable, optionally resizable floating frame (Floating + Modal)
  with a title-bar drag handle, viewport clamping, z-order/focus, and per-edge
  keyboard resize.
- `CommandPalette` - a fuzzy command launcher: a modal overlay over a SearchBox
  combobox and a virtualized command listbox (aria-activedescendant), with an
  exported `fuzzyMatch` primitive.
- `TitleBar` - a beveled HUD masthead with slot-forwarded leading/title/tagline/
  trailing/breadcrumb content over an `ETitleBarLandmark` union.
- `StatusFooter` - a beveled HUD bottom status strip with status tones and an
  optional live region.
- `Marquee` - a CSS-transform scrolling ticker with a seamless loop,
  pause-on-hover/focus, and a static reduced-motion fallback.
- `Scanlines` - a decorative CSS CRT overlay (pointer-events none, aria-hidden,
  reduced-motion gated) driven by new low-alpha `--portal-scanline-*` tokens.

### Changed

- Internal only: the standards-audit lint hardening from 0.10.1 now also gates
  these new components; the bevel/HUD foundation gained the scanline tokens
  (mirrored into `PORTAL_TOKENS`).

## [0.10.1] - 2026-06-27

Internal tooling only; no public API, component, or runtime behavior change.

### Changed

- Hardened the lint gate to enforce three TypeScript conventions the codebase
  already followed by hand (all at zero findings): `explicit-module-boundary-types`
  and `explicit-function-return-type` (return types on the public boundary and on
  internal named functions / const arrows; inline contextually-typed callbacks
  exempt), and `switch-exhaustiveness-check` (`considerDefaultExhaustiveForUnions`
  true, so no-default union switches still require every member while meaningful
  defaults are accepted). `CodingStandards.md` was broadened to match the gate.
- Documented the invariant behind the three legitimate boundary type assertions
  (two List bounded-index `undefined`-strips and the Tooltip child narrow).

## [0.10.0] - 2026-06-27

This release restyles the generic-UI layer into the machined-HUD bevel language
of the game-input controllers and completes Helicon component-type parity for
the P2 data-and-navigation tier (fourteen new component types).

### Added

- Bevel / HUD visual-language foundation. New shared tokens in `tokens.css`
  (`--portal-corner-shape: bevel`, `--portal-bevel-1/2/3` aliasing the radius
  scale, `--portal-hud-fill/-edge-width/-glow`, `--portal-weight-label-bold/
-strong`) and a new `src/theme/surfaces.module.css` of composable utilities
  (`.beveled`, `.metalTrim` animated ring + shared sheen keyframe, `.metalEdge`,
  `.metalFace`, `.wideLabel`, `.pressScale`) that components adopt by `composes`
  reference so no component re-invents a bevel or metal value.
- `Breadcrumb`, `Pagination`, `NumberStepper`, `Rating` - navigation and input
  primitives.
- `NavRail`, `StatTile` (+ `TileRow`), `KeyValue`, and the `Chart` family
  (`BarChart`, `StackedBar`, `RankedBars`, `RatioBar`, `LegendRow`) - density
  and metric surfaces.
- `TreeView` - a controlled, interface-forwarding `role=tree` with the APG
  keyboard model; expansion is a controlled `ReadonlySet` driven by new pure
  helpers in `src/ui/expansion.ts` (`toggleExpanded`, `setExpanded`,
  `expandAll`, `collapseAll`).
- `DataTable` - an always-virtualized `role=grid` with sortable headers, a
  controlled none/single/multi selection model (Ctrl-toggle, Shift-range), and
  a roving 2D `aria-activedescendant` cursor. Row windowing comes from a new
  shared `useVirtualWindow` hook.
- `Menu`, `MenuBar`, and `ContextMenu` - a Popover-based menu family with
  submenus, checkable/radio items, separators, type-ahead, and full APG
  keyboard. `EPopoverRole` gains a `Group` member for the menu surface frame.
- `ColorPicker` - a controlled hex color editor (RGB/HSV/Hex modes, optional
  alpha) over a dependency-free color-math core.
- `Accordion` - a controlled APG disclosure list with a type-safe single/
  multiple mode union, `inert` collapsed panels, and a reduced-motion-gated
  grid-rows reveal.
- `List` and `SearchableList` - a generic virtualized `List<Item>` (single/
  multi selection, full keyboard with type-ahead) reusing `useVirtualWindow`,
  and a master-detail `SearchableList<Item>` composed from `SearchBox`, the
  inner `List`, and `EmptyState`.
- `useVirtualWindow` - a shared, dependency-free vertical row-windowing hook
  (fixed row height, overscan) exported for consumer use and reused by
  `DataTable` and `List`.

### Changed

- VISIBLE restyle. The eighteen existing `src/ui` components are retrofitted
  from the drifted rounded / squircle corners to the beveled machined-HUD edge
  (`CTA`, `SelectableTile`, `SegmentedControl`, `Tabs`, `TextField`,
  `SecretField`, `SearchBox`, `Select`, `Panel`, `ReadoutPanel`, `Dialog`,
  `Popover`, `Badge`, `Chip`, `StatPill`, `StepTrack`, `Progress`, `Banner`;
  `Tooltip`/`Toast` inherit by cascade). Decorative circular markers are kept.
- Tone remains authoritative for borders, carets, and glows only; AA-critical
  text stays on the contrast-safe text/accent tokens, never an arbitrary tone.
- The stylelint config exempts the CSS-modules `composes` property from
  `value-keyword-case` so the camelCase shared utilities compose cleanly.

## [0.9.0] - 2026-06-26

### Added

- `SecretField`: a masked secret/password input with native masking, a required
  current/new-password `autoComplete`, an accessible 48px show/hide toggle
  (`aria-pressed`, a stable `aria-label`, non-submitting button), and caps-lock
  awareness. The value is parent-owned and is logged and reflected nowhere but
  the field's own input value.
- `PromptDialog` gains an opt-in `secret` prop (`SecretPromptOptions`) that
  renders the prompt as a masked `SecretField`, preserving Enter-to-submit and
  the focus-trap contract; the common text prompt is unchanged when omitted.

### Changed

- Motion duration tokens are split into two intent-named families. `frame-*`
  are real per-frame budgets for tactile game-input feedback
  (`--portal-duration-frame-fast` 7ms ~144 fps, `--portal-duration-frame-base`
  16ms ~60 fps, `--portal-duration-frame-slow` 33ms ~30 fps); `ui-*` are
  conventional affordance timings for the generic-UI layer
  (`--portal-duration-ui-fast` 120ms, `--portal-duration-ui-base` 200ms,
  `--portal-duration-ui-slow` 320ms).
- VISIBLE retiming of the generic-UI layer. Every `src/ui` transition that ran
  on the legacy 128ms workhorse is remapped per transition onto the `ui-*`
  scale: snappy hover/focus/small-affordance transitions to `ui-fast` (120ms),
  standard state and entrance motion to `ui-base` (200ms), and the larger modal
  Dialog entrance plus its backdrop fade to `ui-slow` (320ms).
- Game-input controllers in `src/components` move to the `frame-*` family; the
  fast tier is refined from 8ms to 7ms (a sub-millisecond, frame-accurate
  change). `Toggle` is a UI `role="switch"`, so it maps by intent to `ui-base`,
  not to `frame-*`.
- The CTA hover/press transition is moved off the 8ms tactile token (a foot-gun:
  a UI button on a per-frame duration) onto `--portal-duration-ui-fast` (120ms).
- Added `src/theme/tokens.duration.test.ts`, which pins every duration value,
  fences each consumer to its family, keeps the TS mirror in sync with the CSS,
  and asserts the legacy names are gone.

### Breaking

- The value-named and bare duration tokens are removed (pre-1.0 token rename).
  External CSS and TypeScript consumers must migrate:

    | Removed (value)                   | Replacement (value)                                                                                                              |
    | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
    | `--portal-duration-fast` (8ms)    | `--portal-duration-frame-fast` (7ms); UI buttons use `--portal-duration-ui-fast` (120ms)                                         |
    | `--portal-duration-base` (16ms)   | `--portal-duration-frame-base` (16ms)                                                                                            |
    | `--portal-duration-slow` (32ms)   | `--portal-duration-frame-slow` (33ms)                                                                                            |
    | `--portal-duration-ms64` (64ms)   | removed (unused); use `--portal-duration-ui-fast` (120ms)                                                                        |
    | `--portal-duration-ms128` (128ms) | `--portal-duration-ui-fast` (120ms), `--portal-duration-ui-base` (200ms), or `--portal-duration-ui-slow` (320ms), per transition |

- `PORTAL_TOKENS.duration` is now nested: the flat keys `duration.fast`,
  `duration.base`, `duration.slow`, `duration.ms64`, and `duration.ms128` are
  replaced by `duration.frame.{fast,base,slow}` and `duration.ui.{fast,base,slow}`.

## [0.8.0] - 2026-06-26

A large expansion of the generic-UI layer toward Helicon component-type parity,
plus a pre-1.0 accessibility hardening that is breaking.

### Added

- Generic-UI components: `Text`, `Badge`, `Section`, `EmptyState`, `Chip`,
  `SegmentedControl`, `SearchBox`, `Progress`, and `Banner`.
- Overlay infrastructure: the `Popover` primitive (portal-rendered,
  viewport-aware floating panel with flip/shift positioning, outside-click and
  Escape dismissal, and focus restore) and the `useDismiss`, `useFocusTrap`, and
  `useScrollLock` hooks.
- Overlay components: `Tooltip`, `Toast` (`ToastProvider` + `useToast`),
  `Dialog` with `ConfirmDialog` and `PromptDialog`, and `Select`
  (combobox/listbox).
- Shared `AccessibleName` prop contract and the `EOverlayMotion` enum.

### Changed

- Conformance pass across the P1 components: `Progress` drives its determinate
  fill with `transform: scaleX` (compositor) instead of `inline-size`, plus
  broader accessibility, typing, and test hardening.
- Overlay motion constants consolidated into the `EOverlayMotion`
  const-object enum; the emitted `data-motion` values (`full`/`reduced`) are
  unchanged.

### Breaking

- `SegmentedControl` and the dialog-role (default) `Popover` now require an
  accessible name - exactly one of `label` or `labelledBy` - through the shared
  `AccessibleName` union. Omitting it is now a compile error instead of a
  development-only runtime warning. The `menu`, `listbox`, and `tooltip` Popover
  roles keep an optional name, since they are named by their content or an ARIA
  relationship.
