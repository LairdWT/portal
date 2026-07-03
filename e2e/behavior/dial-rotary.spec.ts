import { expect, type Locator, type Page, test } from '@playwright/test';

// Dial rotary behavior. NET-NEW over the unit suite: the atan2 twist math and
// the detent settle are proven against real pointer geometry (a bounding box
// with real layout), which jsdom cannot supply - the unit tests stub the
// knob rect. Driven through the ?fixture=hud harness.

const FIXTURE_URL: string = '/?fixture=hud';

test('Dial steps from the keyboard on the value lattice', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const dial: Locator = page.getByRole('slider', { name: 'Throttle' });
    const readout: Locator = page.getByTestId('dial-value');
    await expect(readout).toHaveText('40');

    await dial.focus();
    await page.keyboard.press('ArrowRight');
    await expect(readout).toHaveText('41');
    await expect(dial).toHaveAttribute('aria-valuenow', '41');

    await page.keyboard.press('ArrowUp');
    await expect(readout).toHaveText('42');

    await page.keyboard.press('PageUp');
    await expect(readout).toHaveText('52');

    await page.keyboard.press('Home');
    await expect(readout).toHaveText('0');

    await page.keyboard.press('End');
    await expect(readout).toHaveText('100');
});

test('Dial pointer twist is relative and settles on a detent', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const dial: Locator = page.getByRole('slider', { name: 'Throttle' });
    const readout: Locator = page.getByTestId('dial-value');
    const box: { x: number; y: number; width: number; height: number } | null =
        await dial.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) {
        return;
    }
    const centerX: number = box.x + box.width / 2;
    const centerY: number = box.y + box.height / 2;

    // Grab at 3 o'clock: grabbing alone must NOT jump the value (the twist
    // is relative, not absolute pointer angle).
    await page.mouse.move(centerX + box.width * 0.4, centerY);
    await page.mouse.down();
    await expect(readout).toHaveText('40');

    // Twist a quarter turn to 6 o'clock: +90 degrees of the 270-degree sweep
    // is +33.3 value, so the live (quantized) value reads 73.
    await page.mouse.move(centerX, centerY + box.height * 0.4, { steps: 12 });
    await expect(readout).toHaveText('73');

    // Release: the value settles on the nearest detent (75).
    await page.mouse.up();
    await expect(readout).toHaveText('75');
    await expect(dial).toHaveAttribute('aria-valuenow', '75');
});
