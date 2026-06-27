// TitleBar: a domain-agnostic, non-interactive masthead strip for the generic UI
// layer - a beveled machined-HUD top-bar that lays out leading / title / tagline
// / trailing slots around a required heading-rendered title, plus an optional
// second-row breadcrumb/nav slot. It mirrors Helicon's title_strip (banner +
// separator + tagline + right_content closure) re-expressed as declarative React
// slots: the bar owns NO data and NO interactivity; every interactive affordance
// (a refresh button, scan indicator, logo, back control, nav row) arrives as
// caller-supplied slot content and owns its own behavior, a11y, and touch target.
//
// Accessibility: `title` is always present and supplies the accessible name. The
// `landmark` prop selects the root role - Banner renders a <header> (an implicit
// banner landmark, named by its content), Region renders a labelled <section>
// (named by the title heading via aria-labelledby for a non-masthead bar), and
// None renders a plain <div> (for a bar already inside a naming landmark). Only
// one banner landmark is allowed per page; secondary bars use Region or None.

import { type ReactNode } from 'react';

import { type EUiStatus, type Toned } from '../tone';

// Landmark role for the bar root. E-prefixed annotated const object (the `enum`
// keyword is banned). The kebab values double as the data-landmark attribute the
// CSS and tests may read. Banner renders a <header> (an implicit `banner`
// landmark when not nested in section/article/aside/main/nav); Region renders a
// <section> labelled by the title heading (use when the bar is NOT the page
// masthead, e.g. a sub-pane header, so it does not claim/duplicate `banner`);
// None renders a plain <div> with no landmark (for a bar nested inside another
// landmark that already names the region).
export const ETitleBarLandmark: {
    readonly Banner: 'banner';
    readonly Region: 'region';
    readonly None: 'none';
} = {
    Banner: 'banner',
    Region: 'region',
    None: 'none',
};
export type ETitleBarLandmark =
    (typeof ETitleBarLandmark)[keyof typeof ETitleBarLandmark];

// Heading level for the title, constrained to the document-outline range.
// Default 1 (a masthead title is normally the page h1); a nested bar lowers it.
export type TitleBarHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

// Props for TitleBar: a domain-agnostic, non-interactive masthead strip.
//
// `title` is the required banner, rendered as a heading at `headingLevel` and
// (when landmark = Region) used to name the region via aria-labelledby. The four
// slots are interface-forwarded ReactNode - the bar owns no behavior; a refresh
// button, scan indicator, logo, or nav row arrives as slot content and owns its
// own interactivity, a11y, and 3rem touch target.
//   leading    - start-region slot before the title (logo / back affordance).
//   tagline    - secondary text after the title (Helicon tagline). Preceded by
//                the decorative separator unless `separator === ''`.
//   trailing   - end-region slot, laid out toward the inline-end edge (Helicon
//                right_to_left right_content).
//   breadcrumb - optional second row under the title row (a Breadcrumb trail or
//                nav strip). Omitted -> no second row rendered.
// `separator` defaults to '::' (Helicon DEFAULT_TITLE_SEPARATOR); it is an
// aria-hidden decorative glyph between title and tagline; pass '' to suppress.
// `status` routes danger/success through the tone scope (data-status). `tone` is
// the opaque tone color the root applies. No `enabled` prop: the bar is a
// structural shell; slot content manages its own enablement.
export type TitleBarProps = Readonly<{
    title: ReactNode;
    headingLevel?: TitleBarHeadingLevel;
    landmark?: ETitleBarLandmark;
    leading?: ReactNode;
    tagline?: ReactNode;
    trailing?: ReactNode;
    breadcrumb?: ReactNode;
    separator?: string;
    status?: EUiStatus;
}> &
    Toned;
