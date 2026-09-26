import assert from 'assert';
import {
  VisualEngine,
  EffectRegistry,
  EffectResolver,
  VisualEffect,
  EffectLifecycle,
  EffectCategories
} from '../src/visual/index.js';

export function runAllVisualEngineTests() {
  console.log('\n=== Running Reaction Visual Engine Test Suite ===\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err);
      failed++;
    }
  }

  const engine = new VisualEngine();

  test('1. Reaction with no visual effect', () => {
    const result = { success: true, reactionTriggered: false };
    const effects = engine.resolveVisualEffects(result);
    assert.strictEqual(effects.length, 0);
  });

  test('2. Single visual effect', () => {
    const result = { success: true, reactionTriggered: true, visualEffect: 'gas_evolution' };
    const effects = engine.resolveVisualEffects(result, 'beaker_1');
    assert.strictEqual(effects.length, 1);
    assert.strictEqual(effects[0].id, 'gas_evolution');
    assert.strictEqual(effects[0].targetContainerId, 'beaker_1');
  });

  test('3. Multiple visual effects', () => {
    const result = {
      success: true,
      reactionTriggered: true,
      visualEffect: 'gas_evolution',
      effects: {
        temperatureDelta: 10,
        targetColor: '#ff0000'
      }
    };
    const effects = engine.resolveVisualEffects(result, 'beaker_1');
    assert.strictEqual(effects.length, 3);
    const ids = effects.map((e) => e.id);
    assert.ok(ids.includes('gas_evolution'));
    assert.ok(ids.includes('temperature_rise'));
    assert.ok(ids.includes('color_change'));
  });

  test('4. Gas evolution', () => {
    const reg = engine.getVisualEffect('gas_evolution');
    assert.strictEqual(reg.category, EffectCategories.GAS);
    assert.strictEqual(reg.particleBehavior.type, 'bubbles');
  });

  test('5. Precipitation', () => {
    const reg = engine.getVisualEffect('precipitation');
    assert.strictEqual(reg.category, EffectCategories.PRECIPITATE);
    assert.strictEqual(reg.particleBehavior.settleToBottom, true);
  });

  test('6. Color change', () => {
    const reg = engine.getVisualEffect('color_change');
    assert.strictEqual(reg.category, EffectCategories.COLOR);
    assert.strictEqual(reg.colorBehavior.mode, 'transition');
  });

  test('7. Temperature rise', () => {
    const reg = engine.getVisualEffect('temperature_rise');
    assert.strictEqual(reg.category, EffectCategories.THERMAL);
    assert.ok(reg.colorBehavior.glowColor.includes('255, 100'));
  });

  test('8. Temperature drop', () => {
    const reg = engine.getVisualEffect('temperature_drop');
    assert.strictEqual(reg.category, EffectCategories.THERMAL);
    assert.ok(reg.colorBehavior.glowColor.includes('100, 200'));
  });

  test('9. Combustion if supported', () => {
    const reg = engine.getVisualEffect('combustion');
    assert.strictEqual(reg.category, EffectCategories.COMBUSTION);
    assert.strictEqual(reg.particleBehavior.type, 'flame_burst');
  });

  test('10. Unknown visualEffect ID', () => {
    const result = { success: true, visualEffect: 'unknown_magic_effect' };
    const effects = engine.resolveVisualEffects(result);
    assert.strictEqual(effects.length, 0);
  });

  test('11. Invalid visual effect data', () => {
    assert.throws(() => new VisualEffect({}), /requires an "id"/);
    const effects = engine.resolveVisualEffects(null);
    assert.strictEqual(effects.length, 0);
  });

  test('12. Effect lifecycle cleanup', () => {
    const testEngine = new VisualEngine();
    const played = testEngine.playVisualEffect({ visualEffect: 'gas_evolution' }, 'beaker_1');
    assert.strictEqual(testEngine.getActiveEffects().length, 1);

    // Fast forward past duration (3500ms)
    testEngine.update(4000);
    assert.strictEqual(testEngine.getActiveEffects().length, 0);
    assert.strictEqual(played[0].state, EffectLifecycle.COMPLETED);
  });

  test('13. Multiple effects targeting the same container', () => {
    const testEngine = new VisualEngine();
    testEngine.playVisualEffect({ visualEffect: 'gas_evolution' }, 'beaker_1');
    testEngine.playVisualEffect({ visualEffect: 'precipitation' }, 'beaker_1');

    const activeBeaker1 = testEngine.getActiveEffects('beaker_1');
    assert.strictEqual(activeBeaker1.length, 2);
  });

  test('14. Effects targeting different containers', () => {
    const testEngine = new VisualEngine();
    testEngine.playVisualEffect({ visualEffect: 'gas_evolution' }, 'beaker_A');
    testEngine.playVisualEffect({ visualEffect: 'precipitation' }, 'beaker_B');

    assert.strictEqual(testEngine.getActiveEffects('beaker_A').length, 1);
    assert.strictEqual(testEngine.getActiveEffects('beaker_B').length, 1);
    assert.strictEqual(testEngine.getActiveEffects().length, 2);

    testEngine.clearVisualEffects('beaker_A');
    assert.strictEqual(testEngine.getActiveEffects('beaker_A').length, 0);
    assert.strictEqual(testEngine.getActiveEffects('beaker_B').length, 1);
  });

  console.log(`\n===========================================`);
  console.log(`Visual Engine Test Results: ${passed} Passed, ${failed} Failed.`);
  console.log(`===========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}
