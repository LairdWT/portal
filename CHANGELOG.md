# Changelog

All notable changes to this project are documented in this file. The format is
based on Keep a Changelog, and the project follows Semantic Versioning with the
0.x caveat that, before 1.0, a minor version may carry a breaking change.

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
