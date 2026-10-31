import { describe, expect, it } from 'vitest';
import {
  createDefaultHexWorld,
  getHexTile,
  hexStep,
} from '../src/index.js';

describe('Hidden Discoveries & Search System', () => {
  it('blocks pickup of hidden relics until searched', () => {
    let world = createDefaultHexWorld();

    // Step East to (1, 0) where the battery cell is hidden
    world = hexStep(world, { type: 'TRAVEL', direction: 'E' }).state;
    expect(world.player.coordinate).toEqual({ q: 1, r: 0 });

    const tile = getHexTile(world, { q: 1, r: 0 })!;
    expect(tile.discoveries.length).toBe(1);
    expect(tile.discoveries[0]?.visibility).toBe('hidden');

    // Attempting to pickup hidden item fails
    const pickupAttempt = hexStep(world, { type: 'PICKUP', itemId: 'relic_battery_01' });
    expect(pickupAttempt.success).toBe(false);
    expect(pickupAttempt.events[0]?.type).toBe('ACTION_REJECTED');
    expect(pickupAttempt.events[0]?.reason).toContain('must be searched and revealed');
    expect(pickupAttempt.state.player.inventory.length).toBe(0);
  });

  it('reveals hidden discoveries via SEARCH and enables collection', () => {
    let world = createDefaultHexWorld();

    // Move to East hex (1, 0)
    world = hexStep(world, { type: 'TRAVEL', direction: 'E' }).state;
    expect(world.clock.watch).toBe('afternoon');

    // Execute SEARCH
    const searchResult = hexStep(world, { type: 'SEARCH' });
    expect(searchResult.success).toBe(true);
    expect(searchResult.state.clock.watch).toBe('night'); // Consumes 1 watch
    world = searchResult.state;

    // Verify events
    const searchedEvent = searchResult.events.find((e) => e.type === 'HEX_SEARCHED');
    expect(searchedEvent).toBeDefined();
    expect(searchedEvent?.revealedCount).toBe(1);

    const revealedEvent = searchResult.events.find((e) => e.type === 'DISCOVERY_REVEALED');
    expect(revealedEvent).toBeDefined();
    expect(revealedEvent?.discovery.name).toBe('Sunken Access Hatch');

    // Tile discovery state is now revealed
    const tile = getHexTile(world, { q: 1, r: 0 })!;
    expect(tile.discoveries[0]?.visibility).toBe('revealed');

    // Now PICKUP succeeds without advancing time
    const clockBeforePickup = world.clock;
    const pickupResult = hexStep(world, { type: 'PICKUP', itemId: 'relic_battery_01' });
    expect(pickupResult.success).toBe(true);
    expect(pickupResult.state.clock).toBe(clockBeforePickup); // Tactical manipulation: 0 watches
    expect(pickupResult.state.player.inventory.length).toBe(1);
    expect(pickupResult.state.player.inventory[0]?.name).toBe('Unmarked Battery Cell');

    // Discovery on tile is now depleted
    const depletedTile = getHexTile(pickupResult.state, { q: 1, r: 0 })!;
    expect(depletedTile.discoveries[0]?.visibility).toBe('depleted');
  });

  it('enforces rucksack carrying capacity limits', () => {
    let world = createDefaultHexWorld();

    // Artificially reduce player maxCarryWeightGrams to 300g (battery is 450g)
    world = {
      ...world,
      player: {
        ...world.player,
        maxCarryWeightGrams: 300,
      },
    };

    // Travel to (1, 0) and search
    world = hexStep(world, { type: 'TRAVEL', direction: 'E' }).state;
    world = hexStep(world, { type: 'SEARCH' }).state;

    // Attempt to pick up 450g battery
    const pickupResult = hexStep(world, { type: 'PICKUP', itemId: 'relic_battery_01' });
    expect(pickupResult.success).toBe(false);
    expect(pickupResult.events[0]?.reason).toContain('Rucksack is overburdened');
    expect(pickupResult.state.player.inventory.length).toBe(0);
  });

  it('drops items onto current hex as revealed cache discoveries', () => {
    let world = createDefaultHexWorld();

    // Travel to (1, 0), search, and pick up battery
    world = hexStep(world, { type: 'TRAVEL', direction: 'E' }).state;
    world = hexStep(world, { type: 'SEARCH' }).state;
    world = hexStep(world, { type: 'PICKUP', itemId: 'relic_battery_01' }).state;
    expect(world.player.inventory.length).toBe(1);

    // Drop the battery
    const dropResult = hexStep(world, { type: 'DROP', itemId: 'relic_battery_01' });
    expect(dropResult.success).toBe(true);
    expect(dropResult.state.player.inventory.length).toBe(0);

    const tile = getHexTile(dropResult.state, { q: 1, r: 0 })!;
    const droppedDiscovery = tile.discoveries.find((d) => d.item?.id === 'relic_battery_01');
    expect(droppedDiscovery).toBeDefined();
    expect(droppedDiscovery?.visibility).toBe('revealed');
    expect(droppedDiscovery?.kind).toBe('cache');
  });

  it('allows repeat searches on empty hexes without crashing', () => {
    let world = createDefaultHexWorld();
    expect(world.clock.totalWatches).toBe(0);

    // Search origin hex (has 0 discoveries)
    const result = hexStep(world, { type: 'SEARCH' });
    expect(result.success).toBe(true);
    expect(result.state.clock.totalWatches).toBe(1); // 1 watch spent searching empty dirt

    const searchedEvent = result.events.find((e) => e.type === 'HEX_SEARCHED');
    expect(searchedEvent?.revealedCount).toBe(0);
  });
});
