# Changelog

All notable changes to this project are documented in this file. The format is
based on Keep a Changelog, and the project follows Semantic Versioning with the
0.x caveat that, before 1.0, a minor version may carry a breaking change.

## [1.7.0] - 2026-07-02

The Tier-1 "form stack" phase of the coverage roadmap: eleven additions that
make end-to-end forms buildable from the package alone. All public-API
changes are additive; the freeze holds.

### Added

- `Field`: form scaffolding wrapper (label / hint / error / required) wiring
  id, aria-describedby, aria-invalid, and aria-required to ANY control
  through a spreadable render-prop object; invalid forces the tone seed to
  danger for the whole scope.
- `TextArea`: the multiline TextField twin - rows, logical block-axis resize
  gate (`ETextAreaResize`), progressive `field-sizing: content` auto-sizing.
- `OtpField`: segmented one-time-code entry over ONE visually hidden native
  input (native paste splitting and backspace), sibling-selector cell
  mirror, `autocomplete="one-time-code"`, blinking caret (steady under
  reduced motion), `onComplete` at full length. `EOtpFieldMode` numeric/text.
- `RangeSlider`: dual-thumb min/max selector - two named `role=slider`
  thumbs with full APG keyboard clamped so the pair never crosses,
  float-safe step quantization, nearest-thumb pointer pickup across the
  whole track, logical fractions (RTL mirrors), `formatValue` ->
  aria-valuetext.
- `Combobox`: form-level single-value autocomplete - options fuzzy-ranked
  with the shared `fuzzyMatch` scorer, matched characters emphasized, shared
  Popover listbox with the full ARIA combobox contract; free text that
  matches nothing stays as typed.
- `TagInput`: multi-value token entry - removable Chips in a beveled shell
  behaving as one text control, Enter/comma commit, duplicate-safe,
  Backspace pops, optional fuzzy suggestion listbox excluding committed
  tags.
- `Calendar` + the zero-dependency `calendarMath` engine: an APG month grid
  with roving-tab-stop keyboard (arrows / paging / Home / End), Intl-driven
  month and weekday names and locale first-day-of-week, min/max windows and
  a disabled-date predicate, and a drawn today ring. `CalendarDate` plus
  `dateToIso` / `parseIsoDate` / `todayDate` are exported for value
  handling; the engine runs plain calendar-day objects over UTC arithmetic
  (DST-proof) with no date dependency.
- `DatePicker`: ISO text field + Calendar-in-Popover dialog. Strict
  YYYY-MM-DD commits (window-gated), clearing commits null, invalid drafts
  stay local with a format hint, picking commits and closes.
- `TimePicker`: segmented HH:MM(:SS) entry - real numeric segments with
  arrow stepping and wrap, select-on-focus replace typing, and an AM/PM key
  under the 12-hour cycle (`ETimePickerCycle`, defaulting from the locale);
  the value stays 24-hour.
- `FileUpload`: dropzone + browse over a real hidden file input - native
  picker and keyboard for free, drag state on the toned target ring,
  `accept`/`maxBytes` gating with per-file `EFileRejection` reasons,
  removable Chip file rows with formatted sizes.

## [1.6.0] - 2026-07-02

### Changed

- BREAKING-lean: `RadialMenu` now DEFAULTS to the collapsible inline form -
  the persistent themed hub toggle with the animated expand - and the
  portaled modal overlay becomes the opt-in via `collapsible={false}`. The
  prop surface is unchanged; only the default flipped (`RadialPad` still
  pins the overlay-free controller form explicitly). The Storybook demos
  follow: cancel-only is the default center hub (Previous/Next belong to
  the paged story), a `FullHub` story keeps the 2x2 grid, and an `Overlay`
  story demonstrates the modal form.
- Collapsible RadialMenu rest state redesigned: the hub face itself is the
  toggle and stays on the theme ramp - its mark is now a themed tone-accent
  plus (rotating into the cancel-cross while open) instead of the metal
  toggle chip. The inline box now collapses to exactly the hub footprint at
  rest and ANIMATES its growth to the full ring on expand (the wedges bloom
  with the percentage-based geometry; reduced motion snaps). The `Paged`
  story now presents the default eight-sided wheel paging sixteen items
  (was a four-sided demo). `surfaces.module.css` `plusGlyph` gains size and
  weight knobs (defaults unchanged).
- `RadialMenu.toggleIcon` / `RadialMenu.toggleText` (additive): optional
  visible content for the collapsed toggle face - a decorative icon and/or
  a short text label (either or both) replacing the default plus mark,
  while `label` keeps naming the toggle for assistive tech.

### Added

- Micro-interaction "juice" pass across the interactive catalogue, every
  addition transform/opacity-only, token-timed, and reduced-motion gated,
  with RTL mirrors wherever a physical transform meets logical layout:
    - Tabs / SegmentedControl: the selected indicator rail now lives on every
      tab collapsed to `scaleX(0)` and GROWS in on selection instead of
      popping.
    - Menu: submenu fly-outs animate in, rows nudge toward reading direction
      on hover, and the checkable tick / radio dot pop in at the moment of
      checking.
    - Select: option rows ease their hover fill with the same nudge, and the
      selected check pops in on selection.
    - List: the selection accent rail grows in (`scaleY`) when a row is
      selected.
    - SearchBox: the clear key pops in the moment the field becomes filled.
    - Toggle: the knob squashes under the press while it slides.
    - Rating: the hover/focus preview pip scales up so the provisional value
      reads at a glance.
    - StatPill / StatTile: the value readout pulses when the value changes -
      the first internal consumers of the exported `useChangeMotion` + `pulse`
      motion hooks. New `LiveTelemetry` StatPill story shows the tick.

### Fixed

- Skill-guided best-practices review (react-ts family): the Toggle knob
  slide and the HudPanel readout fill both animated layout properties
  (`inset-inline-start` / `inline-size`); each now rides `transform` with
  exact token-derived geometry and an RTL mirror. Dialog action buttons
  gained the `:not(:disabled)` interaction guards the rest of the library
  uses, and the DPad direction-collapse switch is exhaustively typed (no
  value-returning `default` over the union).
- The browser-mode Storybook test project pre-optimizes `animejs` so the
  motion hooks entering the module graph cannot trigger a mid-run Vite
  dependency reload.

## [1.5.1] - 2026-07-02

### Added

- `RadialMenu` pages its sections: when more items than sides are supplied,
  the center Next / Previous actions page through them (wrapping), the wedge
  entrance replays per page, and the page resets to one on every open.
  `onCenterAction` still fires for every press. New `Paged` story.
- `RadialMenu.collapsible` (with the new optional `onOpen`): the inline
  disclosure form of the radial. The center hub persists as the collapsed
  state - a toggle button named by `label`, wearing the shared toggle chip -
  and the wedges fan out around it in place on open and collapse back into
  it on close (Escape / outside press collapse it; non-modal, so no backdrop
  and no focus trap). New `Collapsible` story.
- `ENumberStepperFinish` (additive barrel export): NumberStepper's step keys
  now default to the quiet themed HUD finish; `finish` = Metal opts back
  into the brushed-metal BevelButton key face that was the previous default.
- `surfaces.module.css` gains `.toggleChip`: the TreeView twisty promoted to
  a shared universal disclosure chip (size and rotate knobs). TreeView
  composes it, and the collapsible radial hub adopts it as its toggle mark.

### Changed

- DPad rebuilt as a machined plus-shaped cross on the radial's geometry
  foundation (shared `ui/polygonMath` primitives): four chamfered cardinal
  arms around a passive beveled center cap, with tucked-in corner keys for
  EightWay - themed rim, brushed vignetted faces, engraved triangles, tone
  glow and recess on the held direction, clipped-shape focus. The FOUR-BUTTON
  CROSS is now the default `mode` (was EightWay); pointer/keyboard behavior
  and the signal streams are unchanged.
- Toast dismissal is animated: a dismissed card stays mounted through a
  reduced-motion-gated exit (fade + settle) and is removed on the exit
  animation's end (timer backstop); reduced motion removes immediately.
- Toggle's thumb wears the ActionButton tab face (the radial indent ramp;
  recessed when off, lit when on) instead of the brushed-metal ramp, scoped
  strictly to the knob box so the gradient can never bleed into the track.
- Marquee's play/pause control is the shared compactControl icon toggle
  (drawn glyph only, name on aria-label) instead of the wide worded metal
  key beside the strip.

### Fixed

- Window: the body pane now clamps to the frame when the window is resized
  narrower than its content (grid min-inline-size floor), instead of
  overflowing wider than the title bar.

## [1.5.0] - 2026-07-02

All public-API changes are additive-optional; the freeze holds.

### Added

- `RadialItem.iconOnly`: a radial section can present as a pure glyph key -
  the visible text is omitted while `label` still names the wedge for
  assistive tech (ignored when no icon is supplied, so a section never
  renders empty). New `IconSections` story demonstrates drawn SVG marks.
- `circleGlyph` joins the shared token-drawn glyphs in `surfaces.module.css`
  (a bordered ring on currentColor with size and stroke knobs), and
  `crossGlyph` gains a `--portal-cross-weight` knob (defaults to the thin
  border thickness, so every existing consumer renders unchanged).

### Changed

- Radial center hub redesigned. It is now EXACTLY the ring's inner-hole
  flat-top N-gon (square for 4 wedges, hexagon for 6, octagon for 8) - no
  extra vertex chamfer, which would read as a double bevel and widen the
  moat at the corners - so hub and ring stay parallel everywhere. The action
  cells are clip-polygon slices of the hub face (0 = non-interactive panel,
  1 = the whole face, 2 = vertical split, 4 = 2x2 grid) instead of grid
  rectangles sheared by an overflow corner, and each glyph anchors on its
  cell's area (shoelace) centroid - the perceived middle of the visible
  cell, not the vertex average. The hub is themed rather than metallic: an
  accent-highlight/tone rim over tone-fill faces. Confirm is now a bold
  success-green ring (was a check) and cancel a bold danger-red cross;
  next/previous keep their accent triangles; all four carry a soft
  self-colored bloom.
- Radial open/close is now stateful and animated both ways: opening staggers
  the wedges outward from the center while the hub and backdrop only fade;
  closing collapses the wedges back inward together and the surface unmounts
  when the exit animation ends (timer backstop; reduced motion closes
  immediately).
- Radial wedge seams are constant-width: the side edges are offset by a
  linear distance instead of an angular trim, so the gap between
  neighbouring wedges is identical at the inner and outer corners
  (unit-tested).
- Radial depth pass: menu wedge faces carry a center-dark radial wash with a
  tone rim-light and the shared scanline texture; controller faces recess
  the brushed ramp behind a center vignette.
- Radial cohesion pass: the wedges and the hub wear the SAME themed
  highlight/tone rim, so ring and center read as one lit machined assembly
  (variants differ only in their faces - HUD glass on the menu, brushed
  metal keys on the controller). The hub size is derived by the geometry
  module so its apothem sits exactly one wedge-seam width inside the ring's
  hole: the moat around the hub is the same machined seam that separates
  the wedges, and the action cells gain the reclaimed room. The inner hole
  is pulled in per side count to the 2x2 touch-floor limit, so the wedges
  deepen and the center reads smaller.
- Radial interaction juice (reduced-motion honored throughout): wedges lift
  a step outward along their own radial direction on hover with a tone
  glow; hub symbols swell on hover and dip on press; the activated wedge or
  action plays a selection flash - it pops and burns off while its siblings
  collapse; the backdrop gains a soft depth-of-field blur.
- Radial wedge labels size to an explicit per-side-count budget (not a max
  over shrink-to-fit), so the label box can never be squeezed by
  absolute-positioning width rules; the ellipsis fires only when the text
  truly exceeds the wedge's room.
- The radial side count is normalized at runtime (`4 | 6 | 8`; anything else
  resolves to the nearest supported polygon, non-finite input to the
  octagon default), so an out-of-range value from an untyped surface can
  never render NaN geometry; the Storybook `sides` control is now an
  inline-radio over exactly the supported counts.

### Removed

- `checkGlyph` from `surfaces.module.css` (internal and unconsumed once the
  radial confirm became the ring; CSS-module utilities are not part of the
  public API).

## [1.4.0] - 2026-07-02

All public-API changes are additive-optional; the freeze holds.

### Added

- `RadialMenu` (generic UI) and `RadialPad` (game-input controller) - an
  octagonal radial with 4-, 6-, and 8-sided variants. The sections are true
  wedges: clip-path slices of the flat-top N-gon between its outer edge and
  the inner hub hole, computed by a unit-tested geometry module, so the
  assembled sections read as the octagon / hexagon / square itself. They
  emerge from the center out to their edges with a staggered entrance
  (reduced-motion gated). The beveled center hub IS the button area: 0
  actions render a non-interactive machined panel, 1 fills the whole bevel,
  2 split it with a vertical seam, and 4 form a 2x2 grid of centered drawn
  symbols (`confirm` / `cancel` / `next` / `previous`) whose cells land
  exactly on the 3rem touch floor (repeated actions dedupe). Styling follows
  the tier canon: menu wedges are HUD-fill faces behind a static
  machined-metal rim (Tier 2); controller wedges are one continuous
  brushed-metal sheet inside the conic metal ring with dark engraved labels
  (Tier 1, matching `DPad` / `BevelButton`); hub faces stay dark in both
  variants so the status-colored symbols keep their legibility. Hit testing
  follows the visible shape - clicks in the moat between hub and ring, or
  outside the N-gon's corners, fall through to the backdrop and dismiss.
  Both are open/close modal overlays that reuse the shared overlay root,
  focus trap, and dismiss primitives; `RadialMenu` selects by
  `onSelect(id)`, `RadialPad` emits a per-target Digital `InputSignal` pulse
  (id-suffixed like `DPad`, e.g. `radial.section-0` / `radial.confirm`)
  alongside its raw callbacks. New `ERadialAction` value export and
  `RadialItem` / `RadialMenuProps` / `RadialPadProps` / `RadialSides` type
  exports.
- Two shared drawn glyphs in `surfaces.module.css`: `checkGlyph` (confirm tick)
  and `triangleGlyph` (rotatable equilateral triangle for next/previous), so the
  radial symbols reuse the same token-drawn glyph system as the existing
  cross/chevron marks rather than falling back to text.

## [1.3.0] - 2026-07-02

A remediation pass keyed off the post-1.2.0 deep review. All public-API changes
are additive-optional; the freeze holds.

### Added

- `DPad` gains an opt-in `directionSignals` prop. When set, `onSignal` emits
  per-direction digital signals on every transition (a `Release` for the
  previous direction, then a `Press` for the next, with ids suffixed
  `pad.up` / `pad.up-right` style), so a wire consumer can reconstruct the pad
  state. The default emission is unchanged and pinned by test.
- `EWindowFrame` is exported from the root barrel, joining its three sibling
  `Window` enums (it already typed the public `frame` prop).
- New `--portal-weight-label-medium` (600) token completes the label-weight
  ladder (mirrored nowhere; CSS-only like its siblings).
- The API freeze now also guards type exports: a new barrel type contract makes
  removing any `export { type ... }` from `index.ts` a compile error
  (additions stay free - the freeze is additive-optional).

### Fixed

- Stacked overlays no longer collapse together. Focus traps and dismiss
  listeners coordinate through shared layer stacks: only the topmost trap owns
  Tab (a `ConfirmDialog` over a `Dialog` no longer bounces focus forever), and
  one Escape or outside press peels one layer instead of closing the stack.
- Button presses are owned by a single pointer: a second touch on the same
  control can no longer double-emit `Press` or end another finger's held press
  (`useDigitalPress`, ActionButton/BevelButton/ControlSurface).
- Toast auto-dismiss pause tracks its two sources independently; with both
  hover and focus engaged, ending either no longer restarts the timers out
  from under the other.
- The virtualized `List` announces absolute option positions
  (`aria-setsize`/`aria-posinset`), follows item identity when a filter
  changes the list under the cursor, and shows its active ring only while
  focused.
- `DataTable` PageUp/PageDown moves a full viewport at the clamped top and
  bottom of the scroll range (was under-jumping by the missing overscan band).
- The `Drawer` resize handle is a `role="separator"` window splitter (matching
  `SplitPane`) and always announces a complete, meaningful value triplet plus
  `aria-valuetext` in pixels - an unbounded drawer no longer reads raw pixels
  against ARIA's implied maximum of 100.
- `Window` anchors its frame and compass resize handles physically so RTL
  documents no longer render a dragged window off-screen or flip the handle
  compass; a new RTL story documents the contract.
- A keyboard-opened `ContextMenu` returns focus to its opener on Escape
  instead of stranding focus on `body`; ContextMenu and MenuBar gain dedicated
  keyboard-path test files.
- `DPad` no longer compounds its center dead zone (the direction resolver
  re-checked the already-rescaled magnitude, swallowing raw inputs below
  ~0.36).
- AA-critical text stays off the tone seed: `Text`'s accent role and the ghost
  `CTA`'s hover/active label now use the AA-safe accent-highlight token.
- `usePointerControl` / `useRelativePointerControl` release a still-held
  pointer capture on unmount, matching `usePointerDrag`.

### Changed

- Internal hygiene, no visual change (before/after captures byte-identical):
  press feedback and font weights reference their tokens everywhere
  (`--portal-press-scale`, `--portal-weight-label-*`); Select, SearchBox,
  CommandPalette, and Menu compose the shared `.crossGlyph`/`.chevronGlyph`
  utilities instead of hand-rolling them (the shared chevron gains a
  `--portal-chevron-size` knob); `InputBinding`'s composite-key NUL separator
  is an escape sequence so git diffs the module as text; the orphaned,
  never-exported `CanvasDevtools` file is removed.
- `CodingStandards.md` ratifies the `.compactControl` geometry: the transparent
  extender restores the 3rem touch floor on the block axis only, keeping
  adjacent compact controls' hit areas separated (2rem inline width, above the
  WCAG 2.5.8 minimum).

## [1.2.0] - 2026-06-30

Additive features plus a large visual-consistency pass over the component
library, driven by owner review. No breaking changes; the frozen public API is
unchanged except for new additive optional props.

### Added

- `ColorPicker` gains an opt-in `channelInputs` prop. When set, each channel
  slider renders an adjacent number-only input that shows the value and edits it
  through the same controlled contract, each tagged with its channel letter
  (R/G/B/H/S/V/A). Hex mode now also accepts 3- and 4-digit shorthand
  (`#RGB`/`#RGBA`) and shows an `sRGB` color-space denotation. Defaults to
  `false`, so existing markup and tests are unchanged.
- `Window` gains an optional `frame` prop (`'highlight'` default, `'metal'`)
  selecting the frame outline treatment; the default is a normal highlight
  outline rather than the brushed-metal edge.

### Fixed

- HUD surfaces that placed a color in a non-final `background` layer (the shared
  `.metalEdge`/`.metalTrim` utilities, `Breadcrumb`, `SplitPane`, the `Drawer`
  overlay, `CommandPalette`) computed to transparent on spec-compliant browsers;
  they now paint opaque.
- Full-bleed components (`TitleBar`, `SearchableList`, `KeyValue`, `Chart`,
  `List`, `HudPanel`) no longer collapse to a vertical sliver in their Storybook
  stories (the stories opt into `layout: 'fullscreen'`).
- The R3F WebGL probe (`isWebGlAvailable`) leaked a GL context and cached its
  result, latching `OrbBackdrop` and `ShaderSurface` to their static fallback;
  the probe now releases its context. The ripple-grid shader also spawns gentle
  ambient ripples at idle so the effect is visible without pointer input.
- `DataTable` starts with no cell selected (was the unselectable header), uses a
  subtle highlight header instead of an over-bright fill, bevels its selection
  rings, and draws an equilateral sort caret.
- Focus outlines thinned to the 2px ring (`SearchBox`, `SecretField`, `Dialog`,
  `CTA`, `Accordion`, `DataTable`) so a focus ring no longer overlaps its label.
- Game-input controllers restyled to the machined-HUD language and corrected:
  `Slider` finger-groove thumb (smaller, de-metalled), `Toggle` metallic knob +
  toned track, `Thumbpad` filled triangle marker, `DPad` smaller with directional
  triangles, `HudPanel` square bars, `ControlSurface` containment and bevels.
- Visual refinements across `Rating`, `Checkbox`, `Menu`, `Marquee`, `Avatar`,
  `StatPill`, `StatTile`, `ReadoutPanel`, `NavRail`, `Section`, `Select`,
  `SplitPane`, `StepTrack`, `Chart`, `Popover`, and the tone-precedence story.
- `Window` controls reworked: the whole title bar is a drag region, resize grips
  no longer steal the close button's clicks, the corner resize boxes are gone,
  and the controls are compact boxes with drawn glyphs.
- The `Drawer` resize grip (a stray metal bar) was removed; free two-axis resize
  remains the `Window` component's role.
- Unified every close, dismiss, disclosure, and stepper control behind shared
  token-drawn glyph utilities (`.crossGlyph`, `.chevronGlyph`, `.minusGlyph`,
  `.plusGlyph`) and a `.compactControl` button, replacing the remaining ASCII
  `[x]`/`[v]`/`[+]`/`[-]` markers so the controls read identically everywhere.

### Docs

- The `UnityBindingExample` surfaces the press, held, and released phases with a
  richer wire-payload readout.
- Getting Started names the full sidebar taxonomy and the `primaryButtonOnly`
  opt-in and clarifies that `three` is also the `./shaders` peer; the README
  gains an example-app pointer and a refreshed hero image.

## [1.1.0] - 2026-06-30

Additive features, fixes, and tooling hardening on top of the 1.0.0 freeze. No
breaking changes; the frozen public API is unchanged and a guard contract keeps
it so.

### Added

- The game-input controllers gain an opt-in `primaryButtonOnly` prop
  (`ActionButton`, `BevelButton`, `DPad`, and the underlying pointer/press
  hooks). When set, a non-primary mouse button (right/middle) no longer starts a
  gesture or press, matching the existing drag behavior. It defaults to `false`,
  so existing behavior - and the emitted input signals - are unchanged.
- Storybook now ships an autodocs site with auto-generated prop tables plus
  three guides (Getting Started, Theming, Entry Points).

### Fixed

- Virtualized `List`/`DataTable` no longer drop the bottom partially-visible row
  at a fractional scroll offset (a blank strip up to one row tall while
  scrolling).
- `Rating` with `allowClear` no longer clears the value when a clamping keyboard
  key (ArrowRight/ArrowUp/End at the maximum, or Home at 1) re-selects the
  current value; clearing stays on direct re-activation or arrowing below 1.
- Entrance animations (`useEntranceOnReady`) no longer stay hidden when their
  timeline is rebuilt while already visible - e.g. after the OS reduce-motion
  setting is toggled off, or a preset changes, mid-mount.
- Toast auto-dismiss timing now uses a monotonic clock, so a system-clock step
  during a hover/focus pause can no longer dismiss a toast early or late.

### Changed

- Documentation accuracy: `three` is documented as a required peer for both
  `./r3f` and `./shaders` (the shader core imports it), and the README names the
  real `isWebGlAvailable` export.
- Tooling/CI hardening (no consumer-facing API change): extended real-browser
  e2e behavior coverage and a consumer-install packaging smoke; CI now gates
  `pnpm verify` (the freeze contract, type-check, lint, and the Storybook axe
  pass) plus a coverage threshold; the packaging-smoke script is type-checked;
  and the declaration-rollup's cosmetic TypeScript-version advisory is silenced
  so the build output is clean.

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
- Published types now resolve under `moduleResolution: node16` and `nodenext`,
  not only `bundler`. The declaration rollup previously emitted extensionless
  relative re-exports that the node16/nodenext ESM type resolver rejects (TS2305,
  "no exported member"), so consumers on those resolvers saw no types - despite
  the README and Entry Points guide listing them as supported. Each entry point
  is now bundled into a self-contained declaration file. A consumer-install
  packaging smoke (`pnpm smoke:pack`) resolves every subpath under node16 and
  bundler resolvers as a hard gate.
- `Tooltip` now satisfies WCAG 1.4.13 (Content on Hover or Focus): the tooltip
  stays open while the pointer moves onto its panel, instead of closing before
  the content can be reached. A real-browser e2e test asserts the hoverable
  behavior across the default and forced-colors profiles.

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
