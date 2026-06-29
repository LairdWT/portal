import {
    expect,
    type Locator,
    type Page,
    test,
    type TestInfo,
} from '@playwright/test';

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

const GENERATED_INDICATOR: string = '""';

test('forced-colors: the selected tab exposes a non-color indicator box', async ({
    page,
}: { page: Page }, testInfo: TestInfo): Promise<void> => {
    // Gate to the forced-colors project only. This proves the selected indicator
    // survives as a STRUCTURAL cue once the OS strips author colors, so it must
    // not run/assert under the plain desktop project (where colors are intact).
    test.skip(
        testInfo.project.name !== 'behavior-forced-colors',
        'forced-colors indicator check runs only under forced-colors emulation',
    );

    await page.goto(FIXTURE_URL);

    const overview: Locator = page.getByRole('tab', { name: 'Overview' });
    const details: Locator = page.getByRole('tab', { name: 'Details' });

    // Overview is the controlled selection on load; Details is not.
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await expect(details).toHaveAttribute('aria-selected', 'false');

    // The selected tab generates a dedicated ::after rail (content: '') as a
    // redundancy alongside aria-selected; the unselected tab generates none. The
    // rail is a positional box, not a hue, so it remains a distinguishing cue
    // when forced-colors overrides every author color (the same generated-marker
    // pattern backs the RadioGroup dot and the SegmentedControl rail).
    const selectedIndicator: string = await overview.evaluate(
        (el: Element): string => window.getComputedStyle(el, '::after').content,
    );
    const unselectedIndicator: string = await details.evaluate(
        (el: Element): string => window.getComputedStyle(el, '::after').content,
    );

    expect(selectedIndicator).toBe(GENERATED_INDICATOR);
    expect(unselectedIndicator).not.toBe(GENERATED_INDICATOR);
});
