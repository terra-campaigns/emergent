# Agent Guidelines & Engineering Standards

This document defines the rules, conventions, and engineering constraints for any AI coding agent operating within the `emergent` repository.

---

## 1. Specification-Driven Development (Google EGM)

All feature development strictly adheres to the **Elephant-Goldfish Model (EGM)**, orchestrated via the global [`spec-egm`](https://github.com/efsalvarenga/artifice/tree/main/skills/spec-egm) skill from `artifice`:

* **Design Precedes Code:** Agents must never begin writing code for a feature without an approved technical specification located in `docs/designs/`.
* **The Elephant Phase:** When brainstorming or drafting, agents operate under a strict **no-code** rule. The objective is to define state invariants, interfaces, data schemas, and edge cases.
* **The Goldfish Review:** Before implementation, design documents must be reviewed with zero prior conversation context to probe for assumptions, security holes, and scaling bottlenecks.
* **Drift Control & Validation:** Run `python3 ~/Repos/artifice/scripts/validate_egm.py .` (or `./scripts/run_egm_cycle.sh validate`) to confirm that all active specifications have matching approved reviews before implementation begins.

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
* **Automated Verification:** Every new mechanic, tick update, or state transition must be accompanied by unit tests. Do not declare a feature complete without running automated test suites (`./scripts/verify_implementation.sh`).

---

## 6. Resource & Quota Guardrails

* All autonomous execution, pre-flight disk reconnaissance, and quota circuit-breakers are governed by the global rules in `~/.gemini/config/AGENTS.md` (`## Autonomous Execution, Pre-Flight Recon & Quota Guardrails`).
* **Default Model:** Autonomous workers and subagents default to `flash` unless overridden by the human developer.
* Autonomous execution pauses immediately if rolling 5-hour quota falls below 20% or weekly quota falls below 30%.

---

## 7. Narrative Sovereignty & Lore Authorship

* **No AI Lore Invention:** AI agents must never autonomously invent major world lore, factions, historical cataclysms, cosmologies, or narrative premises.
* **Human-Driven Lore:** All significant worldbuilding, narrative arcs, and atmospheric framing must originate from the human developer via explicit design answers or open questions.
* **Procedural Flavour Guardrails:** Ambient procedural generation (e.g. random relic names or terrain flavour) may only be introduced if explicitly specified and approved in a formal EGM design document.

---

## 8. Asynchronous Deferral & The Human Input Registry

When an implementation requires human decisions, narrative lore, or qualitative evaluation:
* **Never Block Autonomous Flow:** Do not halt technical progress waiting for human creative input. Inject neutral technical placeholders (e.g. `"Traveller"`, `"Relic Alpha"`) and proceed with headless logic and automated tests.
* **Dedicated Input Canvases & Decision Ledgers:** All open human questions must be written into dedicated living documents following the `coordinate-fronts` Decision Ledger standard from `artifice` (e.g. `docs/lore/open_questions.md`, `docs/playtests/*.md`).
* **Centralised Registry in `TASKS.md`:** Maintain a `## Human Input Registry` table at the very top of `TASKS.md`, listing every active document requiring human input, its task ID, and its status.

---

## 9. Task Board Autonomy Classification (Guido Framework)

All items added to task boards (`TASKS.md`) follow the global Guido autonomy classification defined in `~/.gemini/config/AGENTS.md`:
* **`[AUTO]` (Autonomous):** Executed entirely by the AI agent without requiring interactive human pauses.
* **`[SEMI]` (Semi-Autonomous):** Drafted or staged by the AI agent, requiring developer review or boundary confirmation.
* **`[HUMAN]` (Human-Driven):** Exclusively reserved for human authority (e.g. narrative lore authorship, qualitative playability evaluation, architectural contract approvals, and git commit authorisations).

---

## 10. Pull Request Code Review Framework & Reviewer Persona

Every Pull Request targeting `main` must be reviewed by the **Principal Code Reviewer ("The Gatekeeper")** agent using the global [`review-pr`](https://github.com/efsalvarenga/artifice/tree/main/skills/review-pr) skill from `artifice`:
* Reviews are conducted under the 8-Pillar Code Review Framework (Google Engineering Practices + EGM Governance).
* Supports Dual-Model Consensus (`Gemini` + local `qwen2.5:14b` + local `mistral-nemo:12b`) and 100% on-device offline mode via `--local`.
* Formal PR review reports are saved to `docs/reviews/pr_<PR_NUMBER>_<slug>_review.md` and signed with the official provenance footer.

---

## 11. Developer Coach Persona & Framework Scouting

Architectural improvements, framework upgrades, developer ergonomics, and ecosystem scouting are championed by the **Principal Developer Coach ("The Catalyst")** agent using the global [`coach-frameworks`](https://github.com/efsalvarenga/artifice/tree/main/skills/coach-frameworks) skill from `artifice`:
* Audits interactions with established frameworks and automates ergonomic guardrails.
* Scouts sibling repositories in `~/Repos/*` and the web for architectural upgrades, triaged via the 4-Test Lesson Acceptance Gate.
