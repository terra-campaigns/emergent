# Pull Request Code Review: PR #[PR_NUMBER] — [PR Title]

**Pull Request:** `#[PR_NUMBER]` (`[source_branch]` → `main`)  
**Reviewer:** Principal Code Reviewer Agent ("The Gatekeeper" / `code-reviewer`)  
**Model:** [Human-Readable Model Name, e.g. Gemini 4 Argon (Medium) / Gemini 3.8 Flash]  
**Skill & Version:** `review-pr v1.0.0`  
**Framework:** Google 8-Pillar Code Review Standard + EGM Governance + Conventional Comments  
**Date:** [YYYY-MM-DD]  
**Verdict:** `APPROVE` | `REQUEST_CHANGES` | `COMMENT`  

---

## 1. Executive Summary

[Concise 2–4 sentence assessment of the Pull Request's objective, architectural soundness, adherence to approved EGM specifications, and readiness to merge into `main`.]

---

## 2. Automated Verification Gate Results

| Verification Gate | Command | Status | Details |
| :--- | :--- | :--- | :--- |
| **EGM Contract Validation** | `./scripts/run_egm_cycle.sh validate` | `PASS` / `FAIL` | [e.g. All specs match Goldfish reviews and required sections] |
| **Gate 1: Markdown Cleanliness** | `./scripts/verify_implementation.sh` | `PASS` / `FAIL` | [e.g. 0 heading blank-line violations] |
| **Gate 2: Engine Typecheck** | `npm run build` (`engine/`) | `PASS` / `FAIL` | [e.g. 0 TypeScript errors under `--strict`] |
| **Gate 3: Deterministic Unit Suite** | `npm test -- --run` (`engine/`) | `PASS` / `FAIL` | [e.g. X/X Vitest tests passing] |
| **Gate 4: Client & Playwright Suite** | `npx playwright test` (`client/`) | `PASS` / `FAIL` | [e.g. X/X headless browser tests passing] |

---

## 3. 8-Pillar Framework Scorecard

| Pillar ID | Review Dimension | Rating (`Pass` / `Warn` / `Fail`) | Summary Assessment |
| :--- | :--- | :--- | :--- |
| **1. `DESIGN`** | Design & EGM Contract Alignment | `Pass` | [Assessment of spec alignment and `engine/` vs `client/` decoupling] |
| **2. `FUNCTIONALITY`** | Functionality, Purity & Determinism | `Pass` | [Assessment of pure reducers, immutability, and edge-case handling] |
| **3. `COMPLEXITY`** | Complexity & Maintainability | `Pass` | [Assessment of control flow simplicity and modularity] |
| **4. `TESTS`** | Automated Tests & Verification | `Pass` | [Assessment of unit, conservation, and Playwright test coverage] |
| **5. `NAMING`** | Naming & Domain Clarity | `Pass` | [Assessment of ubiquitous language alignment with `docs/designs/`] |
| **6. `COMMENTS_DOCS`** | Comments, `TASKS.md` & Markdown Hygiene | `Pass` | [Assessment of docstrings, task registry sync, and Markdown rules] |
| **7. `STYLE_TYPES`** | Style, Type Safety & Git Hygiene | `Pass` | [Assessment of `readonly` types, zero `any`, and Conventional Commits] |
| **8. `LORE_LOCALISATION`** | Narrative Sovereignty & British English | `Pass` | [Assessment of human lore boundaries and British English spelling] |

---

## 4. Conventional Comments Findings

### 4.1 Blocking Findings (`blocking`)

* [If none, write: *None. Zero blocking defects or governance violations identified.*]
* **`issue (blocking, <PILLAR>):`** `[filename:LXX-LYY](file:///Users/efsa/Repos/emergent/path/to/filename#LXX-LYY)` — **[Subject]**
  [Detailed explanation and required remediation.]

### 4.2 Non-Blocking Suggestions, Nitpicks & Questions (`non-blocking`)

* **`suggestion (non-blocking, <PILLAR>):`** `[filename:LXX-LYY](file:///Users/efsa/Repos/emergent/path/to/filename#LXX-LYY)` — **[Subject]**
  [Constructive improvement proposal.]

### 4.3 Engineering Praise (`praise`)

* **`praise (non-blocking, <PILLAR>):`** `[filename:LXX-LYY](file:///Users/efsa/Repos/emergent/path/to/filename#LXX-LYY)` — **[Subject]**
  [Recognition of strong invariant design, clean separation of concerns, or thorough testing.]

---

## 5. Sign-Off & Merge Recommendation

* **Final Verdict:** `[APPROVE / REQUEST_CHANGES / COMMENT]`
* **Pre-Merge Checklist:**
  - [ ] All `blocking` findings resolved
  - [ ] `./scripts/run_egm_cycle.sh validate` passes
  - [ ] `./scripts/verify_implementation.sh` passes
  - [ ] Human developer approval gate (`[HUMAN]`) ready for sign-off on GitHub

---

*Signed by: **Principal Code Reviewer ("The Gatekeeper")** (`code-reviewer`) · Model: **`[Model Name]`** · Skill: **`review-pr v1.0.0`** · Date: `[YYYY-MM-DD]`*
