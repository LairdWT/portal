import { expect, type Locator, type Page, test } from '@playwright/test';

// InventoryGrid and Hotbar reorder behavior. NET-NEW: the pointer drags run
// against real cell geometry (the unit suite stubs the grid rect for
// slotMath), and keyboard grab focus movement crosses real focus. Driven
// through the ?fixture=hud harness whose readouts mirror the slot orders.

const FIXTURE_URL: string = '/?fixture=hud';

test('keyboard grab, move, and drop reorders the cargo', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const order: Locator = page.getByTestId('cargo-order');
    await expect(order).toHaveText('c1,c2,c3,c4,c5,c6');

    const source: Locator = page.getByRole('gridcell', { name: 'Plasma cell' });
    await source.focus();
    await page.keyboard.press(' ');
    await expect(source).toHaveAttribute('aria-selected', 'true');

    // Arrow to the slot below (index 3) and drop there.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press(' ');
    await expect(order).toHaveText('c2,c3,c4,c1,c5,c6');
});

test('Escape cancels a grab without moving anything', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const order: Locator = page.getByTestId('cargo-order');
    const source: Locator = page.getByRole('gridcell', { name: 'Plasma cell' });
    await source.focus();
    await page.keyboard.press(' ');
    await expect(source).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Escape');
    await expect(source).toHaveAttribute('aria-selected', 'false');
    await expect(order).toHaveText('c1,c2,c3,c4,c5,c6');
});

test('pointer drag reorders a cargo slot', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const order: Locator = page.getByTestId('cargo-order');
    const source: Locator = page.getByRole('gridcell', { name: 'Medkit' });
    const target: Locator = page.getByRole('gridcell', { name: 'Empty slot 6' });
    const sourceBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null = await source.boundingBox();
    const targetBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null = await target.boundingBox();
    expect(sourceBox).not.toBeNull();
    expect(targetBox).not.toBeNull();
    if (sourceBox === null || targetBox === null) {
        return;
    }

    await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2,
        { steps: 8 },
    );
    await page.mouse.up();

    // moveSlot(1, 5): c2 leaves index 1 and lands at index 5.
    await expect(order).toHaveText('c1,c3,c4,c5,c6,c2');
});

test('Hotbar reorders with Ctrl+Arrow and keeps activation', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const order: Locator = page.getByTestId('hotbar-order');
    const active: Locator = page.getByTestId('hotbar-active');
    await expect(order).toHaveText('blink,barrage,shield');

    const blink: Locator = page.getByRole('button', { name: 'Blink' });
    await blink.focus();
    await page.keyboard.press('Control+ArrowRight');
    await expect(order).toHaveText('barrage,blink,shield');
    // Focus follows the moved key (same DOM node keyed by id).
    await expect(blink).toBeFocused();

    // A plain activation still works after reordering.
    await page.getByRole('button', { name: 'Shield' }).click();
    await expect(active).toHaveText('shield');
});
