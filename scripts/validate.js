/**
 * ChemLab Scientific Dataset Validator
 *
 * Performs comprehensive verification across all ChemLab dataset files:
 * 1. Valid JSON syntax & file existence referenced in data/index.json
 * 2. Uniqueness of IDs across all datasets
 * 3. Complete elements dataset (All 118 elements, atomic numbers 1-118 present)
 * 4. Cross-reference validation:
 *    - Element categories exist in element_categories.json
 *    - Chemical categories exist in chemical_categories.json
 *    - Reaction types exist in reaction_types.json
 *    - Reaction chemical IDs exist in chemicals.json
 *    - Experiment chemical IDs exist in chemicals.json
 *    - Experiment equipment IDs exist in equipment.json
 *    - Experiment reaction IDs exist in reactions.json
 * 5. Value constraints, units, and non-empty required fields
 * 6. Verification metadata audit (flags review_required entries)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

let errors = [];
let warnings = [];
let reviewRequiredEntries = [];

function logError(msg) {
  errors.push(`[ERROR] ${msg}`);
}

function logWarning(msg) {
  warnings.push(`[WARN] ${msg}`);
}

function readJsonFile(relativePath) {
  const fullPath = path.join(DATA_DIR, relativePath);
  if (!fs.existsSync(fullPath)) {
    logError(`File not found: ${fullPath}`);
    return null;
  }
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    logError(`Invalid JSON syntax in file ${relativePath}: ${err.message}`);
    return null;
  }
}

function validateDataset() {
  console.log('=== ChemLab Dataset Validation Suite ===\n');

  if (!fs.existsSync(INDEX_FILE)) {
    logError(`Master index file missing: ${INDEX_FILE}`);
    return printSummary();
  }

  const indexData = readJsonFile('index.json');
  if (!indexData || !indexData.datasets) {
    logError('Master index.json missing or invalid datasets object.');
    return printSummary();
  }

  const datasets = indexData.datasets;

  // Load all dataset contents
  const elementCategories = readJsonFile(datasets.elementCategories);
  const elements = readJsonFile(datasets.elements);
  const chemicalCategories = readJsonFile(datasets.chemicalCategories);
  const chemicals = readJsonFile(datasets.chemicals);
  const equipment = readJsonFile(datasets.equipment);
  const reactionTypes = readJsonFile(datasets.reactionTypes);
  const reactions = readJsonFile(datasets.reactions);
  const experiments = readJsonFile(datasets.experiments);
  const challenges = readJsonFile(datasets.challenges);
  const achievements = readJsonFile(datasets.achievements);

  // 1. Element Categories Validation
  const validElementCategoryIds = new Set();
  if (Array.isArray(elementCategories)) {
    elementCategories.forEach((cat, idx) => {
      if (!cat.id) logError(`Element Category at index ${idx} missing 'id'`);
      else {
        if (validElementCategoryIds.has(cat.id)) logError(`Duplicate Element Category ID: ${cat.id}`);
        validElementCategoryIds.add(cat.id);
      }
    });
  }

  // 2. Elements Validation (1-118 complete)
  const elementIds = new Set();
  const atomicNumbersSeen = new Set();
  if (Array.isArray(elements)) {
    if (elements.length !== 118) {
      logError(`Elements dataset must contain exactly 118 elements, found ${elements.length}`);
    }
    elements.forEach((elem) => {
      if (!elem.id) logError(`Element missing 'id': atomicNumber ${elem.atomicNumber}`);
      else {
        if (elementIds.has(elem.id)) logError(`Duplicate Element ID: ${elem.id}`);
        elementIds.add(elem.id);
      }

      if (typeof elem.atomicNumber !== 'number' || elem.atomicNumber < 1 || elem.atomicNumber > 118) {
        logError(`Invalid atomic number ${elem.atomicNumber} for element ${elem.id || elem.name}`);
      } else {
        if (atomicNumbersSeen.has(elem.atomicNumber)) logError(`Duplicate atomic number: ${elem.atomicNumber}`);
        atomicNumbersSeen.add(elem.atomicNumber);
      }

      if (!elem.symbol) logError(`Element ${elem.id} missing symbol`);
      if (!elem.name) logError(`Element ${elem.id} missing name`);
      if (!elem.category || !validElementCategoryIds.has(elem.category)) {
        logError(`Element ${elem.id} references invalid category '${elem.category}'`);
      }

      // Audit verification
      if (elem.verification) {
        if (elem.verification.status === 'review_required') {
          reviewRequiredEntries.push(`Element #${elem.atomicNumber} ${elem.name} (${elem.id}): ${elem.verification.notes}`);
        }
      } else {
        logError(`Element ${elem.id} missing verification metadata`);
      }
    });

    for (let i = 1; i <= 118; i++) {
      if (!atomicNumbersSeen.has(i)) {
        logError(`Missing element with atomic number ${i}`);
      }
    }
  }

  // 3. Chemical Categories Validation
  const validChemicalCategoryIds = new Set();
  if (Array.isArray(chemicalCategories)) {
    chemicalCategories.forEach((cat, idx) => {
      if (!cat.id) logError(`Chemical Category at index ${idx} missing 'id'`);
      else {
        if (validChemicalCategoryIds.has(cat.id)) logError(`Duplicate Chemical Category ID: ${cat.id}`);
        validChemicalCategoryIds.add(cat.id);
      }
    });
  }

  // 4. Chemicals Validation
  const chemicalIds = new Set();
  if (Array.isArray(chemicals)) {
    if (chemicals.length < 40) {
      logWarning(`Chemicals count is ${chemicals.length}, expected 40-50 for MVP.`);
    }
    chemicals.forEach((chem) => {
      if (!chem.id) logError(`Chemical missing 'id': ${chem.name}`);
      else {
        if (chemicalIds.has(chem.id)) logError(`Duplicate Chemical ID: ${chem.id}`);
        chemicalIds.add(chem.id);
      }

      if (!chem.formula) logError(`Chemical ${chem.id} missing formula`);
      if (!Array.isArray(chem.categories) || chem.categories.length === 0) {
        logError(`Chemical ${chem.id} has no categories defined`);
      } else {
        chem.categories.forEach((c) => {
          if (!validChemicalCategoryIds.has(c)) {
            logError(`Chemical ${chem.id} uses invalid category '${c}'`);
          }
        });
      }

      // Verification metadata
      if (chem.verification) {
        if (chem.verification.status === 'review_required') {
          reviewRequiredEntries.push(`Chemical ${chem.name} (${chem.id}): ${chem.verification.notes}`);
        }
      } else {
        logError(`Chemical ${chem.id} missing verification metadata`);
      }
    });
  }

  // 5. Equipment Validation
  const equipmentIds = new Set();
  if (Array.isArray(equipment)) {
    equipment.forEach((eq) => {
      if (!eq.id) logError(`Equipment item missing 'id': ${eq.name}`);
      else {
        if (equipmentIds.has(eq.id)) logError(`Duplicate Equipment ID: ${eq.id}`);
        equipmentIds.add(eq.id);
      }
      if (!eq.name) logError(`Equipment ${eq.id} missing name`);
      if (!Array.isArray(eq.supportedActions)) logError(`Equipment ${eq.id} missing supportedActions array`);
    });
  }

  // 6. Reaction Types Validation
  const validReactionTypeIds = new Set();
  if (Array.isArray(reactionTypes)) {
    reactionTypes.forEach((rt) => {
      if (!rt.id) logError(`Reaction Type missing 'id': ${rt.name}`);
      else {
        if (validReactionTypeIds.has(rt.id)) logError(`Duplicate Reaction Type ID: ${rt.id}`);
        validReactionTypeIds.add(rt.id);
      }
    });
  }

  // 7. Reactions Validation
  const reactionIds = new Set();
  if (Array.isArray(reactions)) {
    reactions.forEach((rxn) => {
      if (!rxn.id) logError(`Reaction missing 'id': ${rxn.name}`);
      else {
        if (reactionIds.has(rxn.id)) logError(`Duplicate Reaction ID: ${rxn.id}`);
        reactionIds.add(rxn.id);
      }

      if (!rxn.type || !validReactionTypeIds.has(rxn.type)) {
        logError(`Reaction ${rxn.id} references invalid reaction type '${rxn.type}'`);
      }

      if (!Array.isArray(rxn.reactants) || rxn.reactants.length === 0) {
        logError(`Reaction ${rxn.id} has no reactants`);
      } else {
        rxn.reactants.forEach((r) => {
          if (!r.chemicalId || !chemicalIds.has(r.chemicalId)) {
            logError(`Reaction ${rxn.id} reactant chemical ID '${r.chemicalId}' not found in chemicals.json`);
          }
        });
      }

      if (!Array.isArray(rxn.products)) {
        logError(`Reaction ${rxn.id} products must be an array`);
      } else {
        rxn.products.forEach((p) => {
          if (!p.chemicalId || !chemicalIds.has(p.chemicalId)) {
            logError(`Reaction ${rxn.id} product chemical ID '${p.chemicalId}' not found in chemicals.json`);
          }
        });
      }

      if (!rxn.equation) logError(`Reaction ${rxn.id} missing chemical equation string`);
      if (!rxn.visualEffect) logError(`Reaction ${rxn.id} missing visualEffect key`);

      // Verification metadata
      if (rxn.verification) {
        if (rxn.verification.status === 'review_required') {
          reviewRequiredEntries.push(`Reaction ${rxn.name} (${rxn.id}): ${rxn.verification.notes}`);
        }
      } else {
        logError(`Reaction ${rxn.id} missing verification metadata`);
      }
    });
  }

  // 8. Experiments Validation
  const experimentIds = new Set();
  if (Array.isArray(experiments)) {
    experiments.forEach((exp) => {
      if (!exp.id) logError(`Experiment missing 'id': ${exp.title}`);
      else {
        if (experimentIds.has(exp.id)) logError(`Duplicate Experiment ID: ${exp.id}`);
        experimentIds.add(exp.id);
      }

      if (Array.isArray(exp.availableChemicals)) {
        exp.availableChemicals.forEach((cId) => {
          if (!chemicalIds.has(cId)) {
            logError(`Experiment ${exp.id} references unknown chemical ID '${cId}'`);
          }
        });
      }

      if (Array.isArray(exp.availableEquipment)) {
        exp.availableEquipment.forEach((eqId) => {
          if (!equipmentIds.has(eqId)) {
            logError(`Experiment ${exp.id} references unknown equipment ID '${eqId}'`);
          }
        });
      }

      if (Array.isArray(exp.relatedReactions)) {
        exp.relatedReactions.forEach((rxnId) => {
          if (!reactionIds.has(rxnId)) {
            logError(`Experiment ${exp.id} references unknown reaction ID '${rxnId}'`);
          }
        });
      }
    });
  }

  // 9. Challenges Validation
  const challengeIds = new Set();
  if (Array.isArray(challenges)) {
    challenges.forEach((ch) => {
      if (!ch.id) logError(`Challenge missing 'id': ${ch.title}`);
      else {
        if (challengeIds.has(ch.id)) logError(`Duplicate Challenge ID: ${ch.id}`);
        challengeIds.add(ch.id);
      }
    });
  }

  // 10. Achievements Validation
  const achievementIds = new Set();
  if (Array.isArray(achievements)) {
    achievements.forEach((ach) => {
      if (!ach.id) logError(`Achievement missing 'id': ${ach.title}`);
      else {
        if (achievementIds.has(ach.id)) logError(`Duplicate Achievement ID: ${ach.id}`);
        achievementIds.add(ach.id);
      }
      if (!ach.condition) logError(`Achievement ${ach.id} missing condition object`);
    });
  }

  printSummary();
}

function printSummary() {
  console.log('--- Summary Audit Results ---');
  console.log(`Review Required Entries Count: ${reviewRequiredEntries.length}`);
  if (reviewRequiredEntries.length > 0) {
    reviewRequiredEntries.forEach((item) => console.log(`  * ${item}`));
  }

  if (warnings.length > 0) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  ${w}`));
  }

  if (errors.length > 0) {
    console.log(`\nValidation FAILED with ${errors.length} errors:`);
    errors.forEach((e) => console.log(`  ${e}`));
    process.exit(1);
  } else {
    console.log('\n✅ Dataset Validation PASSED with 0 errors!\n');
    process.exit(0);
  }
}

validateDataset();
