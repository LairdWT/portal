// Shared accessible-name contract for the generic UI layer.
//
// A control that exposes a named interactive ARIA role - a radiogroup, a dialog
// window - must carry an accessible name. The name is supplied EXACTLY ONE of
// two ways and never both: an inline `label` string (wired to aria-label) or a
// `labelledBy` id referencing visible text elsewhere in the DOM (wired to
// aria-labelledby). Modeling the pair as a discriminated XOR union makes the
// "exactly one" rule a compile-time guarantee - omitting the name fails to
// compile and supplying both is rejected - so no DEV-only runtime guard is
// needed. A component mixes this into its own props the way tone.ts mixes Toned.
export type AccessibleName =
    | {
          /**
           * Inline accessible name wired to `aria-label`. Supply EXACTLY ONE of
           * `label` or `labelledBy`, never both.
           */
          readonly label: string;
          readonly labelledBy?: undefined;
      }
    | {
          /**
           * Id of visible text elsewhere in the DOM that names this control,
           * wired to `aria-labelledby`. Supply EXACTLY ONE of `label` or
           * `labelledBy`, never both.
           */
          readonly labelledBy: string;
          readonly label?: undefined;
      };
