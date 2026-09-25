import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';

export default function InfoPanel({ infoItem }) {
  if (!infoItem) {
    return (
      <aside className="info-panel">
        <div className="info-header">Information & Properties</div>
        <div className="info-content">
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
            <Info size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p>Select a container or chemical to view detailed scientific properties.</p>
          </div>
        </div>
      </aside>
    );
  }

  const { type, data } = infoItem;

  return (
    <aside className="info-panel">
      <div className="info-header">
        {type === 'container' ? `Container Info: ${data.id}` : `Chemical Info: ${data.name}`}
      </div>

      <div className="info-content">
        {type === 'container' && (
          <>
            <div className="info-section">
              <span className="info-title">Vessel Overview</span>
              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div><strong>Equipment:</strong> {data.equipmentName || data.equipmentId}</div>
                <div><strong>Capacity:</strong> {data.capacity} {data.unit || 'mL'}</div>
                <div><strong>Temperature:</strong> {Math.round(data.temperature * 10) / 10}°C</div>
                <div><strong>pH Level:</strong> {data.ph !== null && data.ph !== undefined ? Math.round(data.ph * 100) / 100 : '7.0'}</div>
                <div><strong>State:</strong> {data.state || 'empty'}</div>
                <div><strong>Appearance:</strong> {data.appearance || 'colorless'}</div>
              </div>
            </div>

            <div className="info-section">
              <span className="info-title">Contents ({data.contents.length})</span>
              {data.contents.length === 0 ? (
                <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>Container is empty.</div>
              ) : (
                <table className="contents-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Formula</th>
                      <th>Qty</th>
                      <th>Conc.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.contents.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{item.formula}</td>
                        <td>{Math.round(item.quantity * 100) / 100} {item.unit}</td>
                        <td>{item.concentration ? `${Math.round(item.concentration * 100) / 100} M` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {type === 'chemical' && (
          <>
            <div className="info-section">
              <span className="info-title">Identity & Structure</span>
              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div><strong>Name:</strong> {data.name}</div>
                <div><strong>Formula:</strong> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{data.formula}</span></div>
                <div><strong>Molar Mass:</strong> {data.molarMass || data.molecularWeight || '-'} g/mol</div>
                <div><strong>Physical State:</strong> {data.state || data.physicalState}</div>
                <div><strong>Appearance:</strong> {data.appearance?.color || data.appearance || 'colorless'}</div>
              </div>
            </div>

            {data.properties && (
              <div className="info-section">
                <span className="info-title">Physical Properties</span>
                <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {data.properties.density && <div><strong>Density:</strong> {data.properties.density} g/cm³</div>}
                  {typeof data.properties.ph === 'number' && <div><strong>pH:</strong> {data.properties.ph}</div>}
                  {data.properties.boilingPoint !== undefined && <div><strong>Boiling Point:</strong> {data.properties.boilingPoint}°C</div>}
                  {data.properties.meltingPoint !== undefined && <div><strong>Melting Point:</strong> {data.properties.meltingPoint}°C</div>}
                </div>
              </div>
            )}

            {data.safety && (
              <div className="info-section" style={{ borderLeft: '3px solid var(--accent-rose)' }}>
                <span className="info-title" style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertTriangle size={14} /> GHS Safety Data
                </span>
                <div style={{ fontSize: '0.775rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div><strong>Hazard Class:</strong> {data.safety.hazardClass || 'Standard'}</div>
                  {data.safety.ghsSignalWord && <div><strong>Signal Word:</strong> {data.safety.ghsSignalWord}</div>}
                  {data.safety.precautions && Array.isArray(data.safety.precautions) && (
                    <div style={{ marginTop: '0.2rem' }}>
                      <strong>Precautions:</strong>
                      <ul style={{ paddingLeft: '1.2rem', marginTop: '0.2rem' }}>
                        {data.safety.precautions.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {data.commonUses && Array.isArray(data.commonUses) && (
              <div className="info-section">
                <span className="info-title">Applications & Uses</span>
                <ul style={{ fontSize: '0.775rem', paddingLeft: '1.2rem' }}>
                  {data.commonUses.map((use, i) => (
                    <li key={i}>{use}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
