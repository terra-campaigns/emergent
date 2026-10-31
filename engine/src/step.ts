import {
  Direction,
  GameAction,
  GameEvent,
  GroundItem,
  Position,
  SimulationResult,
  TILE_DEFINITIONS,
  WorldState,
} from './types.js';

const DIRECTION_DELTAS: Record<Direction, Position> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

/**
 * Pure reducer function executing a discrete action tick against the simulation state.
 * Returns a new immutable WorldState and emitted events.
 * If the action is rejected, the input state reference is returned with success: false
 * and the tick is not advanced.
 */
export function step(state: WorldState, action: GameAction): SimulationResult {
  switch (action.type) {
    case 'MOVE': {
      const delta = DIRECTION_DELTAS[action.direction];
      const targetX = state.player.position.x + delta.x;
      const targetY = state.player.position.y + delta.y;

      // 1. Boundary check
      if (targetX < 0 || targetX >= state.width || targetY < 0 || targetY >= state.height) {
        return reject(state, 'You reached the end of the world, come back later');
      }

      // 2. Walkability check
      const row = state.tiles[targetY];
      const tileType = row ? row[targetX] : undefined;
      if (!tileType || !TILE_DEFINITIONS[tileType].walkable) {
        return reject(state, 'Tile is impassable');
      }

      // Valid move
      const nextTick = state.tick + 1;
      const fromPos: Position = { x: state.player.position.x, y: state.player.position.y };
      const toPos: Position = { x: targetX, y: targetY };

      const nextState: WorldState = {
        ...state,
        tick: nextTick,
        player: {
          ...state.player,
          position: toPos,
        },
      };

      const event: GameEvent = {
        type: 'MOVED',
        from: fromPos,
        to: toPos,
        tick: nextTick,
      };

      return {
        state: nextState,
        events: [event],
        success: true,
      };
    }

    case 'WAIT': {
      const nextTick = state.tick + 1;
      const nextState: WorldState = {
        ...state,
        tick: nextTick,
      };

      const event: GameEvent = {
        type: 'WAITED',
        tick: nextTick,
      };

      return {
        state: nextState,
        events: [event],
        success: true,
      };
    }

    case 'PICKUP': {
      const px = state.player.position.x;
      const py = state.player.position.y;

      // Filter ground items strictly on the player's current tile (locality constraint)
      const tileGroundItems = state.groundItems.filter(
        (g) => g.position.x === px && g.position.y === py
      );

      let targetItem: GroundItem;
      if (action.itemId !== undefined) {
        const found = tileGroundItems.find((g) => g.item.id === action.itemId);
        if (!found) {
          return reject(state, 'Item not found on current tile');
        }
        targetItem = found;
      } else {
        if (tileGroundItems.length === 0) {
          return reject(state, 'No item to pick up');
        }
        // Pop top item (LIFO stack: index 0)
        targetItem = tileGroundItems[0]!;
      }

      // Capacity check
      const currentWeight = state.player.inventory.reduce((sum, i) => sum + i.weightGrams, 0);
      if (currentWeight + targetItem.item.weightGrams > state.player.maxCarryWeightGrams) {
        return reject(state, 'Exceeds carrying capacity');
      }

      // Valid pickup
      const nextTick = state.tick + 1;
      const nextGroundItems = state.groundItems.filter((g) => g !== targetItem);
      const nextInventory = [...state.player.inventory, targetItem.item];

      const nextState: WorldState = {
        ...state,
        tick: nextTick,
        player: {
          ...state.player,
          inventory: nextInventory,
        },
        groundItems: nextGroundItems,
      };

      const event: GameEvent = {
        type: 'ITEM_COLLECTED',
        item: targetItem.item,
        tick: nextTick,
      };

      return {
        state: nextState,
        events: [event],
        success: true,
      };
    }

    case 'DROP': {
      const itemIndex = state.player.inventory.findIndex((i) => i.id === action.itemId);
      if (itemIndex === -1) {
        return reject(state, 'Item not found in inventory');
      }

      const itemToDrop = state.player.inventory[itemIndex]!;
      const nextInventory = state.player.inventory.filter((_, idx) => idx !== itemIndex);

      // Create new GroundItem with value-copied position (reference isolation)
      // and prepend to maintain LIFO stack order on the tile
      const newGroundItem: GroundItem = {
        item: itemToDrop,
        position: {
          x: state.player.position.x,
          y: state.player.position.y,
        },
      };

      const nextTick = state.tick + 1;
      const nextGroundItems = [newGroundItem, ...state.groundItems];

      const nextState: WorldState = {
        ...state,
        tick: nextTick,
        player: {
          ...state.player,
          inventory: nextInventory,
        },
        groundItems: nextGroundItems,
      };

      const event: GameEvent = {
        type: 'ITEM_DROPPED',
        item: itemToDrop,
        position: {
          x: state.player.position.x,
          y: state.player.position.y,
        },
        tick: nextTick,
      };

      return {
        state: nextState,
        events: [event],
        success: true,
      };
    }
  }
}

function reject(state: WorldState, reason: string): SimulationResult {
  return {
    state,
    events: [
      {
        type: 'ACTION_REJECTED',
        reason,
        tick: state.tick,
      },
    ],
    success: false,
  };
}
