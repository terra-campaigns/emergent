# emergent

A far-future, humanistic sandbox browser RPG set on a remote, semi-feudal world strewn with the incomprehensible remnants of ancient cosmic civilisations.

---

## Overview

In `emergent`, humanity lives in the long shadow of forgotten titans. Centuries after an unremembered cosmic collapse, local fiefdoms, baronies, and wanderers navigate a landscape where medieval timber villages and ploughed fields sit beneath the rusted spires of ancient megastructures. 

> [!TIP]
> **Interested in co-creating, playtesting, or architecting with us?**  
> Read our [**Collaborator-Player-Developer Pitch (`PITCH.md`)**](file:///Users/efsa/Repos/emergent/PITCH.md) to explore the concept, the setting, and how human-agent pair engineering works in this repository.

The game is designed around:
* **Humanistic Fiction:** Grounded mortal drama, trade, honour, and survival amidst ancient technological wonder.
* **Sandbox & Emergence:** Deep systemic simulation where mechanics and narratives arise from interaction rather than rigid linear scripting.
* **Episodic Development:** Built incrementally through autonomous agentic collaboration using Google EGM (Elephant-Goldfish Model) and tick-based simulation foundations (`apexsim`).

---

## Architectural Pillars

```text
[ Google EGM ]          --> Spec-Driven Design (Elephant vision + Goldfish peer review)
[ Coding Agents ]       --> Autonomous task implementation strictly conforming to specs
[ apexsim Engine ]      --> Authoritative headless simulation, tick loop & state machine
[ Browser Client ]      --> Canvas/WebGL presentation layer, audio & UI
[ Automated Test Loop ] --> Playwright / Vitest headless verification harness
```

---

## Repository Structure

```text
emergent/
├── docs/
│   ├── concepts/       # High-level concept briefs (concepts_brief.md)
│   ├── designs/        # Living technical specifications (EGM design docs)
│   └── reviews/        # Goldfish subagent critique reports
├── engine/             # Authoritative simulation core (apexsim-based)
├── client/             # Browser presentation layer (DOM / Canvas / UI)
├── scripts/            # Build, test, and EGM automation scripts
└── AGENTS.md           # Engineering guidelines and constraints for AI agents
```

---

## Getting Started

Refer to [**`PITCH.md`**](file:///Users/efsa/Repos/emergent/PITCH.md) for our invitation and project vision, [`docs/concepts/concepts_brief.md`](file:///Users/efsa/Repos/emergent/docs/concepts/concepts_brief.md) for the initial game design brief, and [`AGENTS.md`](file:///Users/efsa/Repos/emergent/AGENTS.md) for agentic engineering guidelines.
