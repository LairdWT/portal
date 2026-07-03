import { expect, type Locator, type Page, test } from '@playwright/test';

// LogConsole follow-tail behavior. NET-NEW: the pin/unpin contract depends on
// real scroll geometry (scrollHeight vs clientHeight), which jsdom stubs;
// here real appends land the viewport on the real bottom edge. Driven
// through the ?fixture=hud harness.

const FIXTURE_URL: string = '/?fixture=hud';

// How close to the bottom (px) counts as pinned, mirroring the component's
// half-row threshold.
const PIN_TOLERANCE_PX: number = 12;

function tailGap(log: Locator): Promise<number> {
    return log.evaluate(
        (element: HTMLElement): number =>
            element.scrollHeight - element.scrollTop - element.clientHeight,
    );
}

test('follows the tail while pinned', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const log: Locator = page.getByRole('log', { name: 'Telemetry' });
    const follow: Locator = page.getByRole('button', { name: 'Follow tail' });
    await expect(follow).toHaveAttribute('aria-pressed', 'true');

    // Pinned on load: the viewport sits on the bottom edge.
    await expect
        .poll(async (): Promise<number> => tailGap(log))
        .toBeLessThanOrEqual(PIN_TOLERANCE_PX);

    // An append while pinned re-lands the bottom.
    await page.getByRole('button', { name: 'Append entry' }).click();
    await expect(page.getByTestId('log-count')).toHaveText('41');
    await expect
        .poll(async (): Promise<number> => tailGap(log))
        .toBeLessThanOrEqual(PIN_TOLERANCE_PX);
});

test('scrolling away unpins and appends preserve the position', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const log: Locator = page.getByRole('log', { name: 'Telemetry' });
    const follow: Locator = page.getByRole('button', { name: 'Follow tail' });

    // Scroll to the top: the pin releases.
    await log.evaluate((element: HTMLElement): void => {
        element.scrollTop = 0;
    });
    await expect(follow).toHaveAttribute('aria-pressed', 'false');

    // A burst of appends must NOT yank the unpinned viewport away.
    await page.getByRole('button', { name: 'Append burst' }).click();
    await expect(page.getByTestId('log-count')).toHaveText('70');
    const scrollTop: number = await log.evaluate(
        (element: HTMLElement): number => element.scrollTop,
    );
    expect(scrollTop).toBeLessThanOrEqual(PIN_TOLERANCE_PX);

    // The follow toggle re-pins and lands the bottom again.
    await follow.click();
    await expect(follow).toHaveAttribute('aria-pressed', 'true');
    await expect
        .poll(async (): Promise<number> => tailGap(log))
        .toBeLessThanOrEqual(PIN_TOLERANCE_PX);
});
