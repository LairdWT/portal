import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TitleBar } from './TitleBar';
import { ETitleBarLandmark } from './TitleBar.types';

// axe coverage is delivered by the stories (the addon-a11y story gate run under
// pnpm test:run), not jest-axe here - consistent with the rest of the repo. This
// file asserts the heading, landmark mapping, slots, separator, tone, and status
// behavior in jsdom; the masthead has no keyboard contract of its own to test.

const TITLE: string = 'SAAS RADAR';
const TAGLINE: string = 'TACTICAL OPPORTUNITY DISPLAY';

describe('TitleBar', (): void => {
    it('renders the title as a level-1 heading by default', (): void => {
        render(<TitleBar title={TITLE} />);

        expect(
            screen.getByRole('heading', { name: TITLE, level: 1 }),
        ).toBeInTheDocument();
    });

    it('renders the title at an overridden heading level', (): void => {
        render(<TitleBar title={TITLE} headingLevel={3} />);

        expect(
            screen.getByRole('heading', { name: TITLE, level: 3 }),
        ).toBeInTheDocument();
    });

    it('exposes a banner landmark by default', (): void => {
        render(<TitleBar title={TITLE} />);

        const banner: HTMLElement = screen.getByRole('banner');
        expect(banner).toBeInTheDocument();
        expect(banner.getAttribute('data-landmark')).toBe(ETitleBarLandmark.Banner);
    });

    it('exposes a region landmark named by the title heading', (): void => {
        render(<TitleBar title={TITLE} landmark={ETitleBarLandmark.Region} />);

        // getByRole region with the heading name proves aria-labelledby is wired
        // to the title heading's id (round-tripping the id pair).
        expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument();
    });

    it('renders no landmark when landmark is None', (): void => {
        render(<TitleBar title={TITLE} landmark={ETitleBarLandmark.None} />);

        expect(screen.queryByRole('banner')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('region', { name: TITLE }),
        ).not.toBeInTheDocument();
        // The heading still renders so the content stays structured.
        expect(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument();
    });

    it('renders the leading, tagline, trailing, and breadcrumb slots', (): void => {
        render(
            <TitleBar
                title={TITLE}
                leading={<span>LEAD</span>}
                tagline={<span>{TAGLINE}</span>}
                trailing={<button type="button">Refresh</button>}
                breadcrumb={<nav aria-label="trail">CRUMBS</nav>}
            />,
        );

        expect(screen.getByText('LEAD')).toBeInTheDocument();
        expect(screen.getByText(TAGLINE)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
        expect(screen.getByText('CRUMBS')).toBeInTheDocument();
    });

    it('renders the default decorative separator, aria-hidden, when a tagline is set', (): void => {
        render(<TitleBar title={TITLE} tagline={TAGLINE} />);

        const separator: HTMLElement = screen.getByText('::');
        expect(separator).toBeInTheDocument();
        expect(separator.getAttribute('aria-hidden')).toBe('true');
    });

    it('suppresses the separator when separator is the empty string', (): void => {
        render(<TitleBar title={TITLE} tagline={TAGLINE} separator="" />);

        expect(screen.queryByText('::')).not.toBeInTheDocument();
        // The tagline still renders without the separator (Helicon parity).
        expect(screen.getByText(TAGLINE)).toBeInTheDocument();
    });

    it('renders no separator when there is no tagline', (): void => {
        render(<TitleBar title={TITLE} />);

        expect(screen.queryByText('::')).not.toBeInTheDocument();
    });

    it('places trailing content after the title in DOM order', (): void => {
        render(
            <TitleBar
                title={TITLE}
                trailing={<button type="button">Refresh</button>}
            />,
        );

        const heading: HTMLElement = screen.getByRole('heading', {
            name: TITLE,
        });
        const trailing: HTMLElement = screen.getByRole('button', {
            name: 'Refresh',
        });
        // A following-node bit confirms the trailing slot is after the heading.
        const relation: number = heading.compareDocumentPosition(trailing);
        expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('applies the tone seed as the --portal-tone custom property on the root', (): void => {
        const toneColor: string = 'rgb(255, 0, 0)';
        render(<TitleBar title={TITLE} tone={toneColor} />);

        const banner: HTMLElement = screen.getByRole('banner');
        expect(banner.style.getPropertyValue('--portal-tone')).toBe(toneColor);
    });

    it('reflects the status prop on the data-status attribute', (): void => {
        render(<TitleBar title={TITLE} status="danger" />);

        const banner: HTMLElement = screen.getByRole('banner');
        expect(banner.getAttribute('data-status')).toBe('danger');
    });
});
