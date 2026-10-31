/**
 * Authoritative types for the hexagonal world simulation.
 * Strictly adheres to docs/designs/002_hex_grid_and_time_economy.md.
 */

import { RelicItem } from '../types.js';

// -----------------------------------------------------------------------------
// Hexagonal Geometry Types
// -----------------------------------------------------------------------------

/**
 * Axial coordinates on a pointy-topped hexagonal grid.
 * Cubic constraint: q + r + s = 0 (where s is implicitly -q - r).
 */
export interface HexCoordinate {
  readonly q: number; // Column axis
  readonly r: number; // Row axis
}

/**
 * The 6 discrete neighbour directions on a pointy-topped hex grid.
 */
export type HexDirection = 'NE' | 'E' | 'SE' | 'SW' | 'W' | 'NW';

/**
 * Unit directional offsets in axial coordinates.
 */
export const HEX_DIRECTIONS: Readonly<Record<HexDirection, HexCoordinate>> = {
  NE: { q: 1, r: -1 },
  E:  { q: 1, r: 0 },
  SE: { q: 0, r: 1 },
  SW: { q: -1, r: 1 },
  W:  { q: -1, r: 0 },
  NW: { q: 0, r: -1 },
} as const;

/**
 * Canonical string serialization for axial coordinate keying.
 */
export const hexCoordKey = (coord: HexCoordinate): string => `${coord.q},${coord.r}`;

// -----------------------------------------------------------------------------
// Diurnal Time Economy Types
// -----------------------------------------------------------------------------

/**
 * A day consists of 3 distinct 8-hour watches.
 */
export type WatchPhase = 'morning' | 'afternoon' | 'night';

export interface WorldClock {
  readonly day: number;          // 1-based integer (Day 1, Day 2, ...)
  readonly watch: WatchPhase;    // Current 8-hour shift
  readonly totalWatches: number; // Monotonically increasing tick counter (0, 1, 2, ...)
}

// -----------------------------------------------------------------------------
// Discovery & Salvage Lifecycle Types
// -----------------------------------------------------------------------------

export type DiscoveryVisibility = 'hidden' | 'revealed' | 'depleted';

export type DiscoveryKind = 'relic' | 'landmark' | 'cache';

export interface HexDiscovery {
  readonly id: string;
  readonly kind: DiscoveryKind;
  readonly name: string;
  readonly description: string;
  readonly visibility: DiscoveryVisibility;
  readonly item?: RelicItem; // Present if discovery yields a portable relic
}

// -----------------------------------------------------------------------------
// World & Entity State Schema
// -----------------------------------------------------------------------------

export type HexTileType = 
  | 'plains'          // Open traversable scrub/steppe
  | 'rubble'          // Jagged field of masonry or metallic slag
  | 'scrap_wall'      // Impassable colossal plating barrier
  | 'titan_bulkhead'  // Impassable derelict cosmic structure
  | 'waterway';       // Impassable deep drainage channel

export interface HexTileDefinition {
  readonly traversable: boolean;
  readonly description: string;
}

export const HEX_TILE_DEFINITIONS: Readonly<Record<HexTileType, HexTileDefinition>> = {
  plains: { traversable: true, description: 'Traversable grassland and packed earth' },
  rubble: { traversable: true, description: 'Rough, crumbled masonry; traversable' },
  scrap_wall: { traversable: false, description: 'Towering rusted hull plating; impassable' },
  titan_bulkhead: { traversable: false, description: 'Dense celestial alloy; impassable' },
  waterway: { traversable: false, description: 'Deep, stagnant run-off channel; impassable' },
};

export interface HexTile {
  readonly coordinate: HexCoordinate;
  readonly terrain: HexTileType;
  readonly traversable: boolean;
  readonly discoveries: readonly HexDiscovery[];
}

export interface HexPlayerEntity {
  readonly id: string;
  readonly title?: string; // e.g. "A tribal wanderer"
  readonly coordinate: HexCoordinate;
  readonly inventory: readonly RelicItem[];
  readonly maxCarryWeightGrams: number;
}

export interface HexWorldState {
  readonly clock: WorldClock;
  readonly radius: number; // Hex grid radius from origin (0, 0)
  readonly tiles: readonly HexTile[]; // Unique list of hex tiles
  readonly player: HexPlayerEntity;
}

// -----------------------------------------------------------------------------
// Action & Event Taxonomy
// -----------------------------------------------------------------------------

export type HexGameAction =
  | { readonly type: 'TRAVEL'; readonly direction: HexDirection }
  | { readonly type: 'SEARCH' }
  | { readonly type: 'REST' }
  | { readonly type: 'PICKUP'; readonly itemId?: string }
  | { readonly type: 'DROP'; readonly itemId: string };

export type HexGameEvent =
  | { readonly type: 'PLAYER_TRAVELLED'; readonly from: HexCoordinate; readonly to: HexCoordinate; readonly costWatches: 1 }
  | { readonly type: 'WATCH_ADVANCED'; readonly clock: WorldClock }
  | { readonly type: 'DAY_DAWNED'; readonly day: number }
  | { readonly type: 'HEX_SEARCHED'; readonly coordinate: HexCoordinate; readonly revealedCount: number }
  | { readonly type: 'DISCOVERY_REVEALED'; readonly coordinate: HexCoordinate; readonly discovery: HexDiscovery }
  | { readonly type: 'ITEM_PICKED_UP'; readonly item: RelicItem }
  | { readonly type: 'ITEM_DROPPED'; readonly item: RelicItem; readonly coordinate: HexCoordinate }
  | { readonly type: 'ACTION_REJECTED'; readonly reason: string };

export interface HexSimulationResult {
  readonly state: HexWorldState;
  readonly events: readonly HexGameEvent[];
  readonly success: boolean;
}
