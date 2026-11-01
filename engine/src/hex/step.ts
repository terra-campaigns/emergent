/**
 * Authoritative pure reducer for the hexagonal world simulation and 24XX rules system.
 * Strictly adheres to docs/designs/002_hex_grid_and_time_economy.md
 * and docs/designs/003_rules_system_24xx.md.
 */

import { advanceClock } from './clock.js';
import { hexEqual, hexNeighbor, isWithinRadius } from './math.js';
import {
  HexDiscovery,
  HexGameAction,
  HexGameEvent,
  HexPlayerEntity,
  HexSimulationResult,
  HexTile,
  HexWorldState,
} from './types.js';
import { rollStepDie } from '../rules/dice.js';
import { RiskPrompt, StepDie, WandererCondition } from '../rules/types.js';

/**
 * Returns the hex tile residing at the specified coordinate, or undefined if outside grid.
 */
export function getHexTile(state: HexWorldState, coord: { q: number; r: number }): HexTile | undefined {
  return state.tiles.find((t) => hexEqual(t.coordinate, coord));
}

/**
 * Pure helper completing the spatial and discovery effects of a successful or setback peril source action.
 */
function completePerilSourceAction(
  state: HexWorldState,
  sourceAction: HexGameAction,
  events: HexGameEvent[]
): { nextPlayer: HexPlayerEntity; nextTiles: readonly HexTile[] } {
  let nextPlayer = state.player;
  let nextTiles = state.tiles;

  if (sourceAction.type === 'TRAVEL') {
    const targetCoord = hexNeighbor(state.player.coordinate, sourceAction.direction);
    nextPlayer = Object.freeze({ ...nextPlayer, coordinate: targetCoord });
    events.push({
      type: 'PLAYER_TRAVELLED',
      from: state.player.coordinate,
      to: targetCoord,
      costWatches: 1,
    });
  } else if (sourceAction.type === 'SEARCH') {
    const currentTile = getHexTile(state, state.player.coordinate);
    if (currentTile) {
      const hiddenDiscoveries = currentTile.discoveries.filter((d) => d.visibility === 'hidden');
      events.push({
        type: 'HEX_SEARCHED',
        coordinate: state.player.coordinate,
        revealedCount: hiddenDiscoveries.length,
      });
      const updatedDiscoveries = currentTile.discoveries.map((d) => {
        if (d.visibility === 'hidden') {
          const revealed = Object.freeze({ ...d, visibility: 'revealed' as const });
          events.push({
            type: 'DISCOVERY_REVEALED',
            coordinate: state.player.coordinate,
            discovery: revealed,
          });
          return revealed;
        }
        return d;
      });
      nextTiles = Object.freeze(
        state.tiles.map((t) =>
          hexEqual(t.coordinate, state.player.coordinate)
            ? Object.freeze({ ...t, discoveries: Object.freeze(updatedDiscoveries) })
            : t
        )
      );
    }
  }

  return { nextPlayer, nextTiles };
}

/**
 * Pure reducer function executing a discrete game action upon HexWorldState.
 */
export function hexStep(state: HexWorldState, action: HexGameAction): HexSimulationResult {
  // ---------------------------------------------------------------------------
  // Invariant 8: Modal State Lock
  // While pendingRisk is active, only RESOLVE_RISK and ABORT_RISK are permitted.
  // ---------------------------------------------------------------------------
  if (state.pendingRisk !== undefined && action.type !== 'RESOLVE_RISK' && action.type !== 'ABORT_RISK') {
    return {
      state,
      events: [{
        type: 'ACTION_REJECTED',
        reason: 'Must resolve or abort pending risk before taking further actions.',
      }],
      success: false,
    };
  }

  // Incapacitation Action Filter: Incapacitated wanderers cannot travel or search.
  if (state.character.condition === 'incapacitated' && (action.type === 'TRAVEL' || action.type === 'SEARCH')) {
    return {
      state,
      events: [{
        type: 'ACTION_REJECTED',
        reason: 'Wanderer is incapacitated; must rest to recover.',
      }],
      success: false,
    };
  }

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

      // 3. Contextual Peril Interception: Night Traversal without unbroken light source
      const isNight = state.clock.watch === 'night';
      const hasUnbrokenLight = state.player.inventory.some(
        (item) => item.id === 'relic_battery_01' && !state.character.brokenItemIds.includes(item.id)
      );

      if (isNight && !hasUnbrokenLight) {
        const prompt: RiskPrompt = Object.freeze({
          id: 'risk_night_traversal',
          title: 'Pitch Darkness Navigation',
          description: 'Attempting to traverse the treacherous wastes at night without a functioning portable light source.',
          severity: 'moderate',
          stakes: 'Disorientation (losing an extra watch) or twisting an ankle on slag (becoming hindered).',
          sourceAction: action,
          applicableBackgroundId: 'nomad_guide',
          defaultDie: state.character.condition === 'hindered' ? 'd4' : 'd6',
          availableSacrificeItemIds: Object.freeze(
            state.player.inventory.map((i) => i.id).filter((id) => !state.character.brokenItemIds.includes(id))
          ),
        });

        return {
          state: Object.freeze({
            ...state,
            pendingRisk: prompt,
          }),
          events: Object.freeze([{ type: 'RISK_ENCOUNTERED', prompt }]),
          success: true,
        };
      }

      // 4. Safe Traversal: Advance diurnal clock (consumes 1 Watch)
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

      // Condition recovery rules
      let nextCharacter = state.character;
      if (state.character.condition === 'hindered') {
        nextCharacter = Object.freeze({ ...state.character, condition: 'healthy' });
        events.push({
          type: 'CONDITION_CHANGED',
          from: 'hindered',
          to: 'healthy',
          reason: 'Rested through the watch; recovered from hindrance.',
        });
      } else if (state.character.condition === 'injured' && dayDawned) {
        nextCharacter = Object.freeze({ ...state.character, condition: 'hindered' });
        events.push({
          type: 'CONDITION_CHANGED',
          from: 'injured',
          to: 'hindered',
          reason: 'Rested through dawn; injury improved to hindered.',
        });
      } else if (state.character.condition === 'incapacitated' && dayDawned) {
        nextCharacter = Object.freeze({ ...state.character, condition: 'injured' });
        events.push({
          type: 'CONDITION_CHANGED',
          from: 'incapacitated',
          to: 'injured',
          reason: 'Rested through dawn; recovered from incapacitation to injured.',
        });
      }

      return {
        state: Object.freeze({
          ...state,
          clock: newClock,
          character: nextCharacter,
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

    case 'ABORT_RISK': {
      if (!state.pendingRisk) {
        return {
          state,
          events: [{ type: 'ACTION_REJECTED', reason: 'No pending risk to abort.' }],
          success: false,
        };
      }

      return {
        state: Object.freeze({
          ...state,
          pendingRisk: undefined,
        }),
        events: Object.freeze([
          { type: 'RISK_ABORTED', reason: 'Wanderer retreated from the peril to safety.' },
        ]),
        success: true,
      };
    }

    case 'RESOLVE_RISK': {
      if (!state.pendingRisk) {
        return {
          state,
          events: [{ type: 'ACTION_REJECTED', reason: 'No pending risk to resolve.' }],
          success: false,
        };
      }

      const prompt = state.pendingRisk;

      // Validate sacrificeItemId if provided
      if (action.sacrificeItemId) {
        const itemInInventory = state.player.inventory.find((i) => i.id === action.sacrificeItemId);
        const isAlreadyBroken = state.character.brokenItemIds.includes(action.sacrificeItemId);
        if (!itemInInventory || isAlreadyBroken) {
          return {
            state,
            events: [{ type: 'ACTION_REJECTED', reason: 'Selected sacrifice item is invalid or already broken.' }],
            success: false,
          };
        }
      }

      // Determine step die (Invariant 3: hindered condition caps physical rolls at d4)
      let chosenDie: StepDie = prompt.defaultDie;
      if (action.invokeBackground && state.character.background.id === prompt.applicableBackgroundId) {
        chosenDie = state.character.condition === 'hindered' ? 'd4' : state.character.background.die;
      } else if (state.character.condition === 'hindered') {
        chosenDie = 'd4';
      }

      // Cast die via Mulberry32
      const { result: roll, nextState: nextRngState } = rollStepDie(chosenDie, state.rngState);
      const events: HexGameEvent[] = [
        { type: 'DICE_ROLLED', roll, context: prompt.title },
      ];

      // Process outcome according to clock progression matrix
      let nextClock = state.clock;
      let nextPlayer = state.player;
      let nextTiles = state.tiles;
      let nextCharacter = state.character;

      if (roll.outcome === 'success') {
        // Advance clock by 1 watch
        const advanced = advanceClock(nextClock);
        nextClock = advanced.clock;
        if (advanced.dayDawned) events.push({ type: 'DAY_DAWNED', day: nextClock.day });
        events.push({ type: 'WATCH_ADVANCED', clock: nextClock });

        // Complete source action
        const completed = completePerilSourceAction(state, prompt.sourceAction, events);
        nextPlayer = completed.nextPlayer;
        nextTiles = completed.nextTiles;
      } else if (roll.outcome === 'setback') {
        // Advance clock by 2 watches (1 base + 1 delay complication)
        const adv1 = advanceClock(nextClock);
        nextClock = adv1.clock;
        if (adv1.dayDawned) events.push({ type: 'DAY_DAWNED', day: nextClock.day });
        events.push({ type: 'WATCH_ADVANCED', clock: nextClock });

        const adv2 = advanceClock(nextClock);
        nextClock = adv2.clock;
        if (adv2.dayDawned) events.push({ type: 'DAY_DAWNED', day: nextClock.day });
        events.push({ type: 'WATCH_ADVANCED', clock: nextClock });

        // Complete source action with delay
        const completed = completePerilSourceAction(state, prompt.sourceAction, events);
        nextPlayer = completed.nextPlayer;
        nextTiles = completed.nextTiles;
      } else {
        // Disaster (1-2)
        // Advance clock by 1 watch
        const advanced = advanceClock(nextClock);
        nextClock = advanced.clock;
        if (advanced.dayDawned) events.push({ type: 'DAY_DAWNED', day: nextClock.day });
        events.push({ type: 'WATCH_ADVANCED', clock: nextClock });

        // Action fails: wanderer remains on origin hex
        if (action.sacrificeItemId) {
          const sacrificedItem = state.player.inventory.find((i) => i.id === action.sacrificeItemId)!;
          const nextBroken = Object.freeze([...state.character.brokenItemIds, action.sacrificeItemId]);
          const prevCond = state.character.condition;
          const nextCond: WandererCondition = 'hindered';
          nextCharacter = Object.freeze({
            ...state.character,
            brokenItemIds: nextBroken,
            condition: nextCond,
          });
          events.push({
            type: 'GEAR_SACRIFICED',
            itemId: action.sacrificeItemId,
            itemTitle: sacrificedItem.name,
          });
          if (prevCond !== nextCond) {
            events.push({
              type: 'CONDITION_CHANGED',
              from: prevCond,
              to: nextCond,
              reason: 'Gear broken to absorb disaster; wanderer is hindered.',
            });
          }
        } else {
          // Unmitigated harm progression
          const prevCond = state.character.condition;
          let nextCond: WandererCondition = prevCond;
          if (prevCond === 'healthy' || prevCond === 'hindered') {
            nextCond = 'injured';
          } else if (prevCond === 'injured') {
            nextCond = 'incapacitated';
          }
          nextCharacter = Object.freeze({
            ...state.character,
            condition: nextCond,
          });
          events.push({
            type: 'CONDITION_CHANGED',
            from: prevCond,
            to: nextCond,
            reason: 'Unmitigated disaster; sustained physical trauma.',
          });
        }
      }

      return {
        state: Object.freeze({
          ...state,
          clock: nextClock,
          player: nextPlayer,
          tiles: nextTiles,
          character: nextCharacter,
          pendingRisk: undefined,
          rngState: nextRngState,
        }),
        events: Object.freeze(events),
        success: true,
      };
    }
  }
}
