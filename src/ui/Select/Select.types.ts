import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type EPopoverPlacement } from '../Popover/Popover.types';
import { type EUiStatus, type Toned } from '../tone';

// One option in a Select listbox. `id` is the opaque selection identity reported
// through onChange and compared against `value`; `label` is arbitrary renderable
// content (type-ahead matches it only when it is a plain string). `disabled`
// marks an option that is skipped by keyboard navigation and not selectable.
export type SelectOption = Readonly<{
    id: string;
    label: ReactNode;
    disabled?: boolean;
}>;

// Props for the Select: a single-select listbox-popup combobox covering Helicon's
// combo_control and filter_row combo. The control is controlled - `value` is the
// selected option id or null when empty, and `onChange` reports the next id (or
// null only when `clearable`). DOM focus stays on the trigger; the open listbox
// is navigated with aria-activedescendant. `id` falls back to a generated useId.
// `placeholder` shows when nothing is selected; an empty `options` list renders a
// disabled trigger. `enabled` is resolved through useResolvedEnabled. `clearable`
// adds a clear affordance that reports null. `placement` is the listbox's
// preferred side (default Bottom). `status` and `tone` flow through the tone scope.
export type SelectProps = Readonly<{
    label: string;
    options: readonly SelectOption[];
    value: string | null;
    onChange: (id: string | null) => void;
    id?: string;
    placeholder?: string;
    enabled?: EEnabledState;
    clearable?: boolean;
    placement?: EPopoverPlacement;
    status?: EUiStatus;
}> &
    Toned;
