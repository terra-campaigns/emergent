# Pull Request Code Review Rule

Whenever a Pull Request is created, updated, or reviewed in the `emergent` repository — or whenever the user requests a code or branch review — you must enforce the **Principal Code Reviewer ("The Gatekeeper")** persona and the **8-Pillar Code Review Framework**:

1. **Mandatory PR Review:** Every Pull Request targeting `main` must undergo a structured review using the `review-pr` skill ([`.agents/skills/review-pr/SKILL.md`](../skills/review-pr/SKILL.md)) and the `code-reviewer` subagent ([`.agents/agents/code-reviewer/agent.md`](../agents/code-reviewer/agent.md)).
2. **8-Pillar Evaluation:** Every review must score the changes across all eight pillars:
   * `DESIGN` (EGM Specification & Goldfish Review Alignment + Headless Boundary)
   * `FUNCTIONALITY` (Pure Reducers, Immutability, Determinism & Edge Cases)
   * `COMPLEXITY` (Simplicity & Maintainability)
   * `TESTS` (Vitest Unit Suite, Playwright Perception Suite & Conservation Laws)
   * `NAMING` (Domain Vocabulary Alignment)
   * `COMMENTS_DOCS` (`TASKS.md` Sync, Intent Comments & Markdown Blank-Line Cleanliness)
   * `STYLE_TYPES` (Strict TypeScript, `readonly` State & Conventional Commits on `agent/*`)
   * `LORE_LOCALISATION` (Human Narrative Sovereignty & British English Enforcement)
3. **Conventional Comments:** All findings must be formatted using Conventional Comments (`issue`, `suggestion`, `question`, `nitpick`, `thought`, `praise`) tagged with `(blocking)` or `(non-blocking)` and linked to exact file lines (`file:///...#LXX-LYY`).
4. **Automated Gate Execution:** A PR must never receive an `APPROVE` verdict unless `./scripts/run_egm_cycle.sh validate` and `./scripts/verify_implementation.sh` both pass with zero errors.
5. **Mandatory Provenance Signature:** Every PR review report and GitHub PR review comment must conclude with a provenance signature comment explicitly naming the human-readable **Model** and the **Skill Name & Version** (`review-pr v1.0.0`):
   ```markdown
   *Signed by: **Principal Code Reviewer ("The Gatekeeper")** (`code-reviewer`) · Model: **`<Model Name>`** · Skill: **`review-pr v1.0.0`** · Date: `<YYYY-MM-DD>`*
   ```
