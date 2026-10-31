---
name: review-pr
version: 1.0.0
description: >-
  Conducts a formal Pull Request code review using the Principal Code Reviewer
  ("The Gatekeeper") persona and the 8-Pillar Code Review Framework (Google
  Engineering Practices + EGM Governance + Conventional Comments). Use this
  skill whenever the user asks to review a PR, audit a branch diff before
  merging, or when preparing/evaluating any Pull Request in the repository.
---

# Pull Request Code Review Skill (`review-pr`)

This skill orchestrates a formal, structured Pull Request code review in the `emergent` repository using the **Principal Code Reviewer ("The Gatekeeper")** persona and the **8-Pillar Code Review Framework**.

## Reference Materials

* **Code Reviewer Agent Definition:** [`.agents/agents/code-reviewer/agent.md`](../../agents/code-reviewer/agent.md)
* **Detailed 8-Pillar Rubric & Conventional Comments Reference:** [`references/review-framework.md`](./references/review-framework.md)
* **PR Review Report Template:** [`docs/reviews/PR_REVIEW_TEMPLATE.md`](../../../docs/reviews/PR_REVIEW_TEMPLATE.md)

---

## Step-by-Step Review Procedure

### Step 1: Identify Target Pull Request & Branch Scope

1. Check for open GitHub Pull Requests or local branch diffs against `main`:
   ```bash
   gh pr list
   git status
   git log main..HEAD --oneline
   ```
2. If a PR number is specified (or an open PR exists for the current branch), inspect its metadata and changed files:
   ```bash
   gh pr view <PR_NUMBER>
   gh pr diff <PR_NUMBER>
   ```
   If reviewing a local `agent/*` branch prior to or alongside a PR, inspect `git diff main...HEAD --stat` and `git diff main...HEAD`.

### Step 2: Run Automated Verification & EGM Gates

Execute both repository verification harnesses and record their exact outputs:

1. **EGM Specification & Goldfish Review Consistency:**
   ```bash
   ./scripts/run_egm_cycle.sh validate
   ```
2. **Continuous Verification Harness (Markdown Cleanliness, Engine Typecheck, Vitest Unit Suite, Client Build & Playwright Perception Suite):**
   ```bash
   ./scripts/verify_implementation.sh
   ```

### Step 3: Dispatch or Execute the `code-reviewer` Evaluation

* If running in a multi-agent session, invoke the `code-reviewer` subagent (defined in [`.agents/agents/code-reviewer/agent.md`](../../agents/code-reviewer/agent.md), using `Model: inherit` and `Workspace: inherit`) to audit the diff independently, or adopt the **Principal Code Reviewer ("The Gatekeeper")** persona directly.
* Evaluate every changed file across all **8 Pillars** detailed in [`references/review-framework.md`](./references/review-framework.md):
  1. **Design & EGM Contract Alignment (`DESIGN`)**
  2. **Functionality & Determinism (`FUNCTIONALITY`)**
  3. **Complexity & Maintainability (`COMPLEXITY`)**
  4. **Automated Tests & Verification (`TESTS`)**
  5. **Naming & Domain Clarity (`NAMING`)**
  6. **Comments & Documentation (`COMMENTS_DOCS`)**
  7. **Style, Type Safety & Git Hygiene (`STYLE_TYPES`)**
  8. **Narrative Sovereignty & Localisation (`LORE_LOCALISATION`)**

### Step 4: Generate & Sign the Structured Review Report

1. Write or update the formal PR review report at `docs/reviews/pr_<PR_NUMBER>_<slug>_review.md` following [`docs/reviews/PR_REVIEW_TEMPLATE.md`](../../../docs/reviews/PR_REVIEW_TEMPLATE.md) (unless the user asked for a chat-only review).
2. Format all line-level and file-level findings using **Conventional Comments**:
   * Labels: `issue`, `suggestion`, `question`, `nitpick`, `thought`, `praise`
   * Severity: `(blocking)` or `(non-blocking)`
3. **Mandatory Provenance Signature:** Always sign the bottom of the review report (and any GitHub PR comment posted) with the exact **Review Provenance & Signature** footer, explicitly recording the human-readable name of the AI model that executed the review and the `version` field from this skill's YAML frontmatter (`review-pr v1.0.0`):
   ```markdown
   ---

   *Signed by: **Principal Code Reviewer ("The Gatekeeper")** (`code-reviewer`) · Model: **`<Model Name>`** · Skill: **`review-pr v1.0.0`** · Date: `<YYYY-MM-DD>`*
   ```
4. Re-run `./scripts/verify_implementation.sh` to verify that any newly created Markdown review file adheres strictly to Gate 1 (blank line after every Markdown heading).
5. When posting the review to the GitHub PR via `gh pr comment <PR_NUMBER> --body-file <report_path>` or `gh pr review`, ensure the provenance signature comment is included at the bottom of the PR comment body.
