# World Lore & Narrative Questions: emergent

> [!NOTE]
> This document is the asynchronous authoring canvas for the human developer. As established in [`AGENTS.md`](file:///Users/efsa/Repos/emergent/AGENTS.md#L50-L58), AI agents never invent major world lore autonomously. You can edit this file at your leisure. The autonomous agent checks this file and will synchronise your answers into `engine/src/data/defaultWorld.ts` whenever you update it.

---

## Status

* **Current Baseline:** Using neutral technical placeholders in `engine/src/data/defaultWorld.ts`.
* **Last Synchronised by Agent:** 31 October 2026 (Initial stubs created).

---

## 1. Player Entity Persona

**Question:** What should the player character entity be called or titled? What is their background in the world?

* **Default Placeholder:** `title: "Traveller"`, `id: "player_001"`
* **Your Answer:**
  ```text
  [Write your answer here, e.g. "Alden the Scavenger", "A wandering Novice of the Iron Fold", etc.]
  ```

---

## 2. Starting Region & Immediate Horizon

**Question:** What is this first wilderness map called? What feudal barony or frontier border is it, and what ancient cosmic remnant or landmark looms on the horizon?

* **Default Placeholder:** `name: "Sector 0-0: The Grey Flats"`
* **Your Answer:**
  ```text
  [Write your answer here, e.g. "The Rusted Fens of Barony Vane", "The Broken Spine of the Star-Barge", etc.]
  ```

---

## 3. Milestone 1 Relics & Ground Items

**Question:** What are 2–3 specific relics or salvaged items resting in the world for the player to find, examine, and carry? Include their names, descriptions, and approximate mass in grams.

* **Default Placeholder 1:**
  * *Name:* "Unmarked Battery Cell"
  * *Type:* `power_cell`
  * *Weight:* `450` grams
  * *Description:* "A heavy, sealed cylinder with faint chemical heat."
* **Default Placeholder 2:**
  * *Name:* "Faceted Sensor Prism"
  * *Type:* `sensory_optic`
  * *Weight:* `200` grams
  * *Description:* "Crystalline lens showing distorted iridescent refractions."
* **Default Placeholder 3:**
  * *Name:* "Hardened Alloy Plate"
  * *Type:* `alloy_plate`
  * *Weight:* `1200` grams
  * *Description:* "Dense, pitted composite metal salvaged from an ancient bulkhead."

* **Your Answer:**
  ```text
  [Write your relic definitions here, or modify the defaults above.]
  ```

---

## 4. Tile Atmosphere & Local Dialect

**Question:** Are there specific local terms or descriptive touches you want associated with terrain types (plains, rubble, scrap walls, waterways)?

* **Default Placeholder:** Standard utilitarian descriptions in `TILE_DEFINITIONS`.
* **Your Answer:**
  ```text
  [Write any desired atmospheric flavour or regional names here.]
  ```
