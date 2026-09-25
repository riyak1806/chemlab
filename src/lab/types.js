/**
 * ChemLab Laboratory State & Interaction System Types & Error Constants
 */

/**
 * Standard structured error reason codes for laboratory operations.
 */
const LabErrorCodes = {
  INSUFFICIENT_CAPACITY: 'insufficient_capacity',
  INVALID_QUANTITY: 'invalid_quantity',
  CHEMICAL_NOT_FOUND: 'chemical_not_found',
  CONTAINER_NOT_FOUND: 'container_not_found',
  EQUIPMENT_NOT_FOUND: 'equipment_not_found',
  INCOMPATIBLE_ACTION: 'incompatible_action',
  INVALID_PARAMETER: 'invalid_parameter'
};

/**
 * Standard laboratory action types.
 */
const ActionTypes = {
  CREATE_CONTAINER: 'create_container',
  ADD_CHEMICAL: 'add_chemical',
  REMOVE_CHEMICAL: 'remove_chemical',
  TRANSFER: 'transfer',
  MIX: 'mix',
  HEAT: 'heat',
  COOL: 'cool',
  MEASURE: 'measure',
  CLEAR_CONTAINER: 'clear_container',
  DISPOSE_CONTENTS: 'dispose_contents',
  REMOVE_EQUIPMENT: 'remove_equipment',
  RESET_LAB: 'reset_lab'
};

module.exports = {
  LabErrorCodes,
  ActionTypes
};
