/**
 * Authoritative pure reducer for the hexagonal world simulation.
 * Strictly adheres to docs/designs/002_hex_grid_and_time_economy.md.
 */

import { advanceClock } from './clock.js';
import { hexEqual, hexNeighbor, isWithinRadius } from './math.js';
import {
  HexDiscovery,
  HexGameAction,
  HexGameEvent,
  HexSimulationResult,
  HexTile,
  HexWorldState,
} from './types.js';

/**
 * Returns the hex tile residing at the specified coordinate, or undefined if outside grid.
 */
export function getHexTile(state: HexWorldState, coord: { q: number; r: number }): HexTile | undefined {
  return state.tiles.find((t) => hexEqual(t.coordinate, coord));
}

/**
 * Pure reducer function executing a discrete game action upon HexWorldState.
 */
export function hexStep(state: HexWorldState, action: HexGameAction): HexSimulationResult {
  switch (action.type) {
    case 'TRAVEL': {
      const targetCoord = hexNeighbor(state.player.coordinate, action.direction);

      // 1. Boundary check
      if (!isWithinRadius(targetCoord, state.radius)) {
        return {
          state,
          events: [{ type: 'ACTION_REJECTED', reason: 'You reached the perimeter of the territory, turn back.' }],
          success: false,
        };
      }

      // 2. Terrain walkability check
      const targetTile = getHexTile(state, targetCoord);
      if (!targetTile || !targetTile.traversable) {
        const reason = targetTile ? `Path blocked by ${targetTile.terrain.replace('_', ' ')}.` : 'Impassable terrain.';
        return {
          state,
          events: [{ type: 'ACTION_REJECTED', reason }],
          success: false,
        };
      }

      // 3. Advance diurnal clock (consumes 1 Watch)
      const { clock: newClock, dayDawned } = advanceClock(state.clock);
      const events: HexGameEvent[] = [];

      if (dayDawned) {
        events.push({ type: 'DAY_DAWNED', day: newClock.day });
      }
      events.push({ type: 'WATCH_ADVANCED', clock: newClock });
      events.push({
        type: 'PLAYER_TRAVELLED',
        from: state.player.coordinate,
        to: targetCoord,
        costWatches: 1,
      });

      const nextPlayer = Object.freeze({
        ...state.player,
        coordinate: targetCoord,
      });

      return {
        state: Object.freeze({
          ...state,
          clock: newClock,
          player: nextPlayer,
        }),
        events: Object.freeze(events),
        success: true,
      };
    }

    case 'SEARCH': {
      const currentTile = getHexTile(state, state.player.coordinate);
      if (!currentTile) {
        return {
          state,
          events: [{ type: 'ACTION_REJECTED', reason: 'Cannot search outside world territory.' }],
          success: false,
        };
      }

      // Advance diurnal clock (consumes 1 Watch)
      const { clock: newClock, dayDawned } = advanceClock(state.clock);
      const events: HexGameEvent[] = [];

      if (dayDawned) {
        events.push({ type: 'DAY_DAWNED', day: newClock.day });
      }
      events.push({ type: 'WATCH_ADVANCED', clock: newClock });

      const hiddenDiscoveries = currentTile.discoveries.filter((d) => d.visibility === 'hidden');
      events.push({
        type: 'HEX_SEARCHED',
        coordinate: state.player.coordinate,
        revealedCount: hiddenDiscoveries.length,
      });

      // Reveal all hidden discoveries on this tile
      const updatedDiscoveries: HexDiscovery[] = currentTile.discoveries.map((d) => {
        if (d.visibility === 'hidden') {
          const revealed: HexDiscovery = Object.freeze({ ...d, visibility: 'revealed' });
          events.push({
            type: 'DISCOVERY_REVEALED',
            coordinate: state.player.coordinate,
            discovery: revealed,
          });
          return revealed;
        }
        return d;
      });

      const updatedTiles = state.tiles.map((t) =>
        hexEqual(t.coordinate, state.player.coordinate)
          ? Object.freeze({ ...t, discoveries: Object.freeze(updatedDiscoveries) })
          : t
      );

      return {
        state: Object.freeze({
          ...state,
          clock: newClock,
          tiles: Object.freeze(updatedTiles),
        }),
        events: Object.freeze(events),
        success: true,
      };
    }

    case 'REST': {
      // Advance diurnal clock (consumes 1 Watch)
      const { clock: newClock, dayDawned } = advanceClock(state.clock);
      const events: HexGameEvent[] = [];

      if (dayDawned) {
        events.push({ type: 'DAY_DAWNED', day: newClock.day });
      }
      events.push({ type: 'WATCH_ADVANCED', clock: newClock });

      return {
        state: Object.freeze({
          ...state,
          clock: newClock,
        }),
        events: Object.freeze(events),
        success: true,
      };
    }

    case 'PICKUP': {
      const currentTile = getHexTile(state, state.player.coordinate);
      if (!currentTile) {
        return {
          state,
          events: [{ type: 'ACTION_REJECTED', reason: 'Cannot pick up outside world territory.' }],
          success: false,
        };
      }

      // Check if target item is hidden
      if (action.itemId) {
        const hiddenMatch = currentTile.discoveries.find(
          (d) => d.visibility === 'hidden' && d.item?.id === action.itemId
        );
        if (hiddenMatch) {
          return {
            state,
            events: [{ type: 'ACTION_REJECTED', reason: 'Discovery must be searched and revealed before collection.' }],
            success: false,
          };
        }
      }

      // Check for revealed discovery with item
      const discoveryIndex = action.itemId
        ? currentTile.discoveries.findIndex(
            (d) => d.visibility === 'revealed' && d.item?.id === action.itemId
          )
        : currentTile.discoveries.findIndex(
            (d) => d.visibility === 'revealed' && d.item !== undefined
          );

      if (discoveryIndex === -1) {
        // If there's an unsearched hidden discovery with an item, inform the player
        const hasHidden = currentTile.discoveries.some((d) => d.visibility === 'hidden' && d.item);
        if (hasHidden) {
          return {
            state,
            events: [{ type: 'ACTION_REJECTED', reason: 'Discovery must be searched and revealed before collection.' }],
            success: false,
          };
        }
        return {
          state,
          events: [{ type: 'ACTION_REJECTED', reason: 'Item not found on current hex.' }],
          success: false,
        };
      }

      const targetDiscovery = currentTile.discoveries[discoveryIndex]!;
      const item = targetDiscovery.item!;

      // Enforce rucksack weight capacity
      const currentBurden = state.player.inventory.reduce((sum, i) => sum + i.weightGrams, 0);
      if (currentBurden + item.weightGrams > state.player.maxCarryWeightGrams) {
        return {
          state,
          events: [{ type: 'ACTION_REJECTED', reason: 'Rucksack is overburdened.' }],
          success: false,
        };
      }

      // Update discovery to depleted
      const updatedDiscoveries = currentTile.discoveries.map((d, idx) =>
        idx === discoveryIndex ? Object.freeze({ ...d, visibility: 'depleted' as const }) : d
      );

      const updatedTiles = state.tiles.map((t) =>
        hexEqual(t.coordinate, state.player.coordinate)
          ? Object.freeze({ ...t, discoveries: Object.freeze(updatedDiscoveries) })
          : t
      );

      const updatedPlayer = Object.freeze({
        ...state.player,
        inventory: Object.freeze([item, ...state.player.inventory]),
      });

      return {
        state: Object.freeze({
          ...state,
          tiles: Object.freeze(updatedTiles),
          player: updatedPlayer,
        }),
        events: Object.freeze([{ type: 'ITEM_PICKED_UP', item }]),
        success: true,
      };
    }

    case 'DROP': {
      const itemIndex = state.player.inventory.findIndex((i) => i.id === action.itemId);
      if (itemIndex === -1) {
        return {
          state,
          events: [{ type: 'ACTION_REJECTED', reason: 'Item not in rucksack.' }],
          success: false,
        };
      }

      const currentTile = getHexTile(state, state.player.coordinate);
      if (!currentTile) {
        return {
          state,
          events: [{ type: 'ACTION_REJECTED', reason: 'Cannot drop outside world territory.' }],
          success: false,
        };
      }

      const item = state.player.inventory[itemIndex]!;
      const nextInventory = state.player.inventory.filter((_, idx) => idx !== itemIndex);

      // Create a revealed cache discovery on the current hex with unique keying
      const dropDiscovery: HexDiscovery = Object.freeze({
        id: `cache_drop_${item.id}_${state.clock.totalWatches}_${currentTile.discoveries.length}`,
        kind: 'cache',
        name: item.name,
        description: item.description,
        visibility: 'revealed',
        item,
      });

      const updatedTiles = state.tiles.map((t) =>
        hexEqual(t.coordinate, state.player.coordinate)
          ? Object.freeze({ ...t, discoveries: Object.freeze([dropDiscovery, ...t.discoveries]) })
          : t
      );

      const updatedPlayer = Object.freeze({
        ...state.player,
        inventory: Object.freeze(nextInventory),
      });

      return {
        state: Object.freeze({
          ...state,
          tiles: Object.freeze(updatedTiles),
          player: updatedPlayer,
        }),
        events: Object.freeze([
          { type: 'ITEM_DROPPED', item, coordinate: state.player.coordinate },
        ]),
        success: true,
      };
    }
  }
}
