# World Lore & Narrative Questions: emergent

> [!NOTE]
> This document is the asynchronous authoring canvas for the human developer. As established in [`AGENTS.md`](file:///Users/efsa/Repos/emergent/AGENTS.md#L50-L58), AI agents never invent major world lore autonomously. You can edit this file at your leisure. The autonomous agent checks this file and will synchronise your answers into `engine/src/data/defaultWorld.ts` whenever you update it.

---

## Status

* **Current Baseline:** Player entity updated to "A tribal wanderer".
* **Last Synchronised by Agent:** 31 October 2026 (Synchronised Player Persona: "A tribal wanderer").

---

## 1. Player Entity Persona

**Question:** What should the player character entity be called or titled? What is their background in the world?

* **Default Placeholder:** `title: "Traveller"`, `id: "player_001"`
* **Your Answer:**
  ```text
  A tribal wanderer.
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

---

## 5. Hexagonal Territory & Location Canvases (Milestone 2)

With Milestone 2 transitioning the world to an expansive hexagonal territory with an 8-hour diurnal travel economy, here are open question prompts to populate specific hex landmarks and discovery sites:

### 5.1 The Starting Vista (Hex `0, 0`)

**Prompt:** When the tribal wanderer starts their journey at the origin hex, what does their encampment look like? What immediate landmark or shelter anchors this starting point?
* *Technical Placeholder:* `"Scrub Encampment"`
* **Your Thoughts:**
  ```text
  [Write your notes here, e.g. An extinguished peat hearth beneath a leaning comms pylon, a weathered surveyor's cairn, etc.]
  ```

### 5.2 The Horizon Monolith (North-East Hexes)

**Prompt:** In the series tradition of "Emergent" canopies (solitary colossal ruins punching through the horizon), what ancient mega-structure is visible across the plain towards the north-east?
* *Technical Placeholder:* `"Derelict Gantry"`
* **Your Thoughts:**
  ```text
  [Write your notes here, e.g. A fractured atmospheric elevator anchor, a hollow cathedral-hulk of an orbital freighter, etc.]
  ```

### 5.3 The First Hidden Discovery Site (East Hexes)

**Prompt:** Milestone 2 requires spending an 8-hour watch to `SEARCH` a hexagon to reveal hidden salvage. What buried discovery or forgotten cache lies concealed beneath the silt or cracked plates to the east?
* *Technical Placeholder:* `"Sunken Access Hatch"` yielding a portable relic.
* **Your Thoughts:**
  ```text
  [Write your notes here, e.g. A sealed escape pod with preserved avionics, an ancestral scavenger stash wrapped in oiled canvas, etc.]
  ```

### 5.4 The Frontier Hazard (West / South-West Barriers)

**Prompt:** What natural or technological barrier defines the impassable waterways and titan bulkheads to the west?
* *Technical Placeholder:* `"The Drainage Canal & Pitted Plating"`
* **Your Thoughts:**
  ```text
  [Write your notes here, e.g. An alkaline run-off channel cutting through dead soil, a collapsed blast door from an underground silo, etc.]
  ```

### 5.5 The Night Watch Atmosphere

**Prompt:** When the diurnal clock reaches the third watch (`night`), what sensory details or environmental rhythms descend upon the land?
* *Technical Placeholder:* `"Bitter cold and still darkness."`
* **Your Thoughts:**
  ```text
  [Write your notes here, e.g. Static-charged frost coating metal, distant drone hums echoing through the earth, brilliant unfamiliar constellations, etc.]
  ```
