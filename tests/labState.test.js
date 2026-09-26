/**
 * Laboratory State & Action System Automated Test Suite
 * Tests equipment container creation, chemical addition/removal, transfers,
 * mixing, heating/cooling, measurement, error handling, and reaction integration.
 */

import assert from 'assert';
import { LabManager, LabErrorCodes, ActionTypes } from '../src/lab/index.js';

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

export function runAllLabStateTests() {
  console.log('=== Running ChemLab Laboratory State & Interaction Test Suite ===\n');

  console.log('--- 1. Container & Equipment Operations ---');
  test('1. Creating a container', () => {
    const lab = new LabManager();
    const res = lab.createContainer('beaker', 'beaker_1');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.container.id, 'beaker_1');
    assert.strictEqual(res.container.capacity, 250);
    assert.strictEqual(lab.getLabState().getAllContainers().length, 1);
  });

  test('2. Adding a chemical', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    const res = lab.addChemical('beaker_1', 'hydrochloric_acid', 50, 'mL', 1.0);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.container.contents.length, 1);
    assert.strictEqual(res.container.contents[0].chemicalId, 'hydrochloric_acid');
    assert.strictEqual(res.container.contents[0].quantity, 50);
  });

  test('3. Adding multiple chemicals', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'sodium_chloride', 10, 'g');
    const res = lab.addChemical('beaker_1', 'water', 100, 'mL');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.container.contents.length, 2);
  });

  test('4. Removing chemical', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 100, 'mL');
    const res = lab.removeChemical('beaker_1', 'water', 40);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.container.contents[0].quantity, 60);
  });


  console.log('\n--- 2. Transfer & Capacity Validation ---');
  test('5. Transferring chemical', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_A');
    lab.createContainer('beaker', 'beaker_B');
    lab.addChemical('beaker_A', 'water', 100, 'mL');

    const res = lab.transfer('beaker_A', 'beaker_B', 40);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.sourceContainer.contents[0].quantity, 60);
    assert.strictEqual(res.targetContainer.contents[0].quantity, 40);
  });

  test('6. Transfer with insufficient quantity', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_A');
    lab.createContainer('beaker', 'beaker_B');
    lab.addChemical('beaker_A', 'water', 20, 'mL');

    const res = lab.transfer('beaker_A', 'beaker_B', 50);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error.reason, LabErrorCodes.INVALID_QUANTITY);
  });

  test('7. Transfer with insufficient capacity', () => {
    const lab = new LabManager();
    lab.createContainer('test_tube', 'tt_1'); // capacity 20 mL
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 100, 'mL');

    const res = lab.transfer('beaker_1', 'tt_1', 50);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error.reason, LabErrorCodes.INSUFFICIENT_CAPACITY);
  });


  console.log('\n--- 3. Lab Reset, Clear, Dispose & Removal ---');
  test('8. Clearing a container', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 100, 'mL');
    const res = lab.clearContainer('beaker_1');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.container.contents.length, 0);
  });

  test('9. Resetting laboratory', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.createContainer('flask', 'flask_1');
    lab.addChemical('beaker_1', 'water', 50, 'mL');

    const res = lab.resetLab();
    assert.strictEqual(res.success, true);
    assert.strictEqual(lab.getLabState().getAllContainers().length, 0);
  });


  console.log('\n--- 4. Environmental Actions & Measurement ---');
  test('10. Mixing', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 50, 'mL');
    const res = lab.mix('beaker_1');
    assert.strictEqual(res.success, true);
  });

  test('11. Heating', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    const res = lab.heat('beaker_1', 80);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.container.temperature, 80);
  });

  test('12. Cooling', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.heat('beaker_1', 90);
    const res = lab.cool('beaker_1', 25);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.container.temperature, 25);
  });

  test('13. Measurement', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 100, 'mL');
    const res = lab.measure('beaker_1');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.measurement.volume.value, 100);
    assert.strictEqual(res.measurement.temperature.value, 25);
  });


  console.log('\n--- 5. Error & Validation Handling ---');
  test('14. Invalid chemical', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    const res = lab.addChemical('beaker_1', 'unobtainium_chemical', 10, 'mL');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error.reason, LabErrorCodes.CHEMICAL_NOT_FOUND);
  });

  test('15. Invalid container', () => {
    const lab = new LabManager();
    const res = lab.addChemical('non_existent_beaker', 'water', 10, 'mL');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error.reason, LabErrorCodes.CONTAINER_NOT_FOUND);
  });

  test('20. Invalid action handling (e.g., negative quantity, exceeding max temp)', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    const negRes = lab.addChemical('beaker_1', 'water', -50, 'mL');
    assert.strictEqual(negRes.success, false);
    assert.strictEqual(negRes.error.reason, LabErrorCodes.INVALID_QUANTITY);

    const heatRes = lab.heat('beaker_1', 1500); // Exceeds safety limit
    assert.strictEqual(heatRes.success, false);
    assert.strictEqual(heatRes.error.reason, LabErrorCodes.INCOMPATIBLE_ACTION);
  });


  console.log('\n--- 6. Reaction Integration & History ---');
  test('16. Reaction triggered after adding compatible reactants', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'hydrochloric_acid', 50, 'mL', 1.0);
    const res = lab.addChemical('beaker_1', 'sodium_hydroxide', 50, 'mL', 1.0);

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.reactionTriggered, true);
    assert.strictEqual(res.reactionResult.reactionId, 'hcl_naoh_neutralization');
  });

  test('17. Reaction result correctly changing state', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'hydrochloric_acid', 50, 'mL', 1.0);
    const res = lab.addChemical('beaker_1', 'sodium_hydroxide', 50, 'mL', 1.0);

    assert.strictEqual(res.container.ph, 7.0);
    assert.ok(res.container.temperature > 25);
  });

  test('18. Reaction history', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'hydrochloric_acid', 50, 'mL', 1.0);
    lab.addChemical('beaker_1', 'sodium_hydroxide', 50, 'mL', 1.0);

    const state = lab.getLabState();
    assert.strictEqual(state.reactionHistory.length, 1);
    assert.strictEqual(state.reactionHistory[0].reactionId, 'hcl_naoh_neutralization');
  });

  test('19. Action history', () => {
    const lab = new LabManager();
    lab.createContainer('beaker', 'beaker_1');
    lab.addChemical('beaker_1', 'water', 50, 'mL');

    const state = lab.getLabState();
    assert.strictEqual(state.actionHistory.length, 2);
    assert.strictEqual(state.actionHistory[0].type, ActionTypes.CREATE_CONTAINER);
    assert.strictEqual(state.actionHistory[1].type, ActionTypes.ADD_CHEMICAL);
  });

  console.log(`\n===========================================`);
  console.log(`Lab State Test Results: ${testsPassed} Passed, ${testsFailed} Failed.`);
  console.log(`===========================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}
