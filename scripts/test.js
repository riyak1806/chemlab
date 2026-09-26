/**
 * Test runner script for ChemLab
 */

import { runAllEngineTests } from '../tests/chemistryEngine.test.js';
import { runAllLabStateTests } from '../tests/labState.test.js';
import { runAllVisualEngineTests } from '../tests/visualEngine.test.js';

runAllEngineTests();
runAllLabStateTests();
runAllVisualEngineTests();
