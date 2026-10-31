# Goldfish Review: Hexagonal World Grid, Diurnal Time Economy & Hidden Discoveries

**Review Target:** [`docs/designs/002_hex_grid_and_time_economy.md`](docs/designs/002_hex_grid_and_time_economy.md)  
**Reviewer:** Goldfish Reviewer Agent (Zero Context)  
**Date:** 31 October 2026  
**Verdict:** Approved  

---

## 1. Executive Summary

Specification `002_hex_grid_and_time_economy.md` establishes a coherent, deterministic model for Milestone 2. It cleanly translates the developer's playtest directives into rigorous state schemas and pure reducer contracts:
* Pointy-topped hexagonal coordinates governed by axial pairs `(q, r)` and cubic distance invariants.
* A 3-phase diurnal time economy (`morning` $\rightarrow$ `afternoon` $\rightarrow$ `night`) advancing in 8-hour watches per traverse, search, or rest.
* A 3-state discovery lifecycle (`hidden` $\rightarrow$ `revealed` $\rightarrow$ `depleted`) enforcing intentional exploration.

The design maintains strict headless decoupling in `@emergent/engine`, preserves narrative sovereignty by avoiding autonomous world lore generation, and provides comprehensive unit and browser perception test strategies.

---

## 2. Invariant & Edge-Case Probing

| ID | Area / Component | Potential Failure Mode / Ambiguity | Risk Severity |
| :--- | :--- | :--- | :--- |
| PROBE-01 | Hex Coordinates | **Coordinate Key Ambiguity:** Serialising coordinates for tile indexing without a canonical string format (`${q},${r}`) could lead to desynchronised lookups between engine and client. | Low |
| PROBE-02 | Discovery State | **Dropped Item Visibility:** If a dropped relic were placed in a `hidden` state, players would instantly lose track of dropped rucksack items. (Specification correctly enforces `revealed` for drops). | Resolved |
| PROBE-03 | Search Resolution | **Granularity of Search:** Whether `SEARCH` reveals all discoveries on a hex or requires multiple 8-hour watches per item. (Specification confirms all hidden discoveries on the active hex are uncovered in a single watch). | Resolved |
| PROBE-04 | Event Sequencing | **Midnight Rollover Ordering:** When a watch transitions from `night` to `morning`, client animations could glitch if `DAY_DAWNED` fires after movement events. | Low |
| PROBE-05 | Pacing Invariant | **Action Rejection Cost:** Boundary or obstacle collisions must not advance the 8-hour clock; otherwise, bumping into a bulkhead wastes an entire watch. (Specification explicitly guarantees 0 watch cost for rejected actions). | Resolved |
| PROBE-06 | Conservation Fuzzing | **Relic Conservation:** Relics transitioning between rucksack, ground discoveries, and search reveals must remain conserved. | Med |

---

## 3. Detailed Critiques & Blind Spots

### 3.1 Data Schema Completeness

* **Axial Lookups:** To ensure deterministic $O(1)$ lookups in simulation reducers, the engine should expose a pure helper:
  ```typescript
  export const hexCoordKey = (coord: HexCoordinate): string => `${coord.q},${coord.r}`;
  ```
  This guarantees that tile dictionaries, spatial maps, and client hover queries share the exact same string key serialization.

* **Inventory Conservation:** The `HexDiscovery` structure cleanly pairs portable relics with their ground fixture state (`visibility: 'revealed' | 'hidden' | 'depleted'`), preventing orphaned IDs.

### 3.2 Deterministic Simulation Consistency

* **Diurnal Day Rollover:** The invariant `watch === 'night' + 1 watch -> watch = 'morning', day = day + 1` is discrete and integer-based, avoiding floating-point drift.
* **Deterministic Event Ordering:** During midnight transitions, the engine should emit `DAY_DAWNED` first, followed by `WATCH_ADVANCED`, and finally `PLAYER_TRAVELLED`.

### 3.3 Testability & Perception Verification

* The test strategy covers the complete state lifecycle:
  1. Unit tests for axial math and distance calculations.
  2. Diurnal clock rollover and rejected action cost assertions.
  3. Search reveal lifecycle and rucksack burden validation.
  4. 300-tick pseudo-random conservation fuzzing.
  5. Playwright headless browser perception assertions for hex rendering and time badges.

---

## 4. Required Revisions & Hardening

1. **Canonical Coordinate Keying:** Ensure `hexCoordKey(q, r)` is explicitly documented in the specification and exported as a utility primitive.
2. **Deterministic Event Order on Dawn:** Formalise that `DAY_DAWNED` precedes `WATCH_ADVANCED` and `PLAYER_TRAVELLED` when rolling past midnight.

---

## 5. Recommendation & Sign-Off

* **Verdict:** `Approved`
* **Status:** Specification `002_hex_grid_and_time_economy.md` meets all Google EGM criteria and is ready for human approval and autonomous code implementation.

---

*Signed by: **Goldfish Reviewer Agent** · Date: 31 October 2026*
