/**
 * Reaction Matcher
 * Identifies compatible reactions from the dataset based on present chemicals and conditions.
 */

const { evaluateConditions } = require('./conditionResolver');

/**
 * Finds all candidate reactions where all required reactants are present.
 * Evaluates conditions and applies deterministic ranking.
 */
function findMatchingReactions(simulationState, datasetReactions, datasetChemicalsMap) {
  const contents = simulationState.contents || [];

  // Build set of present chemical IDs with quantity > 0
  const presentChemicalIds = new Set();
  const contentsMap = new Map();

  for (const item of contents) {
    if (item && item.chemicalId && datasetChemicalsMap.has(item.chemicalId)) {
      if (item.quantity > 0) {
        presentChemicalIds.add(item.chemicalId);
        contentsMap.set(item.chemicalId, item);
      }
    }
  }

  if (presentChemicalIds.size === 0) {
    return {
      matches: [],
      candidateCount: 0,
      contentsMap,
      presentChemicalIds
    };
  }

  const matchingReactions = [];

  for (const reaction of datasetReactions) {
    const reactants = reaction.reactants || [];
    if (reactants.length === 0) continue;

    // Verify all reactants are present in presentChemicalIds
    const allReactantsPresent = reactants.every((r) => presentChemicalIds.has(r.chemicalId));

    if (!allReactantsPresent) continue;

    // Evaluate environmental conditions for this candidate reaction
    const conditionResult = evaluateConditions(reaction, simulationState, presentChemicalIds);

    matchingReactions.push({
      reaction,
      conditionsMet: conditionResult.met,
      conditionResult,
      contentsMap,
      presentChemicalIds
    });
  }

  // Sort matching reactions deterministically:
  // Rule 1: Reactions whose conditions are fully met come first.
  // Rule 2: Reactions requiring more reactants (higher specificity / reactant count) come first.
  // Rule 3: Reactions with lower difficulty rating come first.
  // Rule 4: Alphabetical order by reaction.id for complete determinism.
  matchingReactions.sort((a, b) => {
    if (a.conditionsMet !== b.conditionsMet) {
      return a.conditionsMet ? -1 : 1;
    }
    const numReactantsA = a.reaction.reactants.length;
    const numReactantsB = b.reaction.reactants.length;
    if (numReactantsA !== numReactantsB) {
      return numReactantsB - numReactantsA;
    }
    const diffA = a.reaction.difficulty || 1;
    const diffB = b.reaction.difficulty || 1;
    if (diffA !== diffB) {
      return diffA - diffB;
    }
    return a.reaction.id.localeCompare(b.reaction.id);
  });

  return {
    matches: matchingReactions,
    candidateCount: matchingReactions.length,
    contentsMap,
    presentChemicalIds
  };
}

module.exports = {
  findMatchingReactions
};
