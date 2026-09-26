/**
 * Condition Resolver
 * Evaluates environmental parameters (temperature, heating, catalysts, equipment)
 * against a reaction's condition requirements.
 */

function evaluateConditions(reaction, simulationState, presentChemicalIdsSet) {
  const conditions = reaction.conditions || {};
  const temp = simulationState.temperature !== undefined ? simulationState.temperature : 25.0;

  // 1. Temperature range check
  if (conditions.minTemperature !== undefined && conditions.minTemperature !== null) {
    if (temp < conditions.minTemperature) {
      return {
        met: false,
        reason: 'temperature_below_minimum',
        details: `Required minimum temperature is ${conditions.minTemperature}°C, current is ${temp}°C.`
      };
    }
  }

  if (conditions.maxTemperature !== undefined && conditions.maxTemperature !== null) {
    if (temp > conditions.maxTemperature) {
      return {
        met: false,
        reason: 'temperature_above_maximum',
        details: `Required maximum temperature is ${conditions.maxTemperature}°C, current is ${temp}°C.`
      };
    }
  }

  // 2. Requires heating check
  if (conditions.requiresHeating) {
    const isHeating = Boolean(simulationState.isHeating || simulationState.heating);
    const reqMinTemp = conditions.minTemperature || 50.0;
    if (!isHeating && temp < reqMinTemp) {
      return {
        met: false,
        reason: 'requires_heating',
        details: `Reaction '${reaction.id}' requires heating or temperature >= ${reqMinTemp}°C.`
      };
    }
  }

  // 3. Catalyst check
  if (conditions.catalyst) {
    if (!presentChemicalIdsSet.has(conditions.catalyst)) {
      return {
        met: false,
        reason: 'missing_catalyst',
        details: `Reaction '${reaction.id}' requires catalyst '${conditions.catalyst}'.`
      };
    }
  }

  return {
    met: true
  };
}

export { evaluateConditions };
