import React, { useState } from 'react';
import { Plus, ArrowRightLeft, Sparkles, Flame, Snowflake, Gauge, RefreshCw, Trash2 } from 'lucide-react';

export default function EquipmentActionPanel({
  selectedContainer,
  containers,
  chemicals,
  onAddChemical,
  onTransfer,
  onMix,
  onHeat,
  onCool,
  onMeasure,
  onClearContainer,
  onRemoveContainer
}) {
  const [chemId, setChemId] = useState(chemicals[0]?.id || 'hydrochloric_acid');
  const [addQty, setAddQty] = useState(50);

  const [targetContainerId, setTargetContainerId] = useState('');
  const [transferQty, setTransferQty] = useState(25);

  const [targetTemp, setTargetTemp] = useState(100);

  if (!selectedContainer) {
    return (
      <div className="equipment-action-panel" style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
        <span>Select a container on the bench to view and execute laboratory actions.</span>
      </div>
    );
  }

  const otherContainers = containers.filter((c) => c.id !== selectedContainer.id);

  return (
    <div className="equipment-action-panel">
      <span className="action-section-title">
        Selected: {selectedContainer.id} ({selectedContainer.equipmentName || selectedContainer.equipmentId})
      </span>

      {/* Action 1: Add Chemical */}
      <div className="action-group">
        <label>Add Chemical:</label>
        <select
          className="action-select"
          value={chemId}
          onChange={(e) => setChemId(e.target.value)}
        >
          {chemicals.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.formula})
            </option>
          ))}
        </select>
        <input
          type="number"
          className="action-num-input"
          value={addQty}
          min="1"
          max="500"
          onChange={(e) => setAddQty(Number(e.target.value))}
        />
        <button
          className="btn-action btn-primary"
          onClick={() => onAddChemical(selectedContainer.id, chemId, addQty)}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Action 2: Transfer */}
      <div className="action-group">
        <label>Transfer to:</label>
        <select
          className="action-select"
          value={targetContainerId}
          onChange={(e) => setTargetContainerId(e.target.value)}
        >
          <option value="">-- Select Target --</option>
          {otherContainers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} ({c.equipmentName || c.equipmentId})
            </option>
          ))}
        </select>
        <input
          type="number"
          className="action-num-input"
          value={transferQty}
          min="1"
          onChange={(e) => setTransferQty(Number(e.target.value))}
        />
        <button
          className="btn-action btn-secondary"
          disabled={!targetContainerId}
          onClick={() => {
            if (targetContainerId) {
              onTransfer(selectedContainer.id, targetContainerId, transferQty);
            }
          }}
        >
          <ArrowRightLeft size={14} /> Transfer
        </button>
      </div>

      {/* Action 3: Mix / Stir */}
      <div className="action-group">
        <button
          className="btn-action btn-amber"
          onClick={() => onMix(selectedContainer.id)}
        >
          <Sparkles size={14} /> Mix / Stir
        </button>
      </div>

      {/* Action 4: Heat / Cool */}
      <div className="action-group">
        <label>Temp (°C):</label>
        <input
          type="number"
          className="action-num-input"
          value={targetTemp}
          step="10"
          min="0"
          max="500"
          onChange={(e) => setTargetTemp(Number(e.target.value))}
        />
        <button
          className="btn-action btn-amber"
          onClick={() => onHeat(selectedContainer.id, targetTemp)}
        >
          <Flame size={14} /> Heat
        </button>
        <button
          className="btn-action btn-secondary"
          onClick={() => onCool(selectedContainer.id, 25)}
        >
          <Snowflake size={14} /> Cool (25°C)
        </button>
      </div>

      {/* Action 5: Measure, Dispose, Remove */}
      <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
        <button
          className="btn-action btn-secondary"
          onClick={() => onMeasure(selectedContainer.id)}
        >
          <Gauge size={14} /> Measure
        </button>
        <button
          className="btn-action btn-secondary"
          onClick={() => onClearContainer(selectedContainer.id)}
        >
          <RefreshCw size={14} /> Dispose
        </button>
        <button
          className="btn-action btn-danger"
          onClick={() => onRemoveContainer(selectedContainer.id)}
        >
          <Trash2 size={14} /> Remove
        </button>
      </div>
    </div>
  );
}
