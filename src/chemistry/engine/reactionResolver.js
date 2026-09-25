/**
 * Reaction Resolver
 * Resolves state updates, temperature changes, pH changes, and product formation.
 */

const { resolveStoichiometry } = require('./quantityResolver');

function resolveReaction(reactionMatch, simulationState, datasetChemicalsMap) {
  const { reaction, contentsMap } = reactionMatch;

  // 1. Resolve Stoichiometry
  const stoichResult = resolveStoichiometry(reaction, contentsMap, datasetChemicalsMap);
  if (!stoichResult.success) {
    return stoichResult;
  }

  const { consumedReactants, producedProducts, scale } = stoichResult;

  // 2. Compute updated contents map
  // Clone current contents map
  const updatedContents = new Map();
  for (const item of simulationState.contents) {
    if (datasetChemicalsMap.has(item.chemicalId)) {
      updatedContents.set(item.chemicalId, { ...item });
    }
  }

  // Deduct consumed reactants
  for (const consumed of consumedReactants) {
    const existing = updatedContents.get(consumed.chemicalId);
    if (existing) {
      existing.quantity = Math.max(0, existing.quantity - consumed.quantity);
      if (existing.quantity === 0) {
        updatedContents.delete(consumed.chemicalId);
      }
    }
  }

  // Add produced products
  for (const produced of producedProducts) {
    const chemicalDef = datasetChemicalsMap.get(produced.chemicalId);
    const existing = updatedContents.get(produced.chemicalId);
    if (existing) {
      existing.quantity += produced.quantity;
    } else if (chemicalDef) {
      updatedContents.set(produced.chemicalId, {
        chemicalId: produced.chemicalId,
        quantity: produced.quantity,
        unit: chemicalDef.state === 'solid' ? 'g' : chemicalDef.state === 'gas' ? 'L' : 'mL',
        concentration: chemicalDef.type === 'solution' ? 1.0 : null
      });
    }
  }

  // Convert updatedContents map back to array
  const nextContents = Array.from(updatedContents.values());

  // 3. Compute temperature change
  const currentTemp = simulationState.temperature !== undefined ? simulationState.temperature : 25.0;
  const effects = reaction.effects || {};
  let tempDelta = 0;
  if (typeof effects.temperatureChange === 'number') {
    // Scale slightly with reaction scale, or apply full delta
    tempDelta = effects.temperatureChange;
  }
  const nextTemperature = Math.round((currentTemp + tempDelta) * 10) / 10;

  // 4. Compute resulting pH
  let nextPh = simulationState.ph !== undefined ? simulationState.ph : 7.0;
  if (effects.phChange && typeof effects.targetPh === 'number') {
    nextPh = effects.targetPh;
  } else if (nextContents.length > 0) {
    // Estimate pH from remaining contents if targetPh not explicitly set
    let totalWaterVolume = 0;
    let WeightedPhSum = 0;
    let phCount = 0;
    for (const c of nextContents) {
      const def = datasetChemicalsMap.get(c.chemicalId);
      if (def && typeof def.properties.ph === 'number') {
        WeightedPhSum += def.properties.ph;
        phCount++;
      }
    }
    if (phCount > 0) {
      nextPh = Math.round((WeightedPhSum / phCount) * 10) / 10;
    }
  }

  return {
    success: true,
    reactionId: reaction.id,
    reactionType: reaction.type,
    reaction,
    scale,
    consumedReactants,
    producedProducts,
    nextState: {
      containerId: simulationState.containerId || 'container',
      temperature: nextTemperature,
      ph: nextPh,
      contents: nextContents,
      isHeating: simulationState.isHeating || false
    }
  };
}

module.exports = {
  resolveReaction
};
