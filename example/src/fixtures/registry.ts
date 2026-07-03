import { type ReactElement } from 'react';

import { Collections } from './Collections';
import { DockWorkspace } from './DockWorkspace';
import { HudInstruments } from './HudInstruments';
import { Overlays } from './Overlays';
import { SingleSelect } from './SingleSelect';
import { TabsApg } from './TabsApg';
import { TooltipHover } from './TooltipHover';

// Query-param fixture router table. App.tsx reads `?fixture=<key>` and renders the
// matching component; an unknown or absent key falls through to the default app
// tree so the two existing layout specs keep passing unchanged. Each value is a
// zero-arg component returning a fully self-contained, controlled fixture.
export const FIXTURES: Readonly<Record<string, () => ReactElement>> = {
    'single-select': SingleSelect,
    'tabs-apg': TabsApg,
    overlays: Overlays,
    collections: Collections,
    tooltip: TooltipHover,
    hud: HudInstruments,
    dock: DockWorkspace,
};
