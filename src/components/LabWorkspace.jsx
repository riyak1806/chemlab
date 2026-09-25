import React from 'react';
import { Beaker, Plus, RefreshCw, Trash2, Gauge } from 'lucide-react';

export default function LabWorkspace({
  containers,
  equipmentList,
  selectedContainerId,
  onSelectContainer,
  onCreateContainer,
  onMeasureContainer,
  onClearContainer,
  onRemoveContainer,
  onSelectInfoItem
}) {
  // Map chemical color descriptors to CSS color codes
  const getColorCss = (appearance) => {
    if (!appearance) return 'rgba(56, 189, 248, 0.4)';
    const appLower = String(appearance).toLowerCase();
    if (appLower.includes('blue') || appLower.includes('cuprum')) return 'rgba(56, 189, 248, 0.7)';
    if (appLower.includes('red') || appLower.includes('pink') || appLower.includes('magenta')) return 'rgba(244, 63, 94, 0.7)';
    if (appLower.includes('green')) return 'rgba(16, 185, 129, 0.7)';
    if (appLower.includes('yellow') || appLower.includes('amber')) return 'rgba(245, 158, 11, 0.7)';
    if (appLower.includes('purple') || appLower.includes('violet')) return 'rgba(168, 85, 247, 0.7)';
    if (appLower.includes('white') || appLower.includes('milky') || appLower.includes('cloudy')) return 'rgba(255, 255, 255, 0.6)';
    if (appLower.includes('brown') || appLower.includes('orange')) return 'rgba(217, 119, 6, 0.7)';
    if (appLower.includes('colorless') || appLower.includes('clear')) return 'rgba(203, 213, 225, 0.35)';
    return 'rgba(148, 163, 184, 0.5)';
  };

  const getPhBadgeClass = (ph) => {
    if (ph === null || ph === undefined) return 'ph-neutral';
    if (ph < 6.5) return 'ph-acidic';
    if (ph > 7.5) return 'ph-basic';
    return 'ph-neutral';
  };

  return (
    <div className="center-area">
      {/* Top Toolbar for Spawning Containers */}
      <div className="equipment-bar">
        <span className="toolbar-label">Add Equipment:</span>
        {equipmentList.map((eq) => (
          <button
            key={eq.id}
            className="equipment-btn"
            onClick={() => onCreateContainer(eq.id)}
            title={`Create new ${eq.name}`}
          >
            <Plus size={14} /> {eq.name} ({eq.capacity?.value || 250} {eq.capacity?.unit || 'mL'})
          </button>
        ))}
      </div>

      {/* Lab Bench / Workspace */}
      <div className="lab-workspace">
        {containers.length === 0 ? (
          <div className="workspace-empty">
            <Beaker className="empty-icon" />
            <h3>Laboratory Workspace Empty</h3>
            <p style={{ marginTop: '0.4rem', fontSize: '0.875rem' }}>
              Select equipment from the toolbar above to place glassware on the lab bench.
            </p>
          </div>
        ) : (
          containers.map((container) => {
            const isSelected = container.id === selectedContainerId;

            // Compute fill percentage
            const totalQty = container.contents.reduce((sum, c) => sum + (c.quantity || 0), 0);
            const fillPercent = Math.min(100, Math.max(0, (totalQty / (container.capacity || 250)) * 100));
            const liquidColor = getColorCss(container.appearance);

            return (
              <div
                key={container.id}
                className={`container-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelectContainer(container.id);
                  onSelectInfoItem({ type: 'container', data: container });
                }}
              >
                <div className="container-card-header">
                  <span className="container-id">{container.id}</span>
                  <span className="container-type">{container.equipmentName || container.equipmentId}</span>
                </div>

                {/* Glassware Graphic Representation */}
                <div className={`glassware-wrapper ${container.equipmentId}`}>
                  <div
                    className="liquid-fill"
                    style={{
                      height: `${fillPercent}%`,
                      backgroundColor: liquidColor
                    }}
                  >
                    {(container.state === 'gas' || container.isMixed) && (
                      <div className="liquid-bubbles" />
                    )}
                  </div>
                  {container.isHeating && <div className="heating-flame" />}
                </div>

                {/* Container Summary Stats */}
                <div className="container-card-stats">
                  <div className="stat-row">
                    <span>Volume:</span>
                    <span className="stat-val">
                      {Math.round(totalQty * 10) / 10} / {container.capacity} {container.unit || 'mL'}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span>Temperature:</span>
                    <span className="stat-val">{Math.round(container.temperature * 10) / 10}°C</span>
                  </div>
                  <div className="stat-row">
                    <span>pH:</span>
                    <span className={`ph-badge ${getPhBadgeClass(container.ph)}`}>
                      {container.ph !== null && container.ph !== undefined ? Math.round(container.ph * 10) / 10 : '7.0'}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span>State:</span>
                    <span className="stat-val" style={{ textTransform: 'capitalize' }}>
                      {container.state || 'empty'}
                    </span>
                  </div>
                </div>

                {/* Card Quick Actions */}
                <div style={{ display: 'flex', gap: '0.35rem', width: '100%', marginTop: '0.2rem' }}>
                  <button
                    className="btn-action btn-secondary"
                    style={{ flex: 1, padding: '0.25rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMeasureContainer(container.id);
                    }}
                    title="Measure"
                  >
                    <Gauge size={12} /> Measure
                  </button>
                  <button
                    className="btn-action btn-secondary"
                    style={{ padding: '0.25rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearContainer(container.id);
                    }}
                    title="Clear Contents"
                  >
                    <RefreshCw size={12} />
                  </button>
                  <button
                    className="btn-action btn-danger"
                    style={{ padding: '0.25rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveContainer(container.id);
                    }}
                    title="Remove Equipment"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
