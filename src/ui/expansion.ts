// Controlled expansion-set helpers for disclosure surfaces (TreeView, Accordion).
//
// A consumer owns a ReadonlySet<string> of expanded node ids and is the single
// source of truth; these pure helpers compute the NEXT set for a mutation and
// never touch the input. They are the web idiom for Helicon's TreeExpansionState
// mutation API (set_expanded / toggle / expand_all / collapse_all). Each returns
// a new Set, except setExpanded which returns the SAME reference when the request
// does not change membership (the "unchanged" fast path), so a controlled
// consumer can skip an onExpandedChange that would be a no-op. No dependency, no
// React, ASCII/LF.

// Toggles an id's membership: removes it when present, adds it when absent.
// Always changes membership, so it always returns a new Set.
export function toggleExpanded(
    set: ReadonlySet<string>,
    id: string,
): ReadonlySet<string> {
    const next: Set<string> = new Set<string>(set);
    if (next.has(id)) {
        next.delete(id);
        return next;
    }
    next.add(id);
    return next;
}

// Sets an id to a specific expanded state. Idempotent: setting an already-present
// id to expanded, or an already-absent id to collapsed, is a no-op that returns
// the original set reference unchanged.
export function setExpanded(
    set: ReadonlySet<string>,
    id: string,
    expanded: boolean,
): ReadonlySet<string> {
    const present: boolean = set.has(id);
    if (expanded && present) {
        return set;
    }
    if (!expanded && !present) {
        return set;
    }
    const next: Set<string> = new Set<string>(set);
    if (expanded) {
        next.add(id);
        return next;
    }
    next.delete(id);
    return next;
}

// Builds the fully expanded set from a flat list of ids (the consumer supplies
// its own ordered id list). The Set constructor dedupes repeated ids.
export function expandAll(ids: readonly string[]): ReadonlySet<string> {
    return new Set(ids);
}

// The empty expansion set (everything collapsed).
export function collapseAll(): ReadonlySet<string> {
    return new Set<string>();
}
