// fuzzyMatch - a pure, dependency-free subsequence fuzzy scorer shared by the
// CommandPalette result ranking (and a candidate primitive for any future fuzzy
// filter row / content browser, so it is authored generally and barrel-exported
// rather than inlined). Given a query and a candidate text it returns a score and
// the matched character ranges for highlight emphasis, or null when the query is
// not a subsequence of the text.
//
// Scoring favours word-boundary and contiguous matches over scattered ones and is
// fully deterministic (greedy left-to-right matching), so ranking ties resolve
// stably at the call site. Case-insensitive. An empty (or whitespace-only) query
// matches everything with an empty range list, the "match all" convention the
// caller relies on. Hand-rolled, matching Portal's zero-runtime-dependency
// posture.

// One match: a relevance score (higher is better) and the [start, end) label
// ranges that were matched, for the caller's highlight rendering.
export type FuzzyMatch = Readonly<{
    score: number;
    ranges: readonly (readonly [number, number])[];
}>;

// A match that starts a word (string start, after a separator, or a camelCase
// hump) reads as far more relevant, so it earns the largest bonus.
const BOUNDARY_BONUS: number = 10;

// A character matched immediately after the previous match keeps a contiguous run
// (the VS Code / Linear palette idiom) and outscores a scattered hit.
const CONTIGUOUS_BONUS: number = 8;

// Every matched character contributes a small base so a longer subsequence match
// outscores a shorter one, all else equal.
const BASE_SCORE: number = 1;

// A scattered match is penalised by the gap it skipped, capped so a single huge
// jump cannot dominate the ranking.
const MAX_GAP_PENALTY: number = 3;

// Alphanumeric test for the word-boundary heuristic (non-global, so .test never
// carries lastIndex state between calls).
const ALPHANUMERIC: RegExp = /[a-z0-9]/i;

// True when text[index] begins a word: the string start, a character following a
// non-alphanumeric separator, or a lower/digit -> uppercase camelCase hump.
function isWordBoundary(text: string, index: number): boolean {
    if (index <= 0) {
        return true;
    }
    const previous: string | undefined = text[index - 1];
    const current: string | undefined = text[index];
    if (previous === undefined || current === undefined) {
        return true;
    }
    if (!ALPHANUMERIC.test(previous)) {
        return true;
    }
    if (
        previous === previous.toLowerCase() &&
        current !== current.toLowerCase() &&
        current === current.toUpperCase()
    ) {
        return true;
    }
    return false;
}

export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
    const needle: string = query.trim().toLowerCase();
    if (needle.length === 0) {
        return { score: 0, ranges: [] };
    }

    const haystack: string = text.toLowerCase();
    const ranges: [number, number][] = [];
    let score: number = 0;
    let searchFrom: number = 0;
    let previousIndex: number = -1;

    for (const needleChar of needle) {
        let found: number = -1;
        for (let i: number = searchFrom; i < haystack.length; i += 1) {
            if (haystack[i] === needleChar) {
                found = i;
                break;
            }
        }
        if (found === -1) {
            return null;
        }

        let charScore: number = BASE_SCORE;
        if (isWordBoundary(text, found)) {
            charScore += BOUNDARY_BONUS;
        }
        if (previousIndex < 0) {
            // First matched character: position only, no contiguity / gap term.
            score += charScore;
        } else if (found === previousIndex + 1) {
            score += charScore + CONTIGUOUS_BONUS;
        } else {
            const gap: number = found - previousIndex - 1;
            score += charScore - Math.min(gap, MAX_GAP_PENALTY);
        }

        const last: [number, number] | undefined = ranges[ranges.length - 1];
        if (last?.[1] === found) {
            last[1] = found + 1;
        } else {
            ranges.push([found, found + 1]);
        }

        previousIndex = found;
        searchFrom = found + 1;
    }

    return { score, ranges };
}
