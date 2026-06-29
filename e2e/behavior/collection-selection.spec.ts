import { expect, type Locator, type Page, test } from '@playwright/test';

// Collection selection + expansion behavior. NET-NEW: the unit suite covers the
// set-toggling and expansion.ts logic in jsdom, but the headline here is that
// key-based selection SURVIVES real virtual-row recycling (real scroll + real
// unmount/remount) and that the aria-activedescendant cursor resolves to a live
// row id - both impossible in jsdom, which has no layout or scroll. The Accordion
// / TreeView portion proves the real visible/inert reveal.
// Driven through the ?fixture=collections harness (example/src/fixtures).

const FIXTURE_URL: string = '/?fixture=collections';

test('List selection survives virtual-row recycling', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const listbox: Locator = page.getByRole('listbox', { name: 'Players' });
    const readout: Locator = page.getByTestId('list-selected');
    await expect(listbox).toHaveAttribute('tabindex', '0');
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

    // The aria-activedescendant cursor moves on ArrowDown and resolves to a real
    // option (roving cursor, not roving real focus).
    await listbox.focus();
    const initialActive: string | null = await listbox.getAttribute(
        'aria-activedescendant',
    );
    expect(initialActive).not.toBeNull();
    await page.keyboard.press('ArrowDown');
    const movedActive: string | null = await listbox.getAttribute(
        'aria-activedescendant',
    );
    expect(movedActive).not.toBe(initialActive);
    if (movedActive !== null) {
        await expect(page.locator(`[id="${movedActive}"]`)).toHaveAttribute(
            'role',
            'option',
        );
    }

    // Move the cursor to row 3 and select it, then add row 4 (Multi).
    await page.keyboard.press('ArrowDown'); // cursor now at index 2
    await page.keyboard.press('ArrowDown'); // cursor now at index 3
    await page.keyboard.press(' ');
    await expect(
        page.getByRole('option', { name: 'Row 3', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown'); // cursor now at index 4
    await page.keyboard.press(' ');
    await expect(readout).toHaveText('row-3,row-4');

    // Scroll the selected rows far out of the window (End jumps the cursor to the
    // last row, unmounting rows 3 and 4) and confirm row 3 is no longer in the DOM.
    await page.keyboard.press('End');
    await expect(
        page.getByRole('option', { name: 'Row 3', exact: true }),
    ).toHaveCount(0);

    // Scroll back: row 3 re-renders, still selected and still in the set - proving
    // selection is keyed on the stable row key, not a DOM node or index.
    await page.keyboard.press('Home');
    await expect(
        page.getByRole('option', { name: 'Row 3', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(readout).toHaveText('row-3,row-4');
});

test('DataTable selection survives virtual-row recycling', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const grid: Locator = page.getByRole('grid', { name: 'Scores' });
    const readout: Locator = page.getByTestId('table-selected');
    await expect(grid).toHaveAttribute('tabindex', '0');
    await expect(grid).toHaveAttribute('aria-multiselectable', 'true');

    const row3: Locator = grid.locator('[role="row"][data-row-index="3"]');
    const row5: Locator = grid.locator('[role="row"][data-row-index="5"]');
    // Plain click selects a single row (desktop-grid semantics); Ctrl+click adds
    // to the multi-selection, so the two rows accumulate.
    await row3.click();
    await expect(row3).toHaveAttribute('aria-selected', 'true');
    await row5.click({ modifiers: ['Control'] });
    await expect(row5).toHaveAttribute('aria-selected', 'true');
    await expect(readout).toHaveText('row-3,row-5');

    // Pointer selection keeps DOM focus on the grid; the active cursor moves on
    // ArrowDown (aria-activedescendant), proving the single-tab-stop 2D cursor.
    const beforeActive: string | null = await grid.getAttribute(
        'aria-activedescendant',
    );
    await page.keyboard.press('ArrowDown');
    const afterActive: string | null = await grid.getAttribute(
        'aria-activedescendant',
    );
    expect(afterActive).not.toBe(beforeActive);

    // Scroll the body to the bottom so row 3 (not the active row) is recycled out.
    await grid.evaluate((element: HTMLElement): void => {
        element.scrollTop = element.scrollHeight;
    });
    await expect(grid.locator('[role="row"][data-row-index="3"]')).toHaveCount(0);

    // Scroll back to the top: row 3 re-renders selected and still in the set.
    await grid.evaluate((element: HTMLElement): void => {
        element.scrollTop = 0;
    });
    await expect(grid.locator('[role="row"][data-row-index="3"]')).toHaveAttribute(
        'aria-selected',
        'true',
    );
    await expect(readout).toHaveText('row-3,row-5');
});

test('Accordion (Multiple) keeps independent expanded sections', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const alpha: Locator = page.getByRole('button', { name: 'Section Alpha' });
    const bravo: Locator = page.getByRole('button', { name: 'Section Bravo' });
    const readout: Locator = page.getByTestId('acc-expanded');

    await alpha.click();
    await expect(alpha).toHaveAttribute('aria-expanded', 'true');
    await expect(readout).toHaveText('alpha');

    await bravo.click();
    await expect(bravo).toHaveAttribute('aria-expanded', 'true');
    await expect(readout).toHaveText('alpha,bravo');

    // Collapsing one leaves the other expanded (Multiple, not Single).
    await alpha.click();
    await expect(alpha).toHaveAttribute('aria-expanded', 'false');
    await expect(bravo).toHaveAttribute('aria-expanded', 'true');
    await expect(readout).toHaveText('bravo');
});

test('TreeView expands a branch to reveal its child group', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const fruits: Locator = page.getByRole('treeitem', { name: 'Fruits' });
    const readout: Locator = page.getByTestId('tree-expanded');
    await expect(fruits).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('treeitem', { name: 'Apple' })).toHaveCount(0);

    await fruits.focus();
    await page.keyboard.press('ArrowRight');
    await expect(fruits).toHaveAttribute('aria-expanded', 'true');
    await expect(readout).toHaveText('fruits');
    await expect(page.getByRole('treeitem', { name: 'Apple' })).toBeVisible();

    // ArrowLeft collapses the branch, hiding the child group again.
    await page.keyboard.press('ArrowLeft');
    await expect(fruits).toHaveAttribute('aria-expanded', 'false');
    await expect(readout).toHaveText('');
    await expect(page.getByRole('treeitem', { name: 'Apple' })).toHaveCount(0);
});
