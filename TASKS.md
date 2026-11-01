# Working Tasks List: emergent

> [!NOTE]
> This document is the authoritative, living task board for `emergent`. It is updated continuously by the autonomous driving agent to track active milestones, dependencies, requirements clarifications, and automated verification gates.

---

## Operational Status

* **Orchestrator Model:** Gemini Flash (strictly enforced unless manually overridden)
* **Quota Guardrails:** Cease autonomous development if rolling 5-hour limit < 20% or weekly limit < 30%
* **Current Phase:** Phase 17 — Human Playability Sign-off (Milestone 3)
* **Current Active Focus:** TASK-1701 `[HUMAN]`: Developer Playtest & 24XX Rules Evaluation

---

## Human Input Registry

This registry tracks all living documents that await developer decisions, narrative lore authorship, or qualitative evaluation:

| Document | Task ID | Focus / Required Input | State |
| :--- | :--- | :--- | :--- |
| [[docs/playtests/003_milestone_3_playtest.md]] | `TASK-1701 [HUMAN]` | Qualitative playtest: 24XX step dice, risk modal, gear sacrifice & M4 priorities | **Active Canvas (Awaiting Playtest)** |
| [[docs/designs/003_rules_system_24xx.md]] | `TASK-1302 [HUMAN]` | Technical design sign-off: 24XX step dice, condition track, gear sacrifice & risk prompts | **Approved by Developer** |
| [[docs/playtests/002_milestone_2_playtest.md]] | `TASK-1201 [HUMAN]` | Qualitative playtest: hex traversal, 8-hour watches, search mechanics & M3 priorities | **Signed Off (Milestone 2 Merged)** |
| [[docs/designs/002_hex_grid_and_time_economy.md]] | `TASK-802 [HUMAN]` | Technical design sign-off: hex coordinates, 8-hour watches, and search system | **Approved by Developer** |
| [[docs/lore/open_questions.md]] | `TASK-303 [HUMAN]` | Location canvases: Starting vista, monolith, cairn, barriers, night atmosphere | **Active Canvas** (Sections 5.1–5.8) |
| [[docs/playtests/001_milestone_1_playtest.md]] | `TASK-601 [HUMAN]` | Qualitative playtest: controls, pacing, visuals, and Milestone 2 priorities | **Signed Off (Milestone 1 Complete)** |
| [[docs/coaching/PROPOSAL_TEMPLATE.md]] | `COACH-001 [SEMI]` | Framework proposal template for developer coaching RFCs | **Available for Proposals** |

---

## Autonomy Classification (Guido Framework)

Every item on the task board is tagged with one of three execution modes:
* **`[AUTO]` (Autonomous):** Executed entirely by the AI agent without requiring interactive human pauses (e.g. code generation against approved specs, configuring tooling, running automated test suites).
* **`[SEMI]` (Semi-Autonomous):** Drafted or staged by the AI agent, but requiring developer review, parameter confirmation, or boundary validation before proceeding.
* **`[HUMAN]` (Human-Driven):** Exclusively reserved for human authority (e.g. narrative lore authorship, qualitative playability evaluation, architectural contract approvals, and git commit executions).

---

## Roadmap Overview

```mermaid
flowchart LR
    subgraph M1["Milestone 1: 2D Orthogonal Core (Complete)"]
        P0["Phase 0: Scaffolding"] --> P1["Phase 1: Spec"]
        P1 --> P2["Phase 2: Review"]
        P2 --> P3["Phase 3: Engine"]
        P3 --> P4["Phase 4: Tests"]
        P4 --> P5["Phase 5: Client"]
        P5 --> P6["Phase 6: Sign-off"]
    end
    subgraph M2["Milestone 2: Hex Grid & Time Economy (Complete / PR #3)"]
        P6 --> P7["Phase 7: Hex Spec"]
        P7 --> P8["Phase 8: Review"]
        P8 --> P9["Phase 9: Hex Engine"]
        P9 --> P10["Phase 10: Tests"]
        P10 --> P11["Phase 11: Hex Client"]
        P11 --> P12["Phase 12: Playtest"]
    end
    subgraph M3["Milestone 3: 24XX Rules & Resolution System (Active Front)"]
        P12 --> P13["Phase 13: 24XX Spec"]
        P13 --> P14["Phase 14: Review"]
        P14 --> P15["Phase 15: Rules Engine"]
        P15 --> P16["Phase 16: Verification"]
    end
```

---

## Task Board

### Phase 0: Scaffolding, Governance & Templates

- [x] **TASK-001 `[AUTO]`: Establish Agent Guidelines & Quota Guardrails**
  - *Target:* [`AGENTS.md`](file:///Users/efsa/Repos/emergent/AGENTS.md)
  - *Criteria:* EGM specification-first rules, British English enforcement, markdown blank line constraints, Gemini Flash + quota threshold guards, and narrative sovereignty.
  - *Status:* Completed

- [x] **TASK-002 `[AUTO]`: Create Living Task Framework**
  - *Target:* [`TASKS.md`](file:///Users/efsa/Repos/emergent/TASKS.md)
  - *Criteria:* Task board tracking phases, dependencies, autonomy tags (`[AUTO]`, `[SEMI]`, `[HUMAN]`), and quota monitoring.
  - *Status:* Completed

- [x] **TASK-003 `[AUTO]`: Scaffold EGM Design & Review Templates**
  - *Target:* [`docs/designs/TEMPLATE.md`](file:///Users/efsa/Repos/emergent/docs/designs/TEMPLATE.md) and [`docs/reviews/TEMPLATE.md`](file:///Users/efsa/Repos/emergent/docs/reviews/TEMPLATE.md)
  - *Criteria:* Standardised schemas for invariants, state machines, tick updates, and Goldfish review rubrics.
  - *Status:* Completed

- [x] **TASK-004 `[AUTO]`: Migrate & Retire Initial Scaffolding Exports**
  - *Target:* [`docs/concepts/concepts_brief.md`](file:///Users/efsa/Repos/emergent/docs/concepts/concepts_brief.md), [`PITCH.md`](file:///Users/efsa/Repos/emergent/PITCH.md), and [`README.md`](file:///Users/efsa/Repos/emergent/README.md)
  - *Criteria:* Fully migrate series context (`hostile`, `unsettled`, `charged`), 5-layer title etymology, and Mermaid architecture diagrams into living docs; cleanly remove `docs/conversation_export.md` and `docs/scaffolding_chat_context.md`.
  - *Status:* Completed

- [x] **TASK-005 `[AUTO]`: Author Collaborator-Player-Developer Pitch**
  - *Target:* [`PITCH.md`](file:///Users/efsa/Repos/emergent/PITCH.md)
  - *Criteria:* High-visibility manifesto framing the project for collaborator-player-developers, highlighting the EGM spec-driven method, deterministic simulation, lore sovereignty, and multi-faceted participation channels.
  - *Status:* Completed

- [x] **TASK-006 `[AUTO]`: Establish Principal Code Reviewer & PR Review Framework**
  - *Target:* [`.agents/agents/code-reviewer/agent.md`](file:///Users/efsa/Repos/emergent/.agents/agents/code-reviewer/agent.md), [`.agents/skills/review-pr/`](file:///Users/efsa/Repos/emergent/.agents/skills/review-pr), and [`docs/reviews/PR_REVIEW_TEMPLATE.md`](file:///Users/efsa/Repos/emergent/docs/reviews/PR_REVIEW_TEMPLATE.md)
  - *Criteria:* Define read-only `code-reviewer` agent persona ("The Gatekeeper"), 8-Pillar rubric reference, Conventional Comments standards, mandatory verification runner execution, and traceable provenance signatures.
  - *Status:* Completed

---

### Phase 1: Core Gameplay Loop Design (Elephant Phase)

- [x] **TASK-101 `[SEMI]`: Requirements Clarification Interview**
  - *Target:* Requirements alignment with human developer
  - *Criteria:* Determine simulation language/runtime (TypeScript selected), tick rate model (action-driven discrete tick), boundary rejection text, and lore sovereignty rule (no AI-invented lore; human authors all world lore).
  - *Status:* Completed

- [x] **TASK-102 `[SEMI]`: Draft Core Gameplay Loop Specification**
  - *Target:* [`docs/designs/001_core_game_loop.md`](file:///Users/efsa/Repos/emergent/docs/designs/001_core_game_loop.md)
  - *Criteria:* Strict no-code spec defining grid coordinate system, entity state schema, tick loop transitions, collision rules, and deterministic state outputs.
  - *Status:* Completed

---

### Phase 2: Goldfish Stress-Test & Spec Formalisation

- [x] **TASK-201 `[AUTO]`: Zero-Context Goldfish Review**
  - *Target:* [`docs/reviews/001_core_game_loop_review.md`](file:///Users/efsa/Repos/emergent/docs/reviews/001_core_game_loop_review.md)
  - *Criteria:* Independent critique probing state desynchronisation, edge-case collisions, scaling bottlenecks, and unstated assumptions. 8 failure modes identified and addressed.
  - *Status:* Completed

- [x] **TASK-202 `[HUMAN]`: Human Specification Sign-Off**
  - *Target:* Formal approval of [`docs/designs/001_core_game_loop.md`](file:///Users/efsa/Repos/emergent/docs/designs/001_core_game_loop.md)
  - *Criteria:* Developer confirmation that the specification contract is sound before any code is generated.
  - *Status:* Completed

---

### Phase 3: Headless Simulation Core (`engine/`)

- [x] **TASK-301 `[AUTO]`: Initialize Engine Project & Dependencies**
  - *Target:* [`engine/`](file:///Users/efsa/Repos/emergent/engine)
  - *Criteria:* `package.json`, `tsconfig.json`, Vitest configuration, and directory layout (`src/state/`, `src/systems/`, `src/data/`, `tests/`).
  - *Status:* Completed

- [x] **TASK-302 `[AUTO]`: Implement Pure Reducer State Machine & Tick Systems**
  - *Target:* `engine/src/state/` and `engine/src/index.ts`
  - *Criteria:* Pure function `step(state, action): SimulationResult` adhering strictly to contract in `docs/designs/001_core_game_loop.md`.
  - *Status:* Completed

- [ ] **TASK-303 `[HUMAN]`: Author Initial World Fixture Data (Lore)**
  - *Target:* [[docs/lore/open_questions.md]] and `engine/src/data/defaultWorld.ts`
  - *Criteria:* Human authors world details asynchronously in [[docs/lore/open_questions.md]]. Engine uses neutral placeholders to proceed without blocking.
  - *Status:* Asynchronous / Unblocking (Neutral placeholders in place)

- [x] **TASK-304 `[AUTO]`: Deterministic Unit Test Suite**
  - *Target:* [`engine/tests/`](file:///Users/efsa/Repos/emergent/engine/tests)
  - *Criteria:* 100% test pass on validation, cardinal movement, wall blocking, boundary clamping ("You reached the end of the world, come back later"), LIFO stacking, integer weight limits, immutability, and 200-tick conservation fuzzing. 24/24 tests passing.
  - *Status:* Completed

---

### Phase 4: Continuous Verification & Perception Harness (`scripts/`)

- [x] **TASK-401 `[AUTO]`: Implement EGM Automation Harness**
  - *Target:* [`scripts/run_egm_cycle.sh`](file:///Users/efsa/Repos/emergent/scripts/run_egm_cycle.sh)
  - *Criteria:* Automation script to inspect EGM status and validate schema consistency across design specs and review reports.
  - *Status:* Completed

- [x] **TASK-402 `[AUTO]`: Implement Continuous Verification Harness**
  - *Target:* [`scripts/verify_implementation.sh`](file:///Users/efsa/Repos/emergent/scripts/verify_implementation.sh)
  - *Criteria:* One-command runner executing markdown cleanliness, engine TypeScript compilation, and headless Vitest unit tests.
  - *Status:* Completed

---

### Phase 5: Browser Presentation Layer (`client/`)

- [x] **TASK-501 `[AUTO]`: Scaffold Presentation Client**
  - *Target:* [`client/`](file:///Users/efsa/Repos/emergent/client)
  - *Criteria:* Lightweight 2D Canvas setup rendering state updates emitted by the engine.
  - *Status:* Completed

- [x] **TASK-502 `[AUTO]`: Connect Local Stream Synchronisation & Controls**
  - *Target:* [`client/src/net/localSimulationStream.ts`](file:///Users/efsa/Repos/emergent/client/src/net/localSimulationStream.ts) and [`client/src/main.ts`](file:///Users/efsa/Repos/emergent/client/src/main.ts)
  - *Criteria:* Client consumes simulation ticks, dispatches actions via keyboard and HUD, and renders updates reactively.
  - *Status:* Completed

- [x] **TASK-503 `[AUTO]`: Playwright Headless Perception Suite**
  - *Target:* [`client/tests/e2e/gameplay.spec.ts`](file:///Users/efsa/Repos/emergent/client/tests/e2e/gameplay.spec.ts)
  - *Criteria:* Automated headless browser assertions verifying canvas render, boundary rejection chronicle logs, and relic pickup. 3/3 tests passing.
  - *Status:* Completed

---

### Phase 6: Human Playability Sign-off

- [x] **TASK-601 `[HUMAN]`: Developer Playtest & Qualitative Feel Review**
  - *Target:* [[docs/playtests/001_milestone_1_playtest.md]]
  - *Criteria:* Human evaluation of pacing, responsiveness, atmosphere, and game feel before iterating to the next milestone.
  - *Status:* Completed (Directives: Hexagonal grid, 1/3-day travel shifts, hidden discoveries & search system).

---

### Phase 7: Milestone 2 Hex Grid & Time Economy Specification (Elephant Phase)

- [x] **TASK-701 `[AUTO]`: Draft Hex Grid, Time Economy & Discovery Specification**
  - *Target:* `docs/designs/002_hex_grid_and_time_economy.md`
  - *Criteria:* Strict no-code EGM spec defining axial coordinate math `(q, r)`, 6 hex adjacencies, diurnal time economy (3 watches/day: morning/afternoon/night), discovery visibility states (`hidden`/`revealed`), and the `SEARCH` action contract.
  - *Status:* Completed

---

### Phase 8: Goldfish Stress-Test & Spec Formalisation

- [x] **TASK-801 `[AUTO]`: Zero-Context Goldfish Review**
  - *Target:* `docs/reviews/002_hex_grid_and_time_economy_review.md`
  - *Criteria:* Independent adversarial review probing coordinate discontinuity, time desynchronisation, search spam vulnerabilities, and boundary invariants.
  - *Status:* Completed (Approved with coordinate keying hardening)

- [x] **TASK-802 `[HUMAN]`: Human Developer Design Approval Gate**
  - *Target:* `docs/designs/002_hex_grid_and_time_economy.md`
  - *Criteria:* Review and formal approval of the Milestone 2 design contract by the human developer.
  - *Status:* Completed (Approved by developer with location canvas directive)

---

### Phase 9: Headless Hexagonal Simulation Core

- [x] **TASK-901 `[AUTO]`: Hexagonal Math & Adjacency Primitives**
  - *Target:* `engine/src/hex/math.ts` and `engine/src/hex/types.ts`
  - *Criteria:* Axial coordinate types, distance algorithms, neighbour offsets (`NE`, `E`, `SE`, `SW`, `W`, `NW`), and hex matrix validation.
  - *Status:* Completed

- [x] **TASK-902 `[AUTO]`: Diurnal Time Economy & Shift Reducer**
  - *Target:* `engine/src/hex/clock.ts` and `engine/src/hex/step.ts`
  - *Criteria:* Update pure reducer to advance 1 watch per hex traverse/search/rest, roll over watches to days, and emit diurnal cycle events.
  - *Status:* Completed

- [x] **TASK-903 `[AUTO]`: Hidden Discoveries & Search Mechanics**
  - *Target:* `engine/src/hex/defaultHexWorld.ts` and `engine/src/hex/step.ts`
  - *Criteria:* Implement `SEARCH` action revealing hidden discoveries on current hex; enforce that unrevealed relics cannot be collected via `PICKUP`.
  - *Status:* Completed

---

### Phase 10: Automated Verification Suite

- [x] **TASK-1001 `[AUTO]`: Deterministic Hex Simulation & Conservation Unit Tests**
  - *Target:* `engine/tests/`
  - *Criteria:* Vitest test suite asserting axial distance, boundary clamping, diurnal clock transitions, search discovery lifecycle, and multi-watch conservation fuzzing (39 passing unit tests).
  - *Status:* Completed

---

### Phase 11: Browser Hexagonal Presentation Client

- [x] **TASK-1101 `[AUTO]`: Hexagonal Canvas Renderer**
  - *Target:* `client/src/render/canvasRenderer.ts`
  - *Criteria:* Regular pointy-topped hex polygon rendering, terrain colouring, coordinate overlays, and wanderer positioning.
  - *Status:* Completed

- [x] **TASK-1102 `[AUTO]`: Diurnal HUD & Search Controls**
  - *Target:* `client/src/ui/hud.ts`, `client/src/main.ts`, and `client/index.html`
  - *Criteria:* HUD displaying current day, watch phase (Morning/Afternoon/Night), search button/keybinding, and revealed salvage picker.
  - *Status:* Completed

- [x] **TASK-1103 `[AUTO]`: Playwright Perception Suite for Hex & Time**
  - *Target:* `client/tests/e2e/gameplay.spec.ts`
  - *Criteria:* End-to-end browser perception tests asserting hex navigation, watch advancement, and searching hidden salvage (4 passing e2e tests).
  - *Status:* Completed

---

### Phase 12: Human Playability Sign-off (Milestone 2)

- [ ] **TASK-1201 `[HUMAN]`: Developer Playtest & Pacing Evaluation**
  - *Target:* `docs/playtests/002_milestone_2_playtest.md`
  - *Criteria:* Human evaluation of hex travel pacing, search discovery excitement, day/night atmospheric rhythm, and Milestone 3 (24XX ruleset) priorities.
  - *Status:* Active (Canvas prepared)

---

### Phase 13: Milestone 3 24XX Rules & Resolution System Specification (Elephant Phase)

- [x] **TASK-1301 `[AUTO]`: Draft 24XX Rules & Resolution Specification**
  - *Target:* `docs/designs/003_rules_system_24xx.md`
  - *Criteria:* Strict no-code EGM specification defining polyhedral step dice (`d4`–`d12`), 24XX ternary outcomes, wanderer background archetypes, condition track, gear sacrifice, passive relic mitigation, and explicit `RiskPrompt` dispatch.
  - *Status:* Completed (Elephant draft authored)

- [x] **TASK-1302 `[HUMAN]`: Human Developer Design Approval Gate**
  - *Target:* `docs/designs/003_rules_system_24xx.md`
  - *Criteria:* Review and formal sign-off on the 24XX rules architecture by the human developer.
  - *Status:* Completed (Approved by developer)

---

### Phase 14: Goldfish Stress-Test & Spec Formalisation

- [x] **TASK-1401 `[AUTO]`: Zero-Context Goldfish Review**
  - *Target:* `docs/reviews/003_rules_system_24xx_review.md`
  - *Criteria:* Independent adversarial review probing risk prompt deadlocks, gear sacrifice exploits, PRNG seed drift, and condition recovery loopholes.
  - *Status:* Completed (8 critical revisions incorporated and validated)

---

### Phase 15: Headless 24XX Rules Engine Implementation

- [x] **TASK-1501 `[AUTO]`: Seeded PRNG & Polyhedral Dice Module**
  - *Target:* `engine/src/rules/dice.ts` and `engine/src/rules/types.ts`
  - *Criteria:* Pure Mulberry32 PRNG state progression and uniform polyhedral dice generation.
  - *Status:* Completed

- [x] **TASK-1502 `[AUTO]`: Condition Track & Gear Sacrifice Reducer**
  - *Target:* `engine/src/rules/` and `engine/src/hex/step.ts`
  - *Criteria:* Integrate `RiskPrompt` interception, `RESOLVE_RISK`, `ABORT_RISK`, condition decay, and gear sacrifice into simulation reducer.
  - *Status:* Completed

---

### Phase 16: Playwright & Perception Verification

- [x] **TASK-1601 `[AUTO]`: 24XX Deterministic Fuzzing & Perception Tests**
  - *Target:* `engine/tests/` and `client/tests/e2e/gameplay.spec.ts`
  - *Criteria:* 100% automated test coverage across PRNG determinism, condition progression, risk modal interaction, and gear sacrifice (49 engine tests, 5 client e2e tests).
  - *Status:* Completed

---

### Phase 17: Human Playability Sign-off (Milestone 3)

- [ ] **TASK-1701 `[HUMAN]`: Developer Playtest & 24XX Rules Evaluation**
  - *Target:* `docs/playtests/003_milestone_3_playtest.md`
  - *Criteria:* Human evaluation of 24XX ternary resolution pacing, risk modal prompt agency, condition ladder, and Milestone 4 priorities.
  - *Status:* Active (Canvas prepared)
