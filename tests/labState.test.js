/**
 * ChemLab Laboratory State & Interaction System Automated Test Suite
 * Validates container management, chemical transfers, capacity limits,
 * reaction triggering, measurements, histories, and structured error handling.
 */

const assert = require('assert');
const { LabManager, LabErrorCodes, ActionTypes } = require('../src/lab');

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

function runAllLabStateTests() {
  console.log('=== Running ChemLab Laboratory State & Interaction Test Suite ===\n');

  console.log('--- 1. Container & Equipment Operations ---');
  test('1. Creating a container', () => {
    const lab = new LabManager();
    const result = lab.createContainer('beaker', 'beaker_1');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.container.id, 'beaker_1');
    assert.strictEqual(result.container.equipmentId, 'beaker');
    assert.strictEqual(result.container.capacity, 250);

    const containerInState = lab.getLabState().getContainer('beaker_1');
    assert.ok(containerInState);
  });

  test('2. Adding a chemical', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    const result = lab.addChemical('beaker_1', 'hydrochloric_acid', 50, 'mL');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.container.contents.length, 1);
    assert.strictEqual(result.container.contents[0].chemicalId, 'hydrochloric_acid');
    assert.strictEqual(result.container.contents[0].quantity, 50);
  });

  test('3. Adding multiple chemicals', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 50, 'mL');
    lab.addChemical('beaker_1', 'sodium_chloride', 10, 'g');

    const container = lab.getLabState().getContainer('beaker_1');
    assert.strictEqual(container.contents.length, 2);
    assert.strictEqual(container.getTotalQuantity(), 60);
  });

  test('4. Removing chemical', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 50, 'mL');

    const result = lab.removeChemical('beaker_1', 'water', 20);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.removed.quantity, 20);
    assert.strictEqual(result.container.contents[0].quantity, 30);
  });

  console.log('\n--- 2. Transfer & Capacity Validation ---');
  test('5. Transferring chemical', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_a');
    lab.createContainer('beaker', 'beaker_b');
    lab.addChemical('beaker_a', 'hydrochloric_acid', 50, 'mL');

    const result = lab.transfer('beaker_a', 'beaker_b', 20);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.sourceContainer.contents[0].quantity, 30);
    assert.strictEqual(result.targetContainer.contents[0].quantity, 20);
  });

  test('6. Transfer with insufficient quantity', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_a');
    lab.createContainer('beaker', 'beaker_b');
    lab.addChemical('beaker_a', 'hydrochloric_acid', 10, 'mL');

    const result = lab.transfer('beaker_a', 'beaker_b', 50);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error.reason, LabErrorCodes.INVALID_QUANTITY);
  });

  test('7. Transfer with insufficient capacity', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_large'); // 250 mL
    lab.createContainer('test_tube', 'tube_small'); // 20 mL capacity
    lab.addChemical('beaker_large', 'water', 100, 'mL');

    const result = lab.transfer('beaker_large', 'tube_small', 50);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error.reason, LabErrorCodes.INSUFFICIENT_CAPACITY);
  });

  console.log('\n--- 3. Lab Reset, Clear, Dispose & Removal ---');
  test('8. Clearing a container', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 50, 'mL');

    const result = lab.clearContainer('beaker_1');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.container.contents.length, 0);
    assert.strictEqual(result.container.state, 'empty');
  });

  test('9. Resetting laboratory', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 50, 'mL');

    const result = lab.resetLab();
    assert.strictEqual(result.success, true);
    assert.strictEqual(lab.getLabState().getAllContainers().length, 0);
  });

  console.log('\n--- 4. Environmental Actions & Measurement ---');
  test('10. Mixing', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 50, 'mL');

    const result = lab.mix('beaker_1');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.container.isMixed, true);
  });

  test('11. Heating', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');

    const result = lab.heat('beaker_1', 80);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.container.temperature, 80);
    assert.strictEqual(result.container.isHeating, true);
  });

  test('12. Cooling', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.heat('beaker_1', 80);

    const result = lab.cool('beaker_1', 25);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.container.temperature, 25);
    assert.strictEqual(result.container.isHeating, false);
  });

  test('13. Measurement', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 100, 'mL');

    const result = lab.measure('beaker_1');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.measurement.volume.value, 100);
    assert.strictEqual(result.measurement.volume.unit, 'mL');
    assert.strictEqual(result.measurement.temperature.value, 25);
  });

  console.log('\n--- 5. Error & Validation Handling ---');
  test('14. Invalid chemical', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');

    const result = lab.addChemical('beaker_1', 'non_existent_chemical', 10);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error.reason, LabErrorCodes.CHEMICAL_NOT_FOUND);
  });

  test('15. Invalid container', () => {
    const lab = new LabManager();
    const result = lab.addChemical('non_existent_container', 'water', 10);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error.reason, LabErrorCodes.CONTAINER_NOT_FOUND);
  });

  test('20. Invalid action handling (e.g., negative quantity, exceeding max temp)', () => {
    const lab = new LabManager();
    lab.createContainer('measuring_cylinder', 'cyl_1'); // maxTemp 80°C

    const negResult = lab.addChemical('cyl_1', 'water', -50);
    assert.strictEqual(negResult.success, false);
    assert.strictEqual(negResult.error.reason, LabErrorCodes.INVALID_QUANTITY);

    const tempResult = lab.heat('cyl_1', 200);
    assert.strictEqual(tempResult.success, false);
    assert.strictEqual(tempResult.error.reason, LabErrorCodes.INCOMPATIBLE_ACTION);
  });

  console.log('\n--- 6. Reaction Integration & History ---');
  test('16. Reaction triggered after adding compatible reactants', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_rxn');
    lab.addChemical('beaker_rxn', 'hydrochloric_acid', 50, 'mL');

    const result = lab.addChemical('beaker_rxn', 'sodium_hydroxide', 50, 'mL');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.reactionTriggered, true);
    assert.strictEqual(result.reactionResult.reactionId, 'hcl_naoh_neutralization');
  });

  test('17. Reaction result correctly changing state', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_rxn');
    lab.addChemical('beaker_rxn', 'hydrochloric_acid', 50, 'mL');
    const result = lab.addChemical('beaker_rxn', 'sodium_hydroxide', 50, 'mL');

    assert.strictEqual(result.container.ph, 7.0);
    assert.ok(result.container.temperature > 25, 'Temperature should rise from exothermic reaction');
  });

  test('18. Reaction history', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_rxn');
    lab.addChemical('beaker_rxn', 'hydrochloric_acid', 50, 'mL');
    lab.addChemical('beaker_rxn', 'sodium_hydroxide', 50, 'mL');

    const reactionHistory = lab.getLabState().reactionHistory;
    assert.strictEqual(reactionHistory.length, 1);
    assert.strictEqual(reactionHistory[0].reactionId, 'hcl_naoh_neutralization');
  });

  test('19. Action history', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 50, 'mL');
    lab.measure('beaker_1');

    const actionHistory = lab.getLabState().actionHistory;
    assert.strictEqual(actionHistory.length, 3);
    assert.strictEqual(actionHistory[0].type, ActionTypes.CREATE_CONTAINER);
    assert.strictEqual(actionHistory[1].type, ActionTypes.ADD_CHEMICAL);
    assert.strictEqual(actionHistory[2].type, ActionTypes.MEASURE);
  });

  console.log(`\n===========================================`);
  console.log(`Lab State Test Results: ${testsPassed} Passed, ${testsFailed} Failed.`);
  console.log(`===========================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAllLabStateTests();
}

module.exports = {
  runAllLabStateTests
};
