/**
 * Core type definitions for the 24XX rules and resolution system.
 * Strictly adheres to docs/designs/003_rules_system_24xx.md.
 */

import { HexGameAction } from '../hex/types.js';

export type StepDie = 'd4' | 'd6' | 'd8' | 'd10' | 'd12';

export const STEP_DIE_FACES: Readonly<Record<StepDie, number>> = Object.freeze({
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
});

export type RollOutcome = 'disaster' | 'setback' | 'success';

export interface RollResult {
  readonly die: StepDie;
  readonly value: number;       // Integer in [1, faces]
  readonly outcome: RollOutcome;
}

export type WandererCondition = 'healthy' | 'hindered' | 'injured' | 'incapacitated';

export interface WandererBackground {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly die: StepDie;        // Standard starting rating: 'd8'
}

export interface WandererCharacterSheet {
  readonly background: WandererBackground;
  readonly condition: WandererCondition;
  readonly brokenItemIds: readonly string[]; // Carried items sacrificed or broken
}

export type RiskSeverity = 'moderate' | 'perilous' | 'lethal';

export interface RiskPrompt {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: RiskSeverity;
  readonly stakes: string;
  readonly sourceAction: HexGameAction;
  readonly applicableBackgroundId?: string; // e.g. 'scavenger' if surveying ruin
  readonly defaultDie: StepDie;             // 'd6' standard, or 'd4' if hindered
  readonly availableSacrificeItemIds: readonly string[]; // Unbroken carried items
}

export const ARCHETYPE_SCAVENGER: WandererBackground = Object.freeze({
  id: 'scavenger',
  name: 'Ruin Scavenger',
  description: 'Adept in assessing structural integrity and salvaging components from collapsed masonry.',
  die: 'd8',
});

export const ARCHETYPE_NOMAD_GUIDE: WandererBackground = Object.freeze({
  id: 'nomad_guide',
  name: 'Wasteland Nomad Guide',
  description: 'Weathered in long marches, reading horizon omens, and navigating pitch darkness.',
  die: 'd8',
});

export const ARCHETYPE_RELIC_SMITH: WandererBackground = Object.freeze({
  id: 'relic_smith',
  name: 'Titan Relic Smith',
  description: 'Trained in celestial alloy couplings, ancient power cells, and pre-collapse engineering.',
  die: 'd8',
});

export const DEFAULT_ARCHETYPES: Readonly<Record<string, WandererBackground>> = Object.freeze({
  scavenger: ARCHETYPE_SCAVENGER,
  nomad_guide: ARCHETYPE_NOMAD_GUIDE,
  relic_smith: ARCHETYPE_RELIC_SMITH,
});
