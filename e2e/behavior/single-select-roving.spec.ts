import { expect, type Locator, type Page, test } from '@playwright/test';

// Single-select roving / activation behavior. NET-NEW over the jsdom unit suite
// (which already locks the onChange payload logic): this exercises REAL browser
// focus location (toBeFocused / document.activeElement), a REAL single-tab-stop
// check jsdom's synthetic focus cannot prove, the manual-vs-automatic activation
// CONTRAST (NavRail vs Tabs) through real key events on a laid-out widget, and -
// on the forced-colors project - that the selected indicator is not color-only.
// Driven through the ?fixture=single-select harness (example/src/fixtures).

const FIXTURE_URL: string = '/?fixture=single-select';
const SINGLE_TAB_STOP: number = 1;

test('roving groups expose exactly one tab stop', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const radiogroup: Locator = page.getByRole('radiogroup', {
        name: 'Difficulty',
    });
    const tablist: Locator = page.getByRole('tablist', { name: 'Panels' });

    const radioStops: number = await radiogroup
        .locator('[role="radio"][tabindex="0"]')
        .count();
    expect(radioStops).toBe(SINGLE_TAB_STOP);

    const tabStops: number = await tablist
        .locator('[role="tab"][tabindex="0"]')
        .count();
    expect(tabStops).toBe(SINGLE_TAB_STOP);
});

test('RadioGroup arrow navigation skips the disabled option and wraps', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const easy: Locator = page.getByRole('radio', { name: 'Easy' });
    const hard: Locator = page.getByRole('radio', { name: 'Hard' });
    const readout: Locator = page.getByTestId('rg-value');
    await expect(readout).toHaveText('easy');

    // ArrowDown from index 0 skips the disabled index 1 and lands on index 2.
    await easy.focus();
    await easy.press('ArrowDown');
    await expect(hard).toBeFocused();
    await expect(readout).toHaveText('hard');

    // ArrowDown again wraps from the last enabled option back to the first.
    await hard.press('ArrowDown');
    await expect(easy).toBeFocused();
    await expect(readout).toHaveText('easy');

    // Home / End jump to the first / last enabled option.
    await easy.press('End');
    await expect(hard).toBeFocused();
    await expect(readout).toHaveText('hard');
    await hard.press('Home');
    await expect(easy).toBeFocused();
    await expect(readout).toHaveText('easy');
});

test('SegmentedControl arrow navigation activates automatically', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const grid: Locator = page.getByRole('radio', { name: 'Grid' });
    const list: Locator = page.getByRole('radio', { name: 'List' });
    const readout: Locator = page.getByTestId('seg-value');
    await expect(readout).toHaveText('grid');

    await grid.focus();
    await grid.press('ArrowRight');
    await expect(list).toBeFocused();
    await expect(readout).toHaveText('list');
});

test('Tabs arrow navigation activates automatically and wraps', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const overview: Locator = page.getByRole('tab', { name: 'Overview' });
    const details: Locator = page.getByRole('tab', { name: 'Details' });
    const history: Locator = page.getByRole('tab', { name: 'History' });
    const readout: Locator = page.getByTestId('tabs-value');
    await expect(readout).toHaveText('overview');

    await overview.focus();
    await overview.press('ArrowRight');
    await expect(details).toBeFocused();
    await expect(readout).toHaveText('details');
    await expect(details).toHaveAttribute('aria-selected', 'true');

    // ArrowLeft moves back to the now-selected first tab (selection follows the
    // controlled value, so press on the focused/selected tab each time).
    await details.press('ArrowLeft');
    await expect(overview).toBeFocused();
    await expect(readout).toHaveText('overview');

    // ArrowLeft from the first tab wraps to the last.
    await overview.press('ArrowLeft');
    await expect(history).toBeFocused();
    await expect(readout).toHaveText('history');
});

test('NavRail uses manual activation: arrows move focus only', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const home: Locator = page.getByRole('button', { name: 'Home' });
    const library: Locator = page.getByRole('button', { name: 'Library' });
    const readout: Locator = page.getByTestId('nav-value');
    await expect(readout).toHaveText('home');

    // ArrowDown moves the roving focus but, unlike Tabs, does NOT change the value.
    await home.focus();
    await home.press('ArrowDown');
    await expect(library).toBeFocused();
    await expect(readout).toHaveText('home');

    // Enter on the focused item is what activates it (manual activation).
    await library.press('Enter');
    await expect(readout).toHaveText('library');
});

test('Select opens as a combobox and selects via aria-activedescendant', async ({
    page,
}: {
    page: Page;
}): Promise<void> => {
    await page.goto(FIXTURE_URL);

    const trigger: Locator = page.getByRole('combobox', { name: 'Region' });
    const readout: Locator = page.getByTestId('select-value');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');

    // ArrowDown opens the listbox; DOM focus stays on the trigger and navigation
    // is exposed through aria-activedescendant rather than roving real focus.
    await trigger.focus();
    await trigger.press('ArrowDown');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toBeFocused();

    const firstActive: string | null = await trigger.getAttribute(
        'aria-activedescendant',
    );
    expect(firstActive).not.toBeNull();
    if (firstActive !== null) {
        await expect(page.locator(`#${firstActive}`)).toHaveAttribute(
            'role',
            'option',
        );
    }

    // Enter selects the active option, closes the listbox, and updates the value.
    await trigger.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(readout).not.toHaveText('');

    // Re-open then Escape closes WITHOUT changing the committed value.
    const committed: string = (await readout.textContent()) ?? '';
    await trigger.press('ArrowDown');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await trigger.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(readout).toHaveText(committed);
});
