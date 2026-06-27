import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type CSSProperties,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { EUiStatus } from '../tone';
import { CommandPalette } from './CommandPalette';
import { ECommandFilterMode, type UiCommand } from './CommandPalette.types';

// A single (non-union) story args shape. CommandPalette's props are an XOR union
// (AccessibleName), which collapses Storybook's arg inference to `never`; the
// stories only ever exercise the `label` form, so a flat args type keeps the meta
// and story typing sound while still feeding valid CommandPalette props.
type CommandPaletteStoryArgs = Readonly<{
    commands: readonly UiCommand[];
    label: string;
    initialQuery?: string;
    recentCommandIds?: readonly string[];
    filterMode?: ECommandFilterMode;
    placeholder?: string;
    enabled?: EEnabledState;
    status?: EUiStatus;
    tone?: string;
}>;

const OPENER_STYLE: CSSProperties = {
    minBlockSize: 'var(--portal-touch-target-min)',
    paddingInline: 'var(--portal-space-4)',
    borderRadius: 'var(--portal-radius-md)',
    border: 'var(--portal-border-thickness-thin) solid var(--portal-color-border)',
    background: 'var(--portal-color-surface-0)',
    color: 'var(--portal-color-text-0)',
    cursor: 'pointer',
};

const COMMANDS: readonly UiCommand[] = [
    { id: 'file.new', label: 'New File', shortcut: 'Ctrl N', group: 'File' },
    { id: 'file.open', label: 'Open File', shortcut: 'Ctrl O', group: 'File' },
    { id: 'file.save', label: 'Save', shortcut: 'Ctrl S', group: 'File' },
    {
        id: 'edit.undo',
        label: 'Undo',
        shortcut: 'Ctrl Z',
        group: 'Edit',
        keywords: ['revert'],
    },
    { id: 'edit.redo', label: 'Redo', shortcut: 'Ctrl Y', group: 'Edit' },
    {
        id: 'edit.find',
        label: 'Find in File',
        shortcut: 'Ctrl F',
        group: 'Edit',
    },
    { id: 'view.zoomIn', label: 'Zoom In', group: 'View' },
    { id: 'view.zoomOut', label: 'Zoom Out', group: 'View' },
    {
        id: 'view.palette',
        label: 'Toggle Command Palette',
        group: 'View',
        keywords: ['launcher'],
    },
];

const DISABLED_COMMANDS: readonly UiCommand[] = [
    { id: 'file.new', label: 'New File', shortcut: 'Ctrl N' },
    {
        id: 'file.save',
        label: 'Save',
        shortcut: 'Ctrl S',
        enabled: EEnabledState.Disabled,
    },
    { id: 'edit.undo', label: 'Undo', shortcut: 'Ctrl Z' },
    {
        id: 'edit.redo',
        label: 'Redo',
        shortcut: 'Ctrl Y',
        enabled: EEnabledState.Disabled,
    },
];

function makeLargeCorpus(count: number): readonly UiCommand[] {
    const out: UiCommand[] = [];
    for (let index: number = 0; index < count; index += 1) {
        out.push({
            id: `cmd.${String(index)}`,
            label: `Command ${String(index)}`,
        });
    }
    return out;
}

const LARGE_CORPUS: readonly UiCommand[] = makeLargeCorpus(5000);

// A controlled wrapper the stories share: CommandPalette is controlled, so the
// story owns `open` and `query`, primes `open: true` on mount (the live surface
// only exists while open, so the axe story gate evaluates the real combobox +
// listbox tree), and records the last activated command id.
function ControlledPalette(args: CommandPaletteStoryArgs): ReactElement {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    const [query, setQuery]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(args.initialQuery ?? '');
    const [lastCommand, setLastCommand]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(null);

    return (
        <div style={{ minBlockSize: '24rem' }}>
            <button
                type="button"
                style={OPENER_STYLE}
                onClick={(): void => {
                    setOpen(true);
                }}
            >
                Open command palette
            </button>
            <p>Last command: {lastCommand ?? 'none'}</p>
            <CommandPalette
                open={open}
                onClose={(): void => {
                    setOpen(false);
                }}
                commands={args.commands}
                query={query}
                onQueryChange={setQuery}
                onSelect={(commandId: string): void => {
                    setLastCommand(commandId);
                    setOpen(false);
                }}
                label={args.label}
                {...(args.recentCommandIds !== undefined
                    ? { recentCommandIds: args.recentCommandIds }
                    : {})}
                {...(args.filterMode !== undefined
                    ? { filterMode: args.filterMode }
                    : {})}
                {...(args.placeholder !== undefined
                    ? { placeholder: args.placeholder }
                    : {})}
                {...(args.enabled !== undefined ? { enabled: args.enabled } : {})}
                {...(args.status !== undefined ? { status: args.status } : {})}
                {...(args.tone !== undefined ? { tone: args.tone } : {})}
            />
        </div>
    );
}

// `component` is intentionally omitted: CommandPalette's required controlled
// props (open/query/callbacks) are owned by the shared wrapper, not the flat
// story args, so binding `component` to the args type would not typecheck under
// exactOptionalPropertyTypes. The render wrapper is the story surface.
const meta: Meta<CommandPaletteStoryArgs> = {
    title: 'UI/CommandPalette',
    args: {
        commands: COMMANDS,
        label: 'Command palette',
        placeholder: 'Type a command',
    },
    render: (args: CommandPaletteStoryArgs): ReactElement => (
        <ControlledPalette {...args} />
    ),
};

export default meta;

type Story = StoryObj<CommandPaletteStoryArgs>;

export const Default: Story = {};

export const Filtering: Story = {
    args: { initialQuery: 'fin' },
};

export const Grouped: Story = {
    args: { label: 'Grouped commands' },
};

export const Recent: Story = {
    args: { recentCommandIds: ['edit.find', 'file.save'] },
};

export const SubstringParity: Story = {
    args: { initialQuery: 'file', filterMode: ECommandFilterMode.Substring },
};

export const WithShortcuts: Story = {
    args: { initialQuery: 'save' },
};

export const DisabledCommands: Story = {
    args: { commands: DISABLED_COMMANDS, label: 'Disabled command rows' },
};

export const NoMatches: Story = {
    args: { initialQuery: 'zzzzz' },
};

export const Empty: Story = {
    args: { commands: [], label: 'Empty command set' },
};

export const Toned: Story = {
    args: { tone: 'oklch(0.7 0.18 25)' },
};

export const StatusDanger: Story = {
    args: { status: EUiStatus.Danger },
};

export const LargeCorpus: Story = {
    args: { commands: LARGE_CORPUS, label: 'Large command corpus' },
};

export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};
