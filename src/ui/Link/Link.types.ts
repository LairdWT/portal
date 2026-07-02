import type { ReactNode } from 'react';

import type { Toned } from '../tone';

// Props for the Link: the themed anchor of the UI layer. `external` targets a
// new tab (with the hardened rel) and appends a drawn outward mark; the
// accent-highlight text color is the AA-safe accent, and focus wears the HUD
// ring. `download` forwards the native attribute.
export type LinkProps = Readonly<
    {
        href: string;
        children: ReactNode;
        external?: boolean | undefined;
        download?: string | undefined;
        id?: string | undefined;
        onClick?: (() => void) | undefined;
    } & Toned
>;
