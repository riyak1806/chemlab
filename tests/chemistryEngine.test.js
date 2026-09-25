/**
 * Chemistry Engine Automated Test Suite
 * Tests simulation logic, reaction matching, stoichiometry, failure handling,
 * and data integrity against the ACTUAL ChemLab dataset.
 */

const assert = require('assert');
const { ChemistryEngine, FailureReasons } = require('../src/chemistry');

let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
    testsFailed++;
  }
}

function runAllEngineTests() {
  console.log('=== Running ChemLab Chemistry Engine Test Suite ===\n');

  const engine = new ChemistryEngine();

  console.log('--- 1. Public API Data Accessors ---');
  test('getElement retrieves element by ID and atomic number', () => {
    const elemById = engine.getElement('hydrogen');
    assert.ok(elemById, 'Hydrogen element should exist');
    assert.strictEqual(elemById.symbol, 'H');

    const elemByNum = engine.getElement(1);
    assert.ok(elemByNum, 'Element #1 should exist');
    assert.strictEqual(elemByNum.id, 'hydrogen');
  });

  test('getChemical retrieves valid chemical definition', () => {
    const hcl = engine.getChemical('hydrochloric_acid');
    assert.ok(hcl, 'Hydrochloric acid should exist in chemicals dataset');
    assert.strictEqual(hcl.formula, 'HCl(aq)');
  });

  test('getReaction retrieves valid reaction definition', () => {
    const rxn = engine.getReaction('hcl_naoh_neutralization');
    assert.ok(rxn, 'HCl + NaOH neutralization reaction should exist');
    assert.strictEqual(rxn.type, 'neutralization');
  });

  test('getExperiment, getEquipment, getChallenge, getAchievement function correctly', () => {
    assert.ok(engine.getExperiment('neutralize_acid_base'));
    assert.ok(engine.getEquipment('beaker'));
    assert.ok(engine.getChallenge('target_ph_7'));
    assert.ok(engine.getAchievement('first_reaction'));
  });


  console.log('\n--- 2. Successful Reaction Cases ---');
  test('Acid + Base Neutralization (HCl + NaOH)', () => {
    const state = {
      containerId: 'beaker',
      temperature: 25,
      ph: 1.0,
      contents: [
        { chemicalId: 'hydrochloric_acid', quantity: 50, unit: 'mL', concentration: 1 },
        { chemicalId: 'sodium_hydroxide', quantity: 50, unit: 'mL', concentration: 1 }
      ]
    };

    const result = engine.simulate(state);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.reactionId, 'hcl_naoh_neutralization');
    assert.strictEqual(result.reactionType, 'neutralization');
    assert.strictEqual(result.visualEffect, 'neutralization');
    assert.strictEqual(result.effects.targetPh, 7.0);
    assert.strictEqual(result.nextState.ph, 7.0);
    assert.ok(result.nextState.temperature > 25, 'Exothermic neutralization should raise temperature');

    // Check consumed & produced products
    const sodiumChlorideProduct = result.products.find((p) => p.chemicalId === 'sodium_chloride');
    assert.ok(sodiumChlorideProduct, 'Sodium chloride should be produced');
    assert.strictEqual(sodiumChlorideProduct.quantity, 50);
  });

  test('Precipitation Reaction (AgNO3 + NaCl -> AgCl precipitate)', () => {
    const state = {
      containerId: 'test_tube',
      temperature: 20,
      ph: 7.0,
      contents: [
        { chemicalId: 'silver_nitrate', quantity: 10, unit: 'mL' },
        { chemicalId: 'sodium_chloride', quantity: 10, unit: 'mL' }
      ]
    };

    const result = engine.simulate(state);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.reactionId, 'agno3_nacl_precipitation');
    assert.strictEqual(result.visualEffect, 'precipitation');
    assert.strictEqual(result.effects.precipitate, 'white_silver_chloride');
  });

  test('Gas Evolution Reaction (HCl + NaHCO3 -> CO2 gas)', () => {
    const state = {
      containerId: 'beaker',
      temperature: 22,
      ph: 2.0,
      contents: [
        { chemicalId: 'hydrochloric_acid', quantity: 30, unit: 'mL' },
        { chemicalId: 'sodium_bicarbonate', quantity: 5, unit: 'g' }
      ]
    };

    const result = engine.simulate(state);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.reactionId, 'hcl_nahco3_gas_evolution');
    assert.strictEqual(result.effects.gasProduced, 'carbon_dioxide_gas');
    assert.strictEqual(result.effects.bubbles, true);
  });

  test('Single Displacement Reaction (CuSO4 + Zn -> ZnSO4 + Cu)', () => {
    const state = {
      containerId: 'beaker',
      temperature: 25,
      ph: 5.0,
      contents: [
        { chemicalId: 'copper_sulfate', quantity: 50, unit: 'mL' },
        { chemicalId: 'zinc_metal', quantity: 10, unit: 'g' }
      ]
    };

    const result = engine.simulate(state);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.reactionId, 'cuso4_zn_displacement');
    assert.strictEqual(result.reactionType, 'single_displacement');
    const copperProduct = result.products.find((p) => p.chemicalId === 'copper_metal');
    assert.ok(copperProduct, 'Copper metal solid should deposit');
  });

  test('Combustion Reaction (Mg + O2 with heating)', () => {
    const state = {
      containerId: 'crucible',
      temperature: 600,
      isHeating: true,
      contents: [
        { chemicalId: 'magnesium_metal', quantity: 2, unit: 'g' },
        { chemicalId: 'oxygen_gas', quantity: 10, unit: 'L' }
      ]
    };

    const result = engine.simulate(state);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.reactionId, 'mg_o2_combustion');
    assert.strictEqual(result.effects.flame, true);
  });

  test('Catalyzed Decomposition Reaction (H2O2 + KI)', () => {
    const state = {
      containerId: 'flask',
      temperature: 25,
      contents: [
        { chemicalId: 'hydrogen_peroxide', quantity: 50, unit: 'mL' },
        { chemicalId: 'potassium_iodide', quantity: 2, unit: 'g' }
      ]
    };

    const result = engine.simulate(state);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.reactionId, 'h2o2_ki_decomposition');
    assert.strictEqual(result.effects.gasProduced, 'oxygen_gas');
  });


  console.log('\n--- 3. Stoichiometry & Limiting Reactant Evaluation ---');
  test('Correctly identifies limiting reactant and consumes expected amounts', () => {
    // 2HCl + 1Mg -> 1MgCl2 + 1H2
    // If we have 10 units HCl and 10 units Mg:
    // Required ratio is 2:1. So 10 HCl limits reaction scale to 5.
    const state = {
      containerId: 'test_tube',
      temperature: 25,
      contents: [
        { chemicalId: 'hydrochloric_acid', quantity: 10, unit: 'mL' },
        { chemicalId: 'magnesium_metal', quantity: 10, unit: 'g' }
      ]
    };

    const result = engine.simulate(state);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.reactionId, 'hcl_mg_single_displacement');
    assert.strictEqual(result.scale, 5, 'Reaction scale should be limited to 5 by HCl');

    // Check remaining Mg in nextState
    const remainingMg = result.nextState.contents.find((c) => c.chemicalId === 'magnesium_metal');
    assert.ok(remainingMg, 'Remaining magnesium should stay in state');
    assert.strictEqual(remainingMg.quantity, 5, '10 Mg - 5 consumed = 5 remaining');

    // Check HCl fully consumed
    const remainingHcl = result.nextState.contents.find((c) => c.chemicalId === 'hydrochloric_acid');
    assert.strictEqual(remainingHcl, undefined, 'HCl should be completely consumed');
  });


  console.log('\n--- 4. Failure & Edge Cases ---');
  test('Returns Failure on Incompatible Chemicals', () => {
    const state = {
      containerId: 'beaker',
      temperature: 25,
      contents: [
        { chemicalId: 'sodium_chloride', quantity: 10, unit: 'g' },
        { chemicalId: 'ethanol', quantity: 100, unit: 'mL' }
      ]
    };

    const result = engine.simulate(state);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, FailureReasons.NO_REACTION);
  });

  test('Returns Failure on Missing Reactant', () => {
    const state = {
      containerId: 'beaker',
      temperature: 25,
      contents: [
        { chemicalId: 'hydrochloric_acid', quantity: 50, unit: 'mL' }
      ]
    };

    const result = engine.simulate(state);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, FailureReasons.NO_REACTION);
  });

  test('Returns Failure on Insufficient Quantity (0 quantity)', () => {
    const state = {
      containerId: 'beaker',
      temperature: 25,
      contents: [
        { chemicalId: 'hydrochloric_acid', quantity: 0, unit: 'mL' },
        { chemicalId: 'sodium_hydroxide', quantity: 50, unit: 'mL' }
      ]
    };

    const result = engine.simulate(state);
    assert.strictEqual(result.success, false);
  });

  test('Returns Failure on Invalid Chemical ID', () => {
    const state = {
      containerId: 'beaker',
      temperature: 25,
      contents: [
        { chemicalId: 'fake_unobtainium_acid', quantity: 50, unit: 'mL' }
      ]
    };

    const result = engine.simulate(state);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, FailureReasons.INVALID_CHEMICAL_ID);
  });

  test('Returns Failure when Required Conditions (Heating/Temperature) are Not Met', () => {
    // Mg + O2 combustion requires minTemperature 500°C and heating
    const state = {
      containerId: 'crucible',
      temperature: 25,
      isHeating: false,
      contents: [
        { chemicalId: 'magnesium_metal', quantity: 2, unit: 'g' },
        { chemicalId: 'oxygen_gas', quantity: 10, unit: 'L' }
      ]
    };

    const result = engine.simulate(state);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, FailureReasons.CONDITION_NOT_MET);
  });


  console.log('\n--- 5. Dataset Cross-Reference Integrity ---');
  test('All reactions reference existing chemical IDs', () => {
    const reactions = engine.getAllReactions();
    const chemicalsMap = engine.chemicalsMap;

    reactions.forEach((r) => {
      r.reactants.forEach((re) => {
        assert.ok(
          chemicalsMap.has(re.chemicalId),
          `Reaction ${r.id} references unknown reactant '${re.chemicalId}'`
        );
      });
      r.products.forEach((p) => {
        assert.ok(
          chemicalsMap.has(p.chemicalId),
          `Reaction ${r.id} references unknown product '${p.chemicalId}'`
        );
      });
    });
  });

  test('All reactions reference existing reaction types', () => {
    const reactions = engine.getAllReactions();
    const reactionTypesMap = engine.reactionTypesMap;

    reactions.forEach((r) => {
      assert.ok(
        reactionTypesMap.has(r.type),
        `Reaction ${r.id} references unknown reaction type '${r.type}'`
      );
    });
  });

  test('All experiments reference valid chemical and equipment IDs', () => {
    const experiments = engine.experiments;
    const chemicalsMap = engine.chemicalsMap;
    const equipmentMap = engine.equipmentMap;

    experiments.forEach((exp) => {
      if (Array.isArray(exp.availableChemicals)) {
        exp.availableChemicals.forEach((cId) => {
          assert.ok(chemicalsMap.has(cId), `Experiment ${exp.id} references unknown chemical '${cId}'`);
        });
      }
      if (Array.isArray(exp.availableEquipment)) {
        exp.availableEquipment.forEach((eqId) => {
          assert.ok(equipmentMap.has(eqId), `Experiment ${exp.id} references unknown equipment '${eqId}'`);
        });
      }
    });
  });

  console.log(`\n===========================================`);
  console.log(`Test Results: ${testsPassed} Passed, ${testsFailed} Failed.`);
  console.log(`===========================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAllEngineTests();
}

module.exports = {
  runAllEngineTests
};
