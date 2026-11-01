import { describe, expect, it } from 'vitest';
import { nextRng, rollStepDie } from '../src/rules/dice.js';
import { STEP_DIE_FACES, StepDie } from '../src/rules/types.js';

describe('24XX Polyhedral Dice & Mulberry32 PRNG', () => {
  it('generates deterministic float values in [0, 1)', () => {
    const seed = 42;
    const { nextState: s1, value: v1 } = nextRng(seed);
    const { nextState: s2, value: v2 } = nextRng(s1);

    expect(v1).toBeGreaterThanOrEqual(0);
    expect(v1).toBeLessThan(1);
    expect(v2).toBeGreaterThanOrEqual(0);
    expect(v2).toBeLessThan(1);
    expect(s1).toBe((seed + 1) | 0);
    expect(s2).toBe((s1 + 1) | 0);

    // Re-running with same initial seed produces identical results
    const rerun = nextRng(seed);
    expect(rerun.value).toBe(v1);
    expect(rerun.nextState).toBe(s1);
  });

  it('guarantees bit-for-bit repeatability across 1000 trials', () => {
    let stateA = 1337;
    let stateB = 1337;
    const rollsA: number[] = [];
    const rollsB: number[] = [];

    for (let i = 0; i < 1000; i++) {
      const rollA = rollStepDie('d8', stateA);
      stateA = rollA.nextState;
      rollsA.push(rollA.result.value);

      const rollB = rollStepDie('d8', stateB);
      stateB = rollB.nextState;
      rollsB.push(rollB.result.value);
    }

    expect(rollsA).toEqual(rollsB);
    expect(stateA).toBe(stateB);
  });

  it('enforces exact face boundaries for each step die', () => {
    const dice: StepDie[] = ['d4', 'd6', 'd8', 'd10', 'd12'];
    let state = 9999;

    for (const die of dice) {
      const maxFaces = STEP_DIE_FACES[die];
      const observedValues = new Set<number>();

      for (let i = 0; i < 500; i++) {
        const { result, nextState } = rollStepDie(die, state);
        state = nextState;

        expect(result.die).toBe(die);
        expect(result.value).toBeGreaterThanOrEqual(1);
        expect(result.value).toBeLessThanOrEqual(maxFaces);
        expect(Number.isInteger(result.value)).toBe(true);

        // Verify ternary outcome matches value
        if (result.value <= 2) {
          expect(result.outcome).toBe('disaster');
        } else if (result.value <= 4) {
          expect(result.outcome).toBe('setback');
        } else {
          expect(result.outcome).toBe('success');
        }

        observedValues.add(result.value);
      }

      // Check min face 1 and max face are reachable
      expect(observedValues.has(1)).toBe(true);
      expect(observedValues.has(maxFaces)).toBe(true);
    }
  });

  it('correctly maps d4 values (disaster or setback, never natural success)', () => {
    let state = 54321;
    for (let i = 0; i < 100; i++) {
      const { result, nextState } = rollStepDie('d4', state);
      state = nextState;
      expect(result.value).toBeLessThanOrEqual(4);
      expect(result.outcome === 'disaster' || result.outcome === 'setback').toBe(true);
      expect(result.outcome).not.toBe('success');
    }
  });
});
