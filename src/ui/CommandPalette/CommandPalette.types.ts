// CommandPalette - public contract for the modal fuzzy command launcher.
//
// CommandPalette is a CONTROLLED modal overlay (an APG "combobox with listbox
// popup" nested in a role="dialog") that holds a filter input over a virtualized
// list of scored command results. It is the React-DOM realization of Helicon's
// command_palette: a caller-owned open flag and filter buffer over a flat command
// set, reporting at most one selected command id through onSelect and closing on
// activation (the host flips `open`).
//
// a11y: DOM focus stays on the role="combobox" input; the role="listbox" is never
// focusable and is navigated by aria-activedescendant. Tone drives the active
// rail / border / glow only, never the AA-critical option label colour. Every
// type is strict: explicit shapes, no `any`, discriminated unions for the row
// model, E-prefixed annotated const-object enums, Readonly props, the shared
// AccessibleName XOR-union and Toned mixes.

import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type AccessibleName } from '../accessibleName';
import { type EUiStatus, type Toned } from '../tone';

// Match strategy. Fuzzy (default) is subsequence scoring with ranking +
// highlight; Substring reproduces Helicon's matches_query exactly
// (label.contains || id.contains, case-insensitive) for strict parity. The
// string values double as the data-filter-mode attribute the CSS/tests read.
export const ECommandFilterMode: {
    readonly Fuzzy: 'fuzzy';
    readonly Substring: 'substring';
} = { Fuzzy: 'fuzzy', Substring: 'substring' };
export type ECommandFilterMode =
    (typeof ECommandFilterMode)[keyof typeof ECommandFilterMode];

// Row kind in the resolved listbox model. Header is a non-selectable group label
// (role="presentation"); Option is a selectable command row (role="option"). The
// discriminant the renderer and the virtualizer key off so a uniform row height
// windows both kinds.
export const ECommandRowKind: {
    readonly Header: 'header';
    readonly Option: 'option';
} = { Header: 'header', Option: 'option' };
export type ECommandRowKind =
    (typeof ECommandRowKind)[keyof typeof ECommandRowKind];

// One launchable command. Mirrors Helicon Command (id/label/shortcut/enabled)
// plus web-idiom additions. id is the stable identity reported through onSelect
// AND the fuzzy/substring match falls back to it (Helicon matches id too).
// keywords are extra match text (aliases) not shown in the label. group is the
// optional section label used for grouped rendering at empty query. icon and
// description are decorative/secondary (never the accessible name). enabled is
// the per-command enablement enum; a disabled command renders but is not
// activatable, matching add_enabled(false, ...).
export type UiCommand = Readonly<{
    id: string;
    label: string;
    keywords?: readonly string[];
    shortcut?: string;
    group?: string;
    description?: ReactNode;
    icon?: ReactNode;
    enabled?: EEnabledState;
}>;

// A scored, resolved row handed to the row renderer. Readonly. matchRanges are
// [start, end) index pairs into the label for highlight emphasis; empty for
// header rows and empty-query option rows. index is the absolute row index
// (matching the virtual window's absolute index).
export type CommandRow =
    | Readonly<{
          kind: typeof ECommandRowKind.Header;
          index: number;
          groupLabel: string;
      }>
    | Readonly<{
          kind: typeof ECommandRowKind.Option;
          index: number;
          command: UiCommand;
          matchRanges: readonly (readonly [number, number])[];
      }>;

// Props for CommandPalette. Controlled by construction (the host owns `open`,
// `query`, and the command corpus); the palette is pure presentation +
// navigation. AccessibleName (XOR label | labelledBy) is REQUIRED - the modal
// dialog and the combobox input both need an accessible name.
export type CommandPaletteProps = Readonly<{
    // Controlled visibility (mirrors Helicon CommandPaletteState.open).
    open: boolean;
    // Dismissal request (Escape, backdrop pointer). The host flips `open`.
    onClose: () => void;
    // The full command corpus (caller-owned; the palette owns no registry).
    commands: readonly UiCommand[];
    // Controlled filter buffer (Helicon's caller-owned state.query).
    query: string;
    onQueryChange: (query: string) => void;
    // Activation. Reports the chosen command id (Helicon response.selected). The
    // host runs the command and flips `open` to false.
    onSelect: (commandId: string) => void;
    // Ids surfaced as a "Recent" group when the query is empty (additive; omit
    // for none). Order is most-recent-first.
    recentCommandIds?: readonly string[];
    // Match strategy; default Fuzzy. Substring = strict Helicon parity.
    filterMode?: ECommandFilterMode;
    // Fixed result row height in CSS px for windowing; defaults to the
    // 3rem-equivalent (48) so a row clears --portal-touch-target-min.
    rowHeight?: number;
    overscan?: number;
    // Placeholder for the combobox input (Helicon SEARCH_FILTER_HINT analog).
    placeholder?: string;
    // Content when the corpus is empty (default EmptyState "No commands.").
    emptyContent?: ReactNode;
    // Content when commands exist but none match.
    noMatchesContent?: ReactNode;
    enabled?: EEnabledState; // gates the whole palette
    status?: EUiStatus; // default EUiStatus.None
}> &
    AccessibleName &
    Toned;
