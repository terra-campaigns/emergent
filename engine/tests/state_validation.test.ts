import { describe, expect, it } from 'vitest';
import { createDefaultWorld } from '../src/data/defaultWorld.js';
import { StateValidationError, validateWorldState } from '../src/validation.js';
import { WorldState } from '../src/types.js';

describe('WorldState Validation', () => {
  it('validates a pristine default world successfully', () => {
    const world = createDefaultWorld();
    expect(() => validateWorldState(world)).not.toThrow();
  });

  it('rejects negative or non-integer tick', () => {
    const world = createDefaultWorld();
    expect(() => validateWorldState({ ...world, tick: -1 })).toThrow(StateValidationError);
    expect(() => validateWorldState({ ...world, tick: 1.5 })).toThrow(StateValidationError);
  });

  it('rejects jagged tile matrices', () => {
    const world = createDefaultWorld();
    // Missing row
    const shortRows = world.tiles.slice(0, 7);
    expect(() => validateWorldState({ ...world, tiles: shortRows })).toThrow(StateValidationError);

    // Mismatched row length
    const jagged = world.tiles.map((row, idx) => (idx === 0 ? row.slice(0, 6) : row));
    expect(() => validateWorldState({ ...world, tiles: jagged })).toThrow(StateValidationError);
  });

  it('rejects unknown tile types', () => {
    const world = createDefaultWorld();
    const badTiles = world.tiles.map((row) => [...row]);
    // @ts-expect-error Intentionally invalid tile type for test
    badTiles[0][0] = 'lava_pit';
    expect(() => validateWorldState({ ...world, tiles: badTiles })).toThrow(StateValidationError);
  });

  it('rejects out-of-bounds or non-integer player position', () => {
    const world = createDefaultWorld();
    expect(() =>
      validateWorldState({
        ...world,
        player: { ...world.player, position: { x: -1, y: 0 } },
      })
    ).toThrow(StateValidationError);

    expect(() =>
      validateWorldState({
        ...world,
        player: { ...world.player, position: { x: 8, y: 0 } },
      })
    ).toThrow(StateValidationError);

    expect(() =>
      validateWorldState({
        ...world,
        player: { ...world.player, position: { x: 1.5, y: 2 } },
      })
    ).toThrow(StateValidationError);
  });

  it('rejects player positioned on an impassable tile', () => {
    const world = createDefaultWorld();
    // (4, 0) is a scrap_wall in default world
    expect(() =>
      validateWorldState({
        ...world,
        player: { ...world.player, position: { x: 4, y: 0 } },
      })
    ).toThrow(StateValidationError);
  });

  it('rejects duplicate relic IDs across inventory and ground', () => {
    const world = createDefaultWorld();
    const duplicateGround = [
      ...world.groundItems,
      {
        item: {
          id: 'relic_001', // already on ground
          name: 'Clone Cell',
          description: 'A duplicate',
          relicType: 'power_cell' as const,
          weightGrams: 100,
        },
        position: { x: 0, y: 0 },
      },
    ];
    expect(() => validateWorldState({ ...world, groundItems: duplicateGround })).toThrow(
      StateValidationError
    );
  });

  it('rejects inventory weight exceeding carry capacity', () => {
    const world = createDefaultWorld();
    const overweightPlayer = {
      ...world.player,
      maxCarryWeightGrams: 500,
      inventory: [
        {
          id: 'heavy_relic',
          name: 'Lead Mass',
          description: 'Too heavy',
          relicType: 'alloy_plate' as const,
          weightGrams: 501,
        },
      ],
    };
    expect(() => validateWorldState({ ...world, player: overweightPlayer })).toThrow(
      StateValidationError
    );
  });

  it('rejects ground relic placed on an impassable tile', () => {
    const world = createDefaultWorld();
    const strandedGround = [
      ...world.groundItems,
      {
        item: {
          id: 'stranded_relic',
          name: 'Waterlogged Cog',
          description: 'In water',
          relicType: 'logic_core' as const,
          weightGrams: 100,
        },
        // (7, 7) is waterway in default world
        position: { x: 7, y: 7 },
      },
    ];
    expect(() => validateWorldState({ ...world, groundItems: strandedGround })).toThrow(
      StateValidationError
    );
  });
});
