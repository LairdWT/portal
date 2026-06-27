// Public types for the KeyValue / PropertyGrid primitive: a non-interactive,
// column-aligned inspector grid of consumer-supplied key/value pairs rendered as
// a semantic definition list. Interface-forwarding: the grid renders, never owns,
// data. Strict TS - no `any`, `type` over `interface`, an E-prefixed annotated
// const-object enum (language enums are banned), and the shared `Toned` mixin.

import { type ReactNode } from 'react';

import { type EUiStatus, type Toned } from '../tone';

// One key-value pair in a KeyValue grid. `id` is the React key and the stable
// row identity (keys may collide as display strings; ids may not). `key` is the
// term label (rendered dim monospace in the key column). `value` is arbitrary
// definition content (interface-forwarding; the grid renders, never owns, data).
// `tone` (via the shared Toned mixin) optionally overrides the grid tone for a
// single row.
export type KeyValuePair = Readonly<
    {
        id: string;
        key: string;
        value: ReactNode;
    } & Toned
>;

// Per-grid policy for an over-long value. Wrap (default) breaks long values
// (hashes, URLs, prose) onto multiple lines so nothing overflows; Truncate keeps
// each value on one line and ellipsizes the overflow (the full text stays in the
// DOM, so assistive tech still reads it). Annotated const object + derived union;
// enums-as-language are banned (CodingStandards).
export const EKeyValueOverflow: {
    readonly Wrap: 'wrap';
    readonly Truncate: 'truncate';
} = {
    Wrap: 'wrap',
    Truncate: 'truncate',
};
export type EKeyValueOverflow =
    (typeof EKeyValueOverflow)[keyof typeof EKeyValueOverflow];

// Props for the KeyValue / PropertyGrid primitive. `label` names the grid for
// assistive tech (e.g. "Cluster metadata"). `pairs` are the rows (a one-element
// array is the single-row `key_value_row` case). `overflow` is the value-overflow
// policy. The Toned mixin carries the opaque grid `tone` that drives the HUD edge
// (the root border and glow); each per-row key rail derives from that row's own
// `tone` and falls back to the accent seed when a row sets none, because the
// shared tone scope re-seeds --portal-tone on every row - the grid `tone` does
// NOT propagate down to the rails. `status` overrides the tone seed via the
// data-status the tone scope reads. Non-interactive: no focus target, no keyboard,
// no motion.
export type KeyValueProps = Readonly<
    {
        label: string;
        pairs: readonly KeyValuePair[];
        overflow?: EKeyValueOverflow;
        status?: EUiStatus;
    } & Toned
>;
