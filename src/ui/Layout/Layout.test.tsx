import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Divider } from './Divider';
import { Grid } from './Grid';
import {
    EDividerOrientation,
    ELayoutGap,
    EStackAlign,
    EStackDirection,
    EStackJustify,
} from './Layout.types';
import { Stack } from './Stack';

describe('Stack', (): void => {
    it('renders sensible defaults onto data attributes', (): void => {
        const view: { container: HTMLElement } = render(
            <Stack>
                <span>a</span>
            </Stack>,
        );
        const root: Element | null = view.container.firstElementChild;
        expect(root?.getAttribute('data-direction')).toBe('column');
        expect(root?.getAttribute('data-gap')).toBe('md');
        expect(root?.getAttribute('data-align')).toBe('stretch');
        expect(root?.getAttribute('data-justify')).toBe('start');
        expect(root?.getAttribute('data-wrap')).toBe('false');
    });

    it('honors explicit axes, alignment, and wrapping', (): void => {
        const view: { container: HTMLElement } = render(
            <Stack
                direction={EStackDirection.Row}
                gap={ELayoutGap.Xl}
                align={EStackAlign.Center}
                justify={EStackJustify.SpaceBetween}
                wrap
            >
                <span>a</span>
            </Stack>,
        );
        const root: Element | null = view.container.firstElementChild;
        expect(root?.getAttribute('data-direction')).toBe('row');
        expect(root?.getAttribute('data-gap')).toBe('xl');
        expect(root?.getAttribute('data-align')).toBe('center');
        expect(root?.getAttribute('data-justify')).toBe('space-between');
        expect(root?.getAttribute('data-wrap')).toBe('true');
    });
});

describe('Grid', (): void => {
    it('clamps the column count into 1..12', (): void => {
        const zero: { container: HTMLElement } = render(
            <Grid columns={0}>
                <span>a</span>
            </Grid>,
        );
        expect(zero.container.firstElementChild?.getAttribute('style')).toContain(
            '--layout-columns: 1',
        );
        const wide: { container: HTMLElement } = render(
            <Grid columns={99}>
                <span>a</span>
            </Grid>,
        );
        expect(wide.container.firstElementChild?.getAttribute('style')).toContain(
            '--layout-columns: 12',
        );
        const invalid: { container: HTMLElement } = render(
            <Grid columns={Number.NaN}>
                <span>a</span>
            </Grid>,
        );
        expect(
            invalid.container.firstElementChild?.getAttribute('style'),
        ).toContain('--layout-columns: 2');
    });
});

describe('Divider', (): void => {
    it('renders a plain separator with its orientation', (): void => {
        render(<Divider orientation={EDividerOrientation.Vertical} />);
        const separator: HTMLElement = screen.getByRole('separator');
        expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('renders the labelled horizontal form', (): void => {
        render(<Divider label="Telemetry" />);
        const separator: HTMLElement = screen.getByRole('separator');
        expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
        expect(screen.getByText('Telemetry')).toBeInTheDocument();
    });

    it('ignores a label on the vertical form', (): void => {
        render(
            <Divider label="Ignored" orientation={EDividerOrientation.Vertical} />,
        );
        expect(screen.queryByText('Ignored')).toBeNull();
    });
});
