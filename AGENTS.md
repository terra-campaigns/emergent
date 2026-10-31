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

## 2. Git Operations Constraint

* **NEVER** run `git commit` or autonomously commit changes on the user's behalf.
* Always leave modified, new, or deleted files in the working directory (unstaged or staged) for the human developer to review, verify, and commit.

---

## 3. Language & Localization

* **British English:** All code comments, docstrings, technical documentation, commit messages, and in-game text must be written in British English (e.g. *behaviour*, *synchronise*, *colour*, *prioritise*).
* **LLM Prompts:** Whenever an agent prompts an external LLM API to generate in-game text or dialogue, it must explicitly instruct the model to return its output in British English.

---

## 4. Markdown Formatting Cleanliness

* When creating or modifying Markdown (`.md`) files, you must **always leave an empty, blank line immediately following any Markdown heading** (`#`, `##`, `###`, `####`). Text must never be placed directly beneath a heading.

---

## 5. Architectural Boundaries

* **Decoupled Simulation:** Keep the simulation engine (`engine/`) strictly headless and decoupled from the presentation client (`client/`). The simulation state must be fully testable without a browser or graphical context.
* **Automated Verification:** Every new mechanic, tick update, or state transition must be accompanied by unit tests. Do not declare a feature complete without running automated test suites.
