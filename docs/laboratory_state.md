# ChemLab Laboratory State & Interaction System (v1)

This document provides complete documentation for the core Laboratory State and Interaction System created for ChemLab.

The system is designed to manage container state, equipment properties, chemical contents, physical state, quantities, concentrations, temperature, pH, visual appearance, user actions, and reaction history. It connects seamlessly with the Chemistry Engine without duplicating chemical reaction logic.

---

## 1. Laboratory State Architecture

The laboratory state is modular, decoupled from any visual UI or rendering framework, and entirely data-driven.

```
LabManager (Action Executor & Integration Layer)
  ├── LabState (Session State Registry)
  │     ├── Containers Map <string, Container>
  │     ├── Environment (ambient temperature, pressure)
  │     ├── ActionHistory Array
  │     └── ReactionHistory Array
  └── ChemistryEngine (Scientific Simulation Engine)
```

### Components

- **`LabManager`**: The primary entry point / API for triggering actions, performing validations, updating state, invoking the Chemistry Engine, applying reaction results, and maintaining history.
- **`LabState`**: Represents a single laboratory session state containing containers, equipment, history logs, and environmental settings.
- **`Container`**: Represents an individual vessel (e.g., beaker, test tube, flask) tracking its capacity, chemical contents, physical state, temperature, pH, and appearance.
- **`ChemistryEngine`**: Scientific dataset lookup and reaction simulator. Evaluates reactions, stoichiometry, temperature thresholds, and chemical product formation.

---

## 2. Data Models

### Container Model

Each container tracks:

- **`id`**: Unique container string identifier.
- **`equipmentId`**: ID referencing the equipment dataset definition (e.g., `'beaker'`).
- **`equipmentName`**: Human-readable equipment name.
- **`capacity`**: Maximum capacity in volume or unit (e.g., `250`).
- **`unit`**: Unit of measurement (`'mL'`).
- **`temperature`**: Current container temperature in °C.
- **`ph`**: Calculated pH value of the liquid solution.
- **`state`**: Physical state (`'empty'`, `'liquid'`, `'solid'`, `'solution'`, `'suspension'`, `'gas'`, `'precipitate_formed'`).
- **`appearance`**: Visual appearance descriptor (`'colorless'`, `'blue'`, `'white_silver_chloride'`, etc.).
- **`isHeating`**: Boolean indicating active heating status.
- **`isMixed`**: Boolean indicating whether contents have been stirred/mixed.
- **`contents`**: Array of `ChemicalContent` objects.

### Chemical Content Model

Each chemical entry inside a container represents:

- **`chemicalId`**: Chemical ID referencing the chemical dataset (e.g., `'hydrochloric_acid'`).
- **`name`**: Display name of chemical.
- **`formula`**: Chemical formula (e.g., `'HCl(aq)'`).
- **`quantity`**: Numerical quantity.
- **`unit`**: Unit of quantity (`'mL'`, `'g'`).
- **`concentration`**: Concentration value where applicable (e.g., `1.0` M).
- **`state`**: Physical state (`'liquid'`, `'solid'`, `'gas'`, `'aqueous'`).
- **`color`**: Chemical color descriptor.

---

## 3. Supported Laboratory Actions

The `LabManager` API exposes the following core operations:

1. **`createContainer(equipmentId, customContainerId?)`**: Creates a new equipment container.
2. **`addChemical(containerId, chemicalId, quantity, unit?, concentration?)`**: Adds chemical to container, checks capacity, and evaluates potential reactions.
3. **`removeChemical(containerId, chemicalId, quantity)`**: Removes a specified quantity of chemical.
4. **`transfer(sourceContainerId, targetContainerId, quantity)`**: Transfers a proportional quantity of mixture from source container to target container.
5. **`mix(containerId)`**: Stirs/mixes container contents and re-evaluates reaction conditions.
6. **`heat(containerId, targetTemperature)`**: Heats container to specified temperature, verifying equipment safety limits, and evaluating temperature-dependent reactions.
7. **`cool(containerId, targetTemperature)`**: Cools container to specified temperature.
8. **`measure(containerId)`**: Returns structured physical measurements (volume, temperature, pH, mass, state, appearance).
9. **`clearContainer(containerId)`**: Clears all chemical contents from container.
10. **`disposeContents(containerId)`**: Alias for `clearContainer`.
11. **`removeEquipment(containerId)`**: Removes container equipment from laboratory state.
12. **`resetLab()`**: Clears all containers and history, resetting session state.

---

## 4. Reaction Integration Flow

When an action (such as `addChemical`, `transfer`, `mix`, or `heat`) alters container contents or conditions:

```
User / UI Action
  │
  ▼
LabManager validates action & capacity
  │
  ▼
LabManager updates Container contents / temperature
  │
  ▼
LabManager formats simulation state
  │
  ▼
ChemistryEngine.simulate(simState)
  │
  ▼
Simulation Result (Success / Products / Heat Change / pH / Visual Effects)
  │
  ▼
LabManager applies Result to Container
  │
  ▼
Record Action & Reaction Entry in History
```

This guarantees strict separation:
- **Chemistry Engine** determines science and reactions.
- **Laboratory State Layer** manages container contents, capacities, history, and state lifecycle.

---

## 5. Action Validation & Error Handling

All actions return structured result objects with explicit error codes instead of throwing unhandled console errors or exceptions.

### Error Codes (`LabErrorCodes`)

- **`insufficient_capacity`**: Attempting to add or transfer material exceeding container capacity.
- **`invalid_quantity`**: Invalid, zero, or negative quantities, or transferring more material than available.
- **`chemical_not_found`**: Invalid chemical ID or chemical not present in container.
- **`container_not_found`**: Specified container ID does not exist in state.
- **`equipment_not_found`**: Specified equipment ID does not exist in dataset.
- **`incompatible_action`**: Action violates equipment safety limits (e.g., heating beyond max temperature).
- **`invalid_parameter`**: Missing or invalid parameters.

---

## 6. Example Workflow

Below is a complete JavaScript example showing how a future UI or script interacts with the Laboratory State system:

```javascript
const { LabManager } = require('./src/lab');

// 1. Instantiate LabManager
const lab = new LabManager();

// 2. Create Beaker A and Beaker B
lab.createContainer('beaker', 'beaker_a');
lab.createContainer('beaker', 'beaker_b');

// 3. Add HCl to Beaker A
lab.addChemical('beaker_a', 'hydrochloric_acid', 50, 'mL');

// 4. Add NaOH to Beaker B
lab.addChemical('beaker_b', 'sodium_hydroxide', 50, 'mL');

// 5. Transfer 25 mL NaOH from Beaker B to Beaker A
const transferResult = lab.transfer('beaker_b', 'beaker_a', 25);

if (transferResult.reactionTriggered) {
  console.log('Reaction Triggered!', transferResult.reactionResult.equation);
}

// 6. Measure Beaker A
const measurement = lab.measure('beaker_a');
console.log('Beaker A Volume:', measurement.measurement.volume);
console.log('Beaker A pH:', measurement.measurement.ph);
console.log('Beaker A Temp:', measurement.measurement.temperature);

// 7. Inspect Action and Reaction Histories
console.log('Actions Logged:', lab.getLabState().actionHistory.length);
console.log('Reactions Logged:', lab.getLabState().reactionHistory.length);
```
