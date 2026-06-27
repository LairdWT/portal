import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { EEnabledState } from '../../state/state';
import { TreeView } from './TreeView';
import { type TreeNode } from './TreeView.types';

const NODES: readonly TreeNode[] = [
    {
        id: 'src',
        label: 'src',
        children: [
            { id: 'index', label: 'index.ts' },
            {
                id: 'ui',
                label: 'ui',
                children: [
                    { id: 'button', label: 'Button.tsx' },
                    { id: 'tree', label: 'TreeView.tsx' },
                ],
            },
        ],
    },
    { id: 'readme', label: 'README.md' },
    { id: 'empty', label: 'empty-dir', children: [] },
];

type ExpandedHandler = (next: ReadonlySet<string>) => void;
type SelectedHandler = (id: string) => void;

function firstExpandedSet(mock: Mock<ExpandedHandler>): ReadonlySet<string> {
    const call: readonly [ReadonlySet<string>] | undefined = mock.mock.calls[0];
    if (call === undefined) {
        throw new Error('expected onExpandedChange to have been called');
    }
    return call[0];
}

describe('TreeView', (): void => {
    it('renders a named tree with one treeitem per visible node', (): void => {
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={vi.fn<ExpandedHandler>()}
            />,
        );

        expect(screen.getByRole('tree', { name: 'Files' })).toBeInTheDocument();
        // Visible: src, index.ts, ui (collapsed), README.md, empty-dir.
        expect(screen.getAllByRole('treeitem')).toHaveLength(5);
    });

    it('sets aria-level, aria-setsize, and aria-posinset for nested siblings', (): void => {
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={vi.fn<ExpandedHandler>()}
            />,
        );

        const src: HTMLElement = screen.getByRole('treeitem', { name: 'src' });
        expect(src).toHaveAttribute('aria-level', '1');
        expect(src).toHaveAttribute('aria-setsize', '3');
        expect(src).toHaveAttribute('aria-posinset', '1');

        const indexItem: HTMLElement = screen.getByRole('treeitem', {
            name: 'index.ts',
        });
        expect(indexItem).toHaveAttribute('aria-level', '2');
        expect(indexItem).toHaveAttribute('aria-setsize', '2');
        expect(indexItem).toHaveAttribute('aria-posinset', '1');

        expect(screen.getByRole('treeitem', { name: 'ui' })).toHaveAttribute(
            'aria-posinset',
            '2',
        );
    });

    it('marks branches with aria-expanded, omits it on leaves, and groups expanded children', (): void => {
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={vi.fn<ExpandedHandler>()}
            />,
        );

        expect(screen.getByRole('treeitem', { name: 'src' })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
        expect(screen.getByRole('treeitem', { name: 'ui' })).toHaveAttribute(
            'aria-expanded',
            'false',
        );
        expect(
            screen.getByRole('treeitem', { name: 'index.ts' }),
        ).not.toHaveAttribute('aria-expanded');
        // The single expanded branch (src) wraps its children in a role=group.
        expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('does not render the descendants of a collapsed branch', (): void => {
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={vi.fn<ExpandedHandler>()}
            />,
        );

        expect(
            screen.queryByRole('treeitem', { name: 'Button.tsx' }),
        ).not.toBeInTheDocument();
    });

    it('expands a collapsed branch on ArrowRight', async (): Promise<void> => {
        const onExpandedChange: Mock<ExpandedHandler> = vi.fn<ExpandedHandler>();
        const user: UserEvent = userEvent.setup();
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set()}
                onExpandedChange={onExpandedChange}
            />,
        );

        screen.getByRole('treeitem', { name: 'src' }).focus();
        await user.keyboard('{ArrowRight}');

        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        expect(firstExpandedSet(onExpandedChange).has('src')).toBe(true);
    });

    it('moves focus to the first child on ArrowRight over an expanded branch', async (): Promise<void> => {
        const onExpandedChange: Mock<ExpandedHandler> = vi.fn<ExpandedHandler>();
        const user: UserEvent = userEvent.setup();
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={onExpandedChange}
            />,
        );

        screen.getByRole('treeitem', { name: 'src' }).focus();
        await user.keyboard('{ArrowRight}');

        expect(screen.getByRole('treeitem', { name: 'index.ts' })).toHaveFocus();
        expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it('collapses an expanded branch on ArrowLeft', async (): Promise<void> => {
        const onExpandedChange: Mock<ExpandedHandler> = vi.fn<ExpandedHandler>();
        const user: UserEvent = userEvent.setup();
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={onExpandedChange}
            />,
        );

        screen.getByRole('treeitem', { name: 'src' }).focus();
        await user.keyboard('{ArrowLeft}');

        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        expect(firstExpandedSet(onExpandedChange).has('src')).toBe(false);
    });

    it('moves focus to the parent on ArrowLeft over a leaf', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={vi.fn<ExpandedHandler>()}
            />,
        );

        screen.getByRole('treeitem', { name: 'index.ts' }).focus();
        await user.keyboard('{ArrowLeft}');

        expect(screen.getByRole('treeitem', { name: 'src' })).toHaveFocus();
    });

    it('moves the roving focus with ArrowDown/ArrowUp and jumps with Home/End', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={vi.fn<ExpandedHandler>()}
            />,
        );

        screen.getByRole('treeitem', { name: 'src' }).focus();
        await user.keyboard('{ArrowDown}');
        expect(screen.getByRole('treeitem', { name: 'index.ts' })).toHaveFocus();

        await user.keyboard('{ArrowDown}');
        expect(screen.getByRole('treeitem', { name: 'ui' })).toHaveFocus();

        await user.keyboard('{ArrowUp}');
        expect(screen.getByRole('treeitem', { name: 'index.ts' })).toHaveFocus();

        await user.keyboard('{End}');
        expect(screen.getByRole('treeitem', { name: 'empty-dir' })).toHaveFocus();

        await user.keyboard('{Home}');
        expect(screen.getByRole('treeitem', { name: 'src' })).toHaveFocus();
    });

    it('focuses the next matching node on type-ahead', async (): Promise<void> => {
        const user: UserEvent = userEvent.setup();
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={vi.fn<ExpandedHandler>()}
            />,
        );

        screen.getByRole('treeitem', { name: 'src' }).focus();
        await user.keyboard('r');

        expect(screen.getByRole('treeitem', { name: 'README.md' })).toHaveFocus();
    });

    it('toggles a branch with Enter in a navigation-only tree', async (): Promise<void> => {
        const onExpandedChange: Mock<ExpandedHandler> = vi.fn<ExpandedHandler>();
        const user: UserEvent = userEvent.setup();
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set()}
                onExpandedChange={onExpandedChange}
            />,
        );

        screen.getByRole('treeitem', { name: 'src' }).focus();
        await user.keyboard('{Enter}');

        expect(onExpandedChange).toHaveBeenCalledTimes(1);
        expect(firstExpandedSet(onExpandedChange).has('src')).toBe(true);
    });

    it('selects with Enter and Space when the tree is selectable', async (): Promise<void> => {
        const onSelectedChange: Mock<SelectedHandler> = vi.fn<SelectedHandler>();
        const user: UserEvent = userEvent.setup();
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={vi.fn<ExpandedHandler>()}
                selectedId={null}
                onSelectedChange={onSelectedChange}
            />,
        );

        screen.getByRole('treeitem', { name: 'index.ts' }).focus();
        await user.keyboard('{Enter}');
        expect(onSelectedChange).toHaveBeenLastCalledWith('index');

        screen.getByRole('treeitem', { name: 'ui' }).focus();
        await user.keyboard(' ');
        expect(onSelectedChange).toHaveBeenLastCalledWith('ui');
    });

    it('reflects the controlled selectedId through aria-selected', (): void => {
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={vi.fn<ExpandedHandler>()}
                selectedId="index"
                onSelectedChange={vi.fn<SelectedHandler>()}
            />,
        );

        expect(screen.getByRole('treeitem', { name: 'index.ts' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        expect(screen.getByRole('treeitem', { name: 'src' })).toHaveAttribute(
            'aria-selected',
            'false',
        );
    });

    it('selects a leaf on click', async (): Promise<void> => {
        const onSelectedChange: Mock<SelectedHandler> = vi.fn<SelectedHandler>();
        const user: UserEvent = userEvent.setup();
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={vi.fn<ExpandedHandler>()}
                selectedId={null}
                onSelectedChange={onSelectedChange}
            />,
        );

        await user.click(screen.getByRole('treeitem', { name: 'README.md' }));
        expect(onSelectedChange).toHaveBeenCalledWith('readme');
    });

    it('keeps exactly one treeitem in the tab order', (): void => {
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={vi.fn<ExpandedHandler>()}
            />,
        );

        const tabbable: readonly HTMLElement[] = screen
            .getAllByRole('treeitem')
            .filter(
                (item: HTMLElement): boolean =>
                    item.getAttribute('tabindex') === '0',
            );
        expect(tabbable).toHaveLength(1);
    });

    it('is inert when disabled', async (): Promise<void> => {
        const onExpandedChange: Mock<ExpandedHandler> = vi.fn<ExpandedHandler>();
        const onSelectedChange: Mock<SelectedHandler> = vi.fn<SelectedHandler>();
        const user: UserEvent = userEvent.setup();
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={onExpandedChange}
                selectedId={null}
                onSelectedChange={onSelectedChange}
                enabled={EEnabledState.Disabled}
            />,
        );

        const src: HTMLElement = screen.getByRole('treeitem', { name: 'src' });
        src.focus();
        await user.keyboard('{ArrowLeft}');
        await user.click(screen.getByRole('treeitem', { name: 'index.ts' }));

        expect(onExpandedChange).not.toHaveBeenCalled();
        expect(onSelectedChange).not.toHaveBeenCalled();
    });

    it('exposes the tone as the --portal-tone custom property', (): void => {
        render(
            <TreeView
                nodes={NODES}
                label="Files"
                expandedIds={new Set(['src'])}
                onExpandedChange={vi.fn<ExpandedHandler>()}
                tone="oklch(0.7 0.18 25)"
            />,
        );

        const tree: HTMLElement = screen.getByRole('tree');
        expect(tree.style.getPropertyValue('--portal-tone')).toBe(
            'oklch(0.7 0.18 25)',
        );
    });
});
