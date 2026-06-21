import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Panel } from './Panel';

const PANEL_TITLE: string = 'Squad status';
const PANEL_BODY: string = 'Panel body content.';

describe('Panel', (): void => {
    it('renders the title and children', (): void => {
        render(<Panel title={PANEL_TITLE}>{PANEL_BODY}</Panel>);

        expect(
            screen.getByRole('heading', { name: PANEL_TITLE }),
        ).toBeInTheDocument();
        expect(screen.getByText(PANEL_BODY)).toBeInTheDocument();
    });

    it('labels the landmark region by its heading', (): void => {
        render(<Panel title={PANEL_TITLE}>{PANEL_BODY}</Panel>);

        // The section is a region only because it is labelled; getByRole region
        // with the heading name proves aria-labelledby is wired to the heading.
        expect(
            screen.getByRole('region', { name: PANEL_TITLE }),
        ).toBeInTheDocument();
    });

    it('renders a div without a region role when landmark is false', (): void => {
        render(
            <Panel title={PANEL_TITLE} landmark={false}>
                {PANEL_BODY}
            </Panel>,
        );

        expect(
            screen.queryByRole('region', { name: PANEL_TITLE }),
        ).not.toBeInTheDocument();
        // The heading still renders so the content remains structured.
        expect(
            screen.getByRole('heading', { name: PANEL_TITLE }),
        ).toBeInTheDocument();
    });

    it('renders the heading at the configured level', (): void => {
        render(
            <Panel title={PANEL_TITLE} headingLevel={3}>
                {PANEL_BODY}
            </Panel>,
        );

        expect(
            screen.getByRole('heading', { name: PANEL_TITLE, level: 3 }),
        ).toBeInTheDocument();
    });
});
