// resolveCommandRows - the pure function that turns (commands, recentIds, query,
// filterMode) into the flat, ranked, optionally grouped row model the listbox
// renders. Kept out of CommandPalette.tsx so the windowing render stays thin and
// the ranking logic is independently testable.
//
// Empty query: grouped rendering - an optional "Recent" group first (additive
// over Helicon), then ungrouped commands, then one header per distinct group.
// Non-empty query: groups dissolve into a single fuzzy- (or substring-) ranked
// flat listbox, the standard palette behaviour. Recent commands are excluded from
// their groups so no command id renders twice (option DOM ids must stay unique).

import { EEnabledState } from '../../state/state';
import {
    type CommandRow,
    ECommandFilterMode,
    ECommandRowKind,
    type UiCommand,
} from './CommandPalette.types';
import { type FuzzyMatch, fuzzyMatch } from './fuzzyMatch';

// The empty-query group label for the caller-supplied recent command ids.
const RECENT_GROUP_LABEL: string = 'Recent';

// A penalty applied to a command matched only through its id / keywords (not its
// label), so any label match always ranks above an alias-only match.
const ALIAS_MATCH_PENALTY: number = 1000;

// A scored option awaiting sort + index assignment.
type ScoredCommand = Readonly<{
    command: UiCommand;
    score: number;
    ranges: readonly (readonly [number, number])[];
    order: number;
}>;

// A single match result before it becomes a row.
type MatchResult = Readonly<{
    score: number;
    ranges: readonly (readonly [number, number])[];
}>;

// Helicon substring parity: case-insensitive label.contains || id.contains. The
// label match also yields a highlight range; an id-only match ranks below every
// label match and carries no label highlight.
function matchSubstring(command: UiCommand, needle: string): MatchResult | null {
    const labelIndex: number = command.label.toLowerCase().indexOf(needle);
    if (labelIndex >= 0) {
        const range: readonly [number, number] = [
            labelIndex,
            labelIndex + needle.length,
        ];
        return { score: -labelIndex, ranges: [range] };
    }
    if (command.id.toLowerCase().includes(needle)) {
        return { score: -ALIAS_MATCH_PENALTY, ranges: [] };
    }
    return null;
}

// Fuzzy match: prefer a label match (with highlight ranges); otherwise include
// the command through an id / keyword alias match (no label highlight, ranked
// below every label match).
function matchFuzzy(command: UiCommand, query: string): MatchResult | null {
    const labelMatch: FuzzyMatch | null = fuzzyMatch(query, command.label);
    if (labelMatch !== null) {
        return { score: labelMatch.score, ranges: labelMatch.ranges };
    }
    const aliases: readonly string[] = [command.id, ...(command.keywords ?? [])];
    let best: number | null = null;
    for (const alias of aliases) {
        const aliasMatch: FuzzyMatch | null = fuzzyMatch(query, alias);
        if (aliasMatch === null) {
            continue;
        }
        if (best === null || aliasMatch.score > best) {
            best = aliasMatch.score;
        }
    }
    if (best === null) {
        return null;
    }
    return { score: best - ALIAS_MATCH_PENALTY, ranges: [] };
}

// Build the grouped, empty-query row model: Recent (if any) then ungrouped then
// grouped, each group introduced by a presentation header row.
function buildGroupedRows(
    commands: readonly UiCommand[],
    recentCommandIds: readonly string[] | undefined,
): readonly CommandRow[] {
    const byId: Map<string, UiCommand> = new Map<string, UiCommand>();
    for (const command of commands) {
        if (!byId.has(command.id)) {
            byId.set(command.id, command);
        }
    }

    const rows: CommandRow[] = [];
    let index: number = 0;
    const usedRecent: Set<string> = new Set<string>();
    const recents: UiCommand[] = [];

    if (recentCommandIds !== undefined) {
        for (const id of recentCommandIds) {
            if (usedRecent.has(id)) {
                continue;
            }
            const command: UiCommand | undefined = byId.get(id);
            if (command === undefined) {
                continue;
            }
            usedRecent.add(id);
            recents.push(command);
        }
    }

    if (recents.length > 0) {
        rows.push({
            kind: ECommandRowKind.Header,
            index,
            groupLabel: RECENT_GROUP_LABEL,
        });
        index += 1;
        for (const command of recents) {
            rows.push({
                kind: ECommandRowKind.Option,
                index,
                command,
                matchRanges: [],
            });
            index += 1;
        }
    }

    const ungrouped: UiCommand[] = [];
    const groupOrder: string[] = [];
    const groups: Map<string, UiCommand[]> = new Map<string, UiCommand[]>();
    for (const command of commands) {
        if (usedRecent.has(command.id)) {
            continue;
        }
        if (command.group === undefined) {
            ungrouped.push(command);
            continue;
        }
        const existing: UiCommand[] | undefined = groups.get(command.group);
        if (existing === undefined) {
            groups.set(command.group, [command]);
            groupOrder.push(command.group);
            continue;
        }
        existing.push(command);
    }

    for (const command of ungrouped) {
        rows.push({
            kind: ECommandRowKind.Option,
            index,
            command,
            matchRanges: [],
        });
        index += 1;
    }

    for (const groupLabel of groupOrder) {
        rows.push({ kind: ECommandRowKind.Header, index, groupLabel });
        index += 1;
        const bucket: readonly UiCommand[] = groups.get(groupLabel) ?? [];
        for (const command of bucket) {
            rows.push({
                kind: ECommandRowKind.Option,
                index,
                command,
                matchRanges: [],
            });
            index += 1;
        }
    }

    return rows;
}

export function resolveCommandRows(
    commands: readonly UiCommand[],
    recentCommandIds: readonly string[] | undefined,
    query: string,
    filterMode: ECommandFilterMode,
): readonly CommandRow[] {
    const trimmed: string = query.trim();
    if (trimmed.length === 0) {
        return buildGroupedRows(commands, recentCommandIds);
    }

    const needle: string = trimmed.toLowerCase();
    const scored: ScoredCommand[] = [];
    let order: number = 0;
    for (const command of commands) {
        const result: MatchResult | null =
            filterMode === ECommandFilterMode.Substring
                ? matchSubstring(command, needle)
                : matchFuzzy(command, trimmed);
        if (result !== null) {
            scored.push({
                command,
                score: result.score,
                ranges: result.ranges,
                order,
            });
        }
        order += 1;
    }

    // Highest score first; ties resolve by original corpus order for a stable,
    // deterministic ranking.
    scored.sort((a: ScoredCommand, b: ScoredCommand): number => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.order - b.order;
    });

    const rows: CommandRow[] = [];
    let index: number = 0;
    for (const entry of scored) {
        rows.push({
            kind: ECommandRowKind.Option,
            index,
            command: entry.command,
            matchRanges: entry.ranges,
        });
        index += 1;
    }
    return rows;
}

// A command is non-activatable when its per-command enabled state is Disabled.
// Exposed so the component and the navigation cursor agree on which rows skip.
export function isCommandDisabled(command: UiCommand): boolean {
    return command.enabled === EEnabledState.Disabled;
}
