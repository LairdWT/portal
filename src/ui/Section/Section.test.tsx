import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EUiStatus } from '../tone';
import { Section } from './Section';

describe('Section', (): void => {
    it('renders the title and body content', (): void => {
        render(<Section title="Telemetry">Live readouts</Section>);

        expect(screen.getByText('Telemetry')).toBeInTheDocument();
        expect(screen.getByText('Live readouts')).toBeInTheDocument();
    });

    it('exposes a region landmark labelled by its title', (): void => {
        render(<Section title="Telemetry">Body</Section>);

        expect(
            screen.getByRole('region', { name: 'Telemetry' }),
        ).toBeInTheDocument();
    });

    it('renders the title as a level-2 heading by default', (): void => {
        render(<Section title="Telemetry">Body</Section>);

        const heading: HTMLElement = screen.getByRole('heading', { level: 2 });
        expect(heading).toHaveTextContent('Telemetry');
    });

    it('renders the title at the configured heading level', (): void => {
        render(
            <Section title="Telemetry" headingLevel={4}>
                Body
            </Section>,
        );

        const heading: HTMLElement = screen.getByRole('heading', { level: 4 });
        expect(heading).toHaveTextContent('Telemetry');
    });

    it('renders the optional actions slot', (): void => {
        render(
            <Section title="Filters" actions={<button type="button">Clear</button>}>
                Body
            </Section>,
        );

        expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });

    it('omits the actions region when no actions are supplied', (): void => {
        render(<Section title="Telemetry">Body</Section>);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('applies the tone style to the root', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(
            <Section title="Telemetry" tone={toneColor}>
                Body
            </Section>,
        );

        const region: HTMLElement = screen.getByRole('region', {
            name: 'Telemetry',
        });
        expect(region.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('surfaces the status as a data attribute', (): void => {
        render(
            <Section title="Telemetry" status={EUiStatus.Danger}>
                Body
            </Section>,
        );

        const region: HTMLElement = screen.getByRole('region', {
            name: 'Telemetry',
        });
        expect(region).toHaveAttribute('data-status', EUiStatus.Danger);
    });

    it('defaults the status to none', (): void => {
        render(<Section title="Telemetry">Body</Section>);

        const region: HTMLElement = screen.getByRole('region', {
            name: 'Telemetry',
        });
        expect(region).toHaveAttribute('data-status', EUiStatus.None);
    });
});
