# Concept Brief: emergent

**Document State:** Draft (Initial Concept)  
**Methodology:** Google EGM (Elephant Phase - Concept Formulation)  
**Author:** Pair programming session (Human & Antigravity)

---

## 1. Vision & Core Philosophy

`emergent` is a far-future, humanistic browser RPG set upon a remote, isolated frontier world. Centuries after an unremembered cosmic cataclysm or civilisational collapse, human life has reorganised into a semi-feudal society. Baronies, roving pilgrim orders, agrarian villages, and scavenger guilds subsist amidst the weathered, colossal skeletons of incomprehensible mega-structures and orbital wreckage.

The title reflects a dual reality:
* **In-World:** A fragile society emerging from a dark age under the quiet, lingering shadow of an ancient emergency.
* **Architecture:** An episodic sandbox where complex world states, narratives, and mechanics emerge dynamically through simulation and agentic engineering.

---

## 2. Setting & Aesthetic Pillars

* **Deep Time & Secular Relics:** Technology from the prior epochs is not treated as magical fantasy; it is incomprehensibly advanced physics, material science, and automation worn down by eons of dust, rain, and salvage.
* **Humanistic Feudalism:** Society is local, fragile, and grounded. People care about crop yields, water rights, oaths of fealty, trade caravans, and family lineage, all unfolding in the literal shadow of derelict star-docks and dead orbital spires.
* **The "Emergent" Canopy:** Like the towering trees that pierce the rainforest canopy, solitary gargantuan ruins punctuate the pastoral horizon.

---

## 3. Core Gameplay Loop (Target Blueprint)

1. **Exploration & Traverse:** Navigating an unmapped, episodic world grid composed of settlements, ruins, wilderness, and contested fiefs.
2. **Systemic Simulation:** Time advances in discrete ticks governed by the authoritative headless engine (`apexsim`). Weather, resource scarcity, faction standing, and entity schedules operate deterministically.
3. **Dialogue & Human Drama:** Multi-perspective interactions with local lords, pilgrims, and scavengers, balancing personal oaths with faction pressures.
4. **Relic Salvage & Risk:** Venturing into unsealed sub-structures where ancient automated systems may still be active, unstable, or malfunctioning.

---

## 4. Technical & Engineering Strategy

* **Design Governance:** Google EGM (Elephant-Goldfish Model). No code is committed to features without approved specifications in `docs/designs/`.
* **Engine Core (`engine/`):** Authoritative, headless tick simulation implementing deterministic state mutation.
* **Browser Client (`client/`):** Lightweight WebGL/Canvas renderer (PixiJS/HTML5) coupled via an event/state synchronisation stream.
* **Continuous Verification:** Playwright headless browser tests and unit test suites running in CI before integration.
