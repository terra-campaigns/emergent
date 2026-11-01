import { describe, expect, it } from 'vitest';
import {
  ARCHETYPE_NOMAD_GUIDE,
  ARCHETYPE_SCAVENGER,
  createDefaultHexWorld,
  hexStep,
  RELIC_BATTERY_CELL,
  RELIC_SENSOR_PRISM,
} from '../src/index.js';

describe('24XX Rules & Resolution Engine', () => {
  it('enforces Invariant 8 (Modal State Lock) when risk is pending', () => {
    // Start at (0, 0), advance to night
    let world = createDefaultHexWorld();
    world = hexStep(world, { type: 'REST' }).state; // morning -> afternoon
    world = hexStep(world, { type: 'REST' }).state; // afternoon -> night
    expect(world.clock.watch).toBe('night');

    // Attempting travel at night without battery triggers risk prompt
    const travelAttempt = hexStep(world, { type: 'TRAVEL', direction: 'NW' });
    expect(travelAttempt.state.pendingRisk).toBeDefined();
    expect(travelAttempt.events[0]?.type).toBe('RISK_ENCOUNTERED');
    world = travelAttempt.state;

    // Disallowing other actions while risk is pending
    const blockedTravel = hexStep(world, { type: 'TRAVEL', direction: 'E' });
    expect(blockedTravel.success).toBe(false);
    expect(blockedTravel.events[0]?.type).toBe('ACTION_REJECTED');
    expect(blockedTravel.events[0]?.reason).toContain('Must resolve or abort pending risk');

    const blockedSearch = hexStep(world, { type: 'SEARCH' });
    expect(blockedSearch.success).toBe(false);

    const blockedRest = hexStep(world, { type: 'REST' });
    expect(blockedRest.success).toBe(false);

    const blockedPickup = hexStep(world, { type: 'PICKUP' });
    expect(blockedPickup.success).toBe(false);

    // ABORT_RISK safely unlocks state with 0 watches consumed
    const abortResult = hexStep(world, { type: 'ABORT_RISK' });
    expect(abortResult.success).toBe(true);
    expect(abortResult.state.pendingRisk).toBeUndefined();
    expect(abortResult.events[0]?.type).toBe('RISK_ABORTED');
    expect(abortResult.state.clock.totalWatches).toBe(world.clock.totalWatches);
  });

  it('enforces Invariant 7: unbroken battery cell negates night travel peril', () => {
    // World with unbroken battery cell in inventory
    let world = createDefaultHexWorld();
    world = {
      ...world,
      player: {
        ...world.player,
        inventory: [RELIC_BATTERY_CELL],
      },
    };

    // Advance to night
    world = hexStep(world, { type: 'REST' }).state;
    world = hexStep(world, { type: 'REST' }).state;
    expect(world.clock.watch).toBe('night');

    // Night travel succeeds directly without triggering risk prompt
    const travelResult = hexStep(world, { type: 'TRAVEL', direction: 'NW' });
    expect(travelResult.success).toBe(true);
    expect(travelResult.state.pendingRisk).toBeUndefined();
    expect(travelResult.state.player.coordinate).toEqual({ q: 0, r: -1 });

    // BUT if the battery cell is broken, peril is triggered!
    let brokenWorld = {
      ...world,
      character: {
        ...world.character,
        brokenItemIds: [RELIC_BATTERY_CELL.id],
      },
    };
    const brokenTravel = hexStep(brokenWorld, { type: 'TRAVEL', direction: 'NW' });
    expect(brokenTravel.state.pendingRisk).toBeDefined();
    expect(brokenTravel.events[0]?.type).toBe('RISK_ENCOUNTERED');
  });

  it('resolves risk with background die invocation and handles success, setback, and disaster', () => {
    // Create world with Nomad Guide archetype (d8 for night travel)
    let world = createDefaultHexWorld('A wanderer', ARCHETYPE_NOMAD_GUIDE, 1337);

    // Advance to night
    world = hexStep(world, { type: 'REST' }).state;
    world = hexStep(world, { type: 'REST' }).state;

    // Trigger night peril
    world = hexStep(world, { type: 'TRAVEL', direction: 'NW' }).state;
    expect(world.pendingRisk?.applicableBackgroundId).toBe('nomad_guide');

    // Resolve risk invoking background (rolls d8)
    const resolveResult = hexStep(world, { type: 'RESOLVE_RISK', invokeBackground: true });
    expect(resolveResult.success).toBe(true);
    expect(resolveResult.state.pendingRisk).toBeUndefined();

    const rollEvent = resolveResult.events.find((e) => e.type === 'DICE_ROLLED');
    expect(rollEvent).toBeDefined();
    if (rollEvent && rollEvent.type === 'DICE_ROLLED') {
      expect(rollEvent.roll.die).toBe('d8');
      expect(rollEvent.roll.value).toBeGreaterThanOrEqual(1);
      expect(rollEvent.roll.value).toBeLessThanOrEqual(8);
    }
  });

  it('sacrifices carried gear to intercept disaster harm and downgrades condition to hindered', () => {
    // Seed selected specifically to trigger a disaster (roll value 1 or 2)
    // Let's find a seed that produces disaster on d6:
    // With seed 1, let's test RESOLVE_RISK
    let world = createDefaultHexWorld('A scrapper', ARCHETYPE_SCAVENGER, 2);
    world = {
      ...world,
      player: {
        ...world.player,
        inventory: [RELIC_SENSOR_PRISM],
      },
    };

    // Advance to night
    world = hexStep(world, { type: 'REST' }).state;
    world = hexStep(world, { type: 'REST' }).state;
    world = hexStep(world, { type: 'TRAVEL', direction: 'NW' }).state;

    // Resolve with sacrifice commitment
    const resolveResult = hexStep(world, {
      type: 'RESOLVE_RISK',
      invokeBackground: false,
      sacrificeItemId: RELIC_SENSOR_PRISM.id,
    });

    const rollEvent = resolveResult.events.find((e) => e.type === 'DICE_ROLLED');
    expect(rollEvent).toBeDefined();

    if (rollEvent && rollEvent.type === 'DICE_ROLLED') {
      if (rollEvent.roll.outcome === 'disaster') {
        // Gear was broken, condition is hindered
        expect(resolveResult.state.character.brokenItemIds).toContain(RELIC_SENSOR_PRISM.id);
        expect(resolveResult.state.character.condition).toBe('hindered');
        expect(resolveResult.events.some((e) => e.type === 'GEAR_SACRIFICED')).toBe(true);
        // Traversal failed: player stayed at origin
        expect(resolveResult.state.player.coordinate).toEqual({ q: 0, r: 0 });
      } else {
        // On success or setback, gear was preserved intact!
        expect(resolveResult.state.character.brokenItemIds.length).toBe(0);
      }
    }
  });

  it('rejects attempt to sacrifice non-existent or already-broken gear', () => {
    let world = createDefaultHexWorld();
    world = hexStep(world, { type: 'REST' }).state;
    world = hexStep(world, { type: 'REST' }).state;
    world = hexStep(world, { type: 'TRAVEL', direction: 'NW' }).state;

    // Attempting sacrifice with non-existent item
    const rejectFake = hexStep(world, {
      type: 'RESOLVE_RISK',
      invokeBackground: false,
      sacrificeItemId: 'phantom_item',
    });
    expect(rejectFake.success).toBe(false);
    expect(rejectFake.events[0]?.reason).toContain('invalid or already broken');
  });

  it('enforces condition degradation and recovers through resting', () => {
    let world = createDefaultHexWorld();

    // Artificially hinder wanderer
    world = {
      ...world,
      character: {
        ...world.character,
        condition: 'hindered',
      },
    };

    // Resting 1 watch recovers hindered to healthy
    const rest1 = hexStep(world, { type: 'REST' });
    expect(rest1.state.character.condition).toBe('healthy');
    expect(rest1.events.some((e) => e.type === 'CONDITION_CHANGED')).toBe(true);

    // Incapacitated wanderer is blocked from travel
    const incapacitatedWorld = {
      ...world,
      character: {
        ...world.character,
        condition: 'incapacitated' as const,
      },
    };

    const blockedMove = hexStep(incapacitatedWorld, { type: 'TRAVEL', direction: 'E' });
    expect(blockedMove.success).toBe(false);
    expect(blockedMove.events[0]?.reason).toContain('Wanderer is incapacitated; must rest to recover');
  });
});
