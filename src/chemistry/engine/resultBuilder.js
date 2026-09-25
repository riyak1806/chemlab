/**
 * Result Builder
 * Constructs standardized, typed simulation result objects.
 */

function buildSuccessResult(resolutionResult) {
  const { reaction, scale, consumedReactants, producedProducts, nextState } = resolutionResult;
  const effects = reaction.effects || {};

  return {
    success: true,
    reactionId: reaction.id,
    reactionName: reaction.name,
    reactionType: reaction.type,
    equation: reaction.equation,
    scale,
    consumedReactants,
    products: producedProducts,
    effects: {
      temperatureChange: effects.temperatureChange || 0.0,
      phChange: Boolean(effects.phChange),
      targetPh: effects.targetPh !== undefined ? effects.targetPh : null,
      colorChange: effects.colorChange || null,
      gasProduced: effects.gasProduced || null,
      precipitate: effects.precipitate || null,
      flame: Boolean(effects.flame),
      bubbles: Boolean(effects.bubbles),
      crystalFormation: Boolean(effects.crystalFormation),
      smoke: Boolean(effects.smoke),
      energyChange: effects.energyChange || 'neutral',
      stateChange: effects.stateChange || null
    },
    visualEffect: reaction.visualEffect || 'none',
    explanation: reaction.explanation || '',
    nextState
  };
}

function buildFailureResult(reason, details, matchingCandidates = [], originalState = null) {
  return {
    success: false,
    reactionId: null,
    reason,
    details: details || '',
    candidateCount: matchingCandidates.length,
    matchingReactions: matchingCandidates.map((m) => ({
      reactionId: m.reaction.id,
      conditionsMet: m.conditionsMet,
      conditionDetails: m.conditionResult
    })),
    nextState: originalState ? { ...originalState } : null
  };
}

module.exports = {
  buildSuccessResult,
  buildFailureResult
};
