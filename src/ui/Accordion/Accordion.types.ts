import { type ReactNode } from 'react';

import { type EEnabledState } from '../../state/state';
import { type EUiStatus, type Toned } from '../tone';

// Public contract for Accordion: a controlled, multi-section disclosure list
// following the WAI-ARIA Accordion pattern. Each item renders a heading whose
// only child is a real <button> carrying aria-expanded / aria-controls; the
// matching panel is a role="region" labelled by its header. Collapsed panels
// stay mounted (for the grid-rows reveal) and are removed from the tab order and
// the accessibility tree via the inert attribute. The component owns only the
// disclosure shell; item content is interface-forwarded as ReactNode. Open state
// is controlled by the consumer through the discriminated `mode` union so the
// value and callback shapes can never be mismatched.

// Expand policy. E-prefixed annotated const object (enums-as-language banned).
// The string values double as the props-union discriminant and as the data-mode
// attribute the CSS may read.
export const EAccordionMode: {
    readonly Single: 'single';
    readonly Multiple: 'multiple';
} = {
    Single: 'single',
    Multiple: 'multiple',
};
export type EAccordionMode = (typeof EAccordionMode)[keyof typeof EAccordionMode];

// Per-section disclosure state. Modeled as an E-prefixed const-object enum so the
// two visual states are a named member set; the kebab-case values double as the
// data-state attribute the CSS reads. Expanded is paired with aria-expanded on
// the header, so open state is never conveyed by tone or the marker alone.
export const EAccordionItemState: {
    readonly Expanded: 'expanded';
    readonly Collapsed: 'collapsed';
} = {
    Expanded: 'expanded',
    Collapsed: 'collapsed',
};
export type EAccordionItemState =
    (typeof EAccordionItemState)[keyof typeof EAccordionItemState];

// Heading level for each section header, constrained to the document-outline
// range. Mirrors Section/Panel. The button is the only child of this heading.
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

// One section. `id` is the disclosure identity reported through onExpandedChange
// and compared against the controlled value; `title` is the header label;
// `content` is the disclosed body. Title and content are interface-forwarded.
export type AccordionItem = Readonly<{
    id: string;
    title: ReactNode;
    content: ReactNode;
}>;

// Fields shared by both modes.
type AccordionSharedProps = {
    items: readonly AccordionItem[];
    headingLevel?: AccordionHeadingLevel; // default 3
    enabled?: EEnabledState; // resolved via useResolvedEnabled
    status?: EUiStatus; // default EUiStatus.None
};

// Single-open member: one open id or null. `collapsible` (default true) allows
// the open section to be closed; when false the open section cannot be collapsed
// by the user, so one section is always open.
export type AccordionSingleProps = Readonly<
    {
        mode: typeof EAccordionMode.Single;
        expandedId: string | null;
        onExpandedChange: (id: string | null) => void;
        collapsible?: boolean; // default true
    } & AccordionSharedProps
> &
    Toned;

// Many-open member: the set of open ids as an ordered array.
export type AccordionMultipleProps = Readonly<
    {
        mode: typeof EAccordionMode.Multiple;
        expandedIds: readonly string[];
        onExpandedChange: (ids: readonly string[]) => void;
    } & AccordionSharedProps
> &
    Toned;

// Discriminated public props union. The component switches on `mode` with no
// default branch, so a new mode is a compile error and impossible states (a
// single value with a multiple callback) are unrepresentable.
export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;
