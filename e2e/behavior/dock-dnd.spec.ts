import { expect, type Locator, type Page, test } from '@playwright/test';

// DockLayout drag-and-drop behavior. NET-NEW: edge-zone hit testing needs a
// real laid-out container (the unit suite drives dockMath with synthetic
// rects), and the float -> dock-back cycle crosses a real portal Window.
// Driven through the ?fixture=dock harness, whose readouts mirror the
// serializable layout state.

const FIXTURE_URL: string = '/?fixture=dock';

test('grip drag docks the console group to the inline-start edge', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const docked: Locator = page.getByTestId('dock-docked');
    await expect(docked).toHaveText('nav,editor,preview,console');

    const grip: Locator = page.getByRole('button', { name: 'Move Console' });
    const dock: Locator = page.locator('[aria-label="Workspace dock"]');
    const gripBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null = await grip.boundingBox();
    const dockBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null = await dock.boundingBox();
    expect(gripBox).not.toBeNull();
    expect(dockBox).not.toBeNull();
    if (gripBox === null || dockBox === null) {
        return;
    }

    // Drag the grip into the inline-start edge band (the outer 20%).
    await page.mouse.move(
        gripBox.x + gripBox.width / 2,
        gripBox.y + gripBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
        dockBox.x + dockBox.width * 0.05,
        dockBox.y + dockBox.height / 2,
        { steps: 10 },
    );
    await page.mouse.up();

    // The drop committed dockAtEdge(inline-start): console leads the tree.
    await expect(docked).toHaveText('console,nav,editor,preview');
});

test('the dock menu floats the editor and its window docks back', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const docked: Locator = page.getByTestId('dock-docked');
    const floating: Locator = page.getByTestId('dock-floating');
    await expect(floating).toHaveText('');

    // Keyboard-reachable path: the group menu's Float action.
    await page.getByRole('button', { name: 'Editor dock options' }).click();
    await page.getByRole('menuitem', { name: 'Float' }).click();
    await expect(floating).toHaveText('editor');
    await expect(docked).toHaveText('nav,preview,console');

    // The floating Window's title-bar action returns it to the dock.
    await page.getByRole('button', { name: 'Dock Editor' }).click();
    await expect(floating).toHaveText('');
    await expect(docked).toContainText('editor');
});
