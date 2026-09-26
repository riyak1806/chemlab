import { EffectLifecycle, EffectCategories } from './types.js';

class VisualEffect {
  constructor(options = {}) {
    if (!options.id) {
      throw new Error('VisualEffect requires an "id" property.');
    }

    this.id = options.id;
    this.instanceId = options.instanceId || `effect_${options.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.category = options.category || EffectCategories.PHYSICAL;
    this.duration = typeof options.duration === 'number' && options.duration > 0 ? options.duration : 3000;
    this.intensity = typeof options.intensity === 'number' ? Math.max(0.0, Math.min(1.0, options.intensity)) : 1.0;
    this.repeat = Boolean(options.repeat);
    this.particleBehavior = options.particleBehavior ? { ...options.particleBehavior } : {};
    this.colorBehavior = options.colorBehavior ? { ...options.colorBehavior } : null;
    this.scale = typeof options.scale === 'number' ? options.scale : 1.0;
    this.position = options.position || 'center';
    this.soundIdentifier = options.soundIdentifier || null;
    this.environmentalEffect = options.environmentalEffect || null;
    this.supportedStates = Array.isArray(options.supportedStates) ? [...options.supportedStates] : ['liquid', 'solution', 'gas', 'solid'];
    this.targetContainerId = options.targetContainerId || null;

    this.state = EffectLifecycle.IDLE;
    this.startTime = null;
    this.elapsedTime = 0;
  }

  start() {
    this.state = EffectLifecycle.STARTING;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.state = EffectLifecycle.ACTIVE;
    return this;
  }

  update(deltaTimeMs = 0) {
    if (this.state === EffectLifecycle.COMPLETED) {
      return this.state;
    }

    if (this.state === EffectLifecycle.IDLE) {
      this.start();
    }

    this.elapsedTime += Math.max(0, deltaTimeMs);

    if (!this.repeat && this.elapsedTime >= this.duration) {
      this.state = EffectLifecycle.COMPLETING;
      this.complete();
    }

    return this.state;
  }

  complete() {
    this.state = EffectLifecycle.COMPLETED;
    return this;
  }

  isActive() {
    return this.state === EffectLifecycle.ACTIVE || this.state === EffectLifecycle.STARTING;
  }

  toJSON() {
    return {
      instanceId: this.instanceId,
      id: this.id,
      category: this.category,
      duration: this.duration,
      intensity: this.intensity,
      repeat: this.repeat,
      particleBehavior: this.particleBehavior,
      colorBehavior: this.colorBehavior,
      scale: this.scale,
      position: this.position,
      soundIdentifier: this.soundIdentifier,
      environmentalEffect: this.environmentalEffect,
      supportedStates: this.supportedStates,
      targetContainerId: this.targetContainerId,
      state: this.state,
      elapsedTime: this.elapsedTime
    };
  }
}

export { VisualEffect };
export default VisualEffect;
