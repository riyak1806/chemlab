import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';

export default function ChemicalCabinet({
  chemicals,
  categories,
  selectedContainerId,
  onAddChemical,
  onSelectInfoItem
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredChemicals = useMemo(() => {
    return chemicals.filter((chem) => {
      const matchesSearch =
        chem.name.toLowerCase().includes(search.toLowerCase()) ||
        chem.formula.toLowerCase().includes(search.toLowerCase()) ||
        chem.id.toLowerCase().includes(search.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' ||
        (chem.categories && chem.categories.includes(selectedCategory));

      return matchesSearch && matchesCat;
    });
  }, [chemicals, search, selectedCategory]);

  return (
    <aside className="chemical-cabinet">
      <div className="cabinet-header">
        <div className="cabinet-title">Chemical Cabinet</div>
        <input
          type="text"
          className="search-input"
          placeholder="Search chemicals or formula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="category-pills">
        <button
          className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All ({chemicals.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="chemical-list">
        {filteredChemicals.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center' }}>
            No matching chemicals found
          </div>
        ) : (
          filteredChemicals.map((chem) => {
            const colorHex = (chem.visual && chem.visual.hexColor) || (chem.appearance && chem.appearance.color) || '#cbd5e1';
            return (
              <div
                key={chem.id}
                className="chemical-card"
                onClick={() => onSelectInfoItem({ type: 'chemical', data: chem })}
              >
                <div className="chemical-top">
                  <span className="chemical-name">{chem.name}</span>
                  <span className="chemical-formula">{chem.formula}</span>
                </div>
                <div className="chemical-meta">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: colorHex }}
                    title={`Color: ${colorHex}`}
                  />
                  <span>State: {chem.state || chem.physicalState}</span>
                  {typeof chem.properties?.ph === 'number' && (
                    <span>pH: {chem.properties.ph}</span>
                  )}
                </div>
                {selectedContainerId && (
                  <button
                    className="btn-add-quick"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddChemical(chem.id, 25);
                    }}
                  >
                    <Plus size={12} /> Add 25 mL to {selectedContainerId}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
