# Changelog

All notable changes to this project are documented in this file. The format is
based on Keep a Changelog, and the project follows Semantic Versioning with the
0.x caveat that, before 1.0, a minor version may carry a breaking change.

## [Unreleased]

### Added

- `SecretField`: a masked secret/password input with native masking, a required
  current/new-password `autoComplete`, an accessible 48px show/hide toggle
  (`aria-pressed`, dynamic `aria-label`, non-submitting button), and caps-lock
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
