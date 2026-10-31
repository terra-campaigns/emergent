/**
 * Default hexagonal world state fixture for emergent Milestone 2.
 * Strictly respects human narrative sovereignty by using neutral placeholders
 * for unauthored locations while integrating human-authored player titles.
 */

import { generateHexCoordinates, hexCoordKey } from './math.js';
import {
  HexDiscovery,
  HexPlayerEntity,
  HexTile,
  HexTileType,
  HEX_TILE_DEFINITIONS,
  HexWorldState,
} from './types.js';
import { createInitialClock } from './clock.js';
import { RelicItem } from '../types.js';

export const RELIC_BATTERY_CELL: RelicItem = Object.freeze({
  id: 'relic_battery_01',
  name: 'Unmarked Battery Cell',
  description: 'A heavy, sealed cylinder with faint chemical heat.',
  relicType: 'power_cell',
  weightGrams: 450,
});

export const RELIC_SENSOR_PRISM: RelicItem = Object.freeze({
  id: 'relic_prism_01',
  name: 'Faceted Sensor Prism',
  description: 'Crystalline lens showing distorted iridescent refractions.',
  relicType: 'sensory_optic',
  weightGrams: 200,
});

export const RELIC_ALLOY_PLATE: RelicItem = Object.freeze({
  id: 'relic_plate_01',
  name: 'Hardened Alloy Plate',
  description: 'Dense, pitted composite metal salvaged from an ancient bulkhead.',
  relicType: 'alloy_plate',
  weightGrams: 1200,
});

export const DEFAULT_HEX_RELICS: Readonly<Record<string, RelicItem>> = Object.freeze({
  battery_cell: RELIC_BATTERY_CELL,
  sensor_prism: RELIC_SENSOR_PRISM,
  alloy_plate: RELIC_ALLOY_PLATE,
});

/**
 * Constructs the default hexagonal world state.
 * Radius: 2 (19 total hexagons).
 */
export function createDefaultHexWorld(playerTitle = 'A tribal wanderer'): HexWorldState {
  const radius = 2;
  const coords = generateHexCoordinates(radius);

  // Pre-configured terrain fixtures
  const terrainOverrides: Record<string, HexTileType> = {
    [hexCoordKey({ q: 1, r: -1 })]: 'titan_bulkhead', // Horizon ruin (NE)
    [hexCoordKey({ q: -1, r: 0 })]: 'scrap_wall',      // Hull plating barrier (W)
    [hexCoordKey({ q: -1, r: 1 })]: 'waterway',        // Deep drainage fissure (SW)
    [hexCoordKey({ q: 1, r: 0 })]:  'rubble',          // Ancient slag field (E)
    [hexCoordKey({ q: 0, r: 1 })]:  'rubble',          // Pitted masonry (SE)
    [hexCoordKey({ q: 2, r: -1 })]: 'scrap_wall',      // Outer perimeter wall
  };

  // Pre-configured hidden discoveries
  const discoveryMap: Record<string, HexDiscovery[]> = {
    // East hex (1, 0) hides the battery cell
    [hexCoordKey({ q: 1, r: 0 })]: [
      {
        id: 'discovery_hatch_01',
        kind: 'cache',
        name: 'Sunken Access Hatch',
        description: 'A corroded hatch half-buried in silt.',
        visibility: 'hidden',
        item: RELIC_BATTERY_CELL,
      },
    ],
    // South-East hex (0, 1) hides the sensor prism
    [hexCoordKey({ q: 0, r: 1 })]: [
      {
        id: 'discovery_cairn_01',
        kind: 'landmark',
        name: 'Weathered Surveyor Cairn',
        description: 'A stack of scored metallic blocks with an optical mount.',
        visibility: 'hidden',
        item: RELIC_SENSOR_PRISM,
      },
    ],
  };

  const tiles: HexTile[] = coords.map((coordinate) => {
    const key = hexCoordKey(coordinate);
    const terrain: HexTileType = terrainOverrides[key] ?? 'plains';
    const traversable = HEX_TILE_DEFINITIONS[terrain].traversable;
    const discoveries = Object.freeze(discoveryMap[key] ? [...discoveryMap[key]!] : []);

    return Object.freeze({
      coordinate,
      terrain,
      traversable,
      discoveries,
    });
  });

  const player: HexPlayerEntity = Object.freeze({
    id: 'player_wanderer',
    title: playerTitle,
    coordinate: Object.freeze({ q: 0, r: 0 }),
    inventory: Object.freeze([]),
    maxCarryWeightGrams: 2000,
  });

  return Object.freeze({
    clock: createInitialClock(),
    radius,
    tiles: Object.freeze(tiles),
    player,
  });
}
