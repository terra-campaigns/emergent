/**
 * Pure deterministic seeded PRNG and 24XX polyhedral dice module.
 * Implements Mulberry32 algorithm strictly per docs/designs/003_rules_system_24xx.md.
 */

import { RollOutcome, RollResult, STEP_DIE_FACES, StepDie } from './types.js';

/**
 * Pure Mulberry32 pseudo-random number generator.
 * Advances state and returns a normalized float in [0, 1).
 */
export function nextRng(state: number): { nextState: number; value: number } {
  let t = (state + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const rand01 = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { nextState: (state + 1) | 0, value: rand01 };
}

/**
 * Rolls a polyhedral step die deterministically from the given PRNG state.
 * Returns face value in [1, faces], the ternary 24XX outcome, and the advanced state.
 */
export function rollStepDie(die: StepDie, state: number): { result: RollResult; nextState: number } {
  const faces = STEP_DIE_FACES[die];
  const { nextState, value } = nextRng(state);
  const faceValue = Math.floor(value * faces) + 1;
  const outcome: RollOutcome = faceValue <= 2 ? 'disaster' : faceValue <= 4 ? 'setback' : 'success';

  return {
    result: Object.freeze({
      die,
      value: faceValue,
      outcome,
    }),
    nextState,
  };
}
