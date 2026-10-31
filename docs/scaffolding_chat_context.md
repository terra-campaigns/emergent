# Initial Scaffolding Chat Context: emergent

> [!NOTE]
> This document captures the complete context, design rationale, and technical decisions made during the initial bootstrapping of the `emergent` project. It is intended solely as background context for agents and developers during the initial scaffolding phase.

**Date:** 31 October 2026  
**Repository:** `terra-campaigns/emergent`  
**Local Path:** `/Users/efsa/Repos/emergent`

---

## 1. Initial Prompt & Feasibility Assessment

### The Core Inquiry

The project began with an inquiry regarding whether combining two specific frameworks would be sufficient to autonomously drive the development of a complex RPG browser game:
1. **Google EGM (Elephant-Goldfish Model):** For design and architectural specification.
2. **Guido's `apexsim` Framework:** For simulation and game runtime logic.

### The Architectural Verdict

**They are not sufficient on their own, but they form two critical pillars.**

* **Google EGM (The Governance Pillar):** A Spec-Driven Development (SDD) methodology. The *Elephant* maintains long-term project context and drafts formal technical specifications under a strict no-code rule. The *Goldfish* subagents conduct zero-context reviews to spot blind spots, logic gaps, and edge cases. Human sign-off is required before implementation.
* **`apexsim` (The Simulation Core):** An authoritative, headless simulation framework running deterministic tick loops and state machines.
* **The Missing Gaps for Full Autonomy:**
  1. *The Autonomous Coder / Execution Harness:* An agent loop equipped with file-system tools, test runners, and AST capabilities to implement code against the approved EGM specifications.
  2. *The Continuous Perception & Verification Loop:* A headless browser testing suite (e.g. Playwright) and unit tests to provide perceptual feedback to the AI without hallucination or context drift.
  3. *The Presentation & Client Layer:* WebGL/Canvas rendering (e.g. PixiJS, HTML5 Canvas), audio, input handling, and user interface (dialogue boxes, inventory).
  4. *Qualitative Game Feel:* A human-in-the-loop playtesting and balance feedback loop.

---

## 2. Naming & Thematic Identity

### Existing Series Context

The project belongs to a catalogue of games with single-word, lowercase, evocative titles:
* `hostile` (hard sci-fi — thermodynamic reality, cold vacuum, mechanical danger)
* `unsettled` (folk medieval horror — creeping psychological and ecological dread)
* `charged` (psychedelic — altered states, electric sensory saturation)

### Worldbuilding & Thematic Brief

* **Genre:** Far-future humanistic fiction.
* **Setting:** A remote, disconnected frontier world in a semi-feudal dark age.
* **Atmosphere:** Humble agrarian and feudal societies (baronies, pilgrimages, scavenger guilds, timber villages) living in the literal shadow of colossal, incomprehensible remnants and orbital wreckage from ancient cosmic civilisations.
* **Development Metaphor:** The title had to also reflect the project's meta-architecture: an episodic, sandbox experience built incrementally as-we-go through autonomous agentic collaboration.

### Title Selection: `emergent`

The chosen title is **`emergent`**. It bridges the in-world fiction and the software architecture across multiple layers:

1. **The In-World Epoch:** Humanity emerging from the long silence of a dark age to rebuild culture amidst ancient ruins.
2. **The "Emergent" Canopy (Ecology):** In forestry, "emergents" are the giant ancient trees punching through the lower canopy—mirroring the titanic spires punctuating the low feudal landscape.
3. **Complexity & Simulation:** In systems science, *emergent* behaviour arises unscripted from simple local rules—the exact philosophy of a sandbox built on simulation ticks (`apexsim`).
4. **Episodic & Agentic:** The game is not built from a monolithic static design document; it emerges feature-by-feature through Google EGM cycles.
5. **The Subconscious Echo of "Emergency":** Derived from the Latin *emergere* ("to rise out of depth"), it shares its root with *emergency* (originally an unexpected occurrence, later an acute crisis). This adds an underlying note of tension and precarious survival, matching the threat profile of *hostile* and *unsettled*.

---

## 3. Scaffolding & Repository Setup

### Organisation & Repository Details

* **GitHub Remote:** `https://github.com/terra-campaigns/emergent` (created via GitHub CLI under the `terra-campaigns` organisation).
* **Local Clone:** `/Users/efsa/Repos/emergent` (alongside `hostile`, `charged`, and `arete`).
* **Git Status:** All initial files remain untracked / unstaged in the local working directory for the user to review and manually commit.

### Initial Directory & File Layout

```text
emergent/
├── .gitignore                    # Web, Node, Rust, Python, OS ignores
├── README.md                     # Project overview and architectural diagram
├── AGENTS.md                     # Engineering constraints & EGM rules for AI agents
├── docs/
│   ├── concepts/
│   │   └── concepts_brief.md     # Initial high-level design brief for emergent
│   ├── designs/                  # Approved EGM feature specifications (to be drafted)
│   ├── reviews/                  # Goldfish critique reports
│   ├── conversation_export.md    # Export of the initial feasibility dialogue
│   └── scaffolding_chat_context.md # This temporary scaffolding context document
├── engine/                       # Headless simulation core (apexsim tick loop)
├── client/                       # Browser presentation layer (PixiJS / Canvas UI)
└── scripts/                      # Build, verification, and EGM automation scripts
```

---

## 4. Key Engineering Constraints (Summary from AGENTS.md)

1. **Strict EGM Spec-First Workflow:** No feature code without an approved specification in `docs/designs/`.
2. **Git Constraint:** Never run autonomous `git commit` commands; leave all changes in the working directory for human developer review.
3. **Language:** British English enforcement across all code comments, docstrings, docs, and LLM text generation prompts.
4. **Markdown Formatting Cleanliness:** Always leave an empty blank line immediately following any Markdown heading.
5. **Decoupled Architecture:** The simulation engine must run headless and be fully verifiable via automated tests without requiring a browser window.
