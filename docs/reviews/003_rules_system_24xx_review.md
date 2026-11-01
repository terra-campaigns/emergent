# Goldfish Review: 24XX Rules & Resolution System

**Review Target:** [`docs/designs/003_rules_system_24xx.md`](file:///Users/efsa/Repos/emergent/docs/designs/003_rules_system_24xx.md)  
**Reviewer:** Goldfish Reviewer Agent (Zero Context)  
**Date:** 1 November 2026  
**Verdict:** Revisions Required  

---

## 1. Executive Summary

Specification `003_rules_system_24xx.md` defines the integration of the 24XX tabletop rules engine into `@emergent/engine`. It introduces polyhedral step dice (`d4` through `d12`), qualitative wanderer conditions, freeform backgrounds, item sacrifice, and explicit risk interception modals.

The design makes substantial strides towards evocative, low-complexity survival simulation. However, probing the specification under adversarial zero-context conditions reveals critical ambiguities in state locking, clock consumption, movement completion upon disaster, gear sacrifice pre-commitment, and PRNG recurrence determinism. These gaps create potential for client exploits, infinite loops, or non-deterministic state drift. Revision is required before transitioning from the Elephant Phase to autonomous implementation.

---

## 2. Invariant & Edge-Case Probing

| ID | Area / Component | Potential Failure Mode / Ambiguity | Risk Severity |
| :--- | :--- | :--- | :--- |
| PROBE-01 | Action Validation | **Modal State Lock Omission:** When `pendingRisk !== undefined`, the reducer does not explicitly reject standard actions (`TRAVEL`, `SEARCH`, `REST`, `PICKUP`, `DROP`), allowing peril bypass or inventory mutation mid-prompt. | High (Blocking) |
| PROBE-02 | Clock & Movement | **Clock Progression & Movement Resolution on Peril:** Underspecified whether Setback adds 1 watch to the base action (total 2) or replaces it, and whether a Disaster halts the wanderer at the origin or allows movement into the dangerous hex. | High (Blocking) |
| PROBE-03 | Inventory & Sacrifice | **Gear Sacrifice Pre-Commitment & Validation Gaps:** Spec does not clarify that `sacrificeItemId` is only broken if the roll results in a Disaster (preserved on Success/Setback), nor does it specify reducer rejection if the item is missing or already broken. | High (Blocking) |
| PROBE-04 | Deterministic PRNG | **PRNG Formula & Integer Derivation Underspecified:** Mulberry32 is mentioned in tests but omitted from schema/logic sections. Recurrence relation and integer face mapping ($1 \dots N$) must be explicitly defined to avoid cross-platform drift. | High (Blocking) |
| PROBE-05 | Passive Mitigation | **Broken Relic Passive Mitigation:** Invariant 7 allows carried relics to nullify peril without checking if the relic is in `character.brokenItemIds`. | Med |
| PROBE-06 | Action Taxonomy | **Underspecified `RESTORE_GEAR` Action:** `RESTORE_GEAR` is defined in `RulesAction`, but has no specified watch cost, location rules, salvage deduction logic, or event schema (`GEAR_RESTORED` is missing from `RulesEvent`). | Med |
| PROBE-07 | Condition Track | **Condition Ladder & Incapacitation Action Filter:** Unclear whether Disaster drops condition by 1 or 2 steps, how `REST` recovers condition, and whether `incapacitated` wanderers are blocked from `TRAVEL` and `SEARCH`. | High (Blocking) |
| PROBE-08 | Localisation | **American English Spelling:** Line 37 contains American spelling "initialization" instead of British English "initialisation". | Low (Non-blocking) |

---

## 3. Detailed Critiques & Blind Spots

### 3.1 Data Schema Completeness

* **Modal State Lock Invariant:**  
  When a player enters peril, the simulation state transitions to holding `pendingRisk: RiskPrompt`. The specification fails to state the reducer's behaviour if the client dispatches another action (e.g. `TRAVEL`, `SEARCH`, `REST`, `PICKUP`, `DROP`).  
  *Vulnerability:* If not guarded, a player could bypass peril by simply walking in another direction or resting.  
  *Mandatory Rule:* When `state.pendingRisk !== undefined`, any action other than `RESOLVE_RISK` and `ABORT_RISK` must be rejected with `ACTION_REJECTED` (costing 0 watches and leaving state unmodified).

* **Gear Sacrifice Pre-Commitment Semantics:**  
  `RulesAction` includes `{ type: 'RESOLVE_RISK', invokeBackground: boolean, sacrificeItemId?: string }`. Because `sacrificeItemId` is submitted before rolling, the specification must clarify:
  1. The item is **only** broken and added to `brokenItemIds` if the roll results in a `disaster`. If the wanderer rolls a `success` or `setback`, the item is preserved intact.
  2. If `sacrificeItemId` is supplied but is not present in `player.inventory` or is already in `brokenItemIds`, the reducer must reject the action with `ACTION_REJECTED` **before** rolling dice or advancing `rngState`.

* **Passive Mitigation with Broken Equipment:**  
  Invariant 7 states that possessing a mitigating relic (such as an `Unmarked Battery Cell`) nullifies night travel peril. The reducer must verify that `item.id` is not present in `character.brokenItemIds`. Broken equipment must never provide passive environmental protection.

* **Missing Schema for `RESTORE_GEAR`:**  
  `RESTORE_GEAR` is included in `RulesAction`, yet Section 4, 5, and 6 contain no details on how salvage weight is deducted, what watch cost is incurred, whether it requires specific landmarks, or what events are emitted (e.g. `GEAR_RESTORED`). This action should either be fully specified or deferred to a later salvage milestone.

---

### 3.2 Deterministic Simulation Consistency

* **Diurnal Clock Progression & Event Sequencing:**  
  The specification must formalise the exact clock progression:
  1. **Prompt Entry:** Discarding or triggering a `RiskPrompt` consumes `0` watches. The wanderer remains on their origin hex.
  2. **`ABORT_RISK`:** Clears `pendingRisk`, emits `RISK_ABORTED`, consumes `0` watches, and preserves origin position.
  3. **`RESOLVE_RISK` (Success):** Emits `DICE_ROLLED`, advances clock by 1 watch (emitting `WATCH_ADVANCED` and potentially `DAY_DAWNED`), and completes `sourceAction` (e.g. emits `PLAYER_TRAVELLED` and updates coordinate).
  4. **`RESOLVE_RISK` (Setback):** Emits `DICE_ROLLED`. If the setback consequence is an extra watch lost, the clock advances by **2 watches** (with proper sequential emission of `WATCH_ADVANCED` / `DAY_DAWNED` for each watch), and the `sourceAction` completes.
  5. **`RESOLVE_RISK` (Disaster):** Advances clock by 1 watch. If gear is sacrificed, emits `GEAR_SACRIFICED` and downgrades harm. The wanderer fails to complete traversal and remains on the origin hex, preventing lethal stumbling into the hazardous hex.

* **PRNG Stepping & Bit-for-Bit Determinism:**  
  To prevent cross-engine drift, the specification must formalise the Mulberry32 algorithm:
  ```typescript
  export function nextRng(state: number): { nextState: number; value: number } {
    let t = (state + 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const rand01 = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return { nextState: (state + 1) | 0, value: rand01 };
  }
  ```
  And specify uniform step die derivation:
  ```typescript
  export function rollDie(faces: number, state: number): { faceValue: number; nextState: number } {
    const { nextState, value } = nextRng(state);
    const faceValue = Math.floor(value * faces) + 1;
    return { faceValue, nextState };
  }
  ```
  `rngState` must **only** be modified when a die is actually cast during `RESOLVE_RISK`. It must remain unchanged during `ACTION_REJECTED` or `ABORT_RISK`.

* **Condition Ladder Transitions & Recovery:**  
  The ladder `healthy` $\rightarrow$ `hindered` $\rightarrow$ `injured` $\rightarrow$ `incapacitated` requires clear transitions:
  1. An unmitigated Disaster drops condition down by 1 tier (from `healthy` $\rightarrow$ `injured`; from `injured` $\rightarrow$ `incapacitated`).
  2. A wanderer marked `incapacitated` must have their `TRAVEL` and `SEARCH` actions rejected.
  3. The `REST` action must be defined to recover conditions: resting 1 watch clears `hindered`; resting for a full cycle of 3 watches clears `injured` back to `hindered`.

---

### 3.3 Testability & Perception Verification

* **Unit Test Additions:**
  1. Verification that non-risk actions dispatched while `pendingRisk !== undefined` return `success: false` and `ACTION_REJECTED`.
  2. Verification that invalid `sacrificeItemId` returns `ACTION_REJECTED` without advancing `rngState` or rolling dice.
  3. Verification that broken relics do not nullify night traversal risk.
  4. Fuzz testing clock progression over 100 peril resolutions ensuring midnight day-dawning events fire deterministically.

---

## 4. Required Revisions

1. **Add Invariant 8 (Modal State Lock):** Mandate that while `pendingRisk !== undefined`, any action other than `RESOLVE_RISK` and `ABORT_RISK` is strictly rejected with `ACTION_REJECTED` (0 watch cost).
2. **Formalise Clock & Movement Resolution Matrix:** Document the exact watch costs and spatial coordinates for `ABORT_RISK`, `RESOLVE_RISK` (Success), `RESOLVE_RISK` (Setback), and `RESOLVE_RISK` (Disaster).
3. **Specify Gear Sacrifice Semantics & Validation:** Document that `sacrificeItemId` is only broken if the result is a Disaster, and specify immediate rejection if the item is missing or broken.
4. **Define Mulberry32 PRNG Algorithm:** Provide the exact mathematical function and die face integer mapping in Section 3/5.
5. **Enforce Unbroken Relic Check on Invariant 7:** Require that carried mitigating relics must not be in `character.brokenItemIds`.
6. **Clarify Condition Track & Incapacitation Rest Rules:** Formalise the condition transition table and state how `REST` recovers condition.
7. **Specify or Defer `RESTORE_GEAR`:** Remove `RESTORE_GEAR` from the Milestone 3 specification scope and defer to a dedicated salvage milestone.
8. **Correct British English:** Replace "initialization" with "initialisation" on line 37.

---

## 5. Recommendation & Sign-Off

* **Verdict:** Revisions Required  
* **Notes for Elephant Agent:** The core design is compelling and faithfully captures the high-stakes spirit of 24XX. Incorporating the eight required revisions above will make the contract airtight and ready for autonomous code generation.

---

*Signed by: **Goldfish Reviewer Agent (Zero Context)** · Date: 1 November 2026*
