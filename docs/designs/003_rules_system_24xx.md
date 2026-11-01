# Design Specification: 24XX Rules & Resolution System

**Document ID:** `docs/designs/003_rules_system_24xx.md`  
**Status:** Approved (Goldfish Revisions Incorporated)  
**Author:** Elephant Agent & Developer  
**Target Milestone:** Milestone 3  

---

## 1. Overview & Objectives

This specification defines the integration of the **24XX rules engine** into `emergent`'s headless simulation architecture. Building on top of the pointy-topped hexagonal territory and 3-watch diurnal time economy established in Milestone 2, this system introduces tabletop-inspired tactical stakes, character backgrounds, condition tracks, breakable gear, and explicit risk resolution without sacrificing the engine's 100% pure, deterministic reducer foundation.

### Goals

* **Polyhedral Step Dice Engine:** Implement classic 24XX step dice (`d4`, `d6`, `d8`, `d10`, `d12`) with the universal ternary resolution model (`1–2 Disaster`, `3–4 Setback`, `5+ Success`).
* **Freeform Background Competencies:** Provide thematic wanderer backgrounds (e.g. *Scavenger d8*, *Nomad Guide d8*, *Relic Smith d8*) that augment relevant risk rolls, defaulting to `d6` for general tasks and `d4` when hindered or untrained.
* **Contextual Peril Checks:** Preserve roll-free fluidity for routine daylight traversal while triggering explicit risk checks for hazardous events: travelling at night without light, crossing unstable rubble or waterways, forcing sealed bulkheads, or surveying dangerous ruin sites.
* **Explicit Roll-Action Dispatch:** Pause simulation flow upon encountering peril with an actionable `RiskPrompt`, granting players tactical agency to select backgrounds, sacrifice gear, or safely abort the action.
* **Condition Track & Gear Sacrifice:** Model wanderer resilience through condition states (`Healthy` $\rightarrow$ `Hindered` $\rightarrow$ `Injured` $\rightarrow$ `Incapacitated`) with the ability to sacrifice carried equipment to absorb fatal disasters.
* **Deterministic Relic Utility:** Model ancient technology as reliable, deterministic environmental mitigators (e.g. battery-powered floodlights neutralising night travel perils) rather than chaotic randomiser items.

### Non-Goals

* **Tactical Grid Combat / Initiative Queues:** Turn-based tactical skirmishing with multi-entity action point economies is deferred to subsequent entity milestones.
* **Numeric Hit Point Sponges:** Avoid quantitative HP pools in favour of evocative, qualitative 24XX condition states and item durability.
* **Autonomous Lore Generation:** All character background names and encounter descriptions strictly adhere to human narrative sovereignty.
* **Salvage & Repair Economy (`RESTORE_GEAR`):** Complex crafting and tool repair are deferred to a dedicated post-Milestone 3 maintenance milestone.

---

## 2. In-Game Fiction & Player Experience

In the far-future wastes of `emergent`, survival is governed not by abstract numeric statistics, but by preparation, specialised heritage, and decisive tactical risk-taking.

### The Wanderer's Calling

At initialisation, the wanderer claims an ancestral background:
* **Scavenger (`d8`):** Adept in unearthing buried vaults, assessing structural integrity, and salvaging intact components from twisted slag.
* **Nomad Guide (`d8`):** Weathered in long marches, reading horizon omens, finding secure pathways through toxic terrain, and surviving exposure.
* **Relic Smith (`d8`):** Knowledgeable in ancient power couplings, celestial alloy seals, and deciphering pre-collapse symbology.

### The Encounter of Peril

When a wanderer attempts a dangerous feat—such as marching across jagged slag during the dead of night, or prying open a collapsed bulkhead—the simulation does not silently roll behind their back. Instead, the world pauses:
1. **The Assessment:** A tactile modal displays the immediate peril and the stakes at hand.
2. **The Choice of Approach:** The player chooses whether to invoke their relevant background (`d8`), rely on general instinct (`d6`), leverage specialised tools, or abort the attempt and retreat to safety.
3. **The Roll:** The polyhedral die is cast:
   * **Success (`5+`):** The action succeeds cleanly without cost or harm.
   * **Setback (`3–4`):** Partial success or accomplishment with a complication (e.g. extra watch lost, equipment degraded, or temporary strain).
   * **Disaster (`1–2`):** Severe consequence or harm. The wanderer sustains an injury—or heroically sacrifices a carried tool, hearing it snap or warp to turn a fatal blow into a manageable hindrance.

---

## 3. State Schema & Data Models

### Polyhedral Primitives & Outcomes

```typescript
export type StepDie = 'd4' | 'd6' | 'd8' | 'd10' | 'd12';

export const STEP_DIE_FACES: Readonly<Record<StepDie, number>> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
} as const;

export type RollOutcome = 'disaster' | 'setback' | 'success';

export interface RollResult {
  readonly die: StepDie;
  readonly value: number;       // Integer in [1, faces]
  readonly outcome: RollOutcome;
}
```

### Deterministic Seeded PRNG Math (Mulberry32)

To guarantee bit-for-bit deterministic reproducibility across all platforms and test runners, dice rolls are derived via pure Mulberry32 pseudo-random number generation:

```typescript
export function nextRng(state: number): { nextState: number; value: number } {
  let t = (state + 0x6D2B79F5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const rand01 = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { nextState: (state + 1) | 0, value: rand01 };
}

export function rollStepDie(die: StepDie, state: number): { result: RollResult; nextState: number } {
  const faces = STEP_DIE_FACES[die];
  const { nextState, value } = nextRng(state);
  const faceValue = Math.floor(value * faces) + 1;
  const outcome: RollOutcome = faceValue <= 2 ? 'disaster' : faceValue <= 4 ? 'setback' : 'success';
  return {
    result: { die, value: faceValue, outcome },
    nextState,
  };
}
```

### Wanderer Condition & Background Schema

```typescript
export type WandererCondition = 'healthy' | 'hindered' | 'injured' | 'incapacitated';

export interface WandererBackground {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly die: StepDie;        // Standard starting rating: 'd8'
}

export interface WandererCharacterSheet {
  readonly background: WandererBackground;
  readonly condition: WandererCondition;
  readonly brokenItemIds: readonly string[]; // Carried items sacrificed or broken
}
```

### Peril Prompt & Risk Schema

```typescript
export type RiskSeverity = 'moderate' | 'perilous' | 'lethal';

export interface RiskPrompt {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: RiskSeverity;
  readonly stakes: string;
  readonly sourceAction: HexGameAction;
  readonly applicableBackgroundId?: string; // e.g. 'scavenger' if surveying ruin
  readonly defaultDie: StepDie;             // 'd6' standard, or 'd4' if hindered
  readonly availableSacrificeItemIds: readonly string[]; // Unbroken carried items
}
```

### Extended World State

```typescript
export interface HexWorldStateV3 extends HexWorldState {
  readonly character: WandererCharacterSheet;
  readonly pendingRisk?: RiskPrompt;        // Present when simulation awaits player resolution
  readonly rngState: number;               // 32-bit deterministic PRNG seed
}
```

### Actions & Events Taxonomy

```typescript
export type RulesAction =
  | { readonly type: 'RESOLVE_RISK'; readonly invokeBackground: boolean; readonly sacrificeItemId?: string }
  | { readonly type: 'ABORT_RISK' };

export type RulesEvent =
  | { readonly type: 'RISK_ENCOUNTERED'; readonly prompt: RiskPrompt }
  | { readonly type: 'DICE_ROLLED'; readonly roll: RollResult; readonly context: string }
  | { readonly type: 'CONDITION_CHANGED'; readonly from: WandererCondition; readonly to: WandererCondition; readonly reason: string }
  | { readonly type: 'GEAR_SACRIFICED'; readonly itemId: string; readonly itemTitle: string }
  | { readonly type: 'RISK_ABORTED'; readonly reason: string };
```

---

## 4. Invariants & Rules

1. **Polyhedral Range Invariant:** For every roll of die `dN`, the generated integer `value` must satisfy $1 \le \text{value} \le N$.
2. **Ternary Threshold Invariant:**
   * $\text{value} \in \{1, 2\} \implies \text{RollOutcome} = \text{'disaster'}$.
   * $\text{value} \in \{3, 4\} \implies \text{RollOutcome} = \text{'setback'}$.
   * $\text{value} \ge 5 \implies \text{RollOutcome} = \text{'success'}$.
3. **Condition Die Restriction Invariant:** While a wanderer's condition is `hindered`, any physical or dangerous roll is capped at `d4`, regardless of background ratings.
4. **Gear Sacrifice Invariant:**
   * `sacrificeItemId` is **contingent**: it is broken and appended to `brokenItemIds` if and only if the roll results in a `disaster`. If the wanderer rolls a `success` or `setback`, the item remains completely undamaged.
   * If `sacrificeItemId` is provided in `RESOLVE_RISK`, the reducer verifies that `sacrificeItemId` exists in `player.inventory` and is not already in `brokenItemIds`. If invalid, the reducer rejects the action with `ACTION_REJECTED` before generating any dice roll or advancing `rngState`.
   * Sacrificing an unbroken carried item upon suffering a Disaster downgrades the outcome to a temporary `hindered` condition, preventing `injured` or `incapacitated` status.
5. **Deterministic State Reproducibility:** Given the identical initial `rngState` and sequence of player actions, all dice rolls, condition shifts, and world mutations must be 100% reproducible bit-for-bit.
6. **Action Abort Safety Invariant:** When a `RiskPrompt` is active, dispatching `ABORT_RISK` cancels the pending action, returns the player to their previous safe coordinate/state, and consumes `0` watches.
7. **Passive Relic Mitigation Invariant:** Active possession of unbroken mitigating relics (where `item.id` is not present in `character.brokenItemIds`) prevents the generation of corresponding risk prompts altogether (e.g. an unbroken `Unmarked Battery Cell` providing light negates night travel peril). Broken relics provide 0 passive environmental protection.
8. **Modal State Lock Invariant:** While `state.pendingRisk !== undefined`, any action other than `RESOLVE_RISK` and `ABORT_RISK` (e.g. `TRAVEL`, `SEARCH`, `REST`, `PICKUP`, `DROP`) is strictly rejected with `ACTION_REJECTED` (`"Must resolve or abort pending risk before taking further actions"`), consuming 0 watches and leaving world state unchanged.

---

## 5. Simulation & Tick Mechanics

### Risk Lifecycle & Clock Progression Matrix

| Action / Outcome | Watches Consumed | Spatial Movement / Search Result | Condition & Harm Consequence | Item Sacrifice Status |
| :--- | :--- | :--- | :--- | :--- |
| **`ABORT_RISK`** | `0` | Cancelled; stays on origin hex | Unchanged | Item preserved |
| **`RESOLVE_RISK` (Success `5+`)** | `1` | Completes traversal to target hex / reveals discovery | Unchanged | Item preserved |
| **`RESOLVE_RISK` (Setback `3–4`)** | `2` (1 base + 1 delay) | Completes traversal to target hex / reveals discovery | Unchanged (or minor strain) | Item preserved |
| **`RESOLVE_RISK` (Disaster `1–2` with Gear Sacrifice)** | `1` | Traversal fails; pushed back to origin hex | Condition transitions to `hindered` | Item marked broken (`brokenItemIds`) |
| **`RESOLVE_RISK` (Disaster `1–2` Unmitigated)** | `1` | Traversal fails; pushed back to origin hex | Drops condition 1 tier: `healthy` $\rightarrow$ `injured` $\rightarrow$ `incapacitated` | No item broken |

### Condition Ladder Transitions & Recovery

1. **Condition Degradation:**
   * `healthy` $\rightarrow$ Disaster (unmitigated) $\rightarrow$ `injured`.
   * `injured` $\rightarrow$ Disaster (unmitigated) $\rightarrow$ `incapacitated`.
   * Any Disaster mitigated by gear sacrifice transitions or maintains condition at `hindered`.
2. **Incapacitation Lock:**
   * When `condition === 'incapacitated'`, all `TRAVEL` and `SEARCH` actions are rejected with `"Wanderer is incapacitated; must rest to recover."`
3. **Recovery via `REST`:**
   * Resting for `1` watch while `hindered` clears the condition back to `healthy`.
   * Resting for a full diurnal day cycle (`3` watches: morning, afternoon, night) while `injured` clears the injury to `hindered`.
   * Resting for a full diurnal day cycle while `incapacitated` clears the status to `injured`.

### Contextual Peril Triggers

1. **Night Traversal (`night` watch):**
   * *Trigger:* Undertaking `TRAVEL` during `night` without an unbroken portable light source (`Unmarked Battery Cell`).
   * *Stakes:* Risk of disorientation (losing 1 extra watch) or twisting an ankle on slag (becoming `hindered`).
   * *Applicable Background:* `Nomad Guide` (`d8`).
2. **Unstable Rubble / Silt Borders:**
   * *Trigger:* Moving through unstable rubble hexes or searching collapsed zones.
   * *Stakes:* Masonry shift risking gear damage or injury.
   * *Applicable Background:* `Scavenger` (`d8`).
3. **Breaching Sealed Ruin Bulkheads:**
   * *Trigger:* Attempting to access sealed titan structures or heavy hatches.
   * *Stakes:* Tool shattering, electrical discharge, or failure to open.
   * *Applicable Background:* `Relic Smith` (`d8`).

---

## 6. Edge Cases & Failure Modes

* **Incapacitation at Zero Health:** If an `injured` wanderer suffers an unmitigated Disaster, condition transitions to `incapacitated`. The wanderer cannot travel or search until resting for a full cycle (3 watches) or using specialised medical salvage.
* **Attempting to Sacrifice Broken Gear:** The reducer strictly rejects sacrifice requests for items already marked in `brokenItemIds` before dice rolling.
* **Out-of-Element Tasks:** Tasks unrelated to the wanderer's background roll default `d6`. If the wanderer is severely disadvantaged, the die is stepped down to `d4`.
* **Rucksack Full of Broken Items:** Broken items retain their gram weight, reinforcing the trade-off between hauling damaged relics for repair and maintaining carrying capacity for fresh salvage.

---

## 7. Verification & Automated Test Strategy

* **Seeded PRNG Unit Tests (`engine/tests/`):** Test suites verifying uniform distribution of Mulberry32, deterministic reproducibility of dice rolls across 1,000 seeded trials, and exact boundary clamping ($1$ to $N$).
* **Modal State Lock Tests:** Verification that any non-risk action dispatched while `pendingRisk !== undefined` returns `success: false` and `ACTION_REJECTED`.
* **Contingent Sacrifice Unit Tests:** Verification that gear is preserved on Success/Setback, broken only on Disaster, and invalid sacrifice IDs reject immediately.
* **Condition State Transition Fuzzing:** Automated tests asserting that unmitigated disasters strictly progress health conditions down the ladder, while gear sacrifices properly intercept lethal harm.
* **Playwright Peril Perception Tests (`client/tests/e2e/`):** End-to-end browser tests asserting that night traversal opens the `RiskPrompt` modal, background selection updates the displayed die face, and aborting safely closes the prompt without spending time.
