# ChemLab Scientific Dataset Foundation (Phase 1)

Welcome to the **ChemLab Scientific Data Foundation**.

ChemLab is designed as a modern, visually polished, browser-based interactive chemistry laboratory and learning game. This directory (`data/`) contains the complete, machine-readable scientific data architecture powering ChemLab's future chemistry simulation engine, visual effects engine, periodic table interactive explorer, guided experiments, challenges, and achievement progression system.

---

## 1. Dataset Architecture

The dataset is organized into modular JSON datasets located in `data/`, indexed centrally by `data/index.json`.

```
data/
├── elements/
│   ├── elements.json                # Complete dataset for all 118 chemical elements
│   └── element_categories.json      # Standardized categories (alkali metals, halogen, etc.)
│
├── chemicals/
│   ├── chemicals.json               # 49 MVP educational chemicals and substances
│   └── chemical_categories.json     # Standardized chemical categories (acid, base, salt, etc.)
│
├── equipment/
│   └── equipment.json               # 17 core laboratory equipment items
│
├── reactions/
│   ├── reactions.json               # 40 scientifically verified chemical reactions
│   └── reaction_types.json          # Standardized reaction classification system
│
├── experiments/
│   └── experiments.json             # 15 educational guided experiments
│
├── challenges/
│   └── challenges.json              # 10 game-like chemistry challenges
│
├── achievements/
│   └── achievements.json           # 15 data-driven achievements
│
├── index.json                       # Central master index registry
└── README.md                        # Architectural and schema documentation
```

### Architectural Separation
* **Dataset (`data/`)**: Pure scientific knowledge, schemas, chemical definitions, and metadata.
* **Future Chemistry Engine**: Interprets chemical properties, stoichiometry, equilibrium, and reaction rate dynamics.
* **Future Visual Engine**: Maps reaction visual effect keys to 2D/3D shaders, animations, particles, and color transitions.
* **Future Lab UI**: User interface, equipment interaction, controls, HUD, and web pages.

---

## 2. Standard Units

All numeric values across all ChemLab datasets use standardized SI or standard chemical units:

* **Atomic Mass**: Atomic Mass Units ($\text{u}$ or $\text{Da}$)
* **Molar Mass**: Grams per mole ($\text{g/mol}$)
* **Temperature / Melting Point / Boiling Point**: Celsius ($\text{^\circ C}$)
* **Density**:
  * Solids and liquids: Grams per cubic centimeter ($\text{g/cm}^3$)
  * Gases at STP: Grams per liter ($\text{g/L}$)
* **Solubility**: Grams of solute per $100\text{ mL}$ of water at $20\text{^\circ C}$ ($\text{g/100 mL}$)
* **Volume**: Milliliters ($\text{mL}$)
* **Mass**: Grams ($\text{g}$)
* **pH**: Standard pH scale ($0.0 - 14.0$)
* **Time**: Seconds ($\text{s}$) or descriptive text (e.g., `"10 mins"`)

---

## 3. Dataset Schemas & Important Fields

### 3.1 `data/elements/elements.json`
Contains all 118 chemical elements (atomic numbers 1 to 118).

* `id`: Lowercase string identifier (e.g. `"hydrogen"`, `"sodium"`).
* `atomicNumber`: Integer from 1 to 118.
* `name`: Full IUPAC name (e.g. `"Sodium"`).
* `symbol`: Standard chemical symbol (e.g. `"Na"`).
* `atomicMass`: Standard IUPAC relative atomic mass.
* `category`: Identifier corresponding to `element_categories.json`.
* `group`: Periodic group number ($1-18$, or `null` for lanthanides/actinides).
* `period`: Periodic period number ($1-7$).
* `block`: Electronic orbital block (`"s"`, `"p"`, `"d"`, `"f"`).
* `phase`: State at room temperature (`"gas"`, `"liquid"`, `"solid"`).
* `electronConfiguration`: Standard notation (e.g. `"[Ne] 3s1"`).
* `electronShells`: Array of electron counts per shell (e.g. `[2, 8, 1]`).
* `electronegativity`: Pauling electronegativity value (`null` if unmeasured/noble gas).
* `oxidationStates`: Array of common oxidation numbers.
* `meltingPoint`: Melting point in $^{\circ}\text{C}$ (`null` if unknown).
* `boilingPoint`: Boiling point in $^{\circ}\text{C}$ (`null` if unknown).
* `density`: Density at STP in $\text{g/cm}^3$ or $\text{g/L}$ (`null` if unknown).
* `appearance`: Visual appearance description.
* `discoveryYear`: Integer year of discovery (negative for antiquity).
* `commonUses`: Array of real-world applications.
* `safetyClass`: Standard safety descriptor (e.g. `"flammable_gas"`, `"water_reactive"`).
* `verification`: Object containing `status`, `sources`, and `notes`.

### 3.2 `data/chemicals/chemicals.json`
Contains chemical compounds, element samples, aqueous solutions, and reagents.

* `id`: Lowercase identifier (e.g. `"hydrochloric_acid"`, `"sodium_hydroxide"`).
* `name`: Display name.
* `formula`: Chemical formula with state annotation (e.g. `"HCl(aq)"`, `"CuSO4·5H2O"`).
* `type`: Entity type (`"compound"`, `"element"`, `"solution"`).
* `categories`: Array of category IDs from `chemical_categories.json` (e.g. `["acid", "inorganic", "solution"]`).
* `state`: Standard physical state (`"liquid"`, `"solid"`, `"gas"`).
* `molarMass`: Molar mass in $\text{g/mol}$.
* `appearance`: Object defining `color`, `transparency`, and `state`.
* `properties`: Physical parameters (`density`, `ph`, `boilingPoint`, `meltingPoint`, `conductive`).
* `solubility`: Object with `waterSoluble` boolean and `solubilityGPer100mL` number.
* `commonUses`: Educational and practical applications.
* `safety`: GHS safety data (`hazardClass`, `ghsSignalWord`, `pictograms`, `precautions`).
* `visual`: Rendering hints (`hexColor`, `opacity`, `texture`).
* `availableInLab`: Boolean flag for availability in virtual lab.
* `verification`: Scientific verification metadata.

### 3.3 `data/equipment/equipment.json`
Defines 17 laboratory glassware items, transfer tools, measurement devices, and heat sources.

* `id`: Lowercase identifier (e.g. `"beaker"`, `"bunsen_burner"`).
* `name`: Equipment name.
* `category`: Functional category (`"glassware"`, `"volumetric"`, `"transfer"`, `"measurement"`, `"heating"`, `"support"`, `"tools"`).
* `supportedActions`: List of interactive actions (`"fill"`, `"heat"`, `"titrate"`, `"measure_ph"`, etc.).
* `capacity`: Object with `value` and `unit` (e.g. `{ "value": 250, "unit": "mL" }`).
* `measurementProperties`: Precision metadata (`hasGraduations`, `precision`, `precisionUnit`).
* `safety`: Operating limits (`maxTemperature`, `fragile`, `precautions`).

### 3.4 `data/reactions/reactions.json`
Defines chemical reactions referencing chemical IDs for reactants and products.

* `id`: Unique identifier (e.g. `"hcl_naoh_neutralization"`).
* `name`: Descriptive name.
* `type`: Reaction category ID from `reaction_types.json` (`"neutralization"`, `"precipitation"`, `"redox"`, etc.).
* `reactants`: Array of `{ "chemicalId": string, "stoichiometry": number }`.
* `products`: Array of `{ "chemicalId": string, "stoichiometry": number }`.
* `equation`: Balanced chemical equation string.
* `conditions`: Environmental parameters (`minTemperature`, `maxTemperature`, `requiresHeating`, `catalyst`).
* `effects`: Standardized simulation outcome effects:
  * `temperatureChange`: Delta in $^{\circ}\text{C}$.
  * `phChange`: Boolean flag.
  * `targetPh`: Expected resulting pH value.
  * `colorChange`: Object with `from` and `to` descriptors.
  * `gasProduced`: Identifier of gas produced.
  * `precipitate`: Descriptor of solid precipitate formed.
  * `flame`, `bubbles`, `crystalFormation`, `smoke`: Booleans.
  * `energyChange`: `"exothermic"`, `"endothermic"`, or `"neutral"`.
  * `stateChange`: Descriptive state change key.
* `visualEffect`: Reusable visual animation identifier (e.g. `"neutralization"`, `"precipitation"`, `"gas_evolution"`, `"combustion"`, `"color_change"`).
* `explanation`: Educational scientific explanation.
* `verification`: Verification metadata.

### 3.5 `data/experiments/experiments.json`
Educational lab guided procedures.

* `id`: Experiment identifier.
* `title`: Display title.
* `description`: Overview.
* `difficulty`: `"beginner"`, `"intermediate"`, `"advanced"`.
* `availableChemicals`: Array of chemical IDs required for the experiment.
* `availableEquipment`: Array of equipment IDs required.
* `objective`: Learning goal.
* `successConditions`: Data-driven rules checked by the future simulation engine.
* `relatedReactions`: Array of reaction IDs triggered in this experiment.

### 3.6 `data/challenges/challenges.json` & `data/achievements/achievements.json`
Game layer datasets defining timed or constrained challenges and data-driven achievement unlocks based on simulation events.

---

## 4. ID & Cross-Reference Conventions

* **ID Format**: All IDs use lower_snake_case (e.g., `hydrochloric_acid`, `hcl_naoh_neutralization`, `alkali_metals`).
* **Strict Foreign Key Referencing**:
  * `reactions.json` reactants and products MUST reference valid chemical IDs in `chemicals.json`.
  * `experiments.json` availableChemicals MUST reference chemical IDs in `chemicals.json`.
  * `experiments.json` availableEquipment MUST reference equipment IDs in `equipment.json`.
  * `experiments.json` relatedReactions MUST reference reaction IDs in `reactions.json`.
  * `elements.json` category MUST reference category IDs in `element_categories.json`.
  * `chemicals.json` categories MUST reference category IDs in `chemical_categories.json`.
  * `reactions.json` type MUST reference type IDs in `reaction_types.json`.

---

## 5. Verification Rules

1. **No Invented Scientific Values**: Every chemical property and reaction equation MUST reflect real-world scientific literature.
2. **Verification Metadata**: Every element, chemical, and reaction record MUST include a `verification` object:
   ```json
   "verification": {
     "status": "verified" | "review_required" | "draft" | "deprecated",
     "sources": ["PubChem CID XXX", "NIST WebBook", "IUPAC"],
     "notes": "Explanatory note on values or uncertainties"
   }
 }
   ```
3. **Use of `review_required`**: If a property cannot be confidently verified with an authoritative scientific reference (e.g. unmeasured macroscopic physical properties of superheavy synthetic elements 100-118), mark status as `"review_required"` and explain in `notes`.

---

## 6. How to Validate the Dataset

Run the built-in validation script locally using Node.js:

```bash
npm run validate-data
```

The validation script (`scripts/validate.js`) executes checks for:
* JSON syntax errors in all dataset files.
* Presence and validity of `data/index.json`.
* ID uniqueness across all entities.
* Presence of all 118 elements (atomic numbers 1 to 118 complete).
* 100% validity of cross-references (reaction chemicals, experiment equipment/chemicals/reactions).
* Auditing of entries marked as `review_required`.

---

## 7. Guidelines for Extending the Dataset

### How to Add a New Chemical
1. Open `data/chemicals/chemicals.json`.
2. Generate a unique `id` in lower_snake_case (e.g., `"sodium_thiosulfate"`).
3. Ensure all categories used exist in `data/chemicals/chemical_categories.json`.
4. Verify physical properties (molar mass, density, solubility, pH) via PubChem or NIST.
5. Add GHS safety data and visual color hex values.
6. Include authoritative sources in `verification.sources`. If unsure of a value, set `"status": "review_required"`.
7. Run `npm run validate-data` to confirm validity.

### How to Add a New Reaction
1. Ensure all reactant and product chemicals exist in `data/chemicals/chemicals.json`.
2. Open `data/reactions/reactions.json`.
3. Create a unique reaction `id` (e.g., `"na2s2o3_hcl_decomposition"`).
4. Select a valid reaction type from `data/reactions/reaction_types.json`.
5. Set accurate stoichiometry and balanced chemical equation string.
6. Standardize the `effects` object using supported keys (`temperatureChange`, `phChange`, `gasProduced`, `precipitate`, `energyChange`, etc.).
7. Reference a standardized `visualEffect` identifier (e.g., `"precipitation"`, `"gas_evolution"`, `"color_change"`).
8. Add verification sources.
9. Run `npm run validate-data` to confirm cross-references pass.

### How to Add a New Guided Experiment
1. Open `data/experiments/experiments.json`.
2. Assign a unique `id` and descriptive title.
3. List required chemical IDs in `availableChemicals` (must exist in `chemicals.json`).
4. List required equipment IDs in `availableEquipment` (must exist in `equipment.json`).
5. Reference triggered reaction IDs in `relatedReactions` (must exist in `reactions.json`).
6. Define explicit data-driven `successConditions`.
7. Run `npm run validate-data`.
