# ChemLab Chemistry Engine v1 Architecture & API Documentation

## Overview

The **ChemLab Chemistry Engine v1** is a pure, UI-agnostic simulation engine designed to interpret the ChemLab scientific dataset (`data/`). It evaluates laboratory states, identifies chemical reactions, enforces stoichiometric balance and environmental conditions, and outputs structured simulation results along with updated laboratory states.

---

## 1. Architectural Pipeline

```
          Laboratory State (Simulation Input)
                         │
                         ▼
                +-----------------+
                | Chemistry Engine |
                +-----------------+
                         │
                         ▼
            1. Reaction Matcher (dataset inspection)
                         │
                         ▼
            2. Condition Resolver (temp, heat, catalyst)
                         │
                         ▼
            3. Quantity / Stoichiometry Resolver
                         │
                         ▼
            4. Reaction Resolver (effects, pH, temp update)
                         │
                         ▼
            5. Result Builder (standardized output)
                         │
                         ▼
        Structured Simulation Result + Next Lab State
```

### Key Components

* **`ChemistryEngine` (`src/chemistry/engine/ChemistryEngine.js`)**: Main facade exposing data accessors and simulation methods (`simulate`, `findReactions`, `applyReaction`).
* **`reactionMatcher` (`src/chemistry/engine/reactionMatcher.js`)**: Inspects present chemicals in container contents, matches against dataset reaction definitions, and applies deterministic ranking.
* **`conditionResolver` (`src/chemistry/engine/conditionResolver.js`)**: Evaluates environmental parameters such as temperature limits, active heating, catalysts, and equipment requirements.
* **`quantityResolver` (`src/chemistry/engine/quantityResolver.js`)**: Computes reaction stoichiometry, limiting reactants, reactant consumption, and product yield quantities.
* **`reactionResolver` (`src/chemistry/engine/reactionResolver.js`)**: Computes state updates including consumed reactants, produced products, resulting pH, and temperature changes.
* **`resultBuilder` (`src/chemistry/engine/resultBuilder.js`)**: Constructs standardized result objects for success and failure cases.

---

## 2. Input Format (`SimulationState`)

The engine accepts a structured laboratory state representing a container and its contents:

```json
{
  "containerId": "beaker",
  "temperature": 25.0,
  "ph": 1.0,
  "isHeating": false,
  "contents": [
    {
      "chemicalId": "hydrochloric_acid",
      "quantity": 50,
      "unit": "mL",
      "concentration": 1.0
    },
    {
      "chemicalId": "sodium_hydroxide",
      "quantity": 50,
      "unit": "mL",
      "concentration": 1.0
    }
  ]
}
```

---

## 3. Output Format (`SimulationResult`)

### 3.1 Successful Reaction Example

```json
{
  "success": true,
  "reactionId": "hcl_naoh_neutralization",
  "reactionName": "Neutralization of Hydrochloric Acid with Sodium Hydroxide",
  "reactionType": "neutralization",
  "equation": "HCl(aq) + NaOH(aq) -> NaCl(aq) + H2O(l)",
  "scale": 50,
  "consumedReactants": [
    { "chemicalId": "hydrochloric_acid", "quantity": 50, "stoichiometry": 1 },
    { "chemicalId": "sodium_hydroxide", "quantity": 50, "stoichiometry": 1 }
  ],
  "products": [
    { "chemicalId": "sodium_chloride", "quantity": 50, "stoichiometry": 1 },
    { "chemicalId": "water", "quantity": 50, "stoichiometry": 1 }
  ],
  "effects": {
    "temperatureChange": 5.0,
    "phChange": true,
    "targetPh": 7.0,
    "colorChange": null,
    "gasProduced": null,
    "precipitate": null,
    "flame": false,
    "bubbles": false,
    "crystalFormation": false,
    "smoke": false,
    "energyChange": "exothermic",
    "stateChange": null
  },
  "visualEffect": "neutralization",
  "explanation": "Hydrochloric acid reacts with sodium hydroxide in a 1:1 mole ratio to yield aqueous sodium chloride and water...",
  "nextState": {
    "containerId": "beaker",
    "temperature": 30.0,
    "ph": 7.0,
    "isHeating": false,
    "contents": [
      { "chemicalId": "sodium_chloride", "quantity": 50, "unit": "mL", "concentration": 1 },
      { "chemicalId": "water", "quantity": 50, "unit": "mL", "concentration": null }
    ]
  }
}
```

### 3.2 Failure / Non-Reaction Example

```json
{
  "success": false,
  "reactionId": null,
  "reason": "condition_not_met",
  "details": "Reaction 'mg_o2_combustion' requires heating or temperature >= 500°C.",
  "candidateCount": 1,
  "matchingReactions": [
    {
      "reactionId": "mg_o2_combustion",
      "conditionsMet": false,
      "conditionDetails": {
        "met": false,
        "reason": "temperature_below_minimum",
        "details": "Required minimum temperature is 500°C, current is 25°C."
      }
    }
  ],
  "nextState": { ... }
}
```

---

## 4. Reaction Matching & Prioritization Rules

When multiple reactions match the present chemicals, the engine applies a deterministic ranking rule:

1. **Condition Satisfaction**: Reactions whose temperature, heating, and catalyst conditions are met rank higher.
2. **Reactant Specificity**: Reactions requiring a greater number of reactants take priority (e.g., 3-reactant redox vs 2-reactant simple replacement).
3. **Difficulty Rating**: Reactions with lower difficulty ratings rank higher.
4. **Alphabetical ID**: Ties are broken alphabetically by `reaction.id`.

---

## 5. Stoichiometry & Quantity Resolution

* Reactant ratios are strictly evaluated against reaction coefficients (`stoichiometry` field).
* The limiting reactant determines the reaction scale ($scale = \min(\text{quantity}_i / \text{stoichiometry}_i)$).
* Excess reactants remain in `nextState.contents` in reduced quantities.
* Products are added to `nextState.contents` proportional to reaction scale and stoichiometry.

---

## 6. Public API Reference

```javascript
const { ChemistryEngine } = require('chemlab-dataset');
const engine = new ChemistryEngine();

// Data Accessors
engine.getElement('hydrogen');              // Element definition
engine.getChemical('hydrochloric_acid');    // Chemical definition
engine.getEquipment('beaker');              // Equipment definition
engine.getReaction('hcl_naoh_neutralization'); // Reaction definition
engine.getExperiment('neutralize_acid_base'); // Guided experiment
engine.getChallenge('target_ph_7');         // Challenge definition
engine.getAchievement('first_reaction');    // Achievement definition

// Simulation Methods
engine.findReactions(simulationState);      // Inspection without state mutation
engine.simulate(simulationState);           // Full simulation returning result & nextState
engine.applyReaction(simulationState, rxn); // Force execution of specific reaction
```

---

## 7. How the UI Layer Will Consume the Engine

1. The future UI layer collects user actions (adding chemicals to a container, turning on a Bunsen burner).
2. The UI constructs a `SimulationState` object and calls `engine.simulate(state)`.
3. If `result.success` is `true`:
   - The UI triggers particle effects or animations based on `result.visualEffect` (e.g., `"precipitation"`, `"gas_evolution"`, `"combustion"`).
   - The UI updates its container state using `result.nextState`.
4. If `result.success` is `false`:
   - The UI maintains the current state and displays educational hints if appropriate based on `result.reason`.

---

## 8. Scientific Limitations (Educational Simulation v1)

* **Discrete Reaction Step**: Reactions resolve deterministically per simulation call.
* **Simplified Thermal & Mass Balance**: Temperature changes are derived from experimental delta values rather than heat capacity dynamics.
* **Dataset Bound**: Behaviours not explicitly defined in `data/reactions/reactions.json` return `no_reaction` rather than unverified reactions.
