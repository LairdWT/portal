import { expect, type Locator, type Page, test } from '@playwright/test';

// The example app renders the SecretFieldDemo in its own <section>, appended after
// the ControlSurface section. These checks exercise the real-browser concerns the
// jsdom unit tests cannot measure: the 48px toggle hit area, the native masked
// type flip, and the submit/no-submit form contract. They run across the device,
// reduced-motion, and forced-colors projects.

const MIN_TOUCH_TARGET_PX: number = 48;

test('masks the secret with a password input by default', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto('/');
    const input: Locator = page.getByLabel('Password', { exact: true });
    await expect(input).toHaveAttribute('type', 'password');
});

test('the reveal toggle clears the 48px touch target', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto('/');
    const toggle: Locator = page.getByRole('button', { name: 'Reveal password' });
    await expect(toggle).toBeVisible();
    const box: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null = await toggle.boundingBox();
    expect(box).not.toBeNull();
    if (box !== null) {
        expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
        expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
    }
});

test('the reveal toggle flips the masked state without submitting', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto('/');
    const input: Locator = page.getByLabel('Password', { exact: true });
    const counter: Locator = page.locator('[data-submit-count]');
    await expect(counter).toHaveAttribute('data-submit-count', '0');

    // The toggle keeps one stable accessible name; shown/hidden is conveyed by
    // aria-pressed on the same button before and after the click.
    const toggle: Locator = page.getByRole('button', { name: 'Reveal password' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();

    await expect(input).toHaveAttribute('type', 'text');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(counter).toHaveAttribute('data-submit-count', '0');
});

test('pressing Enter in the field submits the form', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto('/');
    const input: Locator = page.getByLabel('Password', { exact: true });
    const counter: Locator = page.locator('[data-submit-count]');

    await input.click();
    await input.fill('correct horse battery staple');
    await input.press('Enter');

    await expect(counter).toHaveAttribute('data-submit-count', '1');
});
