import { EffectCategories } from './types.js';

class EffectRegistry {
  constructor() {
    this.registry = new Map();
    this.registerDefaultEffects();
  }

  registerDefaultEffects() {
    this.register('gas_evolution', {
      id: 'gas_evolution',
      category: EffectCategories.GAS,
      duration: 3500,
      intensity: 0.8,
      repeat: false,
      position: 'interior',
      particleBehavior: {
        type: 'bubbles',
        count: 24,
        speed: 'rising',
        sizeRange: [2, 7],
        fadeOnComplete: true
      },
      environmentalEffect: 'slight_bubbling_sound_id',
      supportedStates: ['liquid', 'solution']
    });

    this.register('precipitation', {
      id: 'precipitation',
      category: EffectCategories.PRECIPITATE,
      duration: 4000,
      intensity: 0.85,
      repeat: false,
      position: 'interior',
      particleBehavior: {
        type: 'suspended_particles',
        count: 40,
        settleToBottom: true,
        settleDuration: 3000,
        sedimentLayer: true
      },
      supportedStates: ['liquid', 'solution']
    });

    this.register('color_change', {
      id: 'color_change',
      category: EffectCategories.COLOR,
      duration: 2000,
      intensity: 1.0,
      repeat: false,
      position: 'full_container',
      colorBehavior: {
        mode: 'transition',
        transitionCurve: 'ease-in-out'
      },
      supportedStates: ['liquid', 'solution', 'solid', 'gas']
    });

    this.register('temperature_rise', {
      id: 'temperature_rise',
      category: EffectCategories.THERMAL,
      duration: 3000,
      intensity: 0.6,
      repeat: false,
      position: 'container_glow',
      colorBehavior: {
        glowColor: 'rgba(255, 100, 50, 0.35)',
        heatDistortion: true
      },
      supportedStates: ['liquid', 'solution', 'solid', 'gas']
    });

    this.register('temperature_drop', {
      id: 'temperature_drop',
      category: EffectCategories.THERMAL,
      duration: 3000,
      intensity: 0.6,
      repeat: false,
      position: 'container_glow',
      colorBehavior: {
        glowColor: 'rgba(100, 200, 255, 0.35)',
        frostIndication: true
      },
      supportedStates: ['liquid', 'solution', 'solid', 'gas']
    });

    this.register('combustion', {
      id: 'combustion',
      category: EffectCategories.COMBUSTION,
      duration: 2500,
      intensity: 1.0,
      repeat: false,
      position: 'top_opening',
      particleBehavior: {
        type: 'flame_burst',
        count: 15,
        smokeTrail: true
      },
      colorBehavior: {
        flameColor: '#ff5500',
        coreGlow: '#ffff00'
      },
      supportedStates: ['solid', 'liquid', 'gas']
    });

    this.register('neutralization', {
      id: 'neutralization',
      category: EffectCategories.COLOR,
      duration: 2500,
      intensity: 0.7,
      repeat: false,
      position: 'interior',
      particleBehavior: {
        type: 'subtle_bubbles',
        count: 10
      },
      colorBehavior: {
        phTransition: true
      },
      supportedStates: ['solution', 'liquid']
    });

    this.register('crystal_growth', {
      id: 'crystal_growth',
      category: EffectCategories.PHASE,
      duration: 5000,
      intensity: 0.9,
      repeat: false,
      position: 'bottom_interior',
      particleBehavior: {
        type: 'crystalline_facets',
        nucleationPoints: 5,
        growthSpeed: 'gradual'
      },
      supportedStates: ['solution', 'liquid']
    });

    this.register('electrolysis', {
      id: 'electrolysis',
      category: EffectCategories.ELECTRICAL,
      duration: 4000,
      intensity: 0.75,
      repeat: false,
      position: 'electrodes',
      particleBehavior: {
        type: 'electrode_bubbles',
        anodeBubbles: true,
        cathodeBubbles: true
      },
      supportedStates: ['solution', 'liquid']
    });

    this.register('spark', {
      id: 'spark',
      category: EffectCategories.COMBUSTION,
      duration: 800,
      intensity: 1.0,
      repeat: false,
      position: 'top_opening',
      particleBehavior: {
        type: 'sparks',
        count: 12
      },
      supportedStates: ['gas', 'solid', 'liquid']
    });

    this.register('flame', {
      id: 'flame',
      category: EffectCategories.COMBUSTION,
      duration: 3000,
      intensity: 0.9,
      repeat: true,
      position: 'top_opening',
      particleBehavior: {
        type: 'continuous_flame'
      },
      supportedStates: ['gas', 'solid', 'liquid']
    });

    this.register('smoke', {
      id: 'smoke',
      category: EffectCategories.COMBUSTION,
      duration: 3500,
      intensity: 0.6,
      repeat: false,
      position: 'top_opening',
      particleBehavior: {
        type: 'rising_smoke',
        count: 15
      },
      supportedStates: ['gas', 'solid', 'liquid']
    });
  }

  register(effectId, definition) {
    if (!effectId || typeof effectId !== 'string') {
      throw new Error('Invalid effectId supplied to EffectRegistry.');
    }
    this.registry.set(effectId, {
      id: effectId,
      ...definition
    });
  }

  get(effectId) {
    return this.registry.get(effectId) || null;
  }

  has(effectId) {
    return this.registry.has(effectId);
  }

  getAll() {
    return Array.from(this.registry.values());
  }
}

export { EffectRegistry };
export default EffectRegistry;
