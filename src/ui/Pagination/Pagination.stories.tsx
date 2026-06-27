import { type Meta, type StoryObj } from '@storybook/react-vite';
import {
    type Dispatch,
    type ReactElement,
    type SetStateAction,
    useState,
} from 'react';

import { EEnabledState } from '../../state/state';
import { Pagination } from './Pagination';
import { type PaginationProps } from './Pagination.types';

// A controlled wrapper the stories share: Pagination is controlled, so the story
// owns the current page and feeds it back through `currentPage`, the pattern a
// consumer wiring Pagination to app state uses.
function ControlledPagination(args: PaginationProps): ReactElement {
    const [page, setPage]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(args.currentPage);
    return <Pagination {...args} currentPage={page} onChange={setPage} />;
}

const DEMO_ITEMS: readonly string[] = [
    'Aurora',
    'Borealis',
    'Cinder',
    'Drift',
    'Ember',
    'Flare',
    'Glimmer',
    'Halo',
    'Ion',
    'Jet',
    'Krypton',
    'Lumen',
];
const DEMO_PAGE_SIZE: number = 4;

// A small paged-list demo proving the controlled contract end to end: the visible
// slice tracks the page Pagination reports, the consumer-side usage pattern.
function PagedListDemo(args: PaginationProps): ReactElement {
    const [page, setPage]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(1);
    const pageCount: number = Math.ceil(DEMO_ITEMS.length / DEMO_PAGE_SIZE);
    const start: number = (page - 1) * DEMO_PAGE_SIZE;
    const visible: readonly string[] = DEMO_ITEMS.slice(
        start,
        start + DEMO_PAGE_SIZE,
    );
    return (
        <div>
            <ul>
                {visible.map(
                    (item: string): ReactElement => (
                        <li key={item}>{item}</li>
                    ),
                )}
            </ul>
            <Pagination
                {...args}
                currentPage={page}
                pageCount={pageCount}
                onChange={setPage}
            />
        </div>
    );
}

const meta: Meta<typeof Pagination> = {
    title: 'UI/Pagination',
    component: Pagination,
    args: {
        currentPage: 1,
        pageCount: 7,
    },
    render: (args: PaginationProps): ReactElement => (
        <ControlledPagination {...args} />
    ),
};

export default meta;

type Story = StoryObj<typeof meta>;

// First page of a small run: the previous control is disabled.
export const Default: Story = {};

// A large run windowed around a mid page: first, a left gap, the band, a right
// gap, and last - exercising both gap markers.
export const Windowed: Story = {
    args: { currentPage: 12, pageCount: 24 },
};

// A consumer-supplied opaque tone color drives the active page key.
export const Toned: Story = {
    args: { currentPage: 5, pageCount: 9, tone: 'oklch(0.7 0.18 25)' },
};

// Last-page edge: the next control is disabled.
export const LastPageEdge: Story = {
    args: { currentPage: 7, pageCount: 7 },
};

// One page: both controls are disabled and a single current key shows.
export const SinglePage: Story = {
    args: { currentPage: 1, pageCount: 1 },
};

// Every control is disabled through the resolved enabled state.
export const Disabled: Story = {
    args: { enabled: EEnabledState.Disabled },
};

// Pagination wired to real content, proving the controlled contract.
export const Composition: Story = {
    render: (args: PaginationProps): ReactElement => <PagedListDemo {...args} />,
};
