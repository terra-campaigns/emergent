/**
 * Authoritative type definitions for emergent simulation core.
 * Strictly adheres to docs/designs/001_core_game_loop.md.
 */

export type TileType = 
  | 'plains'
  | 'rubble'
  | 'scrap_wall'
  | 'titan_bulkhead'
  | 'waterway';

export interface TileDefinition {
  readonly walkable: boolean;
  readonly description: string;
}

export const TILE_DEFINITIONS: Readonly<Record<TileType, TileDefinition>> = {
  plains: { walkable: true, description: 'Traversable grassland and packed earth' },
  rubble: { walkable: true, description: 'Rough, crumbled masonry; traversable' },
  scrap_wall: { walkable: false, description: 'Towering rusted hull plating; impassable' },
  titan_bulkhead: { walkable: false, description: 'Dense celestial alloy; impassable' },
  waterway: { walkable: false, description: 'Deep, stagnant run-off channel; impassable' },
};

export interface Position {
  readonly x: number;
  readonly y: number;
}

export type RelicType = 
  | 'power_cell' 
  | 'sensory_optic' 
  | 'alloy_plate' 
  | 'logic_core';

export interface RelicItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly relicType: RelicType;
  readonly weightGrams: number;
}

export interface GroundItem {
  readonly item: RelicItem;
  readonly position: Position;
}

export interface PlayerEntity {
  readonly id: string;
  readonly position: Position;
  readonly inventory: readonly RelicItem[];
  readonly maxCarryWeightGrams: number;
}

export interface WorldState {
  readonly tick: number;
  readonly width: number;
  readonly height: number;
  readonly tiles: readonly (readonly TileType[])[];
  readonly player: PlayerEntity;
  readonly groundItems: readonly GroundItem[];
}

export type Direction = 'north' | 'south' | 'east' | 'west';

export type GameAction =
  | { readonly type: 'MOVE'; readonly direction: Direction }
  | { readonly type: 'WAIT' }
  | { readonly type: 'PICKUP'; readonly itemId?: string }
  | { readonly type: 'DROP'; readonly itemId: string };

export type GameEvent =
  | { readonly type: 'MOVED'; readonly from: Position; readonly to: Position; readonly tick: number }
  | { readonly type: 'ITEM_COLLECTED'; readonly item: RelicItem; readonly tick: number }
  | { readonly type: 'ITEM_DROPPED'; readonly item: RelicItem; readonly position: Position; readonly tick: number }
  | { readonly type: 'WAITED'; readonly tick: number }
  | { readonly type: 'ACTION_REJECTED'; readonly reason: string; readonly tick: number };

export interface SimulationResult {
  readonly state: WorldState;
  readonly events: readonly GameEvent[];
  readonly success: boolean;
}
