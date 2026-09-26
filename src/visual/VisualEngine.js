import EffectRegistry from './EffectRegistry.js';
import EffectResolver from './EffectResolver.js';

class VisualEngine {
  constructor(options = {}) {
    this.registry = options.registry || new EffectRegistry();
    this.resolver = options.resolver || new EffectResolver(this.registry);
    this.activeEffects = new Map();
    this.listeners = new Set();
  }

  resolveVisualEffects(reactionResult, targetContainerId = null) {
    return this.resolver.resolveVisualEffects(reactionResult, targetContainerId);
  }

  getVisualEffect(effectId) {
    return this.registry.get(effectId);
  }

  playVisualEffect(effectOrResult, targetContainerId = null) {
    if (!effectOrResult) return [];

    let effectsToPlay = [];

    if (Array.isArray(effectOrResult)) {
      effectsToPlay = effectOrResult;
    } else if (effectOrResult.id && typeof effectOrResult.update === 'function') {
      effectsToPlay = [effectOrResult];
    } else {
      effectsToPlay = this.resolveVisualEffects(effectOrResult, targetContainerId);
    }

    const startedEffects = [];
    for (const effect of effectsToPlay) {
      if (!effect) continue;
      if (targetContainerId && !effect.targetContainerId) {
        effect.targetContainerId = targetContainerId;
      }
      effect.start();
      this.activeEffects.set(effect.instanceId, effect);
      startedEffects.push(effect);
    }

    if (startedEffects.length > 0) {
      this.notifyListeners();
    }

    return startedEffects;
  }

  update(deltaTimeMs = 100) {
    let changed = false;
    for (const [instanceId, effect] of this.activeEffects.entries()) {
      effect.update(deltaTimeMs);
      if (!effect.isActive()) {
        this.activeEffects.delete(instanceId);
        changed = true;
      }
    }

    if (changed) {
      this.notifyListeners();
    }
  }

  clearVisualEffects(targetContainerId = null) {
    if (targetContainerId) {
      for (const [instanceId, effect] of this.activeEffects.entries()) {
        if (effect.targetContainerId === targetContainerId) {
          effect.complete();
          this.activeEffects.delete(instanceId);
        }
      }
    } else {
      for (const effect of this.activeEffects.values()) {
        effect.complete();
      }
      this.activeEffects.clear();
    }

    this.notifyListeners();
  }

  getActiveEffects(containerId = null) {
    const active = Array.from(this.activeEffects.values()).filter((e) => e.isActive());
    if (containerId) {
      return active.filter((e) => e.targetContainerId === containerId);
    }
    return active;
  }

  onEffectsChanged(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }
    return () => {};
  }

  notifyListeners() {
    const activeList = this.getActiveEffects();
    for (const callback of this.listeners) {
      try {
        callback(activeList);
      } catch (e) {
        console.error('Error in VisualEngine listener callback:', e);
      }
    }
  }
}

export { VisualEngine };
export default VisualEngine;
