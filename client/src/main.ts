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
    onSearch: () => {
      stream.dispatch({ type: 'SEARCH' });
    },
    onRest: () => {
      stream.dispatch({ type: 'REST' });
    },
    onResolveRisk: (invokeBackground, sacrificeItemId) => {
      stream.dispatch({ type: 'RESOLVE_RISK', invokeBackground, sacrificeItemId });
    },
    onAbortRisk: () => {
      stream.dispatch({ type: 'ABORT_RISK' });
    },
  });

  // Subscribe renderer and HUD to the simulation state stream
  stream.subscribe((state, events) => {
    renderer.render(state);
    hud.update(state, events);
  });

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    const currentState = stream.getState();
    let handled = false;

    // When risk modal is active, Escape aborts the risk
    if (currentState.pendingRisk !== undefined) {
      if (e.key === 'Escape') {
        stream.dispatch({ type: 'ABORT_RISK' });
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      // Hexagonal movement
      case 'q':
      case 'Q':
      case 'w':
      case 'W':
      case 'ArrowUp':
        stream.dispatch({ type: 'TRAVEL', direction: 'NW' });
        handled = true;
        break;

      case 'e':
      case 'E':
        stream.dispatch({ type: 'TRAVEL', direction: 'NE' });
        handled = true;
        break;

      case 'a':
      case 'A':
      case 'ArrowLeft':
        stream.dispatch({ type: 'TRAVEL', direction: 'W' });
        handled = true;
        break;

      case 'd':
      case 'D':
      case 'ArrowRight':
        stream.dispatch({ type: 'TRAVEL', direction: 'E' });
        handled = true;
        break;

      case 'z':
      case 'Z':
        stream.dispatch({ type: 'TRAVEL', direction: 'SW' });
        handled = true;
        break;

      case 'c':
      case 'C':
      case 's':
      case 'S':
      case 'ArrowDown':
        stream.dispatch({ type: 'TRAVEL', direction: 'SE' });
        handled = true;
        break;

      // Survey / Search hex
      case 'f':
      case 'F':
        stream.dispatch({ type: 'SEARCH' });
        handled = true;
        break;

      // Diurnal Rest
      case 'r':
      case 'R':
      case ' ':
        stream.dispatch({ type: 'REST' });
        handled = true;
        break;

      // Tactical Pick Up
      case 'g':
      case 'G':
      case 'Enter':
        stream.dispatch({ type: 'PICKUP' });
        handled = true;
        break;

      // Tactical Drop
      case 'x':
      case 'X': {
        if (currentState.player.inventory.length > 0) {
          const topItem = currentState.player.inventory[0]!;
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
