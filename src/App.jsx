import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import ChemicalCabinet from './components/ChemicalCabinet';
import LabWorkspace from './components/LabWorkspace';
import EquipmentActionPanel from './components/EquipmentActionPanel';
import InfoPanel from './components/InfoPanel';
import HistoryInspectorPanel from './components/HistoryInspectorPanel';
import ReactionBanner from './components/ReactionBanner';

import { createLabManager, datasets } from './ui/datasetLoader';
import { FlaskConical, BookOpen, Award, Sparkles, CheckCircle } from 'lucide-react';

export default function App() {
  // Singleton LabManager instance
  const labManager = useMemo(() => createLabManager(), []);

  const [activeTab, setActiveTab] = useState('Lab');
  const [containers, setContainers] = useState([]);
  const [selectedContainerId, setSelectedContainerId] = useState(null);
  const [infoItem, setInfoItem] = useState(null);
  const [lastReaction, setLastReaction] = useState(null);
  const [labStateJson, setLabStateJson] = useState({});
  const [actionHistory, setActionHistory] = useState([]);
  const [reactionHistory, setReactionHistory] = useState([]);

  // Refresh component state from LabManager
  const syncLabState = useCallback(() => {
    const labState = labManager.getLabState();
    const allContainers = labState.getAllContainers().map((c) => c.toJSON());
    setContainers(allContainers);

    const json = labState.toJSON();
    setLabStateJson(json);
    setActionHistory([...labState.actionHistory]);
    setReactionHistory([...labState.reactionHistory]);

    // Keep selected info item up to date if it's a container
    if (selectedContainerId) {
      const current = allContainers.find((c) => c.id === selectedContainerId);
      if (current) {
        setInfoItem((prev) => (prev?.type === 'container' ? { type: 'container', data: current } : prev));
      } else {
        setSelectedContainerId(null);
        setInfoItem(null);
      }
    }
  }, [labManager, selectedContainerId]);

  // Initial load: create default beaker & test tube on bench
  useEffect(() => {
    const beakerRes = labManager.createContainer('beaker', 'beaker_1');
    const tubeRes = labManager.createContainer('test_tube', 'test_tube_1');
    if (beakerRes.success) {
      setSelectedContainerId('beaker_1');
      const state = labManager.getLabState();
      const b = state.getContainer('beaker_1');
      if (b) setInfoItem({ type: 'container', data: b.toJSON() });
    }
    syncLabState();
  }, [labManager, syncLabState]);

  // Action Handlers
  const handleCreateContainer = (equipmentId) => {
    const res = labManager.createContainer(equipmentId);
    if (res.success && res.container) {
      setSelectedContainerId(res.container.id);
      setInfoItem({ type: 'container', data: res.container });
    }
    syncLabState();
  };

  const handleAddChemical = (containerId, chemicalId, quantity) => {
    const res = labManager.addChemical(containerId, chemicalId, quantity);
    if (res.reactionTriggered && res.reactionResult) {
      setLastReaction(res.reactionResult);
    }
    syncLabState();
  };

  const handleTransfer = (sourceId, targetId, quantity) => {
    const res = labManager.transfer(sourceId, targetId, quantity);
    if (res.reactionTriggered && res.reactionResult) {
      setLastReaction(res.reactionResult);
    }
    syncLabState();
  };

  const handleMix = (containerId) => {
    const res = labManager.mix(containerId);
    if (res.reactionTriggered && res.reactionResult) {
      setLastReaction(res.reactionResult);
    }
    syncLabState();
  };

  const handleHeat = (containerId, targetTemperature) => {
    const res = labManager.heat(containerId, targetTemperature);
    if (res.reactionTriggered && res.reactionResult) {
      setLastReaction(res.reactionResult);
    }
    syncLabState();
  };

  const handleCool = (containerId, targetTemperature) => {
    labManager.cool(containerId, targetTemperature);
    syncLabState();
  };

  const handleMeasure = (containerId) => {
    labManager.measure(containerId);
    syncLabState();
  };

  const handleClearContainer = (containerId) => {
    labManager.clearContainer(containerId);
    syncLabState();
  };

  const handleRemoveContainer = (containerId) => {
    labManager.removeEquipment(containerId);
    if (selectedContainerId === containerId) {
      setSelectedContainerId(null);
      setInfoItem(null);
    }
    syncLabState();
  };

  const handleResetLab = () => {
    labManager.resetLab();
    setSelectedContainerId(null);
    setInfoItem(null);
    setLastReaction(null);
    syncLabState();
  };

  const selectedContainer = containers.find((c) => c.id === selectedContainerId) || null;

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetLab={handleResetLab}
        containerCount={containers.length}
        ambientTemp={labStateJson.environment?.ambientTemperature || 25}
      />

      <ReactionBanner
        reactionResult={lastReaction}
        onDismiss={() => setLastReaction(null)}
      />

      {activeTab === 'Lab' && (
        <div className="app-main">
          {/* Left Sidebar: Chemical Cabinet */}
          <ChemicalCabinet
            chemicals={datasets.chemicals}
            categories={datasets.chemicalCategories}
            selectedContainerId={selectedContainerId}
            onAddChemical={(chemId, qty) => selectedContainerId && handleAddChemical(selectedContainerId, chemId, qty)}
            onSelectInfoItem={setInfoItem}
          />

          {/* Center Workspace & Actions */}
          <div className="center-column">
            <LabWorkspace
              containers={containers}
              equipmentList={datasets.equipment}
              selectedContainerId={selectedContainerId}
              onSelectContainer={(id) => {
                setSelectedContainerId(id);
                const cont = containers.find((c) => c.id === id);
                if (cont) setInfoItem({ type: 'container', data: cont });
              }}
              onCreateContainer={handleCreateContainer}
              onMeasureContainer={handleMeasure}
              onClearContainer={handleClearContainer}
              onRemoveContainer={handleRemoveContainer}
              onSelectInfoItem={setInfoItem}
            />

            <EquipmentActionPanel
              selectedContainer={selectedContainer}
              containers={containers}
              chemicals={datasets.chemicals}
              onAddChemical={handleAddChemical}
              onTransfer={handleTransfer}
              onMix={handleMix}
              onHeat={handleHeat}
              onCool={handleCool}
              onMeasure={handleMeasure}
              onClearContainer={handleClearContainer}
              onRemoveContainer={handleRemoveContainer}
            />

            <HistoryInspectorPanel
              actionHistory={actionHistory}
              reactionHistory={reactionHistory}
              labStateJson={labStateJson}
            />
          </div>

          {/* Right Panel: Detailed Info & Properties */}
          <InfoPanel infoItem={infoItem} />
        </div>
      )}

      {activeTab === 'Experiments' && (
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FlaskConical size={24} /> Guided Chemistry Experiments
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {datasets.experiments.map((exp) => (
              <div
                key={exp.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{exp.title}</h3>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
                    {exp.difficulty}
                  </span>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{exp.description}</p>
                <div style={{ fontSize: '0.775rem', color: 'var(--accent-cyan)' }}>
                  <strong>Objective:</strong> {exp.objective}
                </div>
                <button
                  className="btn-action btn-primary"
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                  onClick={() => {
                    handleResetLab();
                    setActiveTab('Lab');
                    // Setup experiment chemicals/equipment
                    if (exp.availableEquipment) {
                      exp.availableEquipment.forEach((eqId) => handleCreateContainer(eqId));
                    }
                  }}
                >
                  Start Experiment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Learn' && (
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={24} /> Chemistry Knowledge & Element Explorer
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {datasets.elements.slice(0, 36).map((el) => (
              <div
                key={el.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{el.atomicNumber}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{el.symbol}</span>
                <span style={{ fontSize: '0.775rem', fontWeight: '600' }}>{el.name}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{el.atomicMass} u</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Profile' && (
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={24} /> Student Profile & Achievements
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {datasets.achievements.map((ach) => (
              <div
                key={ach.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <CheckCircle size={24} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{ach.title}</div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{ach.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
