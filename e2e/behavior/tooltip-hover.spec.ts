import { expect, type Locator, type Page, test } from '@playwright/test';

// Tooltip WCAG 1.4.13 (Content on Hover or Focus). NET-NEW: pointer-geometry hover
// bridging cannot be measured in jsdom at all (Tooltip has only non-geometric unit
// coverage); a real browser is the only place 1.4.13 can be verified. All four
// 1.4.13 assertions run here - appear-on-hover, appear-on-focus/hide-on-blur,
// Escape-dismiss, and the HOVERABLE assertion (the pointer can move onto the panel
// without it vanishing), backed by the Tooltip panel hover-bridge. Driven through
// the ?fixture=tooltip harness.

const FIXTURE_URL: string = '/?fixture=tooltip';

test('hovering the trigger shows a tooltip wired by aria-describedby', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const trigger: Locator = page.getByRole('button', { name: 'Run query' });
    await trigger.hover();

    const tooltip: Locator = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();

    const describedBy: string | null =
        await trigger.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    if (describedBy !== null) {
        await expect(page.locator(`[id="${describedBy}"]`)).toHaveAttribute(
            'role',
            'tooltip',
        );
    }
});

test('the tooltip appears on focus and hides on blur', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const trigger: Locator = page.getByRole('button', { name: 'Run query' });
    await trigger.focus();
    await expect(page.getByRole('tooltip')).toBeVisible();

    await trigger.blur();
    await expect(page.getByRole('tooltip')).toBeHidden();
});

test('Escape dismisses the tooltip', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const trigger: Locator = page.getByRole('button', { name: 'Run query' });
    await trigger.hover();
    await expect(page.getByRole('tooltip')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toBeHidden();
});

test('the tooltip stays open while the pointer is over the panel (WCAG 1.4.13 hoverable)', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const trigger: Locator = page.getByRole('button', { name: 'Run query' });
    await trigger.hover();
    const tooltip: Locator = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();

    // Move the pointer from the trigger onto the tooltip panel; it must remain
    // visible so a user can reach links/selectable text inside it.
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
});
