/**
 * ChemLab Chemistry Engine Module Export
 */

import ChemistryEngine from './engine/ChemistryEngine.js';
import { evaluateConditions } from './engine/conditionResolver.js';
import { resolveStoichiometry } from './engine/quantityResolver.js';
import { findMatchingReactions } from './engine/reactionMatcher.js';
import { resolveReaction } from './engine/reactionResolver.js';
import { buildSuccessResult, buildFailureResult } from './engine/resultBuilder.js';
import { FailureReasons, VisualEffects } from './types/index.js';

export {
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

export default ChemistryEngine;
