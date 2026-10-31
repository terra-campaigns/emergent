# Goldfish Review: Core Gameplay Loop (Milestone 1)

**Review Target:** [`docs/designs/001_core_game_loop.md`](file:///Users/efsa/Repos/emergent/docs/designs/001_core_game_loop.md)  
**Reviewer:** Goldfish Reviewer Agent (Zero Context)  
**Date:** 31 October 2026  
**Verdict:** Revisions Required  

---

## 1. Executive Summary

The specification drafted in `docs/designs/001_core_game_loop.md` provides a well-structured architectural foundation for the headless simulation engine. The state representations are largely clean, discrete action-based ticking is properly decoupled from real-time clocks, and the core cardinal movement rules avoid diagonal ambiguities.

However, from an adversarial zero-context perspective, the specification exhibits several critical failure modes and architectural blind spots:
1. **Numeric and Array Schema Vulnerabilities:** Permitting floating-point weights introduces rounding inaccuracies that break deterministic capacity checks, while unconstrained 2D array typings allow jagged or dimensionally desynchronised tile matrices.
2. **Action Locality and Ambiguity:** The `PICKUP` action does not explicitly guard against picking up items from remote tiles when an `itemId` is supplied, and conflates "top item" (LIFO stack) with "first in array order" (FIFO queue).
3. **Map and Relic Invariants:** Relics can be stranded on impassable terrain upon initialisation, and relic IDs are not formally constrained to be globally unique.
4. **Scope Contradiction in Testing:** The specification includes browser-based Playwright perception testing in Milestone 1 despite declaring presentation layers as an explicit non-goal.

Revisions are required before this design is safe for autonomous code generation.

---

## 2. Invariant & Edge-Case Probing

| ID | Area / Component | Potential Failure Mode / Ambiguity | Risk Severity |
| :--- | :--- | :--- | :--- |
| PROBE-01 | State Schema / Inventory | **Floating-Point & Unbounded Weights:** `weight: number` and `maxCarryWeight: number` permit negative numbers, `NaN`, and floating-point precision drift (e.g. `0.1 + 0.2 === 0.30000000000000004`), which can cause spurious pickup rejections or negative-weight carry exploits. | High |
| PROBE-02 | State Schema / World Grid | **Jagged Tile Arrays & Dimensional Desynchronisation:** `tiles: readonly (readonly Tile[])[]` permits non-rectangular arrays, rows with mismatched lengths, or matrices whose dimensions disagree with `state.width` and `state.height`, resulting in unhandled runtime `TypeError` exceptions during coordinate lookups. | High |
| PROBE-03 | State Mutation / Locality | **Telekinetic `PICKUP` Vulnerability:** Section 5.4 does not define rejection behaviour when an `itemId` is passed that exists on the map but *not* on the player's current tile. A naive implementation searching `groundItems` globally by ID could permit remote item collection. | High |
| PROBE-04 | State Mutation / Inventory | **Stacking Order Contradiction:** Section 5.4 describes picking up the "top item" (implying LIFO stack behaviour), whereas Section 6 specifies "first item in array order" (FIFO queue behaviour). The drop placement order (prepend vs append) is unspecified. | Med |
| PROBE-05 | Invariants / Map Integrity | **Stranded Relics on Impassable Tiles:** No invariant requires ground items to reside strictly on walkable tiles. Relics spawned on `scrap_wall` or `waterway` during map generation are permanently uncollectable. | Med |
| PROBE-06 | State Schema / Redundancy | **Contradictory Walkability State:** `Tile` redundantly defines both `type: TileType` and `walkable: boolean`. Without a canonical mapping or validator, invalid states like `{ type: 'titan_bulkhead', walkable: true }` are representable. | Med |
| PROBE-07 | Identity / Relic Conservation | **Unenforced Relic ID Uniqueness:** No uniqueness constraint is defined for `RelicItem.id`. Duplicate IDs across `groundItems` and `player.inventory` break deterministic drop/pickup resolution and violate the Conservation of Relics invariant. | Med |
| PROBE-08 | Verification / Scope Leak | **Premature Browser E2E Perception Requirement:** Section 7 requires Playwright headless browser tests for Milestone 1, contradicting Section 1 Non-Goals and `TASKS.md` milestone sequencing (Phase 5 presentation). | Low |
| PROBE-09 | State Mutation / Reference Sharing | **Coordinate Reference Coupling on Drop:** Creating a `GroundItem` using `player.position` without requiring value-based copying creates object reference leakage between entities and ground items. | Low |
| PROBE-10 | Orthography / Localisation | **Orthographic Inconsistency:** The specification repeatedly uses "traversible" instead of standard British English "traversable". | Low |

---

## 3. Detailed Critiques & Blind Spots

### 3.1 Data Schema Completeness

* **Integer Quantisation for Weights:**
  In JavaScript and TypeScript, the `number` type represents an IEEE 754 double-precision float. Calculating `currentWeight + item.weight > player.maxCarryWeight` with floating-point values risks arithmetic errors. For instance, two items weighing `0.1` kg and `0.2` kg sum to `0.30000000000000004`, failing a capacity check of `0.3` kg. Weights must be strictly typed as non-negative discrete integers (e.g. `weightGrams: number` or integer mass units) with a schema invariant: `Number.isInteger(w) && w >= 0`.
* **Tile Matrix Validation & Coordinate Safety:**
  The typing `readonly (readonly Tile[])[]` provides no runtime guarantee that `tiles.length === height` or that every row has length equal to `width`. An out-of-bounds lookup on a jagged array returns `undefined`, which throws a `TypeError: Cannot read properties of undefined (reading 'walkable')` when checking `!tile.walkable`. The specification must require an initial state validation function (`validateWorldState`) that enforces rectangular dimensions.
* **Tile Type Walkability Decoupling:**
  The `Tile` interface contains both `type: TileType` and `walkable: boolean`. Storing walkability as a per-instance mutable field when tile types are intrinsically passable or impassable introduces data redundancy. Walkability should either be derived deterministically from `TileType` via a lookup table (e.g. `TILE_DEFINITIONS[type].walkable`), or protected by an invariant asserting that `tile.walkable` matches the canonical property of its `TileType`.
* **Coordinate Integers and Value Equality:**
  `Position` uses `x: number` and `y: number`. Coordinates must be validated as discrete non-negative integers (`0 <= x < width`, `0 <= y < height`). Furthermore, the specification must explicitly mandate value-based coordinate comparison (`posA.x === posB.x && posA.y === posB.y`), warning against reference equality checks (`posA === posB`).

### 3.2 Deterministic Simulation Consistency

* **Locality and Error Handling in `PICKUP`:**
  Section 5.4 states:
  > "Locate `GroundItem` on the player's current tile `(px, py)`. If specific `itemId` provided, match item ID; otherwise take the top item on that tile. If no item exists on the tile, reject action with reason 'No item to pick up'."
  
  This leaves an omission: what if ground items exist on `(px, py)`, but none match the supplied `itemId`? Or what if the requested `itemId` exists elsewhere on the map?
  The resolution sequence must be formally specified:
  1. Filter all ground items where `item.position.x === player.position.x && item.position.y === player.position.y`.
  2. If the filtered list is empty, reject with reason `"No item to pick up"`.
  3. If `action.itemId` is provided, find the item within the filtered list matching that ID. If no match is found on the tile, reject with reason `"Item not found on current tile"`. (Crucially, do *not* query ground items outside the current tile).
  4. If `action.itemId` is omitted, take the item according to the defined stacking order.
* **Stacking Order Discipline (LIFO vs FIFO):**
  Section 5.4 uses the phrase "top item" (stack / LIFO metaphor), while Section 6 uses "first item in array order" (queue / FIFO metaphor). The specification must adopt consistent terminology. If ground items behave as a physical pile, newly dropped items should be prepended to the tile stack, and picking up without an ID should pop the top item (LIFO).
* **Conservation of Relics and Stranded Relics Invariant:**
  Rule 1 (Conservation of Relics) correctly prevents item duplication, but does not prevent relic stranding. A new invariant must be added:
  > "All `GroundItem` entities must occupy a tile where `walkable === true`."
  This prevents procedural map generators or initial scenario configurations from placing relics on inaccessible waterways or titan bulkheads.
* **Deterministic Pure Reducer Semantics:**
  The specification describes `step(state, action): SimulationResult`. It must be explicitly affirmed that `step` is a pure function with zero side effects: the input `state` must remain strictly immutable. When an action is rejected:
  - `SimulationResult.success` must be `false`.
  - `SimulationResult.state` must return the identical input state reference.
  - `SimulationResult.events` must contain `[{ type: 'ACTION_REJECTED', reason, tick: state.tick }]`, where `tick` reflects the unchanged current simulation tick.
* **Object Reference Isolation on Drop:**
  In Section 5.5 (`DROP`), the specification notes: "Create new GroundItem at player's current position (px, py)". The implementation must instantiate a cloned position object `{ x: player.position.x, y: player.position.y }` rather than assigning `player.position` directly, avoiding shared mutable references across entity and ground item records.

### 3.3 Testability & Perception Verification

* **Milestone Scope Boundary & Presentation Leak:**
  Section 7 defines "Presentation Perception Verification (`client/tests/e2e/`)" using Playwright to test coordinate re-renders. This directly contradicts Section 1 Non-Goals ("Graphical rendering... addressed in Phase 5 presentation layers") and the Milestone 1 objective ("Authoritative Tick Core, Grid Movement & Relic Salvage"). Milestone 1 is strictly headless. The Playwright perception test should be removed from Milestone 1 and assigned to Phase 5 in `TASKS.md`.
* **Missing Headless Engine Verification Tests:**
  The proposed test files in `engine/tests/` must be expanded with essential invariant checks:
  1. **State Immutability Test:** Verify that `step(state, action)` does not mutate the input `WorldState` (e.g. by applying `Object.freeze` deeply to the input state before stepping).
  2. **JSON Serialisation / Rehydration Test:** Verify that `JSON.parse(JSON.stringify(state))` yields a valid state that produces identical simulation steps.
  3. **Capacity Boundary Precision Test:** Verify that `currentWeight + weight === maxWeight` succeeds, and `currentWeight + weight === maxWeight + 1` fails deterministically.
  4. **Telekinesis Prevention Test:** Attempt a `PICKUP` specifying an `itemId` that exists on a different tile; assert action rejection and verify the item remains at its original coordinates.
  5. **Conservation Invariant Fuzzing:** Execute a deterministic pseudo-random sequence of 100 actions and assert that the total relic count (`groundItems.length + inventory.length`) and set of item IDs remains perfectly conserved after every tick.

---

## 4. Required Revisions

1. **Integer Weight Enforcement:** Replace floating-point weights with non-negative integer weight units (`weightGrams: number`, `maxCarryWeightGrams: number`) and specify boundary check `currentWeight + item.weightGrams <= player.maxCarryWeightGrams`.
2. **Rectangular Grid & Position Invariants:** Mandate a `validateWorldState(state)` function enforcing that `tiles` is non-jagged (`tiles.length === height` and `tiles[y].length === width`), coordinates are non-negative integers, and `(0, 0)` is explicitly documented as North-West / top-left.
3. **Explicit `PICKUP` Locality & Stacking Rules:**
   - Specify that `PICKUP` with an `itemId` not present on the current tile is rejected with `"Item not found on current tile"`.
   - Reconcile "top item" and "first in array order" by formally declaring a LIFO stack where `DROP` prepends to the tile and default `PICKUP` pops the head.
4. **Walkable Ground Item Invariant:** Add an invariant dictating that `GroundItem.position` must always correspond to a tile where `walkable === true`.
5. **Tile Walkability Canonical Mapping:** Define `walkable` as a canonical property derived from `TileType` via a static dictionary `TILE_DEFINITIONS`, avoiding contradictory per-instance flags.
6. **Relic ID Uniqueness Invariant:** Add an explicit rule requiring all `RelicItem.id` values to be non-empty and globally unique across the entire simulation state.
7. **Scope Alignment for Verification:** Remove `client/tests/e2e/` Playwright tests from Milestone 1 verification, replacing them with pure engine tests for immutability, JSON round-tripping, fuzzing, and capacity boundary conditions.
8. **British English Spelling Standardisation:** Standardise "traversible" to British English "traversable".

---

## 5. Recommendation & Sign-Off

* **Verdict:** **Revisions Required**
* **Notes for Elephant Agent:** 
  Incorporate the 8 revisions into `docs/designs/001_core_game_loop.md` and present the revised specification for final human sign-off before code generation begins.
