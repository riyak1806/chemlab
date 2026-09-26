import VisualEffect from './VisualEffect.js';
import EffectRegistry from './EffectRegistry.js';

class EffectResolver {
  constructor(registry = new EffectRegistry()) {
    this.registry = registry;
  }

  resolveVisualEffects(reactionResult, targetContainerId = null) {
    if (!reactionResult || typeof reactionResult !== 'object') {
      return [];
    }

    const containerId = targetContainerId || reactionResult.containerId || null;
    const resolvedEffects = [];

    const primaryEffectId = reactionResult.visualEffect || (reactionResult.effects && reactionResult.effects.visualEffect);

    if (primaryEffectId && this.registry.has(primaryEffectId)) {
      const def = this.registry.get(primaryEffectId);
      const customProps = {};

      if (reactionResult.effects && reactionResult.effects.targetColor) {
        customProps.colorBehavior = {
          ...def.colorBehavior,
          targetColor: reactionResult.effects.targetColor
        };
      }

      if (reactionResult.effects && reactionResult.effects.precipitateColor) {
        customProps.colorBehavior = {
          ...def.colorBehavior,
          precipitateColor: reactionResult.effects.precipitateColor
        };
      }

      resolvedEffects.push(
        new VisualEffect({
          ...def,
          ...customProps,
          targetContainerId: containerId
        })
      );
    }

    const secondaryEffectIds = this._extractSecondaryEffects(reactionResult, primaryEffectId);
    for (const effectId of secondaryEffectIds) {
      if (effectId !== primaryEffectId && this.registry.has(effectId)) {
        const def = this.registry.get(effectId);
        resolvedEffects.push(
          new VisualEffect({
            ...def,
            targetContainerId: containerId
          })
        );
      }
    }

    return resolvedEffects;
  }

  _extractSecondaryEffects(result, primaryEffectId) {
    const secondary = new Set();
    const effectsObj = result.effects || {};

    if (effectsObj.gasEvolved || result.gasEvolved) {
      secondary.add('gas_evolution');
    }

    if (effectsObj.precipitateFormed || result.precipitateFormed) {
      secondary.add('precipitation');
    }

    if (effectsObj.temperatureDelta) {
      if (effectsObj.temperatureDelta > 0) {
        secondary.add('temperature_rise');
      } else if (effectsObj.temperatureDelta < 0) {
        secondary.add('temperature_drop');
      }
    }

    if (effectsObj.targetColor && primaryEffectId !== 'color_change') {
      secondary.add('color_change');
    }

    return Array.from(secondary);
  }
}

export { EffectResolver };
export default EffectResolver;
