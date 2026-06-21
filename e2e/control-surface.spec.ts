import { expect, type Locator, type Page, test } from '@playwright/test';

// The example app renders a single ControlSurface: a <section> containing a
// Joystick and two ActionButtons. These checks are render-level only - they never
// interact with the joystick - so they exercise the mobile-first layout contract
// across the device, reduced-motion, and forced-colors projects without depending
// on input internals.

const MIN_TOUCH_TARGET_PX: number = 48;

test('example mounts the control surface', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto('/');
    await expect(page.locator('section').first()).toBeVisible();
    const buttonCount: number = await page.getByRole('button').count();
    expect(buttonCount).toBeGreaterThanOrEqual(2);
});

test('control surface has no horizontal overflow', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto('/');
    const overflows: boolean = await page.evaluate((): boolean => {
        const root: HTMLElement = document.documentElement;
        return root.scrollWidth > root.clientWidth;
    });
    expect(overflows).toBe(false);
});

test('every button meets the 48px touch-target minimum', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto('/');
    const buttons: Locator = page.getByRole('button');
    const buttonCount: number = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(2);

    for (let index: number = 0; index < buttonCount; index += 1) {
        const button: Locator = buttons.nth(index);
        await expect(button).toBeVisible();
        const box: {
            x: number;
            y: number;
            width: number;
            height: number;
        } | null = await button.boundingBox();
        expect(box).not.toBeNull();
        if (box !== null) {
            expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
            expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
        }
    }
});
