import { CanvasRenderer } from './render/canvasRenderer.ts';
import { HudController } from './ui/hud.ts';
import { LocalSimulationStream } from './net/localSimulationStream.ts';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const renderer = new CanvasRenderer(canvas);
  const stream = new LocalSimulationStream();

  const hud = new HudController({
    onPickup: (itemId) => {
      stream.dispatch({ type: 'PICKUP', itemId });
    },
    onDrop: (itemId) => {
      stream.dispatch({ type: 'DROP', itemId });
    },
  });

  // Subscribe renderer and HUD to the simulation state stream
  stream.subscribe((state, events) => {
    renderer.render(state);
    hud.update(state, events);
  });

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    let handled = false;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        stream.dispatch({ type: 'MOVE', direction: 'north' });
        handled = true;
        break;

      case 'ArrowDown':
      case 's':
      case 'S':
        stream.dispatch({ type: 'MOVE', direction: 'south' });
        handled = true;
        break;

      case 'ArrowLeft':
      case 'a':
      case 'A':
        stream.dispatch({ type: 'MOVE', direction: 'west' });
        handled = true;
        break;

      case 'ArrowRight':
      case 'd':
      case 'D':
        stream.dispatch({ type: 'MOVE', direction: 'east' });
        handled = true;
        break;

      case ' ':
      case '.':
        stream.dispatch({ type: 'WAIT' });
        handled = true;
        break;

      case 'g':
      case 'G':
      case 'Enter':
        stream.dispatch({ type: 'PICKUP' });
        handled = true;
        break;

      case 'x':
      case 'X': {
        const state = stream.getState();
        if (state.player.inventory.length > 0) {
          const topItem = state.player.inventory[0]!;
          stream.dispatch({ type: 'DROP', itemId: topItem.id });
        }
        handled = true;
        break;
      }
    }

    if (handled) {
      e.preventDefault();
    }
  });
});
