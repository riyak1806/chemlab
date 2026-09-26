/**
 * Chemistry Engine Types & Constants
 */

/**
 * Standard failure reasons for non-reacting laboratory states.
 */
const FailureReasons = {
  INVALID_CHEMICAL_ID: 'invalid_chemical_id',
  NO_REACTION: 'no_reaction',
  MISSING_REACTANT: 'missing_reactant',
  INSUFFICIENT_QUANTITY: 'insufficient_quantity',
  CONDITION_NOT_MET: 'condition_not_met'
};

/**
 * Standard visual effect identifiers supported by dataset and engine.
 */
const VisualEffects = {
  NEUTRALIZATION: 'neutralization',
  PRECIPITATION: 'precipitation',
  GAS_EVOLUTION: 'gas_evolution',
  COLOR_CHANGE: 'color_change',
  COMBUSTION: 'combustion',
  FLAME: 'flame',
  SPARK: 'spark',
  ELECTROLYSIS: 'electrolysis',
  SMOKE: 'smoke',
  CRYSTAL_GROWTH: 'crystal_growth',
  TEMPERATURE_RISING: 'temperature_rise',
  TEMPERATURE_DROPPING: 'temperature_drop'
};

export { FailureReasons, VisualEffects };
