import { expect, test } from '@playwright/test';

test.describe('emergent Hexagonal World & Diurnal Time Economy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
  });

  test('renders initial hex world, canvas, and diurnal clock state', async ({ page }) => {
    // 1. Canvas visibility
    const canvas = page.getByTestId('game-canvas');
    await expect(canvas).toBeVisible();

    // 2. HUD Header & Badges
    await expect(page.locator('#hud-persona')).toHaveText('A tribal wanderer');
    await expect(page.locator('#hud-clock')).toHaveText('Day 1 — Morning');
    await expect(page.locator('#hud-tick')).toHaveText('0');
    await expect(page.locator('#hud-coords')).toHaveText('(0, 0)');
    await expect(page.locator('#hud-weight')).toHaveText('0g / 2000g (0%)');
  });

  test('handles hex movement, diurnal clock advancement, and terrain/perimeter boundary rejection', async ({ page }) => {
    // Initial position (0, 0) and clock Day 1 — Morning
    await expect(page.locator('#hud-coords')).toHaveText('(0, 0)');
    await expect(page.locator('#hud-clock')).toHaveText('Day 1 — Morning');

    // Attempt to step West (-1, 0) into scrap wall
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#hud-coords')).toHaveText('(0, 0)');
    await expect(page.locator('#hud-clock')).toHaveText('Day 1 — Morning');
    await expect(page.locator('#hud-tick')).toHaveText('0');

    // Asserts terrain collision message in Chronicle
    const log = page.getByTestId('event-log');
    await expect(log).toContainText('Path blocked by scrap wall.');

    // Step North-West to (0, -1)
    await page.keyboard.press('q');
    await expect(page.locator('#hud-coords')).toHaveText('(0, -1)');
    await expect(page.locator('#hud-clock')).toHaveText('Day 1 — Afternoon');
    await expect(page.locator('#hud-tick')).toHaveText('1');

    // Step North-West again to (0, -2)
    await page.keyboard.press('q');
    await expect(page.locator('#hud-coords')).toHaveText('(0, -2)');
    await expect(page.locator('#hud-clock')).toHaveText('Day 1 — Night');
    await expect(page.locator('#hud-tick')).toHaveText('2');

    // Step North-West again -> Perimeter boundary rejection (radius 2 exceeded)
    await page.keyboard.press('q');
    await expect(page.locator('#hud-coords')).toHaveText('(0, -2)');
    await expect(page.locator('#hud-clock')).toHaveText('Day 1 — Night');
    await expect(page.locator('#hud-tick')).toHaveText('2');
    await expect(log).toContainText('You reached the perimeter of the territory, turn back.');
  });

  test('surveys hidden discoveries, collects relics, and drops into revealed caches', async ({ page }) => {
    // Initial tile (0, 0) has no ground salvage
    await expect(page.getByTestId('ground-items')).toContainText('No salvage on this hex.');

    // Step East to (1, 0) where the sunken hatch is hidden
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#hud-coords')).toHaveText('(1, 0)');
    await expect(page.locator('#hud-clock')).toHaveText('Day 1 — Afternoon');

    // Ground panel displays hidden discovery indicator
    const groundPanel = page.getByTestId('ground-items');
    await expect(groundPanel).toContainText('1 hidden anomaly detected in this sector. Survey the hex to reveal.');

    // Attempting tactical pickup before surveying fails
    await page.keyboard.press('g');
    const log = page.getByTestId('event-log');
    await expect(log).toContainText('Discovery must be searched and revealed before collection.');

    // Click "Survey (F)" button to execute SEARCH
    const surveyBtn = page.locator('#btn-search-hex');
    await surveyBtn.click();

    // Diurnal clock advances to Night (1 watch consumed)
    await expect(page.locator('#hud-clock')).toHaveText('Day 1 — Night');
    await expect(page.locator('#hud-tick')).toHaveText('2');

    // Relic is now revealed on the ground
    await expect(groundPanel).toContainText('Unmarked Battery Cell (450g)');
    await expect(log).toContainText('Sunken Access Hatch');

    // Click "Pick Up" button
    const pickupBtn = groundPanel.getByRole('button', { name: 'Pick Up' });
    await pickupBtn.click();

    // Diurnal clock unadvanced by tactical pickup
    await expect(page.locator('#hud-clock')).toHaveText('Day 1 — Night');
    await expect(page.locator('#hud-tick')).toHaveText('2');

    // Inventory contains the relic and ground is cleared
    const inventoryPanel = page.getByTestId('inventory-items');
    await expect(inventoryPanel).toContainText('Unmarked Battery Cell (450g)');
    await expect(groundPanel).toContainText('No salvage on this hex.');
    await expect(page.locator('#hud-weight')).toContainText('450g / 2000g (23%)');

    // Drop item via 'x' keyboard shortcut
    await page.keyboard.press('x');

    // Rucksack is now empty again and item returned to ground as revealed cache
    await expect(inventoryPanel).toContainText('Rucksack is empty.');
    await expect(groundPanel).toContainText('Unmarked Battery Cell (450g)');
    await expect(page.locator('#hud-weight')).toContainText('0g / 2000g (0%)');
  });

  test('rests through watches and transitions across midnight to dawn', async ({ page }) => {
    await expect(page.locator('#hud-clock')).toHaveText('Day 1 — Morning');
    await expect(page.locator('#hud-tick')).toHaveText('0');

    // Rest 1 watch via 'r'
    await page.keyboard.press('r');
    await expect(page.locator('#hud-clock')).toHaveText('Day 1 — Afternoon');
    await expect(page.locator('#hud-tick')).toHaveText('1');

    // Rest second watch via 'r'
    await page.keyboard.press('r');
    await expect(page.locator('#hud-clock')).toHaveText('Day 1 — Night');
    await expect(page.locator('#hud-tick')).toHaveText('2');

    // Rest third watch -> Crosses midnight to dawn of Day 2
    await page.keyboard.press('r');
    await expect(page.locator('#hud-clock')).toHaveText('Day 2 — Morning');
    await expect(page.locator('#hud-tick')).toHaveText('3');

    // Chronicle reports dawn breaking
    const log = page.getByTestId('event-log');
    await expect(log).toContainText('Dawn breaks across the territory.');
  });
});
