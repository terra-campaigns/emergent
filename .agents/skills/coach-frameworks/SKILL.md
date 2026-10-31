---
name: coach-frameworks
version: 1.0.0
description: >-
  Conducts strategic framework evaluations, developer ergonomics coaching, and cross-project
  scouting using the Principal Developer Coach ("The Catalyst") persona. Scouts sibling
  repositories and the web to formulate actionable framework improvements or propose
  better ways to adhere to established paradigms.
---

# Framework Coaching & Scouting Skill (`coach-frameworks`)

This skill orchestrates developer coaching sessions, cross-project intelligence gathering, and framework optimization in the `emergent` repository using the **Principal Developer Coach ("The Catalyst")** persona.

## Reference Materials

* **Developer Coach Agent Definition:** [`.agents/agents/developer-coach/agent.md`](../../agents/developer-coach/agent.md)
* **Detailed Coaching & Scouting Rubric:** [`references/coaching-framework.md`](./references/coaching-framework.md)
* **Coaching Proposal Template:** [`docs/coaching/PROPOSAL_TEMPLATE.md`](../../../docs/coaching/PROPOSAL_TEMPLATE.md)

---

## Step-by-Step Coaching Procedure

### Step 1: Clarify the Coaching Scope & Objective

Determine whether the coaching request involves:
1. **Adherence & Ergonomics:** Improving how current frameworks (Elephant-Goldfish Model / EGM, 8-Pillar Review, Guido Autonomy, headless engine, strict TypeScript) are followed, removing friction, or automating manual overhead.
2. **Framework Evolution:** Scouting for superior frameworks, libraries, or architectural paradigms to replace or augment existing approaches.
3. **Ecosystem Harmonisation:** Cross-pollinating proven solutions from sibling projects in `/Users/efsa/Repos/`.

### Step 2: Scout Internal Sibling Repositories (`/Users/efsa/Repos/*`)

Inspect adjacent projects for relevant prior art and established solutions:

```bash
ls -la /Users/efsa/Repos/
find /Users/efsa/Repos/arete -maxdepth 3 -name "*.ts" -o -name "*.sh" -o -name "AGENTS.md"
find /Users/efsa/Repos/charged -maxdepth 3 -name "*.ts" -o -name "*.sh" -o -name ".githooks"
```

* Identify battle-tested scripts, linting configurations, test utilities, or data schemas.
* Note patterns that can be mirrored or shared to eliminate duplication.

### Step 3: Scout External Web Ecosystem & Industry Standards

Use `search_web` to research state-of-the-art implementations, modern library alternatives, performance benchmarks, and architectural RFCs:

* Query authoritative industry sources, official documentation, and modern engineering blogs.
* Evaluate community adoption, maintenance activity, bundle overhead, and typing quality.

### Step 4: Synthesise Findings & Formulate Recommendation

Assess the findings against the 6 core coaching dimensions:
1. **Velocity & Cognitive Overhead (`VELOCITY`)**
2. **Determinism & Pure State Isolation (`DETERMINISM`)**
3. **Type Safety & Compiler Assistance (`TYPES`)**
4. **Verification Rigour & Test Ergonomics (`TESTABILITY`)**
5. **Ecosystem Harmony & Portability (`PORTABILITY`)**
6. **Governance Ergonomics (`GOVERNANCE`)**

Formulate a clear comparative trade-off matrix comparing the status quo with the recommended enhancement.

### Step 5: Deliver the Coaching Output

Depending on the scope:

* **For In-Turn Guidance:** Provide concise, actionable advice in the conversation, highlighting code examples, command snippets, or conceptual mental models.
* **For Ergonomic Automations:** Implement or refine non-breaking helper scripts (e.g. in `scripts/`), test them, and verify that `./scripts/verify_implementation.sh` passes cleanly.
* **For Formal Framework Proposals (RFCs):**
  1. Draft a comprehensive proposal in `docs/coaching/<id>_<slug>_proposal.md` following [`docs/coaching/PROPOSAL_TEMPLATE.md`](../../../docs/coaching/PROPOSAL_TEMPLATE.md).
  2. Register the proposal in the `Human Input Registry` at the top of `TASKS.md` with an `[SEMI]` tag.
  3. Ensure all newly created Markdown files follow the mandatory blank-line-after-heading rule.

### Step 6: Apply the Provenance Signature

Conclude all formal proposals and major coaching summaries with the mandatory signature block:

```markdown
---

*Signed by: **Principal Developer Coach ("The Catalyst")** (`developer-coach`) · Model: **`<Model Name>`** · Skill: **`coach-frameworks v1.0.0`** · Date: `<YYYY-MM-DD>`*
```
