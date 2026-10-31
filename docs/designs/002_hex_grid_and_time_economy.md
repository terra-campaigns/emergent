# Design Specification: Hexagonal World Grid, Diurnal Time Economy & Hidden Discoveries

**Document ID:** `docs/designs/002_hex_grid_and_time_economy.md`  
**Status:** Approved  
**Author:** Elephant Agent & Developer  
**Target Milestone:** Milestone 2  

---

## 1. Overview & Objectives

Milestone 1 established physical presence on a 2D square grid where each movement was an instant orthogonal tick. Based on developer playtest directives ([`docs/playtests/001_milestone_1_playtest.md`](docs/playtests/001_milestone_1_playtest.md)), Milestone 2 fundamentally transforms exploration and pacing:
1. **Hexagonal Topology:** Replaces the 2D Cartesian square grid with a regular pointy-topped hexagonal coordinate system, offering 6 natural equidistant movement directions.
2. **Travel Pacing & Time Economy:** Replaces instantaneous step ticks with a discrete diurnal time economy where travelling between hexagons consumes **a third of a day** (1 Watch $\approx$ 8 hours).
3. **Hidden Discoveries & Search Mechanics:** Ground items, derelicts, and landmarks are no longer immediately visible upon entering a hexagon. Each hexagon requires an explicit `SEARCH` action (spending 1 Watch) to survey the terrain and reveal hidden salvage.

### Goals

* **Pointy-Topped Hexagonal Math:** Implement axial coordinates `(q, r)` with derived cubic constraints (`q + r + s = 0`), pure hex distance calculations, and 6 discrete neighbour transitions (`NE`, `E`, `SE`, `SW`, `W`, `NW`).
* **Diurnal Time State Machine:** Model time using discrete watches (3 watches per in-game day: `morning`, `afternoon`, `night`). Advancing across a hex, searching, or resting advances the watch, cycling day counts deterministically.
* **Discovery Lifecycle:** Model hex discoveries with three strict visibility states: `hidden`, `revealed`, and `depleted`. Enforce that only `revealed` relics can be targeted by `PICKUP`.
* **Decoupled Simulation:** Keep all hexagonal math, diurnal time progression, and search logic 100% headless in `@emergent/engine`.
* **Browser Hex Presentation:** Update `@emergent/client` with an HTML5 Canvas hex renderer, diurnal HUD badges (Day counter and Morning/Afternoon/Night phase indicator), and a dedicated `SEARCH` control.

### Non-Goals

* Continuous or real-time travel timers (all state changes remain discrete, action-driven ticks).
* Hostile AI pathfinding or combat encounters (reserved for Milestone 3).
* 24XX skill rolls and polyhedral step dice (architectural hooks laid in Milestone 2, full system implemented in Milestone 3).
* Autonomous generation of canon region history or faction lore (reserved for human authoring canvases; the agent actively formulates open questions to propose and populate potential locations).

---

## 2. In-Game Fiction & Player Experience

In the feudal, post-collapse world of `emergent`, travel across the frontier is an arduous journey across vast expanse. Distances between derelict bulkheads and scrub plains are measured not in fleeting steps, but in long marches under open skies:
* **The Rhythm of Watches:** A day is divided into three distinct watches:
  * **Morning (Dawn to Midday):** Cool air, clear visibility, optimal travelling conditions.
  * **Afternoon (Midday to Dusk):** Harsh sun or gathering clouds, weariness setting in.
  * **Night (Dusk to Dawn):** Bitter frontier cold, reduced visibility, requiring camp or cautious search.
* **Searching the Hexagon:** A traveller arriving at a new hexagon sees only the broad terrain (e.g. cracked plains, rubble fields, or rusted hulk perimeters). Uncovering salvage buried beneath sediment or hidden inside a sunken access hatch requires pitching camp and spending an entire watch conducting a deliberate `SEARCH`.

---

## 3. State Schema & Data Models

All state structures are strictly typed, serialisable to JSON, and treated as immutable values across pure reducer transitions.

```typescript
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
export const HEX_DIRECTIONS: Record<HexDirection, HexCoordinate> = {
  NE: { q: 1, r: -1 },
  E:  { q: 1, r: 0 },
  SE: { q: 0, r: 1 },
  SW: { q: -1, r: 1 },
  W:  { q: -1, r: 0 },
  NW: { q: 0, r: -1 },
} as const;

/**
 * Canonical string serialisation for axial coordinate keying.
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
  readonly day: number;         // 1-based integer (Day 1, Day 2, ...)
  readonly watch: WatchPhase;   // Current 8-hour shift
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
  readonly tiles: readonly HexTile[]; // Unique list of hex tiles keyed by coordinate
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
```

---

## 4. Invariants & Rules

1. **Cubic Coordinate Invariant:** For every coordinate `(q, r)`, the derived third axis `s = -q - r` must strictly satisfy `q + r + s = 0`.
2. **Radial Boundary Invariant:** A hexagon `(q, r)` is within world bounds if and only if `max(abs(q), abs(r), abs(-q - r)) <= radius`.
3. **Pacing Time Invariant:**
   * Every successful `TRAVEL`, `SEARCH`, and `REST` action advances `totalWatches` by exactly `1`.
   * `watch` cycles deterministically: `morning` $\rightarrow$ `afternoon` $\rightarrow$ `night` $\rightarrow$ `morning`.
   * `day` increments if and only if `watch` transitions from `night` to `morning`.
   * Unsuccessful or rejected actions (e.g. walking into a `titan_bulkhead` or walking outside world radius) consume `0` watches and return the identical state reference.
4. **Discovery Visibility Invariant:**
   * A discovery on a tile begins in the `hidden` state unless explicitly defined as `revealed` in initial map fixtures (e.g. towering surface landmarks).
   * Relics associated with a discovery cannot be picked up (`PICKUP`) while `visibility === 'hidden'`.
   * Executing `SEARCH` on a hex transitions all `hidden` discoveries on that hex to `revealed`.
5. **Relic Conservation Invariant:**
   * The sum of all relics across player rucksack, ground discoveries (`hidden`, `revealed`, and `depleted`), and tile containers must remain perfectly constant across every simulation tick. Relics can neither duplicate nor vanish.

---

## 5. Simulation & Tick Mechanics

### Inputs

* `state`: The immutable `HexWorldState`.
* `action`: One of `TRAVEL`, `SEARCH`, `REST`, `PICKUP`, `DROP`.

### State Mutation Logic

#### 1. Action: `TRAVEL { direction }`

1. Compute target coordinate: `targetCoord = { q: player.q + HEX_DIRECTIONS[direction].q, r: player.r + HEX_DIRECTIONS[direction].r }`.
2. Boundary check: Verify `hexDistance({ q: 0, r: 0 }, targetCoord) <= state.radius`. If false, reject action with `"You reached the perimeter of the territory, turn back."`
3. Terrain walkability check: Find tile at `targetCoord`. If `!tile.traversable`, reject action with `"Path blocked by [terrain name]."`.
4. Clock progression: Advance `WorldClock` by 1 watch (transition watch phase, increment day if transitioning past night).
5. State update: Update `player.coordinate = targetCoord`, emit `PLAYER_TRAVELLED` and `WATCH_ADVANCED`.

#### 2. Action: `SEARCH`

1. Identify the current hex tile at `player.coordinate`.
2. Query `tile.discoveries` for items with `visibility === 'hidden'`.
3. Advance `WorldClock` by 1 watch.
4. If hidden discoveries exist:
   * Map hidden discoveries to `visibility = 'revealed'`.
   * Emit `HEX_SEARCHED` and `DISCOVERY_REVEALED` for each item.
5. If no hidden discoveries exist:
   * Emit `HEX_SEARCHED` with `revealedCount: 0`.

#### 3. Action: `REST`

1. Advance `WorldClock` by 1 watch without changing position or discovery states.
2. Emit `WATCH_ADVANCED` (and `DAY_DAWNED` if crossing midnight).

#### 4. Action: `PICKUP { itemId }`

1. Check that an item with `itemId` exists on the current hex with `visibility === 'revealed'`.
2. Enforce carrying capacity: `currentBurden + item.weightGrams <= player.maxCarryWeightGrams`. If exceeded, reject action with `"Rucksack is overburdened."`.
3. Does **not** advance the 8-hour watch (instant tactical manipulation within the already searched site).
4. Remove item from ground discovery (set `visibility = 'depleted'`), prepend item to `player.inventory`, emit `ITEM_PICKED_UP`.

#### 5. Action: `DROP { itemId }`

1. Verify `itemId` is in `player.inventory`.
2. Remove item from rucksack, add to current hex as a `revealed` ground discovery.
3. Emit `ITEM_DROPPED`.

---

## 6. Edge Cases & Failure Modes

* **Radial Diagonal Clipping:** Traversing off the map edge at pointy corners must be rejected cleanly by the distance formula `max(|q|, |r|, |s|) <= radius`.
* **Repeat Search Spam:** Searching an already surveyed hex where all discoveries are `revealed` or `depleted` still consumes 1 watch (time spent scouring barren ground) and cleanly emits 0 new discoveries without crashing or corrupting state.
* **Midnight Rollover:** A travel action initiated during `night` watch must land at `morning` of `day + 1` with events ordered deterministically (`DAY_DAWNED` followed by `PLAYER_TRAVELLED`).
* **Deep Immutability:** `Object.freeze` deeply applied to state inputs must never produce TypeError runtime exceptions during reducer operations.

---

## 7. Verification & Automated Test Strategy

### Deterministic Unit Tests (`engine/tests/`)

1. **`hex_math.test.ts`**:
   * Verify cubic coordinate derivation and equality invariants across all 6 directions.
   * Verify hex distance calculation between arbitrary coordinates $(q_1, r_1)$ and $(q_2, r_2)$.
2. **`diurnal_clock.test.ts`**:
   * Verify 3-watch cyclic progression (`morning` $\rightarrow$ `afternoon` $\rightarrow$ `night` $\rightarrow$ `morning`).
   * Verify that `day` increments strictly when transitioning from `night`.
   * Verify rejected actions consume 0 watches.
3. **`discoveries_and_search.test.ts`**:
   * Assert `PICKUP` fails when target relic has `visibility === 'hidden'`.
   * Assert `SEARCH` reveals hidden relics and allows subsequent `PICKUP`.
   * Assert repeat `SEARCH` on an empty hex consumes 1 watch and discovers 0 items.
4. **`hex_conservation_fuzzing.test.ts`**:
   * Execute 300 pseudo-random actions across a bounded hex map and assert that the total relic inventory count is perfectly conserved across all ticks.

### Browser Perception Tests (`client/tests/e2e/`)

1. **`hex_gameplay.spec.ts`**:
   * Verify HTML5 Canvas renders regular pointy-topped hexes.
   * Verify HUD displays `Day 1 - Morning`, advancing to `Afternoon` and `Night` upon hex traversal.
   * Verify that stepping onto a hex with hidden salvage keeps the salvage picker empty until the `SEARCH` button or keybinding is pressed.

---

## 8. Goldfish Review Gates

- [x] Zero-context Goldfish review completed (`docs/reviews/002_hex_grid_and_time_economy_review.md`)
- [x] 8-Pillar architectural alignment confirmed
- [x] Human developer approval signed off
