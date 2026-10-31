import { describe, expect, it } from 'vitest';
import { createDefaultWorld } from '../src/data/defaultWorld.js';
import { step } from '../src/step.js';

describe('Grid Movement & Boundary Collision', () => {
  it('moves player in all 4 cardinal directions when tiles are traversable', () => {
    // Start at (1, 1) in default world
    let state = createDefaultWorld();
    expect(state.player.position).toEqual({ x: 1, y: 1 });

    // Step East -> (2, 1)
    let res = step(state, { type: 'MOVE', direction: 'east' });
    expect(res.success).toBe(true);
    expect(res.state.player.position).toEqual({ x: 2, y: 1 });
    expect(res.state.tick).toBe(1);
    expect(res.events).toEqual([
      { type: 'MOVED', from: { x: 1, y: 1 }, to: { x: 2, y: 1 }, tick: 1 },
    ]);
    state = res.state;

    // Step South -> (2, 2)
    res = step(state, { type: 'MOVE', direction: 'south' });
    expect(res.success).toBe(true);
    expect(res.state.player.position).toEqual({ x: 2, y: 2 });
    expect(res.state.tick).toBe(2);
    state = res.state;

    // Step West -> (1, 2)
    res = step(state, { type: 'MOVE', direction: 'west' });
    expect(res.success).toBe(true);
    expect(res.state.player.position).toEqual({ x: 1, y: 2 });
    expect(res.state.tick).toBe(3);
    state = res.state;

    // Step North -> (1, 1)
    res = step(state, { type: 'MOVE', direction: 'north' });
    expect(res.success).toBe(true);
    expect(res.state.player.position).toEqual({ x: 1, y: 1 });
    expect(res.state.tick).toBe(4);
  });

  it('blocks movement into scrap walls and preserves tick count', () => {
    const state = createDefaultWorld();
    // In default world, (4, 1) is a scrap_wall.
    // Move player to (3, 1) first.
    const to31 = step(
      step(state, { type: 'MOVE', direction: 'east' }).state,
      { type: 'MOVE', direction: 'east' }
    ).state;
    expect(to31.player.position).toEqual({ x: 3, y: 1 });
    const currentTick = to31.tick;

    // Try moving East into (4, 1) scrap_wall
    const res = step(to31, { type: 'MOVE', direction: 'east' });
    expect(res.success).toBe(false);
    expect(res.state.player.position).toEqual({ x: 3, y: 1 });
    expect(res.state.tick).toBe(currentTick);
    expect(res.events).toEqual([
      { type: 'ACTION_REJECTED', reason: 'Tile is impassable', tick: currentTick },
    ]);
  });

  it('blocks movement past map boundaries with end-of-world message', () => {
    const state = createDefaultWorld();

    // 1. Step to North perimeter (y = 0)
    const atNorth = step(state, { type: 'MOVE', direction: 'north' }).state;
    expect(atNorth.player.position).toEqual({ x: 1, y: 0 });

    // Try stepping North past y = 0
    const resNorth = step(atNorth, { type: 'MOVE', direction: 'north' });
    expect(resNorth.success).toBe(false);
    expect(resNorth.state.player.position).toEqual({ x: 1, y: 0 });
    expect(resNorth.events[0]?.reason).toBe('You reached the end of the world, come back later');

    // 2. Step to West perimeter (x = 0)
    const atWest = step(state, { type: 'MOVE', direction: 'west' }).state;
    expect(atWest.player.position).toEqual({ x: 0, y: 1 });

    // Try stepping West past x = 0
    const resWest = step(atWest, { type: 'MOVE', direction: 'west' });
    expect(resWest.success).toBe(false);
    expect(resWest.state.player.position).toEqual({ x: 0, y: 1 });
    expect(resWest.events[0]?.reason).toBe('You reached the end of the world, come back later');
  });

  it('advances tick when player executes WAIT', () => {
    const state = createDefaultWorld();
    const res = step(state, { type: 'WAIT' });
    expect(res.success).toBe(true);
    expect(res.state.tick).toBe(state.tick + 1);
    expect(res.events).toEqual([{ type: 'WAITED', tick: 1 }]);
    expect(res.state.player.position).toEqual(state.player.position);
  });
});
