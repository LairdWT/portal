import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { ESplitOrientation } from '../SplitPane/SplitPane.types';
import { DockLayout } from './DockLayout';
import {
    type DockLayoutState,
    type DockNode,
    type DockPanelDef,
    EDockNodeKind,
} from './DockLayout.types';
import { dockedPanelIds } from './dockMath';

type LayoutCallback = (layout: DockLayoutState) => void;

const PANELS: readonly DockPanelDef[] = [
    { id: 'nav', title: 'Navigator', content: <p>Navigator body</p> },
    { id: 'editor', title: 'Editor', content: <p>Editor body</p> },
    { id: 'preview', title: 'Preview', content: <p>Preview body</p> },
    { id: 'console', title: 'Console', content: <p>Console body</p> },
];

const WORKSPACE: DockLayoutState = {
    root: {
        kind: EDockNodeKind.Split,
        orientation: ESplitOrientation.Horizontal,
        fraction: 0.25,
        first: { kind: EDockNodeKind.Tabs, panelIds: ['nav'], activeId: 'nav' },
        second: {
            kind: EDockNodeKind.Tabs,
            panelIds: ['editor', 'preview'],
            activeId: 'editor',
        },
    },
    floating: [],
};

afterEach((): void => {
    document.body.innerHTML = '';
});

// Controlled harness so multi-step flows observe applied layouts.
function Harness(
    props: Readonly<{ initial: DockLayoutState; onChange?: LayoutCallback }>,
): ReactElement {
    const [layout, setLayout]: [
        DockLayoutState,
        Dispatch<SetStateAction<DockLayoutState>>,
    ] = useState<DockLayoutState>(props.initial);
    return (
        <DockLayout
            label="Workspace dock"
            panels={PANELS}
            layout={layout}
            onLayoutChange={(next: DockLayoutState): void => {
                setLayout(next);
                props.onChange?.(next);
            }}
        />
    );
}

describe('DockLayout', (): void => {
    it('renders the docked tree: groups, tabs, splitter, active bodies', (): void => {
        render(
            <DockLayout
                label="Workspace dock"
                panels={PANELS}
                layout={WORKSPACE}
                onLayoutChange={vi.fn<LayoutCallback>()}
            />,
        );
        expect(
            screen.getByRole('region', { name: 'Workspace dock' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('separator')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Navigator' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Preview' })).toBeInTheDocument();
        expect(screen.getByText('Editor body')).toBeInTheDocument();
        // Inactive tab bodies stay unmounted.
        expect(screen.queryByText('Preview body')).not.toBeInTheDocument();
    });

    it('renders the empty dock message', (): void => {
        render(
            <DockLayout
                label="Workspace dock"
                panels={PANELS}
                layout={{ root: null, floating: [] }}
                onLayoutChange={vi.fn<LayoutCallback>()}
            />,
        );
        expect(screen.getByText('No panels docked.')).toBeInTheDocument();
    });

    it('switches tabs through the controlled layout', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(<Harness initial={WORKSPACE} />);
        await user.click(screen.getByRole('tab', { name: 'Preview' }));
        expect(screen.getByText('Preview body')).toBeInTheDocument();
        expect(screen.queryByText('Editor body')).not.toBeInTheDocument();
    });

    it('docks the active panel to an edge from the keyboard menu', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const handleChange: Mock<LayoutCallback> = vi.fn<LayoutCallback>();
        render(<Harness initial={WORKSPACE} onChange={handleChange} />);
        await user.click(
            screen.getByRole('button', { name: 'Navigator dock options' }),
        );
        await user.click(screen.getByRole('menuitem', { name: 'Dock bottom' }));
        const emitted: DockLayoutState | undefined =
            handleChange.mock.lastCall?.[0];
        expect(emitted).toBeDefined();
        const root: DockNode | null = emitted?.root ?? null;
        if (root?.kind !== EDockNodeKind.Split) {
            throw new Error('expected split root');
        }
        expect(root.orientation).toBe(ESplitOrientation.Vertical);
        expect(dockedPanelIds(root.second)).toEqual(['nav']);
    });

    it('moves a panel into another group from the menu', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const handleChange: Mock<LayoutCallback> = vi.fn<LayoutCallback>();
        render(<Harness initial={WORKSPACE} onChange={handleChange} />);
        await user.click(
            screen.getByRole('button', { name: 'Navigator dock options' }),
        );
        await user.click(
            screen.getByRole('menuitem', { name: 'Move to Editor group' }),
        );
        const emitted: DockLayoutState | undefined =
            handleChange.mock.lastCall?.[0];
        expect(dockedPanelIds(emitted?.root ?? null)).toEqual([
            'editor',
            'preview',
            'nav',
        ]);
        // The moved panel activates in its new group.
        expect(screen.getByText('Navigator body')).toBeInTheDocument();
    });

    it('floats a panel from the menu and docks it back from the window', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const handleChange: Mock<LayoutCallback> = vi.fn<LayoutCallback>();
        render(<Harness initial={WORKSPACE} onChange={handleChange} />);
        await user.click(
            screen.getByRole('button', { name: 'Navigator dock options' }),
        );
        await user.click(screen.getByRole('menuitem', { name: 'Float' }));
        const floated: DockLayoutState | undefined =
            handleChange.mock.lastCall?.[0];
        expect(floated?.floating).toHaveLength(1);
        expect(floated?.floating[0]?.panelId).toBe('nav');
        // The floating panel renders as a non-modal window with its body.
        const window: HTMLElement = screen.getByRole('dialog', {
            name: 'Navigator',
        });
        expect(window).toBeInTheDocument();
        expect(screen.getByText('Navigator body')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Dock Navigator' }));
        const docked: DockLayoutState | undefined = handleChange.mock.lastCall?.[0];
        expect(docked?.floating).toHaveLength(0);
        expect(dockedPanelIds(docked?.root ?? null)).toContain('nav');
    });

    it('reports splitter resizes through setFraction', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        const handleChange: Mock<LayoutCallback> = vi.fn<LayoutCallback>();
        render(<Harness initial={WORKSPACE} onChange={handleChange} />);
        screen.getByRole('separator').focus();
        await user.keyboard('{ArrowRight}');
        const emitted: DockLayoutState | undefined =
            handleChange.mock.lastCall?.[0];
        const root: DockNode | null = emitted?.root ?? null;
        if (root?.kind !== EDockNodeKind.Split) {
            throw new Error('expected split root');
        }
        expect(root.fraction).toBeCloseTo(0.27, 5);
    });
});
