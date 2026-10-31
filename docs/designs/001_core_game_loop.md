# Design Specification: Core Gameplay Loop (Milestone 1)

**Document ID:** `docs/designs/001_core_game_loop.md`  
**Status:** Approved  
**Author:** Elephant Agent (Design Phase) & Developer  
**Review Reference:** [`docs/reviews/001_core_game_loop_review.md`](file:///Users/efsa/Repos/emergent/docs/reviews/001_core_game_loop_review.md)  
**Target Milestone:** Milestone 1 (Authoritative Tick Core, Grid Movement & Relic Salvage)  

---

## 1. Overview & Objectives

This specification defines the foundational simulation loop for `emergent`. The simulation core is an authoritative, headless, discrete-tick state machine implemented in TypeScript (`engine/`). It models a 2D tile-based wilderness containing feudal terrain and derelict titan scrap, through which a player entity navigates, encounters impassable obstacles, and salvages ancient relics into a constrained inventory.

### Goals

* Implement a deterministic, pure reducer simulation core decoupled entirely from presentation code (`step(state, action): SimulationResult`).
* Define strict TypeScript interfaces for world state, integer coordinates, non-jagged tile matrices, and integer-quantised relic weights.
* Model discrete action-driven ticks: simulation time advances by exactly one tick when a valid action is executed.
* Provide comprehensive deterministic unit test coverage for movement, collision boundaries, inventory mutations, state immutability, and relic conservation fuzzing.

### Non-Goals

* Real-time continuous clock ticks (postponed to future survival/cooldown systems).
* Combat algorithms, hostile AI behaviour, or health degradation (reserved for Milestone 2).
* Graphical rendering, WebGL setup, audio, or networking (addressed in Phase 5 presentation layers).

---

## 2. In-Game Fiction & Player Experience

The game is set on a remote, disconnected frontier world in a semi-feudal dark age, punctuated by the incomprehensible physical remnants of ancient cosmic civilisations. All major world lore, regional history, faction identities, and narrative arcs are authored exclusively by the human developer.

For Milestone 1, the simulation focuses strictly on the fundamental mechanic of physical presence:
* An entity traversing a discrete 2D terrain grid.
* Navigation shaped by traversable paths versus impassable physical barriers.
* Discovering and collecting salvaged items with discrete mass burdens into a constrained inventory.
* Specific narrative details (e.g. player persona, regional name, and relic lore) will be authored directly by the developer.

---

## 3. State Schema & Data Models

All state structures are strictly typed, serialisable to JSON, and treated as immutable values across tick boundaries.

```typescript
export type TileType = 
  | 'plains'         // Traversable grassland or dirt
  | 'rubble'         // Rough ground, traversable
  | 'scrap_wall'     // Rusted hull plating, impassable
  | 'titan_bulkhead' // Incomprehensible alloy, impassable
  | 'waterway';      // Flooded canal, impassable

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
  readonly x: number; // Integer, 0 <= x < width (0 is West/left)
  readonly y: number; // Integer, 0 <= y < height (0 is North/top)
}

export type RelicType = 
  | 'power_cell' 
  | 'sensory_optic' 
  | 'alloy_plate' 
  | 'logic_core';

export interface RelicItem {
  readonly id: string; // Non-empty, globally unique string
  readonly name: string;
  readonly description: string;
  readonly relicType: RelicType;
  readonly weightGrams: number; // Discrete integer >= 0 (e.g. 500 = 0.5kg)
}

export interface GroundItem {
  readonly item: RelicItem;
  readonly position: Position;
}

export interface PlayerEntity {
  readonly id: string;
  readonly title?: string; // Narrative moniker (e.g. "A tribal wanderer")
  readonly position: Position;
  readonly inventory: readonly RelicItem[];
  readonly maxCarryWeightGrams: number; // Discrete integer > 0
}

export interface WorldState {
  readonly tick: number; // Monotonically increasing discrete integer >= 0
  readonly width: number; // Integer > 0
  readonly height: number; // Integer > 0
  readonly tiles: readonly (readonly TileType[])[]; // Non-jagged matrix [y][x]
  readonly player: PlayerEntity;
  readonly groundItems: readonly GroundItem[]; // LIFO stack per tile (new drops prepended)
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
```

---

## 4. Invariants & Rules

1. **Conservation of Relics:** A `RelicItem` must exist in exactly one location at any given tick: either resting as a `GroundItem` on a specific tile `(x, y)`, or held within `player.inventory`. Items cannot be spontaneously duplicated or lost.
2. **Relic ID Uniqueness:** Every `RelicItem.id` in `WorldState` must be a non-empty string and must be globally unique across all `groundItems` and `player.inventory`.
3. **Discrete Map Invariant & Rectangular Grid:**
   * Grid dimensions must be strictly rectangular: `tiles.length === height` and for all `0 <= y < height`, `tiles[y].length === width`.
   * The top-left tile is North-West `(0, 0)`.
   * For any entity or item position `(x, y)`, the invariants `Number.isInteger(x) && Number.isInteger(y) && 0 <= x < width && 0 <= y < height` must hold.
4. **Collision Invariant:** An entity can never enter or occupy a tile where `TILE_DEFINITIONS[tiles[y][x]].walkable === false`. Attempting to move into an impassable tile or out-of-bounds coordinate fails and does not alter the player's position.
5. **Walkable Ground Item Invariant:** Every `GroundItem` must reside on a tile where `TILE_DEFINITIONS[tiles[position.y][position.x]].walkable === true`. Items can never rest on impassable terrain.
6. **Integer Capacity Invariant:** All weights are stored as discrete non-negative integers (`weightGrams`). The sum of `item.weightGrams` for all items in `player.inventory` must never exceed `player.maxCarryWeightGrams`. Any pickup action that would exceed capacity fails deterministically without precision drift.
7. **Pure Reducer Determinism:** Given an identical initial `WorldState` and `GameAction`, `step(state, action)` must return an identical `SimulationResult` with zero external side effects or state mutations.
8. **Tick Advancement Rule:** Valid actions increment `state.tick` by exactly 1. Rejected actions emit an `ACTION_REJECTED` event, leave `state.tick` unchanged, and return the original state reference with `success: false`.

---

## 5. Simulation & Tick Mechanics

### Inputs

* `state: WorldState`
* `action: GameAction`

### State Mutation Function: `step(state, action): SimulationResult`

1. **Direction Resolution:**
   * `north`: `(x, y - 1)`
   * `south`: `(x, y + 1)`
   * `east`: `(x + 1, y)`
   * `west`: `(x - 1, y)`

2. **Action: `MOVE`**
   * Compute target coordinates `(tx, ty)`.
   * Check boundary: if `tx < 0 || tx >= state.width || ty < 0 || ty >= state.height`, reject action with reason `"You reached the end of the world, come back later"`.
   * Check walkability: retrieve tile type `t = state.tiles[ty][tx]`. If `!TILE_DEFINITIONS[t].walkable`, reject action with reason `"Tile is impassable"`.
   * If valid: return updated state with `player.position` set to `{ x: tx, y: ty }`, increment `tick` by 1, emit `MOVED` event, and set `success: true`.

3. **Action: `WAIT`**
   * Increment `tick` by 1.
   * Emit `WAITED` event.
   * Return state with `success: true`.

4. **Action: `PICKUP` (Strict Locality & LIFO Discipline)**
   * Filter ground items on the player's current coordinate:
     `tileItems = state.groundItems.filter(g => g.position.x === player.position.x && g.position.y === player.position.y)`.
   * If `tileItems.length === 0`: reject with reason `"No item to pick up"`.
   * If `action.itemId` is specified:
     * Find matching item: `target = tileItems.find(g => g.item.id === action.itemId)`.
     * If not found on current tile: reject with reason `"Item not found on current tile"`. (Crucially, items on other coordinates are never queried).
   * If `action.itemId` is omitted:
     * Deterministically take the top of the stack: `target = tileItems[0]`.
   * Capacity Check:
     * `currentWeight = player.inventory.reduce((acc, i) => acc + i.weightGrams, 0)`.
     * If `currentWeight + target.item.weightGrams > player.maxCarryWeightGrams`: reject with reason `"Exceeds carrying capacity"`.
   * If valid:
     * Remove `target` from `state.groundItems`.
     * Append `target.item` to `player.inventory`.
     * Increment `tick` by 1.
     * Emit `ITEM_COLLECTED`.
     * Return updated state with `success: true`.

5. **Action: `DROP` (Stack Discipline & Value Copying)**
   * Verify that `action.itemId` exists in `player.inventory`.
   * If not present, reject action with reason `"Item not found in inventory"`.
   * Remove item from `player.inventory`.
   * Create a new `GroundItem` prepended to `state.groundItems` with an isolated value-copied position:
     `{ item, position: { x: player.position.x, y: player.position.y } }`.
   * Increment `tick` by 1, emit `ITEM_DROPPED`, and return updated state with `success: true`.

---

## 6. Edge Cases & Failure Modes

| Edge Case | Condition | Deterministic Resolution | Tick Effect |
| :--- | :--- | :--- | :--- |
| Map Boundary Clipping | Player steps north at `y = 0` | Action rejected (`"You reached the end of the world, come back later"`); position unchanged. | Tick does not advance. |
| Scrap Wall Obstacle | Player steps into `scrap_wall` | Action rejected (`"Tile is impassable"`); position unchanged. | Tick does not advance. |
| Telekinetic Pickup Attempt | Player inputs `PICKUP` with an `itemId` located on another tile | Action rejected (`"Item not found on current tile"`); item remains untouched. | Tick does not advance. |
| Multiple Relics on Tile | Multiple relics on `(x, y)` without `itemId` parameter | Pops the top item (index 0, LIFO) deterministically. | Tick advances by 1. |
| Capacity Saturation | `currentWeight + item.weightGrams > maxCarryWeightGrams` | Action rejected (`"Exceeds carrying capacity"`); item remains on ground. | Tick does not advance. |
| Dropping onto Impassable Tile | Not possible in Milestone 1 because the player cannot enter an impassable tile | Position invariant ensures drops always land on a traversable tile. | Tick advances by 1. |
| Stacking Order Preservation | Repeated `DROP` actions on the same tile | Newly dropped items are prepended to the tile stack, maintaining strict LIFO resolution for subsequent pickups. | Tick advances by 1 per drop. |

---

## 7. Verification & Automated Test Strategy

All verification for Milestone 1 is conducted purely through headless unit tests in `engine/tests/` using Vitest / Node test runner. No graphical presentation or browser runner is required.

### Test Suites (`engine/tests/`)

1. **`state_validation.test.ts`**:
   * Assert `validateWorldState` passes for valid rectangular states.
   * Assert rejection on jagged arrays, out-of-bounds positions, negative integer coordinates, and duplicate relic IDs.
   * Assert rejection if any ground item is placed on an impassable tile.
2. **`grid_movement.test.ts`**:
   * Assert valid 4-directional cardinal movement (`north`, `south`, `east`, `west`).
   * Assert impassable tile blocking for `scrap_wall`, `titan_bulkhead`, and `waterway`.
   * Assert perimeter boundary clamping on all 4 borders (rejection with "You reached the end of the world, come back later" and zero coordinate delta).
3. **`inventory_mechanics.test.ts`**:
   * Assert relic pickup transfers item from `groundItems` to `player.inventory`.
   * Assert telekinesis prevention: pickup with remote `itemId` is rejected and leaves ground state unchanged.
   * Assert integer capacity ceiling: exact capacity match succeeds; `maxCarryWeightGrams + 1` fails.
   * Assert drop action prepends item with an isolated position value copy.
   * Assert LIFO stacking resolution when multiple items occupy the same tile.
4. **`pure_reducer_and_determinism.test.ts`**:
   * **State Immutability:** Verify that `step(state, action)` never mutates input `state` (asserted with `Object.freeze` deeply applied to the initial state).
   * **Tick Invariant:** Assert that rejected actions return identical state reference and never advance `tick`.
   * **JSON Round-Trip:** Assert that `JSON.parse(JSON.stringify(state))` rehydrates into a functionally identical state.
   * **Conservation Fuzzing:** Execute a deterministic pseudo-random sequence of 200 actions and assert that the total relic count and set of relic IDs remains perfectly conserved after every tick.

---

## 8. Goldfish Review Gates

- [x] Zero-context Goldfish review completed ([`docs/reviews/001_core_game_loop_review.md`](file:///Users/efsa/Repos/emergent/docs/reviews/001_core_game_loop_review.md))
- [x] Addressed 8 identified failure modes: integer weights, non-jagged matrix invariant, `PICKUP` locality, LIFO stack order, walkable relic rule, canonical tile definitions, pure reducer immutability, and British English orthography.
- [x] Human developer approval signed off
