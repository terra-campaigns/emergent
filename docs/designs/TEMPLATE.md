# Design Specification: [Feature Name]

**Document ID:** `docs/designs/XXX_[feature_name].md`  
**Status:** Draft | Under Review | Approved | Superseded  
**Author:** Elephant Agent & Developer  
**Target Milestone:** Milestone X  

---

## 1. Overview & Objectives

[Concise summary of the feature, the problem it solves, and how it fits into the emergent world and simulation.]

### Goals

* [Primary goal 1]
* [Primary goal 2]

### Non-Goals

* [Explicitly out-of-scope item 1]
* [Explicitly out-of-scope item 2]

---

## 2. In-Game Fiction & Player Experience

[Narrative framing, thematic integration, player verbs, and expected visual or interface presentation.]

---

## 3. State Schema & Data Models

[Complete, unambiguous data models. Provide field names, types, constraints, and valid ranges.]

```text
[Data schema or JSON / TypeScript / Rust type definition]
```

---

## 4. Invariants & Rules

* **Invariant 1:** [Condition that must ALWAYS hold true across all simulation ticks]
* **Invariant 2:** [Validation constraint or boundary condition]

---

## 5. Simulation & Tick Mechanics

### Inputs

* [Player actions, tick delta, or environmental triggers]

### State Mutation Logic

1. [Step-by-step deterministic state calculation]
2. [Collision, boundary checks, and resource updates]

### Outputs & Events

* [Events emitted to presentation client or event bus]

---

## 6. Edge Cases & Failure Modes

* **Edge Case 1:** [Description and deterministic resolution]
* **Edge Case 2:** [Boundary condition handling]

---

## 7. Verification & Automated Test Strategy

### Deterministic Unit Tests (`engine/tests/`)

* [Test scenario 1: Stat boundary assertion]
* [Test scenario 2: State transition assertion]

### Perception / End-to-End Tests (`client/tests/e2e/`)

* [Browser interaction assertion via Playwright]

---

## 8. Goldfish Review Gates

- [ ] Zero-context Goldfish review completed
- [ ] Logic contradictions and edge-case holes addressed
- [ ] Human developer approval signed off
