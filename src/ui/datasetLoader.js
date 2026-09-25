import elements from '../../data/elements/elements.json';
import chemicals from '../../data/chemicals/chemicals.json';
import chemicalCategories from '../../data/chemicals/chemical_categories.json';
import equipment from '../../data/equipment/equipment.json';
import reactions from '../../data/reactions/reactions.json';
import reactionTypes from '../../data/reactions/reaction_types.json';
import experiments from '../../data/experiments/experiments.json';
import challenges from '../../data/challenges/challenges.json';
import achievements from '../../data/achievements/achievements.json';

import * as LabManagerPkg from '../lab/LabManager';
import * as ChemistryEnginePkg from '../chemistry/engine/ChemistryEngine';

const LabManager = LabManagerPkg.default || LabManagerPkg.LabManager || LabManagerPkg;
const ChemistryEngine = ChemistryEnginePkg.default || ChemistryEnginePkg.ChemistryEngine || ChemistryEnginePkg;

export const datasets = {
  elements,
  chemicals,
  chemicalCategories,
  equipment,
  reactions,
  reactionTypes,
  experiments,
  challenges,
  achievements
};

export function createLabManager() {
  const engine = new ChemistryEngine({ datasets });
  return new LabManager({ engine });
}
