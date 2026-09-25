/**
 * ChemLab Laboratory Manager / Action Executor System
 * Handles validation, state modification, Chemistry Engine integration,
 * reaction result application, and action/reaction history recording.
 */

const LabState = require('./LabState');
const Container = require('./Container');
const { LabErrorCodes, ActionTypes } = require('./types');
const { ChemistryEngine } = require('../chemistry');

class LabManager {
  /**
   * @param {Object} [options]
   * @param {ChemistryEngine} [options.engine] Custom ChemistryEngine instance
   * @param {LabState} [options.labState] Initial LabState instance
   */
  constructor(options = {}) {
    this.engine = options.engine || new ChemistryEngine();
    this.state = options.labState || new LabState();
    this.containerCounter = 0;
  }

  /**
   * Returns current laboratory state model instance.
   * @returns {LabState}
   */
  getLabState() {
    return this.state;
  }

  /**
   * Creates a new equipment container in the laboratory.
   * @param {string} equipmentId Equipment dataset ID (e.g., 'beaker', 'test_tube')
   * @param {string} [customContainerId] Optional custom container identifier
   * @returns {Object} Standard action result object
   */
  createContainer(equipmentId, customContainerId) {
    const equipment = this.engine.getEquipment(equipmentId);
    if (!equipment) {
      return this._buildErrorResult(
        ActionTypes.CREATE_CONTAINER,
        LabErrorCodes.EQUIPMENT_NOT_FOUND,
        `Equipment with ID '${equipmentId}' not found in dataset.`
      );
    }

    this.containerCounter++;
    const containerId = customContainerId || `${equipmentId}_${this.containerCounter}`;

    if (this.state.getContainer(containerId)) {
      return this._buildErrorResult(
        ActionTypes.CREATE_CONTAINER,
        LabErrorCodes.INVALID_PARAMETER,
        `Container with ID '${containerId}' already exists in lab state.`
      );
    }

    const container = new Container({
      id: containerId,
      equipment,
      temperature: this.state.ambientTemperature
    });

    this.state.addContainer(container);

    const actionRecord = this.state.recordAction({
      type: ActionTypes.CREATE_CONTAINER,
      affectedContainers: [containerId],
      parameters: { equipmentId, customContainerId },
      result: { success: true, container: container.toJSON() }
    });

    return {
      success: true,
      actionId: actionRecord.sequence,
      container: container.toJSON()
    };
  }

  /**
   * Adds a specified quantity of a chemical into a container.
   * @param {string} containerId Container ID
   * @param {string} chemicalId Chemical dataset ID
   * @param {number} quantity Amount to add
   * @param {string} [unit] Unit ('mL', 'g', etc.)
   * @param {number} [concentration] Concentration if applicable
   * @returns {Object} Action result object
   */
  addChemical(containerId, chemicalId, quantity, unit, concentration) {
    const container = this.state.getContainer(containerId);
    if (!container) {
      return this._buildErrorResult(
        ActionTypes.ADD_CHEMICAL,
        LabErrorCodes.CONTAINER_NOT_FOUND,
        `Container '${containerId}' not found.`
      );
    }

    const chemical = this.engine.getChemical(chemicalId);
    if (!chemical) {
      return this._buildErrorResult(
        ActionTypes.ADD_CHEMICAL,
        LabErrorCodes.CHEMICAL_NOT_FOUND,
        `Chemical '${chemicalId}' not found in dataset.`
      );
    }

    if (typeof quantity !== 'number' || quantity <= 0 || isNaN(quantity)) {
      return this._buildErrorResult(
        ActionTypes.ADD_CHEMICAL,
        LabErrorCodes.INVALID_QUANTITY,
        `Quantity must be a positive number. Received '${quantity}'.`
      );
    }

    if (!container.canFit(quantity)) {
      return this._buildErrorResult(
        ActionTypes.ADD_CHEMICAL,
        LabErrorCodes.INSUFFICIENT_CAPACITY,
        `Adding ${quantity} ${unit || 'units'} exceeds container capacity (${container.capacity} ${container.unit}). Current total: ${container.getTotalQuantity()}.`
      );
    }

    // Add chemical to container
    container.addChemical(chemical, quantity, unit, concentration);

    // Evaluate potential reaction via Chemistry Engine
    const reactionResult = this._evaluateAndApplyReaction(container);

    const actionRecord = this.state.recordAction({
      type: ActionTypes.ADD_CHEMICAL,
      affectedContainers: [containerId],
      affectedChemicals: [chemicalId],
      parameters: { chemicalId, quantity, unit, concentration },
      result: {
        success: true,
        container: container.toJSON(),
        reactionTriggered: reactionResult.reactionTriggered,
        reactionResult: reactionResult.reactionResult || null
      }
    });

    return {
      success: true,
      actionId: actionRecord.sequence,
      container: container.toJSON(),
      reactionTriggered: reactionResult.reactionTriggered,
      reactionResult: reactionResult.reactionResult || null
    };
  }

  /**
   * Removes a specified quantity of a chemical from a container.
   * @param {string} containerId
   * @param {string} chemicalId
   * @param {number} quantity
   * @returns {Object} Action result
   */
  removeChemical(containerId, chemicalId, quantity) {
    const container = this.state.getContainer(containerId);
    if (!container) {
      return this._buildErrorResult(
        ActionTypes.REMOVE_CHEMICAL,
        LabErrorCodes.CONTAINER_NOT_FOUND,
        `Container '${containerId}' not found.`
      );
    }

    const contentItem = container.getContent(chemicalId);
    if (!contentItem) {
      return this._buildErrorResult(
        ActionTypes.REMOVE_CHEMICAL,
        LabErrorCodes.CHEMICAL_NOT_FOUND,
        `Chemical '${chemicalId}' is not present in container '${containerId}'.`
      );
    }

    if (typeof quantity !== 'number' || quantity <= 0 || isNaN(quantity)) {
      return this._buildErrorResult(
        ActionTypes.REMOVE_CHEMICAL,
        LabErrorCodes.INVALID_QUANTITY,
        `Quantity must be a positive number. Received '${quantity}'.`
      );
    }

    const removed = container.removeChemical(chemicalId, quantity);

    const actionRecord = this.state.recordAction({
      type: ActionTypes.REMOVE_CHEMICAL,
      affectedContainers: [containerId],
      affectedChemicals: [chemicalId],
      parameters: { chemicalId, quantity },
      result: { success: true, removed, container: container.toJSON() }
    });

    return {
      success: true,
      actionId: actionRecord.sequence,
      removed,
      container: container.toJSON()
    };
  }

  /**
   * Transfers a quantity of liquid/contents from a source container to a destination container.
   * @param {string} sourceContainerId
   * @param {string} targetContainerId
   * @param {number} quantity Quantity to transfer
   * @returns {Object} Action result
   */
  transfer(sourceContainerId, targetContainerId, quantity) {
    const source = this.state.getContainer(sourceContainerId);
    if (!source) {
      return this._buildErrorResult(
        ActionTypes.TRANSFER,
        LabErrorCodes.CONTAINER_NOT_FOUND,
        `Source container '${sourceContainerId}' not found.`
      );
    }

    const target = this.state.getContainer(targetContainerId);
    if (!target) {
      return this._buildErrorResult(
        ActionTypes.TRANSFER,
        LabErrorCodes.CONTAINER_NOT_FOUND,
        `Target container '${targetContainerId}' not found.`
      );
    }

    if (typeof quantity !== 'number' || quantity <= 0 || isNaN(quantity)) {
      return this._buildErrorResult(
        ActionTypes.TRANSFER,
        LabErrorCodes.INVALID_QUANTITY,
        `Transfer quantity must be a positive number. Received '${quantity}'.`
      );
    }

    const sourceTotal = source.getTotalQuantity();
    if (sourceTotal <= 0) {
      return this._buildErrorResult(
        ActionTypes.TRANSFER,
        LabErrorCodes.INVALID_QUANTITY,
        `Source container '${sourceContainerId}' is empty.`
      );
    }

    if (quantity > sourceTotal + 1e-6) {
      return this._buildErrorResult(
        ActionTypes.TRANSFER,
        LabErrorCodes.INVALID_QUANTITY,
        `Requested transfer quantity (${quantity}) exceeds available quantity in source (${sourceTotal}).`
      );
    }

    if (!target.canFit(quantity)) {
      return this._buildErrorResult(
        ActionTypes.TRANSFER,
        LabErrorCodes.INSUFFICIENT_CAPACITY,
        `Target container '${targetContainerId}' does not have enough capacity for ${quantity} ${target.unit}. Remaining: ${target.getRemainingCapacity()}.`
      );
    }

    // Proportionally transfer each chemical in source mixture
    const ratio = quantity / sourceTotal;
    const transferredItems = [];

    // Clone contents array to prevent mutation issues while iterating
    const sourceContentsCopy = source.contents.map((c) => ({ ...c }));

    for (const item of sourceContentsCopy) {
      const amountToTransfer = item.quantity * ratio;
      source.removeChemical(item.chemicalId, amountToTransfer);

      const chemicalDef = this.engine.getChemical(item.chemicalId);
      if (chemicalDef) {
        target.addChemical(chemicalDef, amountToTransfer, item.unit, item.concentration);
        transferredItems.push({
          chemicalId: item.chemicalId,
          quantity: amountToTransfer
        });
      }
    }

    // Evaluate potential reaction in target container after transfer
    const reactionResult = this._evaluateAndApplyReaction(target);

    const actionRecord = this.state.recordAction({
      type: ActionTypes.TRANSFER,
      affectedContainers: [sourceContainerId, targetContainerId],
      parameters: { sourceContainerId, targetContainerId, quantity },
      result: {
        success: true,
        source: source.toJSON(),
        target: target.toJSON(),
        reactionTriggered: reactionResult.reactionTriggered,
        reactionResult: reactionResult.reactionResult || null
      }
    });

    return {
      success: true,
      actionId: actionRecord.sequence,
      sourceContainer: source.toJSON(),
      targetContainer: target.toJSON(),
      reactionTriggered: reactionResult.reactionTriggered,
      reactionResult: reactionResult.reactionResult || null
    };
  }

  /**
   * Mixes / stirs contents in container and triggers potential reaction evaluation.
   * @param {string} containerId
   * @returns {Object} Action result
   */
  mix(containerId) {
    const container = this.state.getContainer(containerId);
    if (!container) {
      return this._buildErrorResult(
        ActionTypes.MIX,
        LabErrorCodes.CONTAINER_NOT_FOUND,
        `Container '${containerId}' not found.`
      );
    }

    container.isMixed = true;

    // Trigger simulation upon mixing
    const reactionResult = this._evaluateAndApplyReaction(container);

    const actionRecord = this.state.recordAction({
      type: ActionTypes.MIX,
      affectedContainers: [containerId],
      result: {
        success: true,
        container: container.toJSON(),
        reactionTriggered: reactionResult.reactionTriggered,
        reactionResult: reactionResult.reactionResult || null
      }
    });

    return {
      success: true,
      actionId: actionRecord.sequence,
      container: container.toJSON(),
      reactionTriggered: reactionResult.reactionTriggered,
      reactionResult: reactionResult.reactionResult || null
    };
  }

  /**
   * Heats a container to a target temperature or increases current temperature.
   * @param {string} containerId
   * @param {number} targetTemperature Target temperature in °C
   * @returns {Object} Action result
   */
  heat(containerId, targetTemperature) {
    const container = this.state.getContainer(containerId);
    if (!container) {
      return this._buildErrorResult(
        ActionTypes.HEAT,
        LabErrorCodes.CONTAINER_NOT_FOUND,
        `Container '${containerId}' not found.`
      );
    }

    if (typeof targetTemperature !== 'number' || isNaN(targetTemperature)) {
      return this._buildErrorResult(
        ActionTypes.HEAT,
        LabErrorCodes.INVALID_PARAMETER,
        `Target temperature must be a valid number. Received '${targetTemperature}'.`
      );
    }

    const equipment = this.engine.getEquipment(container.equipmentId);
    if (equipment && equipment.safety && equipment.safety.maxTemperature) {
      if (targetTemperature > equipment.safety.maxTemperature) {
        return this._buildErrorResult(
          ActionTypes.HEAT,
          LabErrorCodes.INCOMPATIBLE_ACTION,
          `Temperature ${targetTemperature}°C exceeds equipment maximum temperature safety limit (${equipment.safety.maxTemperature}°C).`
        );
      }
    }

    container.temperature = targetTemperature;
    container.isHeating = true;

    // Evaluate temperature-dependent reaction
    const reactionResult = this._evaluateAndApplyReaction(container);

    const actionRecord = this.state.recordAction({
      type: ActionTypes.HEAT,
      affectedContainers: [containerId],
      parameters: { targetTemperature },
      result: {
        success: true,
        container: container.toJSON(),
        reactionTriggered: reactionResult.reactionTriggered,
        reactionResult: reactionResult.reactionResult || null
      }
    });

    return {
      success: true,
      actionId: actionRecord.sequence,
      container: container.toJSON(),
      reactionTriggered: reactionResult.reactionTriggered,
      reactionResult: reactionResult.reactionResult || null
    };
  }

  /**
   * Cools a container to a target temperature.
   * @param {string} containerId
   * @param {number} targetTemperature
   * @returns {Object} Action result
   */
  cool(containerId, targetTemperature) {
    const container = this.state.getContainer(containerId);
    if (!container) {
      return this._buildErrorResult(
        ActionTypes.COOL,
        LabErrorCodes.CONTAINER_NOT_FOUND,
        `Container '${containerId}' not found.`
      );
    }

    if (typeof targetTemperature !== 'number' || isNaN(targetTemperature)) {
      return this._buildErrorResult(
        ActionTypes.COOL,
        LabErrorCodes.INVALID_PARAMETER,
        `Target temperature must be a valid number. Received '${targetTemperature}'.`
      );
    }

    container.temperature = targetTemperature;
    container.isHeating = false;

    const actionRecord = this.state.recordAction({
      type: ActionTypes.COOL,
      affectedContainers: [containerId],
      parameters: { targetTemperature },
      result: { success: true, container: container.toJSON() }
    });

    return {
      success: true,
      actionId: actionRecord.sequence,
      container: container.toJSON()
    };
  }

  /**
   * Performs measurements on a container (volume, temperature, pH, total mass).
   * @param {string} containerId
   * @returns {Object} Structured measurement result object
   */
  measure(containerId) {
    const container = this.state.getContainer(containerId);
    if (!container) {
      return this._buildErrorResult(
        ActionTypes.MEASURE,
        LabErrorCodes.CONTAINER_NOT_FOUND,
        `Container '${containerId}' not found.`
      );
    }

    const totalVolume = container.getTotalQuantity();

    // Approximate mass calculation assuming 1g/mL density for liquids if unspecified
    let totalMass = 0;
    container.contents.forEach((item) => {
      if (item.unit === 'g') {
        totalMass += item.quantity;
      } else {
        totalMass += item.quantity * 1.0; // 1 mL ≈ 1 g
      }
    });

    const measurementData = {
      containerId: container.id,
      equipmentId: container.equipmentId,
      volume: {
        value: Math.round(totalVolume * 100) / 100,
        unit: container.unit
      },
      temperature: {
        value: Math.round(container.temperature * 10) / 10,
        unit: 'C'
      },
      ph: {
        value: container.ph !== null && container.ph !== undefined ? Math.round(container.ph * 100) / 100 : null
      },
      mass: {
        value: Math.round(totalMass * 100) / 100,
        unit: 'g'
      },
      state: container.state,
      appearance: container.appearance,
      contentCount: container.contents.length
    };

    const actionRecord = this.state.recordAction({
      type: ActionTypes.MEASURE,
      affectedContainers: [containerId],
      result: { success: true, measurement: measurementData }
    });

    return {
      success: true,
      actionId: actionRecord.sequence,
      measurement: measurementData
    };
  }

  /**
   * Clears all chemical contents from a container.
   * @param {string} containerId
   * @returns {Object} Action result
   */
  clearContainer(containerId) {
    const container = this.state.getContainer(containerId);
    if (!container) {
      return this._buildErrorResult(
        ActionTypes.CLEAR_CONTAINER,
        LabErrorCodes.CONTAINER_NOT_FOUND,
        `Container '${containerId}' not found.`
      );
    }

    container.clear();

    const actionRecord = this.state.recordAction({
      type: ActionTypes.CLEAR_CONTAINER,
      affectedContainers: [containerId],
      result: { success: true, container: container.toJSON() }
    });

    return {
      success: true,
      actionId: actionRecord.sequence,
      container: container.toJSON()
    };
  }

  /**
   * Alias for clearContainer for disposal workflow.
   * @param {string} containerId
   * @returns {Object} Action result
   */
  disposeContents(containerId) {
    return this.clearContainer(containerId);
  }

  /**
   * Completely removes an equipment container from the laboratory.
   * @param {string} containerId
   * @returns {Object} Action result
   */
  removeEquipment(containerId) {
    const removed = this.state.removeContainer(containerId);
    if (!removed) {
      return this._buildErrorResult(
        ActionTypes.REMOVE_EQUIPMENT,
        LabErrorCodes.CONTAINER_NOT_FOUND,
        `Container '${containerId}' not found.`
      );
    }

    const actionRecord = this.state.recordAction({
      type: ActionTypes.REMOVE_EQUIPMENT,
      affectedContainers: [containerId],
      result: { success: true, removedContainerId: containerId }
    });

    return {
      success: true,
      actionId: actionRecord.sequence,
      removedContainerId: containerId
    };
  }

  /**
   * Resets the entire laboratory session state to fresh default.
   * @returns {Object} Action result
   */
  resetLab() {
    this.state.reset();
    this.containerCounter = 0;

    this.state.recordAction({
      type: ActionTypes.RESET_LAB,
      affectedContainers: [],
      result: { success: true }
    });

    return {
      success: true,
      labState: this.state.toJSON()
    };
  }

  /**
   * Internal helper to invoke ChemistryEngine and apply reaction results to container state.
   * @private
   * @param {Container} container
   * @returns {{reactionTriggered: boolean, reactionResult?: Object}}
   */
  _evaluateAndApplyReaction(container) {
    if (container.contents.length === 0) {
      return { reactionTriggered: false };
    }

    const simState = {
      containerId: container.id,
      temperature: container.temperature,
      ph: container.ph,
      isHeating: container.isHeating,
      contents: container.contents.map((c) => ({
        chemicalId: c.chemicalId,
        quantity: c.quantity,
        unit: c.unit,
        concentration: c.concentration
      }))
    };

    const simResult = this.engine.simulate(simState);

    if (!simResult || !simResult.success) {
      return { reactionTriggered: false };
    }

    // Apply simulation result to container
    if (simResult.nextState) {
      // Update contents from next state
      container.contents = (simResult.nextState.contents || []).map((item) => {
        const chemicalDef = this.engine.getChemical(item.chemicalId);
        return {
          chemicalId: item.chemicalId,
          name: chemicalDef ? chemicalDef.name : item.chemicalId,
          formula: chemicalDef ? chemicalDef.formula : '',
          quantity: item.quantity,
          unit: item.unit || 'mL',
          concentration: item.concentration,
          state: chemicalDef ? chemicalDef.physicalState : 'liquid',
          color: (chemicalDef && chemicalDef.appearance && chemicalDef.appearance.color) || 'colorless'
        };
      });

      if (typeof simResult.nextState.ph === 'number') {
        container.ph = simResult.nextState.ph;
      }
      if (typeof simResult.nextState.temperature === 'number') {
        container.temperature = simResult.nextState.temperature;
      }
    }

    // Apply specific visual effects / color changes
    if (simResult.effects) {
      if (simResult.effects.targetPh !== undefined) {
        container.ph = simResult.effects.targetPh;
      }
      if (simResult.effects.colorChange) {
        container.appearance = simResult.effects.colorChange;
      } else if (simResult.effects.precipitate) {
        container.appearance = simResult.effects.precipitate;
        container.state = 'precipitate_formed';
      }
    }

    container.recalculateStateAndAppearance();

    // Log reaction in lab state history
    this.state.recordReaction({
      containerId: container.id,
      reactionId: simResult.reactionId,
      reactionType: simResult.reactionType,
      equation: simResult.equation,
      effects: simResult.effects,
      consumed: simResult.consumed,
      products: simResult.products
    });

    return {
      reactionTriggered: true,
      reactionResult: simResult
    };
  }

  /**
   * Internal helper to build structured failure results.
   * @private
   */
  _buildErrorResult(actionType, errorReason, message) {
    const errorRecord = {
      type: actionType,
      error: {
        reason: errorReason,
        message
      }
    };
    this.state.recordAction(errorRecord);

    return {
      success: false,
      error: {
        reason: errorReason,
        message
      }
    };
  }
}

module.exports = LabManager;
module.exports.LabManager = LabManager;
module.exports.default = LabManager;
