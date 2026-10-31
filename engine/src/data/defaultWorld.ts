import { TileType, WorldState } from '../types.js';
import { validateWorldState } from '../validation.js';

/**
 * Default world fixture for Milestone 1.
 * Uses neutral technical placeholders awaiting human lore authoring
 * in docs/lore/open_questions.md.
 */

// 8x8 Grid Layout
// P = Plains (walkable)
// R = Rubble (walkable)
// S = Scrap Wall (impassable)
// T = Titan Bulkhead (impassable)
// W = Waterway (impassable)
const TILES_LAYOUT: TileType[][] = [
  ['plains', 'plains', 'plains', 'plains', 'scrap_wall', 'plains', 'plains', 'plains'],
  ['plains', 'plains', 'plains', 'rubble', 'scrap_wall', 'plains', 'rubble', 'plains'],
  ['plains', 'rubble', 'plains', 'plains', 'plains', 'plains', 'plains', 'scrap_wall'],
  ['plains', 'plains', 'plains', 'plains', 'rubble', 'plains', 'plains', 'scrap_wall'],
  ['scrap_wall', 'plains', 'plains', 'plains', 'titan_bulkhead', 'plains', 'plains', 'plains'],
  ['scrap_wall', 'plains', 'rubble', 'plains', 'titan_bulkhead', 'plains', 'waterway', 'waterway'],
  ['plains', 'plains', 'plains', 'plains', 'plains', 'plains', 'waterway', 'waterway'],
  ['plains', 'plains', 'scrap_wall', 'scrap_wall', 'plains', 'plains', 'waterway', 'waterway'],
];

export function createDefaultWorld(): WorldState {
  const world: WorldState = {
    tick: 0,
    width: 8,
    height: 8,
    tiles: TILES_LAYOUT,
    player: {
      id: 'player_001',
      position: { x: 1, y: 1 },
      inventory: [],
      maxCarryWeightGrams: 2000, // 2kg capacity
    },
    groundItems: [
      {
        item: {
          id: 'relic_001',
          name: 'Unmarked Battery Cell',
          description: 'A heavy, sealed cylinder with faint chemical heat.',
          relicType: 'power_cell',
          weightGrams: 450,
        },
        position: { x: 2, y: 1 },
      },
      {
        item: {
          id: 'relic_002',
          name: 'Faceted Sensor Prism',
          description: 'Crystalline lens showing distorted iridescent refractions.',
          relicType: 'sensory_optic',
          weightGrams: 200,
        },
        position: { x: 4, y: 3 },
      },
      {
        item: {
          id: 'relic_003',
          name: 'Hardened Alloy Plate',
          description: 'Dense, pitted composite metal salvaged from an ancient bulkhead.',
          relicType: 'alloy_plate',
          weightGrams: 1200,
        },
        position: { x: 1, y: 4 },
      },
    ],
  };

  validateWorldState(world);
  return world;
}
