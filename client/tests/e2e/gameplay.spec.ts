import { expect, test } from '@playwright/test';

test.describe('emergent Browser Client & Perception Loop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
  });

  test('renders initial world, canvas, and player HUD state', async ({ page }) => {
    // 1. Canvas visibility
    const canvas = page.getByTestId('game-canvas');
    await expect(canvas).toBeVisible();

    // 2. HUD Badges
    await expect(page.locator('#hud-persona')).toHaveText('A tribal wanderer');
    await expect(page.locator('#hud-tick')).toHaveText('0');
    await expect(page.locator('#hud-coords')).toHaveText('(1, 1)');
    await expect(page.locator('#hud-weight')).toHaveText('0g / 2000g (0%)');
  });

  test('executes movement and asserts boundary rejection in Chronicle', async ({ page }) => {
    // Initial position (1, 1)
    await expect(page.locator('#hud-coords')).toHaveText('(1, 1)');

    // Step North to (1, 0)
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('#hud-coords')).toHaveText('(1, 0)');
    await expect(page.locator('#hud-tick')).toHaveText('1');

    // Step North again -> Boundary Rejection
    await page.keyboard.press('ArrowUp');

    // Asserts coordinates unchanged and tick unadvanced
    await expect(page.locator('#hud-coords')).toHaveText('(1, 0)');
    await expect(page.locator('#hud-tick')).toHaveText('1');

    // Asserts boundary message rendered in Chronicle
    const log = page.getByTestId('event-log');
    await expect(log).toContainText('You reached the end of the world, come back later');
  });

  test('discovers and picks up relic into rucksack', async ({ page }) => {
    // Initial tile (1, 1) has no ground salvage
    await expect(page.getByTestId('ground-items')).toContainText('No salvage on this tile.');

    // Step East to (2, 1) where relic_001 resides
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#hud-coords')).toHaveText('(2, 1)');

    // Ground salvage card should appear
    const groundPanel = page.getByTestId('ground-items');
    await expect(groundPanel).toContainText('Unmarked Battery Cell (450g)');

    // Click "Pick Up" button
    const pickupBtn = groundPanel.getByRole('button', { name: 'Pick Up' });
    await pickupBtn.click();

    // Inventory card should now contain the relic
    const inventoryPanel = page.getByTestId('inventory-items');
    await expect(inventoryPanel).toContainText('Unmarked Battery Cell (450g)');

    // Ground panel should now be empty
    await expect(groundPanel).toContainText('No salvage on this tile.');

    // Burden updated to 450g
    await expect(page.locator('#hud-weight')).toContainText('450g / 2000g (23%)');

    // Drop item via 'x' keyboard binding
    await page.keyboard.press('x');

    // Rucksack is now empty again and item returned to ground
    await expect(inventoryPanel).toContainText('Rucksack is empty.');
    await expect(groundPanel).toContainText('Unmarked Battery Cell (450g)');
    await expect(page.locator('#hud-weight')).toContainText('0g / 2000g (0%)');
  });
});
