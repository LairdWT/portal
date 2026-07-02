import type { ReactNode } from 'react';

import type { EUiStatus, Toned } from '../tone';

// One feed entry. `title` names the row; `time` is a display string the
// consumer formats (the timeline never owns clocks); `status` accents the
// marker dot through the universal status ramp.
export type TimelineItem = Readonly<{
    id: string;
    title: string;
    time?: string | undefined;
    description?: ReactNode;
    status?: EUiStatus | undefined;
}>;

// Props for the Timeline: a vertical activity feed - drawn marker dots on a
// connecting rail, mono timestamps, and status-toned accents. Presentation
// only: no interaction, no virtualization (compose LogConsole-scale feeds
// from List instead).
export type TimelineProps = Readonly<
    {
        label: string;
        items: readonly TimelineItem[];
    } & Toned
>;
