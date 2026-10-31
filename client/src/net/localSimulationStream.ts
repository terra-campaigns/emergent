import {
  createDefaultHexWorld,
  HexGameAction,
  HexGameEvent,
  HexSimulationResult,
  hexStep,
  HexWorldState,
} from '@emergent/engine';

export type SimulationListener = (state: HexWorldState, events: readonly HexGameEvent[]) => void;

/**
 * Local state synchronisation stream for the hexagonal simulation engine.
 * Encapsulates the headless simulation engine and notifies listeners
 * on each state transition.
 */
export class LocalSimulationStream {
  private state: HexWorldState;
  private listeners: SimulationListener[] = [];

  constructor() {
    this.state = createDefaultHexWorld();
  }

  public getState(): HexWorldState {
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

  public dispatch(action: HexGameAction): HexSimulationResult {
    const result = hexStep(this.state, action);
    this.state = result.state;
    this.notify(result.events);
    return result;
  }

  private notify(events: readonly HexGameEvent[]): void {
    for (const listener of this.listeners) {
      listener(this.state, events);
    }
  }
}
