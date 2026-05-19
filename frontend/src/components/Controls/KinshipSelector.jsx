import React from 'react';
import { getAllNamesFromHistory } from '../../hooks/useFamilyData.js';
import './Controls.css';

export default function KinshipSelector({ selectedIdentity, onSelect, onExit }) {
  const names = getAllNamesFromHistory();
  if (!names.length) return null;

  function handleChange(e) {
    const val = e.target.value;
    if (!val) onExit?.();
    else onSelect?.(val);
  }

  return (
    <div className="controls-group kinship-group">
      <span className="kinship-label">Quem sou eu?</span>
      <select className="kinship-select" value={selectedIdentity || ''} onChange={handleChange}>
        <option value="">Selecione seu nome...</option>
        {names.map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );
}
