import {
  createDefaultWorld,
  GameAction,
  GameEvent,
  SimulationResult,
  step,
  WorldState,
} from '@emergent/engine';

export type SimulationListener = (state: WorldState, events: readonly GameEvent[]) => void;

/**
 * Local state synchronisation stream.
 * Encapsulates the headless simulation engine and notifies listeners
 * on each state transition.
 */
export class LocalSimulationStream {
  private state: WorldState;
  private listeners: SimulationListener[] = [];

  constructor() {
    this.state = createDefaultWorld();
  }

  public getState(): WorldState {
    return this.state;
  }

  public subscribe(listener: SimulationListener): () => void {
    this.listeners.push(listener);
    // Emit initial state
    listener(this.state, []);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public dispatch(action: GameAction): SimulationResult {
    const result = step(this.state, action);
    this.state = result.state;
    this.notify(result.events);
    return result;
  }

  private notify(events: readonly GameEvent[]): void {
    for (const listener of this.listeners) {
      listener(this.state, events);
    }
  }
}
