import { describe, expect, it } from 'vitest';

import { type FuzzyMatch, fuzzyMatch } from './fuzzyMatch';

describe('fuzzyMatch', (): void => {
    it('matches everything with empty ranges for an empty query', (): void => {
        const result: FuzzyMatch | null = fuzzyMatch('', 'Open File');
        expect(result).not.toBeNull();
        expect(result?.score).toBe(0);
        expect(result?.ranges).toEqual([]);
    });

    it('treats a whitespace-only query as the match-all empty query', (): void => {
        const result: FuzzyMatch | null = fuzzyMatch('   ', 'Save');
        expect(result).not.toBeNull();
        expect(result?.ranges).toEqual([]);
    });

    it('returns merged contiguous ranges for a subsequence match', (): void => {
        const result: FuzzyMatch | null = fuzzyMatch('ca', 'Cat');
        expect(result).not.toBeNull();
        expect(result?.ranges).toEqual([[0, 2]]);
    });

    it('returns separate ranges for a scattered subsequence match', (): void => {
        const result: FuzzyMatch | null = fuzzyMatch('ct', 'Cat');
        expect(result).not.toBeNull();
        expect(result?.ranges).toEqual([
            [0, 1],
            [2, 3],
        ]);
    });

    it('returns null when the query is not a subsequence', (): void => {
        expect(fuzzyMatch('xyz', 'Cat')).toBeNull();
        expect(fuzzyMatch('ac', 'Cat')).toBeNull();
    });

    it('is case-insensitive', (): void => {
        const result: FuzzyMatch | null = fuzzyMatch('CA', 'cat');
        expect(result).not.toBeNull();
        expect(result?.ranges).toEqual([[0, 2]]);
    });

    it('ranks contiguous word-boundary matches above scattered ones', (): void => {
        const contiguous: FuzzyMatch | null = fuzzyMatch('ca', 'Cat');
        const scattered: FuzzyMatch | null = fuzzyMatch('ca', 'Centaur');
        expect(contiguous).not.toBeNull();
        expect(scattered).not.toBeNull();
        expect(contiguous?.score ?? 0).toBeGreaterThan(scattered?.score ?? 0);
    });

    it('rewards a word-boundary start over a mid-word match', (): void => {
        const boundary: FuzzyMatch | null = fuzzyMatch('f', 'Find File');
        const midWord: FuzzyMatch | null = fuzzyMatch('i', 'Find File');
        expect(boundary).not.toBeNull();
        expect(midWord).not.toBeNull();
        expect(boundary?.score ?? 0).toBeGreaterThan(midWord?.score ?? 0);
    });

    it('is deterministic for repeated calls', (): void => {
        const first: FuzzyMatch | null = fuzzyMatch('cmd', 'Open Command');
        const second: FuzzyMatch | null = fuzzyMatch('cmd', 'Open Command');
        expect(first).toEqual(second);
    });
});
