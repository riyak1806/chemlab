/**
 * ChemLab Laboratory State Management Model
 * Encapsulates full laboratory session state: containers, equipment, environment, action history, and reaction history.
 */

import Container from './Container.js';

class LabState {
  /**
   * @param {Object} [options]
   * @param {string} [options.sessionId] Unique session identifier
   * @param {number} [options.ambientTemperature=25] Ambient laboratory temperature in °C
   */
  constructor(options = {}) {
    this.sessionId = options.sessionId || `lab_session_${Date.now()}`;
    this.ambientTemperature = options.ambientTemperature || 25;
    this.environment = {
      ambientTemperature: this.ambientTemperature,
      pressure: '1 atm'
    };

    /**
     * Map of container ID -> Container instance
     * @type {Map<string, Container>}
     */
    this.containers = new Map();

    /**
     * History of performed actions
     * @type {Array<Object>}
     */
    this.actionHistory = [];

    /**
     * History of triggered chemical reactions
     * @type {Array<Object>}
     */
    this.reactionHistory = [];

    this.sequenceCounter = 0;
  }

  /**
   * Retrieves a container instance by ID.
   * @param {string} containerId
   * @returns {Container|null}
   */
  getContainer(containerId) {
    return this.containers.get(containerId) || null;
  }

  /**
   * Adds or registers a container in state.
   * @param {Container} container
   */
  addContainer(container) {
    this.containers.set(container.id, container);
  }

  /**
   * Removes a container from state.
   * @param {string} containerId
   * @returns {boolean} True if found and removed
   */
  removeContainer(containerId) {
    return this.containers.delete(containerId);
  }

  /**
   * Clears all containers and history, resetting the lab state to fresh default.
   */
  reset() {
    this.containers.clear();
    this.actionHistory = [];
    this.reactionHistory = [];
    this.sequenceCounter = 0;
  }

  /**
   * Logs an action in the history timeline.
   * @param {Object} actionRecord
   */
  recordAction(actionRecord) {
    this.sequenceCounter++;
    const entry = {
      sequence: this.sequenceCounter,
      timestamp: new Date().toISOString(),
      ...actionRecord
    };
    this.actionHistory.push(entry);
    return entry;
  }

  /**
   * Logs a reaction event in the history timeline.
   * @param {Object} reactionRecord
   */
  recordReaction(reactionRecord) {
    const entry = {
      timestamp: new Date().toISOString(),
      ...reactionRecord
    };
    this.reactionHistory.push(entry);
    return entry;
  }

  /**
   * Returns all containers as an array.
   */
  getAllContainers() {
    return Array.from(this.containers.values());
  }

  /**
   * Serializes full lab state into plain JavaScript object representation.
   */
  toJSON() {
    const containersObj = {};
    for (const [id, container] of this.containers.entries()) {
      containersObj[id] = container.toJSON();
    }

    return {
      sessionId: this.sessionId,
      environment: { ...this.environment },
      containers: containersObj,
      actionHistory: [...this.actionHistory],
      reactionHistory: [...this.reactionHistory]
    };
  }
}

export { LabState };
export default LabState;
