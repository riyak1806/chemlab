/**
 * Main Chemistry Engine Class
 * Serves as the central API for data lookup, reaction matching,
 * condition & quantity resolution, and laboratory state simulation.
 */

import fs from 'fs';
import path from 'path';
import { findMatchingReactions } from './reactionMatcher.js';
import { resolveReaction } from './reactionResolver.js';
import { buildSuccessResult, buildFailureResult } from './resultBuilder.js';
import { FailureReasons } from '../types/index.js';

class ChemistryEngine {
  constructor(options = {}) {
    const dataDir = options.dataDir || '';
    this.dataDir = dataDir;

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

    if (options.datasets) {
      this.loadDatasetsFromObject(options.datasets);
    } else {
      this.loadDatasets();
    }
  }

  loadDatasetsFromObject(datasets = {}) {
    this.elements = datasets.elements || [];
    this.elements.forEach((e) => {
      this.elementsMap.set(e.id, e);
      if (e.atomicNumber) this.elementsMap.set(String(e.atomicNumber), e);
    });

    this.chemicals = datasets.chemicals || [];
    this.chemicals.forEach((c) => this.chemicalsMap.set(c.id, c));

    this.equipment = datasets.equipment || [];
    this.equipment.forEach((eq) => this.equipmentMap.set(eq.id, eq));

    this.reactionTypes = datasets.reactionTypes || [];
    this.reactionTypes.forEach((rt) => this.reactionTypesMap.set(rt.id, rt));

    this.reactions = datasets.reactions || [];
    this.reactions.forEach((r) => this.reactionsMap.set(r.id, r));

    this.experiments = datasets.experiments || [];
    this.experiments.forEach((exp) => this.experimentsMap.set(exp.id, exp));

    this.challenges = datasets.challenges || [];
    this.challenges.forEach((ch) => this.challengesMap.set(ch.id, ch));

    this.achievements = datasets.achievements || [];
    this.achievements.forEach((ach) => this.achievementsMap.set(ach.id, ach));
  }

  loadDatasets() {
    if (typeof window !== 'undefined' || !fs || !fs.existsSync) {
      return;
    }
    try {
      const dataDirectory = this.dataDir || path.join(process.cwd(), 'data');
      const indexPath = path.join(dataDirectory, 'index.json');
      if (!fs.existsSync(indexPath)) return;

      const masterIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      const datasetPaths = masterIndex.datasets || {};

      const readJson = (relPath) => {
        if (!relPath) return [];
        const fullPath = path.join(dataDirectory, relPath);
        if (!fs.existsSync(fullPath)) return [];
        return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      };

      this.elements = readJson(datasetPaths.elements);
      this.elements.forEach((e) => {
        this.elementsMap.set(e.id, e);
        if (e.atomicNumber) this.elementsMap.set(String(e.atomicNumber), e);
      });

      this.chemicals = readJson(datasetPaths.chemicals);
      this.chemicals.forEach((c) => this.chemicalsMap.set(c.id, c));

      this.equipment = readJson(datasetPaths.equipment);
      this.equipment.forEach((eq) => this.equipmentMap.set(eq.id, eq));

      this.reactionTypes = readJson(datasetPaths.reactionTypes);
      this.reactionTypes.forEach((rt) => this.reactionTypesMap.set(rt.id, rt));

      this.reactions = readJson(datasetPaths.reactions);
      this.reactions.forEach((r) => this.reactionsMap.set(r.id, r));

      this.experiments = readJson(datasetPaths.experiments);
      this.experiments.forEach((exp) => this.experimentsMap.set(exp.id, exp));

      this.challenges = readJson(datasetPaths.challenges);
      this.challenges.forEach((ch) => this.challengesMap.set(ch.id, ch));

      this.achievements = readJson(datasetPaths.achievements);
      this.achievements.forEach((ach) => this.achievementsMap.set(ach.id, ach));
    } catch (e) {
      console.warn('Failed to load datasets from disk:', e);
    }
  }

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

  simulate(simulationState) {
    if (!simulationState || typeof simulationState !== 'object') {
      return buildFailureResult(FailureReasons.INVALID_CHEMICAL_ID, 'Simulation state object is invalid or missing.');
    }

    const contents = simulationState.contents;
    if (!Array.isArray(contents)) {
      return buildFailureResult(FailureReasons.INVALID_CHEMICAL_ID, 'Simulation state contents must be an array.', [], simulationState);
    }

    for (const item of contents) {
      if (!item || !item.chemicalId || typeof item.chemicalId !== 'string') {
        return buildFailureResult(FailureReasons.INVALID_CHEMICAL_ID, 'One or more items in contents are missing a valid chemicalId.', [], simulationState);
      }
      if (!this.chemicalsMap.has(item.chemicalId)) {
        return buildFailureResult(FailureReasons.INVALID_CHEMICAL_ID, `Chemical ID '${item.chemicalId}' is not found in dataset.`, [], simulationState);
      }
    }

    const matchResult = findMatchingReactions(simulationState, this.reactions, this.chemicalsMap);
    const { matches = [] } = matchResult;

    if (matches.length === 0) {
      return buildFailureResult(FailureReasons.NO_REACTION, 'No matching chemical reaction found for present chemicals.', [], simulationState);
    }

    const topMatch = matches[0];

    if (!topMatch.conditionsMet) {
      return buildFailureResult(
        FailureReasons.CONDITION_NOT_MET,
        topMatch.conditionResult.details || 'Reaction conditions were not met.',
        matches,
        simulationState
      );
    }

    const resolution = resolveReaction(topMatch, simulationState, this.chemicalsMap);

    if (!resolution.success) {
      return buildFailureResult(
        resolution.reason || FailureReasons.INSUFFICIENT_QUANTITY,
        resolution.details || 'Stoichiometry or quantity condition not met.',
        matches,
        simulationState
      );
    }

    return buildSuccessResult(resolution);
  }

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

export { ChemistryEngine };
export default ChemistryEngine;
