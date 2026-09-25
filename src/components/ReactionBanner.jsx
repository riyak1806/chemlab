import React from 'react';
import { Sparkles, X } from 'lucide-react';

export default function ReactionBanner({ reactionResult, onDismiss }) {
  if (!reactionResult) return null;

  const { equation, reactionType, effects } = reactionResult;

  return (
    <div className="reaction-banner">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="reaction-banner-title">
          <Sparkles size={18} /> Reaction Triggered!
        </div>
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      {equation && <div className="reaction-banner-eq">{equation}</div>}

      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
        <div><strong>Type:</strong> {reactionType || 'Chemical Interaction'}</div>
        {effects && (
          <div style={{ marginTop: '0.2rem', color: 'var(--accent-cyan)' }}>
            {effects.temperatureChange && <div>ΔTemp: +{effects.temperatureChange}°C</div>}
            {effects.colorChange && <div>Color Change: {effects.colorChange}</div>}
            {effects.gasProduced && <div>Gas Produced: {effects.gasProduced}</div>}
            {effects.precipitate && <div>Precipitate Formed: {effects.precipitate}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
