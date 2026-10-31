# The `emergent` 8-Pillar Code Review Framework

This reference defines the formal evaluation rubric used by the **Principal Code Reviewer ("The Gatekeeper")** on every Pull Request in `emergent`. It synthesises **Google's Engineering Practices Code Review Standard**, **Conventional Comments**, and **`emergent` Elephant-Goldfish Model (EGM) Governance**.

---

## 1. The 8 Evaluation Pillars

### Pillar 1: Design & EGM Contract Alignment (`DESIGN`)

* **What to Check:**
  * Does the PR implement a feature that has an approved specification in `docs/designs/` and a completed Goldfish review in `docs/reviews/`?
  * Do all data structures, action payloads, and tick phases match the specification without undocumented drift?
  * Is the headless boundary strictly preserved (`engine/` imports zero browser, DOM, Canvas, or `client/` modules)?
* **Blocking Triggers:**
  * Code introduced for a mechanic without an approved EGM design specification.
  * Direct coupling between `engine/` and browser/DOM APIs.

### Pillar 2: Functionality & Determinism (`FUNCTIONALITY`)

* **What to Check:**
  * Are state transitions implemented as pure functions (`step(state, action): SimulationResult`)?
  * Is input state treated as strictly immutable (no in-place mutation of coordinates, arrays, or entity maps)?
  * Are all calculations deterministic across platforms (integer arithmetic where specified, no `Math.random()`, no `Date.now()` inside simulation logic)?
  * Are boundary conditions (grid edges, impassable terrain, capacity limits, empty stacks) properly guarded?
* **Blocking Triggers:**
  * Any state mutation of caller-owned arguments.
  * Any source of non-determinism inside `engine/`.

### Pillar 3: Complexity & Maintainability (`COMPLEXITY`)

* **What to Check:**
  * Are functions small, cohesive, and single-purpose?
  * Is control flow flat and readable (early returns, exhaustive switch statements)?
  * Is the PR free of dead code, unused exports, or speculative abstractions not required by the current milestone?
* **Blocking Triggers:**
  * Unnecessary architectural complexity or dead/unreachable code paths.

### Pillar 4: Automated Tests & Verification (`TESTS`)

* **What to Check:**
  * Are unit tests (`engine/tests/`) provided for every new reducer branch, invariant, and rejection path?
  * Are Playwright perception tests (`client/tests/e2e/`) provided for user-facing HUD or canvas changes?
  * Do tests verify conservation laws (e.g. total relic count across world + inventory remains constant across random walks)?
  * Do `./scripts/run_egm_cycle.sh validate` and `./scripts/verify_implementation.sh` pass with 0 errors?
* **Blocking Triggers:**
  * Any failing test or verification gate.
  * New simulation mechanics added without corresponding unit tests.

### Pillar 5: Naming & Domain Clarity (`NAMING`)

* **What to Check:**
  * Do identifiers match the domain vocabulary defined in `docs/designs/` (e.g. `WorldState`, `EntitiesState`, `ChronicleEntry`, `SimulationResult`)?
  * Are boolean variables and predicates prefixed clearly (`isPassable`, `canCarry`, `hasRelic`)?
* **Blocking Triggers:**
  * Misleading identifiers that contradict the domain specification.

### Pillar 6: Comments & Documentation (`COMMENTS_DOCS`)

* **What to Check:**
  * Do comments explain *why* an invariant or constraint exists rather than restating *what* the code does?
  * Are `TASKS.md` and the `Human Input Registry` updated to reflect current milestone progress and any deferred human questions?
  * Does every Markdown heading (`#`, `##`, `###`, `####`) across the repository have an empty blank line immediately beneath it?
* **Blocking Triggers:**
  * Any Markdown heading cleanliness violation caught by Gate 1 of `./scripts/verify_implementation.sh`.

### Pillar 7: Style, Type Safety & Git Hygiene (`STYLE_TYPES`)

* **What to Check:**
  * Does TypeScript compile cleanly under `--strict` with zero `any` types or unsafe casts?
  * Are state interfaces marked `readonly`?
  * Does the PR originate from an isolated `agent/*` branch rather than committing directly to `main`?
  * Do commits follow Conventional Commits in British English with the `Co-authored-by` trailer?
* **Blocking Triggers:**
  * TypeScript compilation errors, unapproved `any` usage, or direct commits to `main`.

### Pillar 8: Narrative Sovereignty & Localisation (`LORE_LOCALISATION`)

* **What to Check:**
  * Is 100% of documentation, comments, commit messages, and in-game text written in **British English** (e.g. *behaviour*, *synchronise*, *colour*, *prioritise*, *traveller*)?
  * If any external LLM API prompt is present, does it explicitly instruct the model to respond in British English?
  * Has the PR strictly respected human narrative sovereignty (using neutral technical placeholders or human-authored lore from `docs/lore/open_questions.md`, with zero AI-invented factions, cataclysms, or cosmologies)?
* **Blocking Triggers:**
  * Unauthorised AI-invented world lore injected into code or documentation.
  * Uncorrected American English spelling in user-facing text or technical documentation.

---

## 2. Conventional Comments Specification

Every finding in a review must follow the structured **Conventional Comments** pattern:

```text
<label> (<severity>, <pillar>): [file:line](file:///path#Lline) — <Subject>
```

| Label | Intent | Typical Severity |
| :--- | :--- | :--- |
| `issue` | Highlights a functional defect, invariant breach, specification drift, or rule violation. | `blocking` |
| `suggestion` | Proposes a concrete refactoring, clearer type signature, or test case improvement. | `blocking` or `non-blocking` |
| `question` | Requests clarification from the author or human developer on an ambiguous choice. | `non-blocking` |
| `nitpick` | Points out a minor spelling (e.g. American vs British English), naming, or formatting detail. | `non-blocking` (or `blocking` if violating `AGENTS.md`) |
| `thought` | Shares a forward-looking architectural reflection for future milestones. | `non-blocking` |
| `praise` | Highlights particularly clean, idiomatic, well-tested, or disciplined engineering. | `non-blocking` |

---

## 3. Verdict Criteria

* **`APPROVE`:** All 8 pillars pass (`Pass` or `Pass with non-blocking notes`), zero `blocking` issues exist, and both `./scripts/run_egm_cycle.sh validate` and `./scripts/verify_implementation.sh` exit with code `0`.
* **`REQUEST_CHANGES`:** One or more `blocking` issues exist across any pillar, or any automated verification gate fails.
* **`COMMENT`:** Architectural feedback or mid-flight review on a draft PR without issuing a final sign-off verdict.
