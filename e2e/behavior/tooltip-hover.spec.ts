import { expect, type Locator, type Page, test } from '@playwright/test';

// Tooltip WCAG 1.4.13 (Content on Hover or Focus). NET-NEW: pointer-geometry hover
// bridging cannot be measured in jsdom at all (Tooltip has only non-geometric unit
// coverage); a real browser is the only place 1.4.13 can be verified. The
// appear-on-hover/focus, focus/blur, and Escape-dismiss assertions run today; the
// HOVERABLE assertion (pointer can move onto the panel without it vanishing) is
// test.fixme because the Tooltip hover-bridge is Track-6 P2 and Tooltip.tsx is out
// of scope here. Driven through the ?fixture=tooltip harness.

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

// GATED (Track-6 P2): today the wrapper span's onPointerLeave closes the tooltip
// before the pointer reaches the portaled panel (Tooltip.tsx closeDelayMs = 0 and
// no pointer-enter bridge on the panel). Enabling this requires the Track-6
// hover-bridge in Tooltip.tsx, which is out of scope for this Track-3 work.
test.fixme('the tooltip stays open while the pointer is over the panel (WCAG 1.4.13 hoverable)', async ({
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
