import { describe, expect, it } from 'vitest';
import { createDefaultWorld } from '../src/data/defaultWorld.js';
import { step } from '../src/step.js';

describe('Inventory & Relic Mechanics', () => {
  it('picks up a ground relic and updates inventory', () => {
    // In default world, relic_001 is at (2, 1) weighing 450g
    let state = createDefaultWorld();
    expect(state.groundItems.some((g) => g.item.id === 'relic_001')).toBe(true);

    // Step East to (2, 1)
    state = step(state, { type: 'MOVE', direction: 'east' }).state;
    expect(state.player.position).toEqual({ x: 2, y: 1 });

    // Execute PICKUP without itemId
    const res = step(state, { type: 'PICKUP' });
    expect(res.success).toBe(true);
    expect(res.state.player.inventory).toHaveLength(1);
    expect(res.state.player.inventory[0]?.id).toBe('relic_001');
    expect(res.state.groundItems.some((g) => g.item.id === 'relic_001')).toBe(false);
    expect(res.events).toEqual([
      {
        type: 'ITEM_COLLECTED',
        item: expect.objectContaining({ id: 'relic_001' }),
        tick: res.state.tick,
      },
    ]);
  });

  it('prevents telekinetic pickup of remote relics', () => {
    // Player is at (1, 1), relic_002 is at (4, 3)
    const state = createDefaultWorld();
    const res = step(state, { type: 'PICKUP', itemId: 'relic_002' });
    expect(res.success).toBe(false);
    expect(res.events[0]?.reason).toBe('Item not found on current tile');
    expect(res.state.player.inventory).toHaveLength(0);
    // Relic 002 remains on ground
    expect(res.state.groundItems.some((g) => g.item.id === 'relic_002')).toBe(true);
  });

  it('rejects pickup on empty tile', () => {
    // (1, 1) has no ground items
    const state = createDefaultWorld();
    const res = step(state, { type: 'PICKUP' });
    expect(res.success).toBe(false);
    expect(res.events[0]?.reason).toBe('No item to pick up');
    expect(res.state.tick).toBe(state.tick);
  });

  it('enforces LIFO stack order when multiple relics share a tile', () => {
    const base = createDefaultWorld();
    // Place two items at (1, 1)
    const stackedWorld = {
      ...base,
      groundItems: [
        {
          item: {
            id: 'top_item',
            name: 'Top Prism',
            description: 'Top of stack',
            relicType: 'sensory_optic' as const,
            weightGrams: 100,
          },
          position: { x: 1, y: 1 },
        },
        {
          item: {
            id: 'bottom_item',
            name: 'Bottom Cell',
            description: 'Bottom of stack',
            relicType: 'power_cell' as const,
            weightGrams: 200,
          },
          position: { x: 1, y: 1 },
        },
      ],
    };

    // First PICKUP should pop 'top_item'
    const res1 = step(stackedWorld, { type: 'PICKUP' });
    expect(res1.success).toBe(true);
    expect(res1.state.player.inventory[0]?.id).toBe('top_item');

    // Second PICKUP should pop 'bottom_item'
    const res2 = step(res1.state, { type: 'PICKUP' });
    expect(res2.success).toBe(true);
    expect(res2.state.player.inventory[1]?.id).toBe('bottom_item');
  });

  it('rejects pickup when item weight exceeds maxCarryWeightGrams', () => {
    const base = createDefaultWorld();
    // Player max carry is 300g, item on ground is 301g
    const state = {
      ...base,
      player: {
        ...base.player,
        maxCarryWeightGrams: 300,
        inventory: [],
      },
      groundItems: [
        {
          item: {
            id: 'heavy_relic',
            name: 'Heavy Plate',
            description: 'Exceeds limit',
            relicType: 'alloy_plate' as const,
            weightGrams: 301,
          },
          position: { x: 1, y: 1 },
        },
      ],
    };

    const res = step(state, { type: 'PICKUP' });
    expect(res.success).toBe(false);
    expect(res.events[0]?.reason).toBe('Exceeds carrying capacity');
    expect(res.state.player.inventory).toHaveLength(0);
    expect(res.state.tick).toBe(state.tick);
  });

  it('drops item from inventory to player coordinate with position isolation', () => {
    const base = createDefaultWorld();
    // Give player an item in inventory
    const state = {
      ...base,
      player: {
        ...base.player,
        position: { x: 2, y: 3 },
        inventory: [
          {
            id: 'drop_target',
            name: 'Cell',
            description: 'Ready to drop',
            relicType: 'power_cell' as const,
            weightGrams: 250,
          },
        ],
      },
      groundItems: [],
    };

    const res = step(state, { type: 'DROP', itemId: 'drop_target' });
    expect(res.success).toBe(true);
    expect(res.state.player.inventory).toHaveLength(0);
    expect(res.state.groundItems).toHaveLength(1);
    expect(res.state.groundItems[0]?.item.id).toBe('drop_target');
    expect(res.state.groundItems[0]?.position).toEqual({ x: 2, y: 3 });
    // Value copy: groundItem position is not reference-identical to player position
    expect(res.state.groundItems[0]?.position).not.toBe(res.state.player.position);
    expect(res.events).toEqual([
      {
        type: 'ITEM_DROPPED',
        item: expect.objectContaining({ id: 'drop_target' }),
        position: { x: 2, y: 3 },
        tick: res.state.tick,
      },
    ]);
  });

  it('rejects drop if item is not in inventory', () => {
    const state = createDefaultWorld();
    const res = step(state, { type: 'DROP', itemId: 'non_existent' });
    expect(res.success).toBe(false);
    expect(res.events[0]?.reason).toBe('Item not found in inventory');
    expect(res.state.tick).toBe(state.tick);
  });
});
