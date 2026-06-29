import { expect, it } from 'vitest';

import { type AccordionMultipleProps } from './ui/Accordion/Accordion.types';
import { type ColorPickerProps } from './ui/ColorPicker/ColorPicker.types';
import { type DataTableProps } from './ui/DataTable/DataTable.types';
import { type ListProps } from './ui/List/List.types';
import { type NavRailProps } from './ui/NavRail/NavRail.types';
import { type RadioGroupProps } from './ui/RadioGroup/RadioGroup.types';
import { type SearchBoxProps } from './ui/SearchBox/SearchBox.types';
import { type SegmentedControlProps } from './ui/SegmentedControl/SegmentedControl.types';
import { type SelectProps } from './ui/Select/Select.types';
import { ESelectionMode } from './ui/selectionMode';
import { type TabsProps } from './ui/Tabs/Tabs.types';
import { type TreeViewProps } from './ui/TreeView/TreeView.types';

// Compile-time freeze contract (1.0 stabilization, Track 3). Each annotated
// constant resolves to the literal `true` ONLY when its pinned public-API
// contract holds; if a prop is renamed or its shape regresses, the indexed
// access becomes `false` (or a type error) and assigning `true` no longer
// compiles, so `pnpm typecheck` fails. The runtime expect keeps the constants
// used and double-checks the canonical mode literal.

// `true` iff A is assignable to B (tuple-wrapped so a union A is checked whole).
type Assignable<A, B> = [A] extends [B] ? true : false;

it('freezes the 1.0 public-API contract (types compile, mode enum canonical)', (): void => {
    // 1. The controlled single-select prop is named `value` across the family.
    const radioValue: Assignable<string, RadioGroupProps['value']> = true;
    const segValue: Assignable<string, SegmentedControlProps['value']> = true;
    const tabsValue: Assignable<string, TabsProps['value']> = true;
    const navValue: Assignable<string, NavRailProps['value']> = true;
    // Select widens to string | null - assert `value` exists and accepts null.
    const selectValue: Assignable<null, SelectProps['value']> = true;

    // 2. The "set of ids" contract is ReadonlySet<string> (selection + expansion).
    const listSel: Assignable<
        ReadonlySet<string>,
        NonNullable<ListProps<unknown>['selectedKeys']>
    > = true;
    const tableSel: Assignable<
        ReadonlySet<string>,
        NonNullable<DataTableProps['selectedKeys']>
    > = true;
    const accExpand: Assignable<
        ReadonlySet<string>,
        AccordionMultipleProps['expandedIds']
    > = true;
    const treeExpand: Assignable<
        ReadonlySet<string>,
        TreeViewProps['expandedIds']
    > = true;

    // 3. One selection-mode enum, used by DataTable and List with the same shape.
    const tableMode: Assignable<
        NonNullable<DataTableProps['selectionMode']>,
        ESelectionMode
    > = true;
    const listMode: Assignable<
        NonNullable<ListProps<unknown>['selectionMode']>,
        ESelectionMode
    > = true;

    // 4. Value-string editors report through `onValueChange`.
    const searchCb: Assignable<
        SearchBoxProps['onValueChange'],
        ((value: string) => void) | undefined
    > = true;
    const colorCb: Assignable<
        ColorPickerProps['onValueChange'],
        ((value: string) => void) | undefined
    > = true;

    const allHold: boolean = [
        radioValue,
        segValue,
        tabsValue,
        navValue,
        selectValue,
        listSel,
        tableSel,
        accExpand,
        treeExpand,
        tableMode,
        listMode,
        searchCb,
        colorCb,
    ].every((held: boolean): boolean => held);

    expect(allHold).toBe(true);
    expect(ESelectionMode.Multi).toBe('multi');
});
