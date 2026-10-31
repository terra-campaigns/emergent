import { describe, expect, it } from 'vitest';
import {
  cubeS,
  generateHexCoordinates,
  hexCoordKey,
  hexDistance,
  hexEqual,
  hexNeighbor,
  HEX_DIRECTIONS,
  HexCoordinate,
  HexDirection,
  isWithinRadius,
} from '../src/index.js';

describe('Hexagonal Coordinate & Math Primitives', () => {
  it('enforces cubic constraint s = -q - r for all coordinates', () => {
    const coords: HexCoordinate[] = [
      { q: 0, r: 0 },
      { q: 1, r: -1 },
      { q: 2, r: -1 },
      { q: -3, r: 1 },
      { q: 5, r: 5 },
    ];

    for (const c of coords) {
      const s = cubeS(c);
      expect(c.q + c.r + s).toBe(0);
    }
  });

  it('correctly calculates axial distance between coordinates', () => {
    const origin: HexCoordinate = { q: 0, r: 0 };

    // Distance to self is 0
    expect(hexDistance(origin, origin)).toBe(0);

    // Distance to immediate neighbours is always 1
    const directions: HexDirection[] = ['NE', 'E', 'SE', 'SW', 'W', 'NW'];
    for (const dir of directions) {
      const neighbor = hexNeighbor(origin, dir);
      expect(hexDistance(origin, neighbor)).toBe(1);
    }

    // Distance along straight lines
    expect(hexDistance(origin, { q: 3, r: 0 })).toBe(3);
    expect(hexDistance(origin, { q: 0, r: -4 })).toBe(4);
    expect(hexDistance({ q: 2, r: -2 }, { q: -2, r: 2 })).toBe(4);
  });

  it('calculates 6 discrete neighbour transitions correctly', () => {
    const origin: HexCoordinate = { q: 0, r: 0 };

    expect(hexNeighbor(origin, 'NE')).toEqual({ q: 1, r: -1 });
    expect(hexNeighbor(origin, 'E')).toEqual({ q: 1, r: 0 });
    expect(hexNeighbor(origin, 'SE')).toEqual({ q: 0, r: 1 });
    expect(hexNeighbor(origin, 'SW')).toEqual({ q: -1, r: 1 });
    expect(hexNeighbor(origin, 'W')).toEqual({ q: -1, r: 0 });
    expect(hexNeighbor(origin, 'NW')).toEqual({ q: 0, r: -1 });

    // Round-trip traversal (e.g. E then W returns to origin)
    const east = hexNeighbor(origin, 'E');
    const returned = hexNeighbor(east, 'W');
    expect(hexEqual(returned, origin)).toBe(true);
  });

  it('generates the exact count of hexes for a given radius', () => {
    // Formula for hex radius R: 1 + 3 * R * (R + 1)
    // Radius 0: 1
    // Radius 1: 7
    // Radius 2: 19
    // Radius 3: 37
    const r0 = generateHexCoordinates(0);
    expect(r0.length).toBe(1);

    const r1 = generateHexCoordinates(1);
    expect(r1.length).toBe(7);

    const r2 = generateHexCoordinates(2);
    expect(r2.length).toBe(19);

    const r3 = generateHexCoordinates(3);
    expect(r3.length).toBe(37);

    // Verify all generated coordinates satisfy isWithinRadius
    for (const c of r2) {
      expect(isWithinRadius(c, 2)).toBe(true);
    }
    // Verify an out-of-bounds coordinate fails
    expect(isWithinRadius({ q: 3, r: 0 }, 2)).toBe(false);
  });

  it('provides canonical serialisation for coordinate dictionary keys', () => {
    expect(hexCoordKey({ q: 0, r: 0 })).toBe('0,0');
    expect(hexCoordKey({ q: -1, r: 2 })).toBe('-1,2');
    expect(hexCoordKey({ q: 3, r: -4 })).toBe('3,-4');
  });
});
