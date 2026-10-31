/**
 * Pure mathematical functions for pointy-topped hexagonal grids.
 * Coordinates are represented in axial form (q, r) with implicit cubic axis s = -q - r.
 */

import { HexCoordinate, HexDirection, HEX_DIRECTIONS, hexCoordKey } from './types.js';

export { hexCoordKey };

/**
 * Derives the third cubic coordinate axis 's' from axial pair (q, r).
 * Strictly maintains the cubic invariant: q + r + s = 0.
 */
export function cubeS(coord: HexCoordinate): number {
  return -coord.q - coord.r;
}

/**
 * Tests value equality between two axial coordinates.
 */
export function hexEqual(a: HexCoordinate, b: HexCoordinate): boolean {
  return a.q === b.q && a.r === b.r;
}

/**
 * Calculates the adjacent neighbour coordinate in the given hex direction.
 */
export function hexNeighbor(coord: HexCoordinate, direction: HexDirection): HexCoordinate {
  const offset = HEX_DIRECTIONS[direction];
  return {
    q: coord.q + offset.q,
    r: coord.r + offset.r,
  };
}

/**
 * Calculates the exact discrete distance (number of hex steps) between two hex coordinates.
 * Formula: max(|q1 - q2|, |r1 - r2|, |s1 - s2|).
 */
export function hexDistance(a: HexCoordinate, b: HexCoordinate): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = cubeS(a) - cubeS(b);
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
}

/**
 * Returns true if the coordinate is within a regular hex territory of the given radius from (0, 0).
 */
export function isWithinRadius(coord: HexCoordinate, radius: number): boolean {
  return hexDistance({ q: 0, r: 0 }, coord) <= radius;
}

/**
 * Generates all axial coordinates contained within a regular hexagon of the given radius.
 */
export function generateHexCoordinates(radius: number): readonly HexCoordinate[] {
  const coords: HexCoordinate[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      coords.push({ q, r });
    }
  }
  return Object.freeze(coords);
}
