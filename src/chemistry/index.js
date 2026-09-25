/**
 * ChemLab Chemistry Engine Module Export
 */

const ChemistryEngine = require('./engine/ChemistryEngine');
const { evaluateConditions } = require('./engine/conditionResolver');
const { resolveStoichiometry } = require('./engine/quantityResolver');
const { findMatchingReactions } = require('./engine/reactionMatcher');
const { resolveReaction } = require('./engine/reactionResolver');
const { buildSuccessResult, buildFailureResult } = require('./engine/resultBuilder');
const { FailureReasons, VisualEffects } = require('./types');

module.exports = {
  ChemistryEngine,
  evaluateConditions,
  resolveStoichiometry,
  findMatchingReactions,
  resolveReaction,
  buildSuccessResult,
  buildFailureResult,
  FailureReasons,
  VisualEffects
};
