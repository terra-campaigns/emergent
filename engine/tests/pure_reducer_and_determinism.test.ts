import { describe, expect, it } from 'vitest';
import { createDefaultWorld } from '../src/data/defaultWorld.js';
import { step } from '../src/step.js';
import { validateWorldState } from '../src/validation.js';
import { Direction, GameAction, WorldState } from '../src/types.js';

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && typeof val === 'object') {
      deepFreeze(val);
    }
  }
  return obj;
}

describe('Pure Reducer Immutability & Determinism', () => {
  it('does not mutate input state when executing actions on deeply frozen state', () => {
    const state = deepFreeze(createDefaultWorld());

    // Valid move
    expect(() => step(state, { type: 'MOVE', direction: 'east' })).not.toThrow();

    // Valid wait
    expect(() => step(state, { type: 'WAIT' })).not.toThrow();

    // Rejected move into wall
    expect(() => step(state, { type: 'MOVE', direction: 'north' })).not.toThrow();

    // Rejected pickup
    expect(() => step(state, { type: 'PICKUP' })).not.toThrow();
  });

  it('returns identical state reference when action is rejected', () => {
    const state = createDefaultWorld();
    const res = step(state, { type: 'MOVE', direction: 'north' }); // into y=0 then north rejected
    const northState = step(state, { type: 'MOVE', direction: 'north' }).state;
    const rejectedRes = step(northState, { type: 'MOVE', direction: 'north' });

    expect(rejectedRes.success).toBe(false);
    expect(rejectedRes.state).toBe(northState); // Strict referential equality
    expect(rejectedRes.state.tick).toBe(northState.tick);
  });

  it('maintains determinism across JSON serialisation and rehydration', () => {
    const original = createDefaultWorld();
    const action: GameAction = { type: 'MOVE', direction: 'east' };

    const step1 = step(original, action);

    // Serialise and deserialize
    const serialized = JSON.stringify(original);
    const rehydrated = JSON.parse(serialized) as WorldState;
    const step2 = step(rehydrated, action);

    expect(step1.state).toEqual(step2.state);
    expect(step1.events).toEqual(step2.events);
    expect(step1.success).toBe(step2.success);
  });

  it('conserves all relics and passes invariants during 200-tick action fuzzing', () => {
    let state = createDefaultWorld();
    const initialRelicIds = new Set([
      ...state.groundItems.map((g) => g.item.id),
      ...state.player.inventory.map((i) => i.id),
    ]);
    const initialRelicCount = initialRelicIds.size;

    const directions: Direction[] = ['north', 'south', 'east', 'west'];

    // Deterministic linear congruential generator (LCG) for reproducible pseudo-randomness
    let seed = 42;
    function nextRandom(): number {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    for (let i = 0; i < 200; i++) {
      const roll = nextRandom();
      let action: GameAction;

      if (roll < 0.5) {
        // 50% Move
        const dirIndex = Math.floor(nextRandom() * 4);
        action = { type: 'MOVE', direction: directions[dirIndex]! };
      } else if (roll < 0.65) {
        // 15% Wait
        action = { type: 'WAIT' };
      } else if (roll < 0.85) {
        // 20% Pickup
        action = { type: 'PICKUP' };
      } else {
        // 15% Drop (if player has inventory)
        if (state.player.inventory.length > 0) {
          const invIndex = Math.floor(nextRandom() * state.player.inventory.length);
          action = { type: 'DROP', itemId: state.player.inventory[invIndex]!.id };
        } else {
          action = { type: 'WAIT' };
        }
      }

      const result = step(state, action);
      state = result.state;

      // Invariant check on every tick
      expect(() => validateWorldState(state)).not.toThrow();

      // Relic Conservation check
      const currentRelicIds = new Set([
        ...state.groundItems.map((g) => g.item.id),
        ...state.player.inventory.map((item) => item.id),
      ]);

      expect(currentRelicIds.size).toBe(initialRelicCount);
      expect(currentRelicIds).toEqual(initialRelicIds);
    }

    expect(state.tick).toBeGreaterThan(0);
  });
});
