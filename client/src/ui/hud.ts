import {
  hexEqual,
  HexGameEvent,
  HEX_TILE_DEFINITIONS,
  HexWorldState,
  RelicItem,
  WatchPhase,
} from '@emergent/engine';

export interface HudCallbacks {
  onPickup: (itemId?: string) => void;
  onDrop: (itemId: string) => void;
  onSearch: () => void;
  onRest: () => void;
}

function capitalise(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export class HudController {
  private clockEl: HTMLElement;
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
    this.clockEl = document.getElementById('hud-clock')!;
    this.tickEl = document.getElementById('hud-tick')!;
    this.personaEl = document.getElementById('hud-persona')!;
    this.coordsEl = document.getElementById('hud-coords')!;
    this.terrainEl = document.getElementById('hud-terrain')!;
    this.weightProgressEl = document.getElementById('weight-progress')!;
    this.weightTextEl = document.getElementById('hud-weight')!;
    this.groundListEl = document.getElementById('ground-items-list')!;
    this.inventoryListEl = document.getElementById('inventory-items-list')!;
    this.eventLogEl = document.getElementById('event-log')!;

    const searchBtn = document.getElementById('btn-search-hex');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.callbacks.onSearch());
    }

    const restBtn = document.getElementById('btn-rest');
    if (restBtn) {
      restBtn.addEventListener('click', () => this.callbacks.onRest());
    }
  }

  public update(state: HexWorldState, events: readonly HexGameEvent[]): void {
    // 1. Header Badges
    this.clockEl.textContent = `Day ${state.clock.day} — ${capitalise(state.clock.watch)}`;
    this.tickEl.textContent = state.clock.totalWatches.toString();
    this.personaEl.textContent = state.player.title || 'A tribal wanderer';

    // 2. Status & Position
    const { q, r } = state.player.coordinate;
    this.coordsEl.textContent = `(${q}, ${r})`;

    const currentTile = state.tiles.find((t) => hexEqual(t.coordinate, state.player.coordinate));
    if (currentTile) {
      const def = HEX_TILE_DEFINITIONS[currentTile.terrain];
      this.terrainEl.textContent = def?.description || capitalise(currentTile.terrain.replace('_', ' '));
    }

    // 3. Carrying Capacity
    const currentWeight = state.player.inventory.reduce((sum, i) => sum + i.weightGrams, 0);
    const maxWeight = state.player.maxCarryWeightGrams;
    const percent = Math.min(100, Math.round((currentWeight / maxWeight) * 100));

    this.weightProgressEl.style.width = `${percent}%`;
    this.weightProgressEl.style.backgroundColor = percent >= 90 ? '#e06c75' : '#56b6c2';
    this.weightTextEl.textContent = `${currentWeight}g / ${maxWeight}g (${percent}%)`;

    // 4. Ground Salvage on Current Hex
    this.renderGroundList(currentTile);

    // 5. Inventory List
    this.renderInventoryList(state.player.inventory);

    // 6. Chronicle Logs
    this.appendEvents(events, state.clock.day, state.clock.watch);
  }

  private renderGroundList(tile?: HexWorldState['tiles'][number]): void {
    this.groundListEl.innerHTML = '';

    if (!tile) {
      const notice = document.createElement('span');
      notice.className = 'empty-notice';
      notice.textContent = 'No salvage on this hex.';
      this.groundListEl.appendChild(notice);
      return;
    }

    const hiddenDiscoveries = tile.discoveries.filter((d) => d.visibility === 'hidden');
    const revealedDiscoveries = tile.discoveries.filter(
      (d) => d.visibility === 'revealed' && d.item !== undefined
    );

    // Render hidden discovery alert banner if any hidden discoveries exist
    if (hiddenDiscoveries.length > 0) {
      const hint = document.createElement('div');
      hint.className = 'discovery-notice';
      hint.textContent = `${hiddenDiscoveries.length} hidden anomaly detected in this sector. Survey the hex to reveal.`;
      this.groundListEl.appendChild(hint);
    }

    if (revealedDiscoveries.length === 0 && hiddenDiscoveries.length === 0) {
      const notice = document.createElement('span');
      notice.className = 'empty-notice';
      notice.textContent = 'No salvage on this hex.';
      this.groundListEl.appendChild(notice);
      return;
    }

    revealedDiscoveries.forEach((d) => {
      const item = d.item!;
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
      btn.textContent = 'Pick Up';
      btn.addEventListener('click', () => this.callbacks.onPickup(item.id));

      card.appendChild(btn);
      this.groundListEl.appendChild(card);
    });
  }

  private renderInventoryList(inventory: readonly RelicItem[]): void {
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

  private appendEvents(
    events: readonly HexGameEvent[],
    currentDay: number,
    currentWatch: WatchPhase
  ): void {
    const timeLabel = `Day ${currentDay} — ${capitalise(currentWatch)}`;

    events.forEach((ev) => {
      const entry = document.createElement('div');
      entry.className = 'log-entry';

      switch (ev.type) {
        case 'PLAYER_TRAVELLED':
          entry.classList.add('moved');
          entry.textContent = `[${timeLabel}] Travelled to (${ev.to.q}, ${ev.to.r}).`;
          break;

        case 'HEX_SEARCHED':
          entry.classList.add('searched');
          entry.textContent =
            ev.revealedCount > 0
              ? `[${timeLabel}] Surveyed hex (${ev.coordinate.q}, ${ev.coordinate.r}): Uncovered ${ev.revealedCount} hidden anomaly.`
              : `[${timeLabel}] Surveyed hex (${ev.coordinate.q}, ${ev.coordinate.r}): Found only dust and silence.`;
          break;

        case 'DISCOVERY_REVEALED':
          entry.classList.add('collected');
          entry.textContent = `[${timeLabel}] Revealed: ${ev.discovery.name} — ${ev.discovery.description}`;
          break;

        case 'ITEM_PICKED_UP':
          entry.classList.add('collected');
          entry.textContent = `[${timeLabel}] Recovered: ${ev.item.name} (${ev.item.weightGrams}g).`;
          break;

        case 'ITEM_DROPPED':
          entry.classList.add('dropped');
          entry.textContent = `[${timeLabel}] Dropped: ${ev.item.name} at (${ev.coordinate.q}, ${ev.coordinate.r}).`;
          break;

        case 'DAY_DAWNED':
          entry.classList.add('dawn');
          entry.textContent = `[Day ${ev.day}] Dawn breaks across the territory.`;
          break;

        case 'WATCH_ADVANCED': {
          // If WATCH_ADVANCED is the only event in this tick (e.g. REST), log the rest
          if (events.length === 1 || (events.length === 2 && events.some((e) => e.type === 'DAY_DAWNED'))) {
            entry.classList.add('moved');
            entry.textContent = `[${timeLabel}] Rested through the watch.`;
          } else {
            return; // Subsumed by the primary action event (TRAVEL / SEARCH)
          }
          break;
        }

        case 'ACTION_REJECTED':
          entry.classList.add('rejected');
          entry.textContent = `[Rejected] ${ev.reason}`;
          break;
      }

      this.eventLogEl.prepend(entry);
    });
  }
}
