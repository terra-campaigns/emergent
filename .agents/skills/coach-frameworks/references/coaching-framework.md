# The Developer Coaching & Framework Scouting Reference

This reference details the operational methodologies, reconnaissance rubrics, and evaluation standards utilized by the **Principal Developer Coach ("The Catalyst")** (`developer-coach`) within `emergent` and its sibling ecosystem.

---

## 1. Core Coaching Rubrics & Evaluation Dimensions

When auditing existing frameworks or evaluating proposed alternatives, the coach assesses six fundamental dimensions:

### Dimension 1: Velocity & Cognitive Overhead (`VELOCITY`)

* **Assessment:** Does the framework enable fast iteration, or does it demand excessive cognitive overhead and ceremony for trivial additions?
* **Scouting Indicators:** How many files must be touched to add a single action, event, or component? Is there boilerplate that can be derived or automated?

### Dimension 2: Determinism & Pure State Isolation (`DETERMINISM`)

* **Assessment:** Does the framework safeguard headless simulation purity? Does it enforce single-direction data flow, immutable transitions, and integer/fixed-point determinism?
* **Scouting Indicators:** Are reducers truly pure functions? Are engine models strictly isolated from browser/DOM APIs?

### Dimension 3: Type Safety & Compiler Assistance (`TYPES`)

* **Assessment:** Does the framework harness TypeScript `--strict` to make invalid states unrepresentable?
* **Scouting Indicators:** Use of discriminated unions, readonly data structures, exhaustive pattern matching, and runtime schema validators (e.g. Zod, ArkType, TypeBox).

### Dimension 4: Verification Rigour & Test Ergonomics (`TESTABILITY`)

* **Assessment:** How straightforward is it to write and maintain tests? Can complex simulation ticks and state transitions be asserted in under ten lines of code?
* **Scouting Indicators:** Clean test fixtures, generative fuzzing support, fast execution under Vitest, and visual perception confidence under Playwright.

### Dimension 5: Ecosystem Harmony & Portability (`PORTABILITY`)

* **Assessment:** Can utilities, scripts, and architectural concepts be shared cleanly across sibling repositories in `/Users/efsa/Repos/*` without tight coupling?
* **Scouting Indicators:** Consistent configuration conventions, shared script standards, and interoperable data schemas.

### Dimension 6: Governance Ergonomics (`GOVERNANCE`)

* **Assessment:** Does the framework make adherence to repository governance (Elephant-Goldfish Model, British English, Markdown cleanliness, Conventional Commits) natural and automatic rather than punitive?
* **Scouting Indicators:** Self-healing scripts, pre-commit checks, clear error messages, and well-structured document templates.

---

## 2. Reconnaissance Guide: Sibling Ecosystem Scouting

The coach has direct access to inspect adjacent repositories in `/Users/efsa/Repos/`. When scouting for patterns, follow these repo-specific intelligence maps:

### 1. `arete` & `arete-engine`

* **Focus Areas:** Deep functional domain modelling, strict typing, knowledge organisation, CLI automation, and continuous verification.
* **Inspect:**
  * `.agents/` and `agents/` for specialized agent prompt structures and skills.
  * Automation scripts in `scripts/` or `_data/` for data validation and transformation pipelines.
  * Task boards and contribution guidelines for team-level workflow mechanics.

### 2. `charged` & `hostile`

* **Focus Areas:** Game design systems, procedural generation, spatial topologies, combat reducers, and agent hooks.
* **Inspect:**
  * `.githooks/` for pre-commit verification and git hygiene enforcement.
  * `.agents/context/` and `.agents/scripts/` for runtime context injection into agent prompts.
  * State management patterns for game loops, entities, and inventories.

### 3. `oude-mechanismen`

* **Focus Areas:** Mechanical systems, physical simulation, deterministic clockwork state machines, and release versioning.
* **Inspect:**
  * State transition mechanics, clockwork tick synchronisation, and state snapshots.
  * Versioning conventions and automated release checklists.

### 4. `forge`

* **Focus Areas:** Scaffolding, repository templating, operational runbooks (`OPERATIONS.md`), and agent bootstrapping.
* **Inspect:**
  * Template generation scripts and baseline configurations for new agent tools.

---

## 3. Reconnaissance Guide: External Industry & Web Scouting

When scouting external open-source ecosystems via `search_web`, prioritize authoritative, modern sources:

* **TypeScript & Functional Architecture:**
  * Official TypeScript handbook & releases (TypeScript 5.x+ feature adoption).
  * Functional design patterns: immutable data structures, lens/optics paradigms, algebraic data types.
* **Deterministic Simulation & ECS:**
  * Headless simulation paradigms, tick-based network engines, rewindable state stores.
  * Hexagonal grid algorithms (Red Blob Games standards), spatial partitioning structures.
* **Tooling & Build Performance:**
  * Vite, Vitest, Rollup, esbuild, and Playwright ecosystem developments.
  * Fast snapshot testing, automated linting rules, and AST-based codemods.

---

## 4. Coaching Engagement Delivery & Lifecycle

Coaching outputs must be delivered with clear execution pathways:

1. **Lightweight Coaching (In-Turn Advice):** Delivered directly in the conversation when a developer or agent asks how to optimize an immediate snippet, configure a tool, or resolve a small friction point.
2. **Ergonomic Automation (Scripts & Tooling):** Implemented directly as non-breaking scripts or tooling enhancements (e.g. `./scripts/...`), accompanied by a concise usage demonstration.
3. **Formal Framework RFC (Coaching Proposal):** For architectural changes or new libraries, drafted as a structured proposal in `docs/coaching/` and tracked in `TASKS.md` for human review.
