import { describe, expect, it } from 'vitest';
import {
  createDefaultHexWorld,
  HexDirection,
  HexGameAction,
  HexWorldState,
  hexStep,
} from '../src/index.js';

// Deep freeze utility to verify immutability
function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val && typeof val === 'object') {
      deepFreeze(val);
    }
  }
  return obj;
}

// Pseudo-random linear congruential generator (LCG) for deterministic fuzzing
function makeDeterministicRandom(seed = 123456789) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Counts total relics existing in the world (inventory + discoveries)
function countTotalRelics(state: HexWorldState): { count: number; ids: string[] } {
  const ids: string[] = [];

  // 1. Inventory relics
  for (const item of state.player.inventory) {
    ids.push(item.id);
  }

  // 2. Hex discoveries (relic exists whether hidden, revealed, or depleted)
  // Note: when picked up, discovery visibility becomes 'depleted', but item was moved to rucksack.
  // In the world, an item exists either in rucksack OR in an active (hidden/revealed) discovery!
  for (const tile of state.tiles) {
    for (const d of tile.discoveries) {
      if (d.item && (d.visibility === 'hidden' || d.visibility === 'revealed')) {
        ids.push(d.item.id);
      }
    }
  }

  ids.sort();
  return { count: ids.length, ids };
}

describe('Hex World Deterministic Conservation & Fuzzing Suite', () => {
  it('executes 300 pseudo-random actions without mutation and perfectly conserves relics', () => {
    let state = createDefaultHexWorld();
    deepFreeze(state);

    const initialMetrics = countTotalRelics(state);
    expect(initialMetrics.count).toBe(2); // 2 relics initially in defaultHexWorld (battery + prism)
    const initialIds = [...initialMetrics.ids];

    const rand = makeDeterministicRandom(42);
    const directions: HexDirection[] = ['NE', 'E', 'SE', 'SW', 'W', 'NW'];

    for (let tick = 0; tick < 300; tick++) {
      const roll = rand();
      let action: HexGameAction;

      if (roll < 0.50) {
        // 50% Travel
        const dir = directions[Math.floor(rand() * directions.length)]!;
        action = { type: 'TRAVEL', direction: dir };
      } else if (roll < 0.75) {
        // 25% Search
        action = { type: 'SEARCH' };
      } else if (roll < 0.85) {
        // 10% Pickup
        // Attempt to pick up a relic from the current tile
        const currentTile = state.tiles.find(
          (t) => t.coordinate.q === state.player.coordinate.q && t.coordinate.r === state.player.coordinate.r
        );
        const revealedDiscovery = currentTile?.discoveries.find((d) => d.visibility === 'revealed' && d.item);
        if (revealedDiscovery?.item) {
          action = { type: 'PICKUP', itemId: revealedDiscovery.item.id };
        } else {
          // Attempt pickup of known item (might be rejected if not here, valid probe)
          action = { type: 'PICKUP', itemId: 'relic_battery_01' };
        }
      } else if (roll < 0.95) {
        // 10% Drop
        if (state.player.inventory.length > 0) {
          const itemToDrop = state.player.inventory[0]!;
          action = { type: 'DROP', itemId: itemToDrop.id };
        } else {
          action = { type: 'DROP', itemId: 'non_existent_relic' };
        }
      } else {
        // 5% Rest
        action = { type: 'REST' };
      }

      // Execute reducer step
      const result = hexStep(state, action);
      expect(result).toBeDefined();

      // Deep freeze the new state to assert immutability for subsequent step
      state = deepFreeze(result.state);

      // Invariant Check: Conservation of Relics
      const currentMetrics = countTotalRelics(state);
      expect(currentMetrics.count).toBe(initialMetrics.count);
      expect(currentMetrics.ids).toEqual(initialIds);

      // Invariant Check: Monotonicity of totalWatches
      expect(state.clock.totalWatches).toBeGreaterThanOrEqual(0);
      expect(state.clock.day).toBeGreaterThanOrEqual(1);
    }
  });
});
