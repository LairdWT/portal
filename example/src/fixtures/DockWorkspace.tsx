import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import {
    dockedPanelIds,
    DockLayout,
    type DockLayoutState,
    type DockPanelDef,
    EDockNodeKind,
    ESplitOrientation,
} from '@laird-wt/portal';

// Dock-workspace fixture: a controlled DockLayout whose serializable state is
// mirrored into readouts - the depth-first docked panel order and the
// floating panel ids - so the drag-and-drop spec can assert layout mutations
// (edge docking, floating, dock-back) from the DOM alone.

const PANELS: readonly DockPanelDef[] = [
    { id: 'nav', title: 'Navigator', content: <p>Navigator body</p> },
    { id: 'editor', title: 'Editor', content: <p>Editor body</p> },
    { id: 'preview', title: 'Preview', content: <p>Preview body</p> },
    { id: 'console', title: 'Console', content: <p>Console body</p> },
];

// nav | (editor+preview / console) - the storybook WORKSPACE arrangement.
const INITIAL_LAYOUT: DockLayoutState = {
    root: {
        kind: EDockNodeKind.Split,
        orientation: ESplitOrientation.Horizontal,
        fraction: 0.25,
        first: { kind: EDockNodeKind.Tabs, panelIds: ['nav'], activeId: 'nav' },
        second: {
            kind: EDockNodeKind.Split,
            orientation: ESplitOrientation.Vertical,
            fraction: 0.65,
            first: {
                kind: EDockNodeKind.Tabs,
                panelIds: ['editor', 'preview'],
                activeId: 'editor',
            },
            second: {
                kind: EDockNodeKind.Tabs,
                panelIds: ['console'],
                activeId: 'console',
            },
        },
    },
    floating: [],
};

export function DockWorkspace(): ReactElement {
    const [layout, setLayout]: [
        DockLayoutState,
        Dispatch<SetStateAction<DockLayoutState>>,
    ] = useState<DockLayoutState>(INITIAL_LAYOUT);

    return (
        <main>
            <div style={{ blockSize: '480px' }}>
                <DockLayout
                    label="Workspace dock"
                    panels={PANELS}
                    layout={layout}
                    onLayoutChange={setLayout}
                    blockSize="460px"
                />
            </div>
            <p data-testid="dock-docked">{dockedPanelIds(layout.root).join(',')}</p>
            <p data-testid="dock-floating">
                {layout.floating
                    .map((entry: { panelId: string }): string => entry.panelId)
                    .join(',')}
            </p>
        </main>
    );
}
