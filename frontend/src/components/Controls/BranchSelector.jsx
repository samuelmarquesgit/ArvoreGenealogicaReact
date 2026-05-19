import React from 'react';
import './Controls.css';

export default function BranchSelector({ branches, focusedBranchKey, onFocus, onReset }) {
  function handleChange(e) {
    const val = e.target.value;
    onFocus?.(val ? decodeURIComponent(val) : null);
  }

  return (
    <div className="controls-group branch-group">
      <span className="branch-label">Ramos</span>
      <select
        className="branch-select"
        value={focusedBranchKey ? encodeURIComponent(focusedBranchKey) : ''}
        onChange={handleChange}
      >
        <option value="">Toda a família</option>
        {branches.map(b => (
          <option key={b.key} value={encodeURIComponent(b.key)}>
            {b.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={!focusedBranchKey}
        onClick={onReset}
      >
        Limpar
      </button>
    </div>
  );
}
