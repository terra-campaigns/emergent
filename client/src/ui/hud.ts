import { GameEvent, TILE_DEFINITIONS, WorldState } from '@emergent/engine';

export interface HudCallbacks {
  onPickup: (itemId?: string) => void;
  onDrop: (itemId: string) => void;
}

export class HudController {
  private tickEl: HTMLElement;
  private personaEl: HTMLElement;
  private coordsEl: HTMLElement;
  private terrainEl: HTMLElement;
  private weightProgressEl: HTMLElement;
  private weightTextEl: HTMLElement;
  private groundListEl: HTMLElement;
  private inventoryListEl: HTMLElement;
  private eventLogEl: HTMLElement;
  private callbacks: HudCallbacks;

  constructor(callbacks: HudCallbacks) {
    this.callbacks = callbacks;
    this.tickEl = document.getElementById('hud-tick')!;
    this.personaEl = document.getElementById('hud-persona')!;
    this.coordsEl = document.getElementById('hud-coords')!;
    this.terrainEl = document.getElementById('hud-terrain')!;
    this.weightProgressEl = document.getElementById('weight-progress')!;
    this.weightTextEl = document.getElementById('hud-weight')!;
    this.groundListEl = document.getElementById('ground-items-list')!;
    this.inventoryListEl = document.getElementById('inventory-items-list')!;
    this.eventLogEl = document.getElementById('event-log')!;
  }

  public update(state: WorldState, events: readonly GameEvent[]): void {
    // 1. Header Badges
    this.tickEl.textContent = state.tick.toString();
    this.personaEl.textContent = state.player.title || 'A tribal wanderer';

    // 2. Status & Position
    const px = state.player.position.x;
    const py = state.player.position.y;
    this.coordsEl.textContent = `(${px}, ${py})`;

    const currentTileType = state.tiles[py]?.[px];
    if (currentTileType) {
      this.terrainEl.textContent = TILE_DEFINITIONS[currentTileType]?.description || currentTileType;
    }

    // 3. Carrying Capacity
    const currentWeight = state.player.inventory.reduce((sum, i) => sum + i.weightGrams, 0);
    const maxWeight = state.player.maxCarryWeightGrams;
    const percent = Math.min(100, Math.round((currentWeight / maxWeight) * 100));

    this.weightProgressEl.style.width = `${percent}%`;
    this.weightProgressEl.style.backgroundColor = percent >= 90 ? '#e06c75' : '#56b6c2';
    this.weightTextEl.textContent = `${currentWeight}g / ${maxWeight}g (${percent}%)`;

    // 4. Ground Items on Current Tile
    const currentGroundItems = state.groundItems.filter(
      (g) => g.position.x === px && g.position.y === py
    );

    this.renderGroundList(currentGroundItems);

    // 5. Inventory List
    this.renderInventoryList(state.player.inventory);

    // 6. Chronicle Logs
    this.appendEvents(events);
  }

  private renderGroundList(groundItems: WorldState['groundItems']): void {
    this.groundListEl.innerHTML = '';
    if (groundItems.length === 0) {
      const notice = document.createElement('span');
      notice.className = 'empty-notice';
      notice.textContent = 'No salvage on this tile.';
      this.groundListEl.appendChild(notice);
      return;
    }

    groundItems.forEach((g) => {
      const card = document.createElement('div');
      card.className = 'item-card';

      const info = document.createElement('div');
      info.className = 'item-info';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name';
      nameSpan.textContent = `${g.item.name} (${g.item.weightGrams}g)`;

      const descSpan = document.createElement('span');
      descSpan.className = 'item-desc';
      descSpan.textContent = g.item.description;

      info.appendChild(nameSpan);
      info.appendChild(descSpan);
      card.appendChild(info);

      const btn = document.createElement('button');
      btn.className = 'btn-action';
      btn.textContent = 'Pick Up';
      btn.addEventListener('click', () => this.callbacks.onPickup(g.item.id));

      card.appendChild(btn);
      this.groundListEl.appendChild(card);
    });
  }

  private renderInventoryList(inventory: WorldState['player']['inventory']): void {
    this.inventoryListEl.innerHTML = '';
    if (inventory.length === 0) {
      const notice = document.createElement('span');
      notice.className = 'empty-notice';
      notice.textContent = 'Rucksack is empty.';
      this.inventoryListEl.appendChild(notice);
      return;
    }

    inventory.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'item-card';

      const info = document.createElement('div');
      info.className = 'item-info';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name';
      nameSpan.textContent = `${item.name} (${item.weightGrams}g)`;

      const descSpan = document.createElement('span');
      descSpan.className = 'item-desc';
      descSpan.textContent = item.description;

      info.appendChild(nameSpan);
      info.appendChild(descSpan);
      card.appendChild(info);

      const btn = document.createElement('button');
      btn.className = 'btn-action';
      btn.textContent = 'Drop';
      btn.addEventListener('click', () => this.callbacks.onDrop(item.id));

      card.appendChild(btn);
      this.inventoryListEl.appendChild(card);
    });
  }

  private appendEvents(events: readonly GameEvent[]): void {
    events.forEach((ev) => {
      const entry = document.createElement('div');
      entry.className = 'log-entry';

      switch (ev.type) {
        case 'MOVED':
          entry.classList.add('moved');
          entry.textContent = `[Tick ${ev.tick}] Moved to (${ev.to.x}, ${ev.to.y}).`;
          break;
        case 'ITEM_COLLECTED':
          entry.classList.add('collected');
          entry.textContent = `[Tick ${ev.tick}] Recovered: ${ev.item.name} (${ev.item.weightGrams}g).`;
          break;
        case 'ITEM_DROPPED':
          entry.classList.add('dropped');
          entry.textContent = `[Tick ${ev.tick}] Dropped: ${ev.item.name} at (${ev.position.x}, ${ev.position.y}).`;
          break;
        case 'WAITED':
          entry.textContent = `[Tick ${ev.tick}] Waited a moment in silence.`;
          break;
        case 'ACTION_REJECTED':
          entry.classList.add('rejected');
          entry.textContent = `[Tick ${ev.tick}] ${ev.reason}`;
          break;
      }

      this.eventLogEl.prepend(entry);
    });
  }
}
