import { expect, type Locator, type Page, test } from '@playwright/test';

// Tabs APG tab/tabpanel relationship. NET-NEW: this is a DOM-id-resolution
// contract that only matters once rendered in a browser with a real id graph -
// the per-tab id is `${useId()}-tab-${item.id}`, so the tab->panel (aria-controls)
// and panel->tab (aria-labelledby) links can only be verified against the live
// ids. The existing axe story renders a tablist but does not assert the id wiring.
// Driven through the ?fixture=tabs-apg harness (example/src/fixtures).

const FIXTURE_URL: string = '/?fixture=tabs-apg';
const TAB_IDS: readonly string[] = ['intro', 'api', 'faq'];

test('the tablist carries its accessible name', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);
    await expect(page.getByRole('tablist', { name: 'Docs' })).toBeVisible();
});

test('each tab links to a real tabpanel via aria-controls', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    for (const id of TAB_IDS) {
        const tab: Locator = page.locator(
            `[role="tab"][aria-controls="panel-${id}"]`,
        );
        const tabDomId: string | null = await tab.getAttribute('id');
        expect(tabDomId).not.toBeNull();
        expect(tabDomId ?? '').not.toBe('');

        const panel: Locator = page.locator(`#panel-${id}`);
        await expect(panel).toBeAttached();
        await expect(panel).toHaveAttribute('role', 'tabpanel');
    }
});

test('the active panel is labelled by the active tab id', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const introTab: Locator = page.getByRole('tab', { name: 'Intro' });
    const introTabId: string | null = await introTab.getAttribute('id');
    expect(introTabId).not.toBeNull();

    // Only the active panel is visible, so the tabpanel role resolves to one node.
    const panel: Locator = page.getByRole('tabpanel');
    await expect(panel).toHaveAttribute('aria-labelledby', introTabId ?? '');
});

test('switching tabs updates selection and swaps the labelled panel', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const introTab: Locator = page.getByRole('tab', { name: 'Intro' });
    const apiTab: Locator = page.getByRole('tab', { name: 'API' });

    await introTab.focus();
    await introTab.press('ArrowRight');
    await expect(apiTab).toHaveAttribute('aria-selected', 'true');
    await expect(introTab).toHaveAttribute('aria-selected', 'false');

    const apiTabId: string | null = await apiTab.getAttribute('id');
    const panel: Locator = page.getByRole('tabpanel');
    await expect(panel).toHaveAttribute('id', 'panel-api');
    await expect(panel).toHaveAttribute('aria-labelledby', apiTabId ?? '');
});
