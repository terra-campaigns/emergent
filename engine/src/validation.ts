import { TILE_DEFINITIONS, TileType, WorldState } from './types.js';

export class StateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateValidationError';
  }
}

function isTileWalkable(tileType: unknown): boolean {
  if (typeof tileType !== 'string' || !(tileType in TILE_DEFINITIONS)) {
    return false;
  }
  return TILE_DEFINITIONS[tileType as TileType].walkable;
}

/**
 * Validates that a WorldState satisfies all invariants defined in Milestone 1.
 * Throws StateValidationError if any invariant is violated.
 */
export function validateWorldState(state: WorldState): void {
  // 1. Tick invariant
  if (!Number.isInteger(state.tick) || state.tick < 0) {
    throw new StateValidationError(`Invalid tick: ${state.tick}. Must be a non-negative integer.`);
  }

  // 2. Grid dimensions
  if (!Number.isInteger(state.width) || state.width <= 0) {
    throw new StateValidationError(`Invalid width: ${state.width}. Must be an integer > 0.`);
  }
  if (!Number.isInteger(state.height) || state.height <= 0) {
    throw new StateValidationError(`Invalid height: ${state.height}. Must be an integer > 0.`);
  }

  // 3. Rectangular non-jagged tiles matrix
  if (!Array.isArray(state.tiles) || state.tiles.length !== state.height) {
    throw new StateValidationError(
      `Tiles matrix row count (${state.tiles?.length}) does not match height (${state.height}).`
    );
  }

  for (let y = 0; y < state.height; y++) {
    const row = state.tiles[y];
    if (!Array.isArray(row) || row.length !== state.width) {
      throw new StateValidationError(
        `Row ${y} length (${row?.length}) does not match width (${state.width}). Matrix is jagged.`
      );
    }
    for (let x = 0; x < state.width; x++) {
      const tileType = row[x];
      if (typeof tileType !== 'string' || !(tileType in TILE_DEFINITIONS)) {
        throw new StateValidationError(`Unknown tile type "${tileType}" at position (${x}, ${y}).`);
      }
    }
  }

  // 4. Player position and constraints
  const { player } = state;
  if (!player || typeof player !== 'object') {
    throw new StateValidationError('Player entity is missing or invalid.');
  }
  if (!Number.isInteger(player.position.x) || !Number.isInteger(player.position.y)) {
    throw new StateValidationError(
      `Player position (${player.position.x}, ${player.position.y}) must have integer coordinates.`
    );
  }
  if (
    player.position.x < 0 ||
    player.position.x >= state.width ||
    player.position.y < 0 ||
    player.position.y >= state.height
  ) {
    throw new StateValidationError(
      `Player position (${player.position.x}, ${player.position.y}) is out of grid bounds.`
    );
  }

  const playerRow = state.tiles[player.position.y];
  const playerTile = playerRow ? playerRow[player.position.x] : undefined;
  if (!isTileWalkable(playerTile)) {
    throw new StateValidationError(
      `Player is located on an impassable tile "${playerTile}" at (${player.position.x}, ${player.position.y}).`
    );
  }

  if (!Number.isInteger(player.maxCarryWeightGrams) || player.maxCarryWeightGrams <= 0) {
    throw new StateValidationError(
      `Invalid maxCarryWeightGrams: ${player.maxCarryWeightGrams}. Must be an integer > 0.`
    );
  }

  // 5. Relic ID uniqueness & validation
  const seenIds = new Set<string>();

  // Check inventory
  let currentInventoryWeight = 0;
  for (const item of player.inventory) {
    if (!item.id || typeof item.id !== 'string') {
      throw new StateValidationError('Relic item in inventory has missing or invalid ID.');
    }
    if (seenIds.has(item.id)) {
      throw new StateValidationError(`Duplicate relic ID "${item.id}" detected in inventory.`);
    }
    seenIds.add(item.id);

    if (!Number.isInteger(item.weightGrams) || item.weightGrams < 0) {
      throw new StateValidationError(
        `Relic "${item.id}" has invalid weightGrams: ${item.weightGrams}. Must be an integer >= 0.`
      );
    }
    currentInventoryWeight += item.weightGrams;
  }

  if (currentInventoryWeight > player.maxCarryWeightGrams) {
    throw new StateValidationError(
      `Inventory weight (${currentInventoryWeight}g) exceeds max capacity (${player.maxCarryWeightGrams}g).`
    );
  }

  // Check ground items
  for (const groundItem of state.groundItems) {
    const { item, position } = groundItem;
    if (!item.id || typeof item.id !== 'string') {
      throw new StateValidationError('Ground item has missing or invalid ID.');
    }
    if (seenIds.has(item.id)) {
      throw new StateValidationError(`Duplicate relic ID "${item.id}" detected on ground.`);
    }
    seenIds.add(item.id);

    if (!Number.isInteger(item.weightGrams) || item.weightGrams < 0) {
      throw new StateValidationError(
        `Ground relic "${item.id}" has invalid weightGrams: ${item.weightGrams}. Must be an integer >= 0.`
      );
    }

    if (!Number.isInteger(position.x) || !Number.isInteger(position.y)) {
      throw new StateValidationError(
        `Ground relic "${item.id}" has non-integer position (${position.x}, ${position.y}).`
      );
    }

    if (position.x < 0 || position.x >= state.width || position.y < 0 || position.y >= state.height) {
      throw new StateValidationError(
        `Ground relic "${item.id}" is placed out of bounds at (${position.x}, ${position.y}).`
      );
    }

    const row = state.tiles[position.y];
    const tile = row ? row[position.x] : undefined;
    if (!isTileWalkable(tile)) {
      throw new StateValidationError(
        `Ground relic "${item.id}" is placed on impassable tile "${tile}" at (${position.x}, ${position.y}).`
      );
    }
  }
}
