/**
 * Quantity Resolver
 * Handles stoichiometric calculations, limiting reactant determination,
 * consumed reactant amounts, product yields, and remaining quantities.
 */

function resolveStoichiometry(reaction, contentsMap, datasetChemicalsMap) {
  const reactants = reaction.reactants || [];
  if (reactants.length === 0) {
    return {
      success: false,
      reason: 'no_reactants_in_reaction'
    };
  }

  // 1. Check presence & compute maximum reaction scale (limiting reactant)
  let limitingScale = Infinity;
  let limitingReactantId = null;

  for (const r of reactants) {
    const chemicalId = r.chemicalId;
    const requiredCoeff = r.stoichiometry || 1;
    const item = contentsMap.get(chemicalId);

    if (!item || item.quantity <= 0) {
      return {
        success: false,
        reason: 'missing_reactant',
        missingChemicalId: chemicalId
      };
    }

    const itemQuantity = item.quantity;
    // Calculate how many stoichiometric "moles" / units of reaction can occur
    const possibleScale = itemQuantity / requiredCoeff;

    if (possibleScale < limitingScale) {
      limitingScale = possibleScale;
      limitingReactantId = chemicalId;
    }
  }

  if (limitingScale <= 0 || limitingScale === Infinity) {
    return {
      success: false,
      reason: 'insufficient_quantity',
      details: 'Reactant quantities are insufficient to trigger reaction.'
    };
  }

  // Cap reaction scale if needed (e.g. max scale per tick = limitingScale)
  const scale = limitingScale;

  // 2. Compute consumed reactant quantities
  const consumedReactants = reactants.map((r) => {
    const amount = r.stoichiometry * scale;
    return {
      chemicalId: r.chemicalId,
      quantity: amount,
      stoichiometry: r.stoichiometry
    };
  });

  // 3. Compute produced product quantities
  const products = reaction.products || [];
  const producedProducts = products
    .filter((p) => p.stoichiometry > 0)
    .map((p) => {
      const amount = p.stoichiometry * scale;
      return {
        chemicalId: p.chemicalId,
        quantity: amount,
        stoichiometry: p.stoichiometry
      };
    });

  return {
    success: true,
    scale,
    limitingReactantId,
    consumedReactants,
    producedProducts
  };
}

module.exports = {
  resolveStoichiometry
};
