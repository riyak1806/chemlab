/**
 * ChemLab Container Model
 * Represents an individual laboratory vessel or equipment container,
 * holding chemicals, tracking capacity, temperature, pH, physical state, and appearance.
 */

class Container {
  /**
   * @param {Object} options Container configuration
   * @param {string} options.id Unique container identifier
   * @param {Object} options.equipment Equipment definition from dataset
   * @param {number} [options.temperature=25] Ambient or current temperature in Celsius
   */
  constructor({ id, equipment, temperature = 25 }) {
    if (!id || typeof id !== 'string') {
      throw new Error('Container requires a valid string ID');
    }
    if (!equipment || !equipment.id) {
      throw new Error('Container requires a valid equipment definition');
    }

    this.id = id;
    this.equipmentId = equipment.id;
    this.equipmentName = equipment.name || equipment.id;

    // Capacity definition
    this.capacity = equipment.capacity ? Number(equipment.capacity.value) || 250 : 250;
    this.unit = equipment.capacity ? equipment.capacity.unit : 'mL';

    this.temperature = temperature;
    this.ph = 7.0;
    this.isHeating = false;
    this.isMixed = false;

    // Physical state and appearance
    this.state = 'empty';
    this.appearance = 'colorless';

    /**
     * @type {Array<{chemicalId: string, name: string, quantity: number, unit: string, concentration?: number, state: string, formula?: string, color?: string}>}
     */
    this.contents = [];
  }

  /**
   * Calculates total volume / quantity of contents currently in container.
   * @returns {number} Total volume / mass in container capacity units
   */
  getTotalQuantity() {
    return this.contents.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
  }

  /**
   * Calculates remaining capacity available.
   * @returns {number} Remaining capacity
   */
  getRemainingCapacity() {
    return Math.max(0, this.capacity - this.getTotalQuantity());
  }

  /**
   * Checks if adding a specific quantity will exceed container capacity.
   * @param {number} quantity
   * @returns {boolean}
   */
  canFit(quantity) {
    if (this.capacity === null || this.capacity === undefined) return true;
    return (this.getTotalQuantity() + quantity) <= (this.capacity + 1e-6);
  }

  /**
   * Retrieves a specific chemical content item by ID.
   * @param {string} chemicalId
   * @returns {Object|null}
   */
  getContent(chemicalId) {
    return this.contents.find((item) => item.chemicalId === chemicalId) || null;
  }

  /**
   * Adds a chemical to the container.
   * @param {Object} chemicalDef Chemical dataset definition object
   * @param {number} quantity Amount to add
   * @param {string} unit Unit of measurement ('mL', 'g', etc.)
   * @param {number} [concentration] Concentration if applicable
   */
  addChemical(chemicalDef, quantity, unit, concentration) {
    const existing = this.getContent(chemicalDef.id);
    const addedConc = concentration !== undefined ? concentration : (chemicalDef.defaultConcentration || 1.0);

    if (existing) {
      if (existing.concentration !== undefined && addedConc !== undefined) {
        const totalQty = existing.quantity + quantity;
        if (totalQty > 0) {
          existing.concentration =
            (existing.quantity * existing.concentration + quantity * addedConc) / totalQty;
        }
      }
      existing.quantity += quantity;
    } else {
      this.contents.push({
        chemicalId: chemicalDef.id,
        name: chemicalDef.name || chemicalDef.id,
        formula: chemicalDef.formula || '',
        quantity,
        unit: unit || (chemicalDef.physicalState === 'solid' ? 'g' : 'mL'),
        concentration: addedConc,
        state: chemicalDef.physicalState || 'liquid',
        color: (chemicalDef.appearance && chemicalDef.appearance.color) || 'colorless'
      });
    }

    this.recalculateStateAndAppearance(chemicalDef);
  }

  /**
   * Removes a specified quantity of a chemical from the container.
   * @param {string} chemicalId
   * @param {number} quantity
   * @returns {Object|null} Removed item info or null if chemical not present
   */
  removeChemical(chemicalId, quantity) {
    const existingIndex = this.contents.findIndex((item) => item.chemicalId === chemicalId);
    if (existingIndex === -1) return null;

    const existing = this.contents[existingIndex];
    const amountToRemove = Math.min(existing.quantity, quantity);

    existing.quantity -= amountToRemove;
    if (existing.quantity <= 1e-9) {
      this.contents.splice(existingIndex, 1);
    }

    this.recalculateStateAndAppearance();
    return {
      chemicalId: existing.chemicalId,
      quantity: amountToRemove,
      unit: existing.unit,
      concentration: existing.concentration
    };
  }

  /**
   * Clears all chemical contents from container and resets state.
   */
  clear() {
    this.contents = [];
    this.ph = 7.0;
    this.isMixed = false;
    this.isHeating = false;
    this.state = 'empty';
    this.appearance = 'colorless';
  }

  /**
   * Dynamically evaluates container physical state, pH, and visual appearance based on contents.
   * @param {Object} [lastAddedChemical] Optional chemical def that was just added
   */
  recalculateStateAndAppearance(lastAddedChemical) {
    if (this.contents.length === 0) {
      this.state = 'empty';
      this.appearance = 'colorless';
      this.ph = 7.0;
      return;
    }

    const states = new Set(this.contents.map((c) => c.state));
    if (states.has('liquid') || states.has('aqueous')) {
      if (states.has('solid')) {
        this.state = 'suspension';
      } else {
        this.state = 'solution';
      }
    } else if (states.has('solid')) {
      this.state = 'solid';
    } else if (states.has('gas')) {
      this.state = 'gas';
    } else {
      this.state = 'mixed';
    }

    if (lastAddedChemical && typeof lastAddedChemical.ph === 'number') {
      this.ph = lastAddedChemical.ph;
    } else if (lastAddedChemical && lastAddedChemical.safetyProperties && typeof lastAddedChemical.safetyProperties.ph === 'number') {
      this.ph = lastAddedChemical.safetyProperties.ph;
    }

    const coloredItem = this.contents.find((c) => c.color && c.color !== 'colorless' && c.color !== 'clear');
    if (coloredItem) {
      this.appearance = coloredItem.color;
    } else {
      this.appearance = 'colorless';
    }
  }

  /**
   * Serializes container to a plain JS object.
   */
  toJSON() {
    return {
      id: this.id,
      equipmentId: this.equipmentId,
      equipmentName: this.equipmentName,
      capacity: this.capacity,
      unit: this.unit,
      temperature: Math.round(this.temperature * 100) / 100,
      ph: this.ph !== null && this.ph !== undefined ? Math.round(this.ph * 100) / 100 : null,
      state: this.state,
      appearance: this.appearance,
      isHeating: this.isHeating,
      isMixed: this.isMixed,
      contents: this.contents.map((c) => ({
        chemicalId: c.chemicalId,
        name: c.name,
        formula: c.formula,
        quantity: Math.round(c.quantity * 1000) / 1000,
        unit: c.unit,
        concentration: c.concentration,
        state: c.state,
        color: c.color
      }))
    };
  }
}

export { Container };
export default Container;
