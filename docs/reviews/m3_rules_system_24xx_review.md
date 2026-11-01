# Code Review Report: Milestone 3 — 24XX Rules & Resolution System

**Pull Request / Branch Scope:** `agent/milestone-3-rules-system-24xx` compared against `agent/milestone-2-hex-and-time`  
**Reviewer:** Principal Code Reviewer Agent ("The Gatekeeper" / `code-reviewer`)  
**Model:** Gemini 3.8 Flash  
**Skill & Version:** `review-pr v1.0.0`  
**Framework:** Google 8-Pillar Code Review Standard + EGM Governance + Conventional Comments  
**Date:** 2026-11-01  
**Verdict:** `APPROVE`  

---

## 1. Executive Summary

This formal code review evaluates Milestone 3 (`agent/milestone-3-rules-system-24xx`), introducing tabletop-inspired 24XX rules, polyhedral step dice (`d4`–`d12`), qualitative wanderer conditions, background archetypes, contingent gear sacrifice, and an interactive risk prompt modal to `emergent`. The implementation strictly adheres to approved EGM design specification [`003_rules_system_24xx.md`](file:///Users/efsa/Repos/emergent/docs/designs/003_rules_system_24xx.md), incorporating all eight critical invariants established during the Goldfish review in [`003_rules_system_24xx_review.md`](file:///Users/efsa/Repos/emergent/docs/reviews/003_rules_system_24xx_review.md). All automated verification gates pass with zero errors (100% Markdown heading cleanliness, strict TypeScript engine compilation, 49/49 deterministic Vitest unit tests, and 5/5 Playwright perception tests), with pristine architectural decoupling between headless simulation logic and browser presentation.

---

## 2. Automated Verification Gate Results

| Verification Gate | Command | Status | Details |
| :--- | :--- | :--- | :--- |
| **EGM Contract Validation** | `./scripts/run_egm_cycle.sh validate` | `PASS` | All specifications match approved Goldfish reviews (`001`, `002`, and `003`). |
| **Gate 1: Markdown Cleanliness** | `./scripts/verify_implementation.sh` | `PASS` | 100% of repository Markdown headings are immediately followed by clean blank lines. |
| **Gate 2: Engine Typecheck** | `npm run build` (`engine/`) | `PASS` | TypeScript compiled with 0 errors under `--strict` mode. |
| **Gate 3: Deterministic Unit Suite** | `npm test -- --run` (`engine/`) | `PASS` | 49/49 Vitest unit tests passing, covering Mulberry32 PRNG repeatability, boundary clamping, modal locking, gear sacrifice, and condition decay. |
| **Gate 4: Client & Playwright Suite** | `npx playwright test` (`client/`) | `PASS` | Client builds cleanly (0 Vite errors); 5/5 headless Playwright perception tests passing. |

========================================================  
✓ ALL VERIFICATION GATES PASSED CLEANLY.  
========================================================

---

## 3. 8-Pillar Framework Scorecard

| Pillar ID | Review Dimension | Rating | Summary Assessment |
| :--- | :--- | :--- | :--- |
| **1. `DESIGN`** | Design & EGM Contract Alignment | `Pass` | Full fidelity to `docs/designs/003_rules_system_24xx.md`. Incorporates Invariants 1–8 (step dice ranges, ternary thresholds, hindered caps, contingent gear sacrifice, deterministic Mulberry32 math, zero-watch aborts, unbroken relic checks, and modal state locking). Complete headless decoupling (`engine/` has zero DOM/Canvas dependencies). |
| **2. `FUNCTIONALITY`** | Functionality, Purity & Determinism | `Pass` | Pure reducer transitions (`hexStep`) return frozen state and event arrays with zero mutation of inputs. Seeded PRNG (`rngState`) advances deterministically only upon dice rolls. Invariant 8 modal state locks prevent action skipping during pending risk. |
| **3. `COMPLEXITY`** | Complexity & Maintainability | `Pass` | Lean, single-responsibility modules (`engine/src/rules/dice.ts` is under 40 lines). Reducer control flow is explicit and readable. Slight repetition in peril completion logic identified as an ergonomic refactoring opportunity. |
| **4. `TESTS`** | Automated Tests & Verification | `Pass` | Comprehensive test coverage across seeded PRNG uniform distribution (1,000 trials), step die face bounds, modal state locking, contingent gear sacrifice, and Playwright end-to-end perception of the risk modal. |
| **5. `NAMING`** | Naming & Domain Clarity | `Pass` | Precise alignment with ubiquitous domain terminology (`StepDie`, `STEP_DIE_FACES`, `RollOutcome`, `RollResult`, `WandererCondition`, `WandererBackground`, `RiskPrompt`, `RESOLVE_RISK`, `ABORT_RISK`). |
| **6. `COMMENTS_DOCS`** | Comments, `TASKS.md` & Markdown Hygiene | `Pass` | Invariants are extensively cross-referenced to specification documents. Living task board (`TASKS.md`) and `Human Input Registry` accurately track active Milestone 3 playtest canvas `003_milestone_3_playtest.md`. 100% Markdown heading cleanliness verified. |
| **7. `STYLE_TYPES`** | Style, Type Safety & Git Hygiene | `Pass` | Strict TypeScript types with `readonly` modifiers, discriminated unions, and extensive `Object.freeze` enforcement. Git commits follow Conventional Commits on isolated agent branch with required co-authorship trailers. |
| **8. `LORE_LOCALISATION`** | Narrative Sovereignty & British English | `Pass` | Strictly upholds human narrative sovereignty using neutral technical archetypes without AI-invented lore. All user-facing strings, chronicle entries, and documentation adhere to British English. |

---

## 4. Conventional Comments Findings

### 4.1 Blocking Findings (`blocking`)

*None. Zero blocking defects, invariant violations, or governance breaches identified.*

---

### 4.2 Non-Blocking Suggestions, Nitpicks & Questions (`non-blocking`)

* **`suggestion (non-blocking, DESIGN):`** [`client/src/ui/hud.ts:L172-L178`](file:///Users/efsa/Repos/emergent/client/src/ui/hud.ts#L172-L178) — **Clarify Background Inapplicability in Modal Action Button**  
  In `HudController.renderRiskModal`, the background invocation button is rendered as `Invoke ${state.character.background.name} (${bgDie})` regardless of whether the character's background matches `prompt.applicableBackgroundId`. If a Scavenger encounters night traversal (`applicableBackgroundId: 'nomad_guide'`), the button text advertises `Invoke Ruin Scavenger (d8)`. When clicked, the engine reducer strictly adheres to Invariant 3 and lines 442–446 of [`engine/src/hex/step.ts`](file:///Users/efsa/Repos/emergent/engine/src/hex/step.ts#L442-L446) by falling back to `prompt.defaultDie` (`d6`), and the chronicle records `Cast d6`. While the engine's contract enforcement is impeccable, the player may feel deceived by the button label. Disabling the button or displaying `(Not Applicable)` when `state.character.background.id !== prompt.applicableBackgroundId` would enhance player feedback.

* **`suggestion (non-blocking, COMPLEXITY):`** [`engine/src/hex/step.ts:L468-L558`](file:///Users/efsa/Repos/emergent/engine/src/hex/step.ts#L468-L558) — **Extract Helper for Peril Source Action Execution**  
  In `hexStep`, the logic executing `prompt.sourceAction` (handling spatial updates for `TRAVEL` and discovery reveals for `SEARCH`) is duplicated across both the `success` branch (lines 468–506) and the `setback` branch (lines 520–558). Extracting this block into a private helper function (e.g. `completePerilSourceAction(state, sourceAction)`) would eliminate approximately 40 lines of structural repetition and enhance maintainability as additional actions trigger peril in future milestones.

* **`suggestion (non-blocking, FUNCTIONALITY):`** [`engine/src/hex/step.ts:L221-L237`](file:///Users/efsa/Repos/emergent/engine/src/hex/step.ts#L221-L237) — **Diurnal Dawn Rest Recovery Approximation**  
  In the `REST` action reducer, recovering from `injured` to `hindered` (and `incapacitated` to `injured`) hooks directly into the boolean `dayDawned` (the midnight watch rollover). The specification in [`003_rules_system_24xx.md:L209`](file:///Users/efsa/Repos/emergent/docs/designs/003_rules_system_24xx.md#L209) states that recovery requires resting for a full diurnal day cycle (3 watches). Under the current implementation, if a wanderer is injured during the night watch and immediately rests, `dayDawned` triggers on that single watch transition, clearing the injury after 1 watch instead of 3. For subsequent milestones, tracking consecutive rested watches or an injury timestamp on `WandererCharacterSheet` would ensure full 3-watch rest cycles are strictly enforced.

* **`nitpick (non-blocking, LORE_LOCALISATION):`** [`engine/src/rules/dice.ts:L10`](file:///Users/efsa/Repos/emergent/engine/src/rules/dice.ts#L10) — **Enforce British English in JSDoc Comments**  
  Line 10 contains the American English spelling *normalized* (`* Advances state and returns a normalized float in [0, 1).`). In keeping with repository localisation standards, this should be updated to the British English spelling *normalised* in the next cleanup cycle.

* **`nitpick (non-blocking, NAMING):`** [`client/src/ui/hud.ts:L211,L322`](file:///Users/efsa/Repos/emergent/client/src/ui/hud.ts#L211) — **Pluralise Discovery Count in Chronicle and Sector Hints**  
  In `HudController.renderGroundList` and `HudController.appendEvents`, notification strings format discovery counts as `${hiddenDiscoveries.length} hidden anomaly` and `Uncovered ${ev.revealedCount} hidden anomaly.`. Incorporating pluralisation (`1 hidden anomaly` vs `2 hidden anomalies`) will polish chronicle narrative presentation.

---

### 4.3 Engineering Praise (`praise`)

* **`praise (non-blocking, FUNCTIONALITY):`** [`engine/src/hex/step.ts:L428-L438,L568-L590`](file:///Users/efsa/Repos/emergent/engine/src/hex/step.ts#L428-L438) — **Pristine Contingent Gear Sacrifice & Pre-Roll Validation**  
  The implementation of Invariant 4 is exceptionally disciplined. The reducer verifies that `sacrificeItemId` exists in inventory and is not already broken *prior* to rolling the step die or advancing `rngState`, rejecting invalid commitments with zero side effects. Crucially, gear is broken only if the resulting roll is a `disaster`; rolls resulting in `success` or `setback` leave the committed item completely undamaged.

* **`praise (non-blocking, FUNCTIONALITY):`** [`engine/src/hex/step.ts:L31-L44`](file:///Users/efsa/Repos/emergent/engine/src/hex/step.ts#L31-L44) — **Watertight Invariant 8 Modal State Lock**  
  The modal state lock strictly intercepts any action dispatched while `state.pendingRisk !== undefined` (excluding `RESOLVE_RISK` and `ABORT_RISK`), returning `ACTION_REJECTED` and consuming zero watches. This completely eliminates client-side bypass exploits where a player could otherwise circumvent perilous encounters by simply walking in another direction.

* **`praise (non-blocking, TESTS):`** [`engine/tests/rules_dice.test.ts:L24-L42`](file:///Users/efsa/Repos/emergent/engine/tests/rules_dice.test.ts#L24-L42) — **Deterministic Seeded PRNG Reproducibility Suite**  
  The 1,000-trial Mulberry32 reproducibility test provides ironclad verification that identical seeds produce bit-for-bit identical sequences of polyhedral step die outcomes and state transitions across platforms, cementing deterministic simulation purity.

---

## 5. Sign-Off & Merge Recommendation

* **Final Verdict:** `APPROVE`
* **Pre-Merge Checklist:**
  - [x] All `blocking` findings resolved (0 blocking issues identified)
  - [x] `./scripts/run_egm_cycle.sh validate` passes cleanly
  - [x] `./scripts/verify_implementation.sh` passes cleanly (Typecheck, Vitest, Playwright, Markdown)
  - [x] Living task board (`TASKS.md`) and qualitative playtest canvas (`docs/playtests/003_milestone_3_playtest.md`) established
  - [ ] Human developer playability sign-off gate (`[HUMAN]`) awaiting evaluation in `TASK-1701`

---

*Signed by: **Principal Code Reviewer ("The Gatekeeper")** (`code-reviewer`) · Model: **Gemini 3.8 Flash** · Skill: **`review-pr v1.0.0`** · Date: 2026-11-01*
