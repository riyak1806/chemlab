/**
 * Main Chemistry Engine Class
 * Serves as the central API for data lookup, reaction matching,
 * condition & quantity resolution, and laboratory state simulation.
 */

const path = require('path');
const fs = require('fs');

const { findMatchingReactions } = require('./reactionMatcher');
const { resolveReaction } = require('./reactionResolver');
const { buildSuccessResult, buildFailureResult } = require('./resultBuilder');
const { FailureReasons } = require('../types');

class ChemistryEngine {
  /**
   * @param {Object} options Configuration options
   * @param {string} [options.dataDir] Path to the data directory (defaults to repository data/ directory)
   */
  constructor(options = {}) {
    const dataDir = options.dataDir || path.join(__dirname, '..', '..', '..', 'data');
    this.dataDir = dataDir;

    // In-memory dataset registries
    this.elements = [];
    this.elementsMap = new Map();

    this.chemicals = [];
    this.chemicalsMap = new Map();

    this.equipment = [];
    this.equipmentMap = new Map();

    this.reactions = [];
    this.reactionsMap = new Map();

    this.reactionTypes = [];
    this.reactionTypesMap = new Map();

    this.experiments = [];
    this.experimentsMap = new Map();

    this.challenges = [];
    this.challengesMap = new Map();

    this.achievements = [];
    this.achievementsMap = new Map();

    this.loadDatasets();
  }

  /**
   * Loads and indexes all JSON dataset files.
   */
  loadDatasets() {
    const indexPath = path.join(this.dataDir, 'index.json');
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Master index file not found at ${indexPath}`);
    }

    const masterIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const datasetPaths = masterIndex.datasets || {};

    // Helper to read json
    const readJson = (relPath) => {
      if (!relPath) return [];
      const fullPath = path.join(this.dataDir, relPath);
      if (!fs.existsSync(fullPath)) return [];
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    };

    // Load Elements
    this.elements = readJson(datasetPaths.elements);
    this.elements.forEach((e) => {
      this.elementsMap.set(e.id, e);
      if (e.atomicNumber) this.elementsMap.set(String(e.atomicNumber), e);
    });

    // Load Chemicals
    this.chemicals = readJson(datasetPaths.chemicals);
    this.chemicals.forEach((c) => this.chemicalsMap.set(c.id, c));

    // Load Equipment
    this.equipment = readJson(datasetPaths.equipment);
    this.equipment.forEach((eq) => this.equipmentMap.set(eq.id, eq));

    // Load Reaction Types
    this.reactionTypes = readJson(datasetPaths.reactionTypes);
    this.reactionTypes.forEach((rt) => this.reactionTypesMap.set(rt.id, rt));

    // Load Reactions
    this.reactions = readJson(datasetPaths.reactions);
    this.reactions.forEach((r) => this.reactionsMap.set(r.id, r));

    // Load Experiments
    this.experiments = readJson(datasetPaths.experiments);
    this.experiments.forEach((exp) => this.experimentsMap.set(exp.id, exp));

    // Load Challenges
    this.challenges = readJson(datasetPaths.challenges);
    this.challenges.forEach((ch) => this.challengesMap.set(ch.id, ch));

    // Load Achievements
    this.achievements = readJson(datasetPaths.achievements);
    this.achievements.forEach((ach) => this.achievementsMap.set(ach.id, ach));
  }

  // --- Public Data Accessors ---

  getElement(idOrAtomicNumber) {
    return this.elementsMap.get(String(idOrAtomicNumber)) || null;
  }

  getChemical(id) {
    return this.chemicalsMap.get(id) || null;
  }

  getEquipment(id) {
    return this.equipmentMap.get(id) || null;
  }

  getReaction(id) {
    return this.reactionsMap.get(id) || null;
  }

  getExperiment(id) {
    return this.experimentsMap.get(id) || null;
  }

  getChallenge(id) {
    return this.challengesMap.get(id) || null;
  }

  getAchievement(id) {
    return this.achievementsMap.get(id) || null;
  }

  getAllElements() {
    return this.elements;
  }

  getAllChemicals() {
    return this.chemicals;
  }

  getAllReactions() {
    return this.reactions;
  }

  getAllEquipment() {
    return this.equipment;
  }

  // --- Core Simulation API ---

  /**
   * Finds matching reactions for a given simulation state without applying changes.
   * @param {Object} simulationState
   * @returns {Object} Matching reactions and evaluation details
   */
  findReactions(simulationState) {
    if (!simulationState || !Array.isArray(simulationState.contents)) {
      return {
        success: false,
        reason: FailureReasons.INVALID_CHEMICAL_ID,
        matches: []
      };
    }
    return findMatchingReactions(simulationState, this.reactions, this.chemicalsMap);
  }

  /**
   * Simulates chemical interactions for a laboratory state.
   * @param {Object} simulationState The structured input state
   * @returns {Object} Structured reaction result object
   */
  simulate(simulationState) {
    // 1. Validate simulation state structure and contents
    if (!simulationState || typeof simulationState !== 'object') {
      return buildFailureResult(FailureReasons.INVALID_CHEMICAL_ID, 'Simulation state object is invalid or missing.');
    }

    const contents = simulationState.contents;
    if (!Array.isArray(contents)) {
      return buildFailureResult(FailureReasons.INVALID_CHEMICAL_ID, 'Simulation state contents must be an array.', [], simulationState);
    }

    // Verify input chemical IDs against dataset
    for (const item of contents) {
      if (!item || !item.chemicalId || typeof item.chemicalId !== 'string') {
        return buildFailureResult(FailureReasons.INVALID_CHEMICAL_ID, 'One or more items in contents are missing a valid chemicalId.', [], simulationState);
      }
      if (!this.chemicalsMap.has(item.chemicalId)) {
        return buildFailureResult(FailureReasons.INVALID_CHEMICAL_ID, `Chemical ID '${item.chemicalId}' is not found in dataset.`, [], simulationState);
      }
    }

    // 2. Perform Reaction Matching
    const matchResult = findMatchingReactions(simulationState, this.reactions, this.chemicalsMap);
    const { matches } = matchResult;

    if (matches.length === 0) {
      return buildFailureResult(FailureReasons.NO_REACTION, 'No matching chemical reaction found for present chemicals.', [], simulationState);
    }

    // Top match
    const topMatch = matches[0];

    // Check if top match conditions were met
    if (!topMatch.conditionsMet) {
      return buildFailureResult(
        FailureReasons.CONDITION_NOT_MET,
        topMatch.conditionResult.details || 'Reaction conditions were not met.',
        matches,
        simulationState
      );
    }

    // 3. Resolve Reaction
    const resolution = resolveReaction(topMatch, simulationState, this.chemicalsMap);

    if (!resolution.success) {
      return buildFailureResult(
        resolution.reason || FailureReasons.INSUFFICIENT_QUANTITY,
        resolution.details || 'Stoichiometry or quantity condition not met.',
        matches,
        simulationState
      );
    }

    // 4. Build and return structured success result
    return buildSuccessResult(resolution);
  }

  /**
   * Explicitly applies a given reaction to a laboratory state.
   * @param {Object} simulationState
   * @param {Object|string} reactionOrId Reaction object or reaction ID
   * @returns {Object} Structured reaction result object
   */
  applyReaction(simulationState, reactionOrId) {
    const reaction = typeof reactionOrId === 'string' ? this.getReaction(reactionOrId) : reactionOrId;
    if (!reaction) {
      return buildFailureResult(FailureReasons.NO_REACTION, 'Specified reaction does not exist in dataset.', [], simulationState);
    }

    const contents = simulationState.contents || [];
    const contentsMap = new Map();
    const presentChemicalIds = new Set();
    for (const item of contents) {
      if (item && item.chemicalId) {
        contentsMap.set(item.chemicalId, item);
        if (item.quantity > 0) presentChemicalIds.add(item.chemicalId);
      }
    }

    const matchObj = {
      reaction,
      contentsMap,
      presentChemicalIds
    };

    const resolution = resolveReaction(matchObj, simulationState, this.chemicalsMap);
    if (!resolution.success) {
      return buildFailureResult(resolution.reason, resolution.details || 'Unable to apply reaction to current state.', [], simulationState);
    }

    return buildSuccessResult(resolution);
  }
}

module.exports = ChemistryEngine;
