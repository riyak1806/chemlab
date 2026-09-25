import React, { useState } from 'react';

export default function HistoryInspectorPanel({ actionHistory, reactionHistory, labStateJson }) {
  const [activeTab, setActiveTab] = useState('actions');

  return (
    <div className="bottom-panel">
      <div className="bottom-tabs">
        <button
          className={`bottom-tab ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          📜 Action Log ({actionHistory.length})
        </button>
        <button
          className={`bottom-tab ${activeTab === 'reactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('reactions')}
        >
          🧪 Reaction History ({reactionHistory.length})
        </button>
        <button
          className={`bottom-tab ${activeTab === 'inspector' ? 'active' : ''}`}
          onClick={() => setActiveTab('inspector')}
        >
          📊 Laboratory State Inspector (JSON)
        </button>
      </div>

      <div className="bottom-content">
        {activeTab === 'actions' && (
          <div>
            {actionHistory.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem' }}>
                No laboratory actions recorded yet.
              </div>
            ) : (
              [...actionHistory].reverse().map((act) => (
                <div key={act.sequence} className="log-entry">
                  <span className="log-seq">#{act.sequence}</span>
                  <span className="log-type">[{act.type}]</span>
                  <span className="log-msg">
                    {act.affectedContainers?.length ? `[${act.affectedContainers.join(', ')}] ` : ''}
                    {act.result?.error
                      ? `Error: ${act.result.error.message}`
                      : JSON.stringify(act.parameters || act.result)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reactions' && (
          <div>
            {reactionHistory.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem' }}>
                No chemical reactions triggered yet. Mix compatible chemicals to observe reactions.
              </div>
            ) : (
              [...reactionHistory].reverse().map((rxn, idx) => (
                <div key={idx} className="reaction-card-log">
                  <div className="reaction-eq">{rxn.equation || rxn.reactionId}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    Type: {rxn.reactionType || 'Standard'} | Container: {rxn.containerId}
                  </div>
                  {rxn.effects && (
                    <div style={{ color: 'var(--accent-cyan)', fontSize: '0.725rem', marginTop: '0.2rem' }}>
                      Effects: {JSON.stringify(rxn.effects)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'inspector' && (
          <pre style={{ margin: 0, color: 'var(--accent-cyan)', fontSize: '0.75rem' }}>
            {JSON.stringify(labStateJson, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
