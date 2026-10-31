/**
 * Diurnal time economy for emergent.
 * Operates on discrete 8-hour watches (morning, afternoon, night).
 */

import { WatchPhase, WorldClock } from './types.js';

export interface WatchAdvanceResult {
  readonly clock: WorldClock;
  readonly dayDawned: boolean;
}

const NEXT_WATCH: Record<WatchPhase, WatchPhase> = {
  morning: 'afternoon',
  afternoon: 'night',
  night: 'morning',
};

/**
 * Creates an initial WorldClock at Day 1, Morning watch.
 */
export function createInitialClock(): WorldClock {
  return Object.freeze({
    day: 1,
    watch: 'morning',
    totalWatches: 0,
  });
}

/**
 * Pure state transition advancing the world clock by exactly 1 watch (8 hours).
 * Returns the new clock and a boolean indicating whether dawn arrived (midnight crossed).
 */
export function advanceClock(current: WorldClock): WatchAdvanceResult {
  const nextWatch = NEXT_WATCH[current.watch];
  const dayDawned = current.watch === 'night';
  const nextDay = dayDawned ? current.day + 1 : current.day;

  return {
    clock: Object.freeze({
      day: nextDay,
      watch: nextWatch,
      totalWatches: current.totalWatches + 1,
    }),
    dayDawned,
  };
}
