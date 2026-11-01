# Agent Guidelines & Engineering Standards

This document defines the rules, conventions, and engineering constraints for any AI coding agent operating within the `emergent` repository.

---

## 1. Specification-Driven Development (Google EGM)

All feature development must strictly follow the **Elephant-Goldfish Model (EGM)**:

* **Design Precedes Code:** Agents must never begin writing code for a feature without an approved technical specification located in `docs/designs/`.
* **The Elephant Phase:** When brainstorming or drafting, agents operate under a strict **no-code** rule. The objective is to define state invariants, interfaces, data schemas, and edge cases.
* **The Goldfish Review:** Before implementation, design documents must be reviewed with zero prior conversation context to probe for assumptions, security holes, and scaling bottlenecks.
* **Drift Control:** Code implementations must adhere strictly to approved design contracts. If requirements change during implementation, the specification document must be revised and re-approved first.

---

## 2. Git Operations, Branch Isolation & PR Gates (Model 3)

* **Branch Isolation (`agent/*`):** All autonomous feature development, specification work, and implementation commits must occur on dedicated agent branches (e.g. `agent/milestone-1-core-loop` or `agent/<feature>`). Agents must never commit directly to local `main` once remote protection is established.
* **Autonomous Push Boundary:** Autonomous agents are authorised to run `git push` **only** to upstream agent branches (`origin/agent/*`). Pushing directly to `origin/main` is strictly prohibited.
* **Atomic Checkpoint Commits:** Within `agent/*` branches, agents are authorised to commit atomic gates:
  1. **Specification Approval Gates:** Committing approved design documents and review reports upon human sign-off.
  2. **Automated Verification Gates:** Committing clean, passing state implementations after 100% of automated unit tests pass.
  3. **Milestone Completions:** Committing major task board updates (`TASKS.md`) when a roadmap phase completes.
* **Human Pull Request Approval Gate:** Changes to `main` strictly require a GitHub Pull Request with at least one human approval. The agent prepares the PR and awaits human review and merge.
* **Automated Branch Deletion on Merge:** The repository enforces automated head branch deletion upon PR merge (`delete_branch_on_merge: true`). Merged feature and agent branches (`agent/*`) are automatically deleted on GitHub once closed and merged, with local tracking branches pruned accordingly.
* **Co-Authorship Standards:** The repository owner (`Estevao Alvarenga`) is the primary author of all work. All autonomous commits must credit the AI model as co-author using the standard Git trailer:
  ```text
  Co-authored-by: Gemini 3.8 Flash <gemini-flash@google.com>
  ```
* **Prohibition on Speculative Commits:** The agent must never commit or push intermediate, broken, failing, or unreviewed work-in-progress code.
* **Conventional Commits:** All commit messages and PR titles must follow Conventional Commits in British English.

---

## 3. Language & Localisation

* **British English:** All code comments, docstrings, technical documentation, commit messages, and in-game text must be written in British English (e.g. *behaviour*, *synchronise*, *colour*, *prioritise*).
* **LLM Prompts:** Whenever an agent prompts an external LLM API to generate in-game text or dialogue, it must explicitly instruct the model to return its output in British English.

---

## 4. Markdown Formatting Cleanliness

* When creating or modifying Markdown (`.md`) files, you must **always leave an empty, blank line immediately following any Markdown heading** (`#`, `##`, `###`, `####`). Text must never be placed directly beneath a heading.

---

## 5. Architectural Boundaries

* **Decoupled Simulation:** Keep the simulation engine (`engine/`) strictly headless and decoupled from the presentation client (`client/`). The simulation state must be fully testable without a browser or graphical context.
* **Automated Verification:** Every new mechanic, tick update, or state transition must be accompanied by unit tests. Do not declare a feature complete without running automated test suites.

---

## 6. Resource & Quota Guardrails

* **Default Model:** All autonomous agents, subagent invocations, and LLM completions must operate using Gemini Flash unless explicitly overridden by the human developer.
* **Quota Safeguards:** Autonomous work must cease immediately if the 5-hour rolling limit drops below 20%, or if the weekly limit drops below 30%. When triggered, the agent must pause, summarise the current state in `TASKS.md`, and await human instructions before proceeding.

---

## 7. Narrative Sovereignty & Lore Authorship

* **No AI Lore Invention:** AI agents must never autonomously invent major world lore, factions, historical cataclysms, cosmologies, or narrative premises.
* **Human-Driven Lore:** All significant worldbuilding, narrative arcs, and atmospheric framing must originate from the human developer via explicit design answers or open questions.
* **Procedural Flavour Guardrails:** Ambient procedural generation (e.g. random relic names or terrain flavour) may only be introduced if explicitly specified and approved in a formal EGM design document.

---

## 8. Asynchronous Deferral & The Human Input Registry

When an implementation requires human decisions, narrative lore, or qualitative evaluation:
* **Never Block Autonomous Flow:** The agent must not halt technical progress waiting for human creative input. It must inject neutral technical placeholders (e.g. `"Traveller"`, `"Relic Alpha"`) and proceed with headless logic and automated tests.
* **Dedicated Input Canvases:** All open human questions must be written into dedicated living documents (e.g. `docs/lore/open_questions.md`, `docs/playtests/*.md`).
* **Centralised Registry in `TASKS.md`:** The agent must maintain a `## Human Input Registry` table at the very top of `TASKS.md`, listing every active document requiring human input, its task ID, and its status.

---

## 9. Task Board Autonomy Classification (Guido Framework)

All items added to task boards (`TASKS.md`) must be tagged with one of three execution modes:
* **`[AUTO]` (Autonomous):** Executed entirely by the AI agent without requiring interactive human pauses (e.g. scaffolding manifests, writing pure reducers, running unit test suites).
* **`[SEMI]` (Semi-Autonomous):** Drafted or staged by the AI agent, but requiring developer review, parameter confirmation, or boundary validation before proceeding.
* **`[HUMAN]` (Human-Driven):** Exclusively reserved for human authority (e.g. narrative lore authorship, qualitative playability evaluation, architectural contract approvals, and git commit authorisations).

---

## 10. Pull Request Code Review Framework & Reviewer Persona

Every Pull Request targeting `main` must be reviewed by the **Principal Code Reviewer ("The Gatekeeper")** agent using the global [`review-pr`](https://github.com/efsalvarenga/artifice/tree/main/skills/review-pr) skill from `artifice`:

* **The 8-Pillar Code Review Framework (Google Engineering Practices + EGM Governance):**
  1. **`DESIGN` (Design & EGM Contract Alignment):** Verifies that every feature has an approved specification in `docs/designs/`, a passing Goldfish review in `docs/reviews/`, zero specification drift, and strict decoupling between `engine/` and `client/`.
  2. **`FUNCTIONALITY` (Functionality, Purity & Determinism):** Verifies pure reducer transitions, strict immutability of input state, platform-independent determinism, and boundary/collision edge-case handling.
  3. **`COMPLEXITY` (Complexity & Maintainability):** Rejects over-engineering, dead code, and convoluted control flow in favour of simple, composable functions.
  4. **`TESTS` (Automated Tests & Verification):** Requires passing unit tests (`engine/tests/`), conservation fuzzing, Playwright perception tests (`client/tests/e2e/`), and zero errors from `./scripts/run_egm_cycle.sh validate` and `./scripts/verify_implementation.sh`.
  5. **`NAMING` (Naming & Domain Clarity):** Enforces ubiquitous domain terminology matching `docs/designs/`.
  6. **`COMMENTS_DOCS` (Comments, `TASKS.md` & Markdown Hygiene):** Verifies *why*-focused comments, accurate synchronisation of `TASKS.md` and the `Human Input Registry`, and strict compliance with the Markdown blank-line-after-heading constraint.
  7. **`STYLE_TYPES` (Style, Type Safety & Git Hygiene):** Enforces TypeScript `--strict` (`readonly` state schemas, discriminated unions, zero `any`), `agent/*` branch isolation, and Conventional Commits with co-authorship trailers.
  8. **`LORE_LOCALISATION` (Narrative Sovereignty & British English):** Enforces 100% British English across all text and prompts, and blocks any unauthorised AI-invented world lore.
* **Conventional Comments Taxonomy:** All findings must be formatted as `<label> (<severity>, <pillar>): [file:line](file:///...) — <Subject>` using labels `issue`, `suggestion`, `question`, `nitpick`, `thought`, or `praise` and severity decorations `blocking` or `non-blocking`.
* **Review Artefacts & Provenance Signature:** Formal PR review reports follow [`docs/reviews/PR_REVIEW_TEMPLATE.md`](docs/reviews/PR_REVIEW_TEMPLATE.md) and are saved as `docs/reviews/pr_<PR_NUMBER>_<slug>_review.md`. Every review report and GitHub PR comment must be signed at the bottom with the human-readable **Model Name** and **Skill Version** (`review-pr v1.0.0`):
  ```markdown
  *Signed by: **Principal Code Reviewer ("The Gatekeeper")** (`code-reviewer`) · Model: **`<Model Name>`** · Skill: **`review-pr v1.1.0`** · Date: `<YYYY-MM-DD>`*
  ```
