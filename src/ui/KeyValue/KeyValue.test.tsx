// Unit tests for KeyValue / PropertyGrid. vitest + @testing-library/react. The
// component is non-interactive, so there is NO keyboard test (stated explicitly
// so the reviewer does not expect one). Covers render/order, the <dl>/<dt>/<dd>
// structure plus accessible group name, ReactNode value forwarding, the
// data-overflow/data-status attributes, grid + per-row tone, and the empty grid.

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EUiStatus } from '../tone';
import { KeyValue } from './KeyValue';
import styles from './KeyValue.module.css';
import { EKeyValueOverflow, type KeyValuePair } from './KeyValue.types';

const pairs: readonly KeyValuePair[] = [
    { id: 'theme', key: 'THEME', value: 'integration' },
    { id: 'members', key: 'MEMBERS', value: 12 },
    { id: 'status', key: 'STATUS', value: 'online' },
];

describe('KeyValue', (): void => {
    it('renders every key and value as text', (): void => {
        render(<KeyValue label="Cluster metadata" pairs={pairs} />);

        expect(screen.getByText('THEME')).toBeInTheDocument();
        expect(screen.getByText('integration')).toBeInTheDocument();
        expect(screen.getByText('MEMBERS')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('STATUS')).toBeInTheDocument();
        expect(screen.getByText('online')).toBeInTheDocument();
    });

    it('renders the pairs in order', (): void => {
        render(<KeyValue label="Cluster metadata" pairs={pairs} />);

        const grid: HTMLElement = screen.getByLabelText('Cluster metadata');
        const terms: readonly (string | null)[] = Array.from(
            grid.querySelectorAll('dt'),
        ).map((term: Element): string | null => term.textContent);
        expect(terms).toEqual(['THEME', 'MEMBERS', 'STATUS']);
    });

    it('exposes the named grid as a group wrapping the definition list', (): void => {
        render(<KeyValue label="Cluster metadata" pairs={pairs} />);

        const grid: HTMLElement = screen.getByRole('group', {
            name: 'Cluster metadata',
        });
        expect(grid.querySelector('dl')).not.toBeNull();
    });

    it('associates each term with its definition via dt/dd rows', (): void => {
        render(<KeyValue label="Cluster metadata" pairs={pairs} />);

        const grid: HTMLElement = screen.getByLabelText('Cluster metadata');
        const term: HTMLElement = within(grid).getByText('THEME');
        expect(term.tagName).toBe('DT');

        const row: HTMLElement | null = term.closest('div');
        expect(row).not.toBeNull();
        if (row === null) {
            throw new Error('expected the term to sit inside a row div');
        }

        const definition: HTMLElement = within(row).getByText('integration');
        expect(definition.tagName).toBe('DD');
    });

    it('forwards a ReactNode value into the definition cell', (): void => {
        const richPairs: readonly KeyValuePair[] = [
            {
                id: 'owner',
                key: 'OWNER',
                value: <span data-testid="rich-value">Ada</span>,
            },
        ];
        render(<KeyValue label="Service record" pairs={richPairs} />);

        const rich: HTMLElement = screen.getByTestId('rich-value');
        expect(rich).toHaveTextContent('Ada');
        expect(rich.closest('dd')).not.toBeNull();
    });

    it('defaults data-overflow to wrap', (): void => {
        render(<KeyValue label="Cluster metadata" pairs={pairs} />);

        const grid: HTMLElement = screen.getByLabelText('Cluster metadata');
        expect(grid).toHaveAttribute('data-overflow', EKeyValueOverflow.Wrap);
    });

    it('reflects the truncate overflow policy as a data attribute', (): void => {
        render(
            <KeyValue
                label="Cluster metadata"
                pairs={pairs}
                overflow={EKeyValueOverflow.Truncate}
            />,
        );

        const grid: HTMLElement = screen.getByLabelText('Cluster metadata');
        expect(grid).toHaveAttribute('data-overflow', EKeyValueOverflow.Truncate);
    });

    it('reflects the status as a data attribute', (): void => {
        render(
            <KeyValue
                label="Cluster metadata"
                pairs={pairs}
                status={EUiStatus.Danger}
            />,
        );

        const grid: HTMLElement = screen.getByLabelText('Cluster metadata');
        expect(grid).toHaveAttribute('data-status', EUiStatus.Danger);
    });

    it('applies the grid-level tone to the root', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(
            <KeyValue label="Cluster metadata" pairs={pairs} tone={toneColor} />,
        );

        const grid: HTMLElement = screen.getByLabelText('Cluster metadata');
        expect(grid.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('applies a per-row tone independently of the grid', (): void => {
        const rowTone: string = 'rgb(0, 128, 255)';
        const tonedPairs: readonly KeyValuePair[] = [
            { id: 'theme', key: 'THEME', value: 'integration', tone: rowTone },
            { id: 'members', key: 'MEMBERS', value: 12 },
        ];
        render(<KeyValue label="Cluster metadata" pairs={tonedPairs} />);

        const grid: HTMLElement = screen.getByLabelText('Cluster metadata');

        const tonedTerm: HTMLElement = within(grid).getByText('THEME');
        const tonedRow: HTMLElement | null = tonedTerm.closest('div');
        expect(tonedRow).not.toBeNull();
        expect(tonedRow?.style.getPropertyValue('--portal-tone')).toBe(rowTone);

        const plainTerm: HTMLElement = within(grid).getByText('MEMBERS');
        const plainRow: HTMLElement | null = plainTerm.closest('div');
        expect(plainRow).not.toBeNull();
        expect(plainRow?.style.getPropertyValue('--portal-tone')).toBe('');
    });

    it('marks the definition cell with the value class for the overflow CSS', (): void => {
        render(<KeyValue label="Cluster metadata" pairs={pairs} />);

        const valueClass: string | undefined = styles.value;
        expect(valueClass).toBeDefined();

        const definition: HTMLElement = screen.getByText('integration');
        expect(definition).toHaveClass(valueClass ?? '');
    });

    it('renders an empty grid without throwing', (): void => {
        render(<KeyValue label="Empty grid" pairs={[]} />);

        const grid: HTMLElement = screen.getByRole('group', {
            name: 'Empty grid',
        });
        expect(grid.querySelector('dl')).not.toBeNull();
        expect(grid.querySelectorAll('dt')).toHaveLength(0);
    });
});
