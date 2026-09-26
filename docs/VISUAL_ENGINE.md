# ChemLab — Reaction Visual Engine Architecture (v1)

## 1. Overview & Architecture

The Reaction Visual Engine is a decoupled, reusable visual-effects system that translates chemical simulation results into container-local visual animations and UI feedback.

It follows a strict unidirectional pipeline:

```
Chemistry Dataset
       ↓
Chemistry Engine (Scientific Truth)
       ↓
Reaction Result Payload
       ↓
Effect Resolver (Maps result -> VisualEffect instances)
       ↓
Visual Engine Manager (Manages active effects & lifecycles)
       ↓
Container Effect Overlay (React Overlay / Canvas / Web Animations)
```

### Key Architectural Directives
* **Scientific Truth:** The Visual Engine **never** determines whether a reaction occurs or calculates stoichiometry. It purely renders visual feedback for outputs produced by the `ChemistryEngine`.
* **Decoupled Definitions:** Individual reaction definitions in `data/reactions/reactions.json` reference effect IDs (`visualEffect: "gas_evolution"`). They do NOT contain animation implementation details.
* **Target Isolation:** Effects target specific glassware containers (`targetContainerId`) rather than applying globally across the screen.
* **Future-Proof 3D Capability:** The structured visual model emits serializable parameters (`toJSON()`) that can be consumed by 2D CSS/DOM overlays, Canvas, WebGL, or future 3D renderers (e.g. Three.js).

---

## 2. Effect Data Model (`VisualEffect`)

The `VisualEffect` class represents an active or candidate effect instance with pure visual metadata:

* `id` *(string)*: Registered effect ID (e.g., `'gas_evolution'`).
* `instanceId` *(string)*: Unique instance identifier.
* `category` *(string)*: Effect classification (`'gas'`, `'precipitate'`, `'color'`, `'thermal'`, `'combustion'`, `'phase'`, `'electrical'`, `'physical'`).
* `duration` *(number)*: Lifetime in milliseconds.
* `intensity` *(number)*: Value between `0.0` and `1.0`.
* `repeat` *(boolean)*: Continuous effect flag.
* `particleBehavior` *(object)*: Config for particle generation (type, count, movement speed, size range, settlement behavior).
* `colorBehavior` *(object)*: Config for visual transitions (target colors, glow, heat distortion).
* `scale` / `position` *(string/number)*: Spatial placement relative to container (`'interior'`, `'top_opening'`, `'bottom_interior'`, `'container_glow'`, `'electrodes'`).
* `targetContainerId` *(string)*: ID of the vessel receiving the effect.
* `state` *(EffectLifecycle)*: Lifecycle state (`idle` → `starting` → `active` → `completing` → `completed`).

---

## 3. Centralized Registry (`EffectRegistry`)

`EffectRegistry` maintains a map of generic visual effect configurations:

### Supported Visual Effects
1. **`neutralization`**: Soft color shift with subtle micro-bubbling.
2. **`precipitation`**: Suspended particle cloud settling into a bottom sediment layer.
3. **`gas_evolution`**: Bubbles forming and rising to liquid surface.
4. **`combustion`**: Flame burst with glowing core and smoke trail.
5. **`color_change`**: Smooth container liquid color transition.
6. **`crystal_growth`**: Crystalline facet nucleation at container base.
7. **`temperature_rise`**: Warm thermal glow with subtle heat distortion.
8. **`temperature_drop`**: Cool blue glow with frost indication.
9. **`electrolysis`**: Dual electrode bubble stream generation.
10. **`spark`**: Quick high-intensity electrical spark flash.
11. **`flame`**: Continuous flame ignition at container top.
12. **`smoke`**: Wafting smoke particle trail.

---

## 4. Effect Resolver (`EffectResolver`)

`EffectResolver` converts `reactionResult` outputs into single or multi-effect composites:

```js
const resolver = new EffectResolver(registry);
const effects = resolver.resolveVisualEffects(reactionResult, containerId);
```

### Multi-Effect Composition
A single reaction can produce composite effects. For example, a gas-producing exothermic reaction yields:
* Primary Effect: `gas_evolution`
* Secondary Effects: `temperature_rise` (from `temperatureDelta > 0`) + `color_change` (from `targetColor`).

---

## 5. Effect Lifecycle Management

```
idle → starting → active → completing → completed
```

1. **`idle`**: Instantiated, awaiting playback.
2. **`starting`**: Registered with `VisualEngine`, initial timestamp recorded.
3. **`active`**: Ticking frame updates; rendered by UI overlays.
4. **`completing`**: Reached duration limit; cleanup initiated.
5. **`completed`**: Automatically purged from `VisualEngine` active map; garbage collected.

---

## 6. Laboratory UI Integration

In `src/App.jsx` and `src/components/LabWorkspace.jsx`:

1. `VisualEngine` runs a 100ms update loop (`engine.update(100)`).
2. UI components subscribe to state changes via `engine.onEffectsChanged(callback)`.
3. Action handlers (`addChemical`, `mix`, `heat`, `transfer`) invoke `engine.playVisualEffect(result, containerId)`.
4. Glassware containers render `<ContainerEffectOverlay containerId={container.id} activeEffects={activeEffects} />`.
5. CSS animations and particles respect `prefers-reduced-motion` settings.

---

## 7. Step-by-Step Example

```
1. Chemistry Engine produces Reaction Result:
   {
     success: true,
     reactionId: "hcl_nahco3_gas_evolution",
     visualEffect: "gas_evolution",
     effects: { gasProduced: "carbon_dioxide_gas", bubbles: true, temperatureDelta: 2 },
     containerId: "beaker_1"
   }

2. VisualEngine.playVisualEffect(reactionResult, "beaker_1")

3. EffectResolver converts result into:
   [
     VisualEffect { id: "gas_evolution", targetContainerId: "beaker_1", duration: 3500 },
     VisualEffect { id: "temperature_rise", targetContainerId: "beaker_1", duration: 3000 }
   ]

4. VisualEngine marks effects active and notifies listeners.

5. Beaker 1 Container Effect Overlay renders rising gas bubbles and thermal glow.

6. VisualEngine lifecycle ticks completed after duration and removes active effects cleanly.
```

---

## 8. How to Add a New Visual Effect

1. Register default parameters in `src/visual/EffectRegistry.js`:
   ```js
   this.register('my_new_effect', {
     id: 'my_new_effect',
     category: EffectCategories.PHYSICAL,
     duration: 3000,
     intensity: 1.0,
     position: 'interior',
     particleBehavior: { type: 'custom_particles', count: 20 }
   });
   ```
2. Reference `"visualEffect": "my_new_effect"` in `data/reactions/reactions.json`.
3. Add visual rendering rules in `src/visual/components/ContainerEffectOverlay.jsx`.

---

## 9. Future 3D Renderer Integration

Because `VisualEffect` instances emit structured JSON metadata (`effect.toJSON()`), a future 3D renderer (e.g. Three.js) can consume identical effect streams without modifying chemistry logic:

```js
visualEngine.onEffectsChanged((activeEffects) => {
  activeEffects.forEach((effect) => {
    if (effect.category === 'gas') {
      threeScene.getMesh(effect.targetContainerId).spawn3DBubbles(effect.particleBehavior);
    }
  });
});
```
