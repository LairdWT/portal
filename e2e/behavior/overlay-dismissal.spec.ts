import { expect, type Locator, type Page, test } from '@playwright/test';

// Overlay trap + restore + dismissal for the whole portal overlay family. NET-NEW
// (highest value): jsdom has NO real focus model and NO real portal layout, so Tab
// traversal inside a portal and focus-restore ACROSS portal unmount are only
// faithfully exercised in a real browser. Each overlay is asserted on BEHAVIOR
// (opened, focus moved into the panel, Escape dismissed, focus restored to the
// trigger), never on its callback name (onClose vs onOpenChange).
// Driven through the ?fixture=overlays harness (example/src/fixtures).

const FIXTURE_URL: string = '/?fixture=overlays';
const TAB_PRESSES: number = 6;

// `focusInside` asserts focus moves INTO the panel on open; `trapTab` asserts Tab
// stays trapped. These hold for the surfaces whose useFocusTrap focuses on open
// (Dialog, Drawer, Window, CommandPalette). Popover (panel is visibility:hidden
// until positioned, so it cannot focus on the open click) and Menu (focus moves to
// an item only on keyboard navigation, not on click-open) are asserted on
// open + Escape-dismiss + focus-restore only - the contract this spec proves for
// the whole family.
type OverlayCase = Readonly<{
    name: string;
    trigger: string;
    panelRole: string;
    focusInside: boolean;
    trapTab: boolean;
}>;

const OVERLAY_CASES: readonly OverlayCase[] = [
    {
        name: 'Dialog',
        trigger: 'Open dialog',
        panelRole: 'dialog',
        focusInside: true,
        trapTab: true,
    },
    {
        name: 'Drawer',
        trigger: 'Open drawer',
        panelRole: 'dialog',
        focusInside: true,
        trapTab: true,
    },
    {
        name: 'Popover',
        trigger: 'Open popover',
        panelRole: 'dialog',
        focusInside: false,
        trapTab: false,
    },
    {
        name: 'Window',
        trigger: 'Open window',
        panelRole: 'dialog',
        focusInside: true,
        trapTab: true,
    },
    {
        name: 'CommandPalette',
        trigger: 'Open palette',
        panelRole: 'dialog',
        focusInside: true,
        trapTab: true,
    },
    {
        name: 'Menu',
        trigger: 'Open menu',
        panelRole: 'menu',
        focusInside: false,
        trapTab: false,
    },
];

// Whether DOM focus currently sits inside the shared portal overlay root.
async function focusIsInsideOverlay(page: Page): Promise<boolean> {
    return page.evaluate((): boolean => {
        const root: Element | null = document.querySelector(
            '[data-portal-overlay-root]',
        );
        const active: Element | null = document.activeElement;
        return root !== null && active !== null && root.contains(active);
    });
}

for (const overlayCase of OVERLAY_CASES) {
    test(`${overlayCase.name} opens, traps focus, and restores on Escape`, async ({
        page,
    }: {
        page: Page;
    }): Promise<void> => {
        await page.goto(FIXTURE_URL);

        const trigger: Locator = page.getByRole('button', {
            name: overlayCase.trigger,
            exact: true,
        });
        const panel: Locator = page.getByRole(
            overlayCase.panelRole === 'dialog' ? 'dialog' : 'menu',
        );

        // Open the surface.
        await trigger.click();
        await expect(panel).toBeVisible();

        // Surfaces whose focus trap focuses on open move focus INTO the panel.
        if (overlayCase.focusInside) {
            await expect
                .poll((): Promise<boolean> => focusIsInsideOverlay(page))
                .toBe(true);
        }

        // Trapping surfaces keep Tab inside: focus must never escape the portal.
        if (overlayCase.trapTab) {
            for (let index: number = 0; index < TAB_PRESSES; index += 1) {
                await page.keyboard.press('Tab');
            }
            await expect
                .poll((): Promise<boolean> => focusIsInsideOverlay(page))
                .toBe(true);
        }

        // Escape dismisses the surface and restores focus to the opening trigger.
        await page.keyboard.press('Escape');
        await expect(panel).toBeHidden();
        await expect(trigger).toBeFocused();
    });
}
