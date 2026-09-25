/**
 * Test runner script for ChemLab
 */

const { runAllEngineTests } = require('../tests/chemistryEngine.test');
const { runAllLabStateTests } = require('../tests/labState.test');

runAllEngineTests();
runAllLabStateTests();
