import { describe, expect, it } from 'vitest';
import {
  advanceClock,
  createDefaultHexWorld,
  createInitialClock,
  hexStep,
} from '../src/index.js';

describe('Diurnal Clock & Travel Pacing', () => {
  it('advances through 3 watches per day and increments day upon dawn', () => {
    let clock = createInitialClock();
    expect(clock.day).toBe(1);
    expect(clock.watch).toBe('morning');
    expect(clock.totalWatches).toBe(0);

    // Morning -> Afternoon (Day 1)
    const step1 = advanceClock(clock);
    clock = step1.clock;
    expect(clock.day).toBe(1);
    expect(clock.watch).toBe('afternoon');
    expect(clock.totalWatches).toBe(1);
    expect(step1.dayDawned).toBe(false);

    // Afternoon -> Night (Day 1)
    const step2 = advanceClock(clock);
    clock = step2.clock;
    expect(clock.day).toBe(1);
    expect(clock.watch).toBe('night');
    expect(clock.totalWatches).toBe(2);
    expect(step2.dayDawned).toBe(false);

    // Night -> Morning (Day 2 Dawn)
    const step3 = advanceClock(clock);
    clock = step3.clock;
    expect(clock.day).toBe(2);
    expect(clock.watch).toBe('morning');
    expect(clock.totalWatches).toBe(3);
    expect(step3.dayDawned).toBe(true);
  });

  it('advances 1 watch per travel movement and emits proper diurnal events', () => {
    const world = createDefaultHexWorld();
    expect(world.clock.day).toBe(1);
    expect(world.clock.watch).toBe('morning');

    // Move East to (1, 0)
    const result1 = hexStep(world, { type: 'TRAVEL', direction: 'E' });
    expect(result1.success).toBe(true);
    expect(result1.state.clock.watch).toBe('afternoon');
    expect(result1.state.player.coordinate).toEqual({ q: 1, r: 0 });

    // Expect WATCH_ADVANCED and PLAYER_TRAVELLED events
    expect(result1.events.some((e) => e.type === 'WATCH_ADVANCED')).toBe(true);
    expect(result1.events.some((e) => e.type === 'PLAYER_TRAVELLED')).toBe(true);
  });

  it('charges zero watches when an action is rejected', () => {
    const world = createDefaultHexWorld();
    const initialClock = world.clock;

    // Attempt to step into impassable scrap wall at West (-1, 0)
    const result = hexStep(world, { type: 'TRAVEL', direction: 'W' });
    expect(result.success).toBe(false);
    expect(result.state.clock).toBe(initialClock); // Reference equality
    expect(result.events[0]?.type).toBe('ACTION_REJECTED');
    expect(result.events[0]?.reason).toContain('Path blocked by scrap wall');
  });

  it('advances 1 watch when resting', () => {
    const world = createDefaultHexWorld();
    const result = hexStep(world, { type: 'REST' });
    expect(result.success).toBe(true);
    expect(result.state.clock.watch).toBe('afternoon');
    expect(result.state.player.coordinate).toEqual(world.player.coordinate); // Position unchanged
  });
});
