import React, { useState } from 'react';
import { parseSheetUrl } from '../../services/api.js';
import { getHistory } from '../../hooks/useFamilyData.js';
import { buildSheetEditUrl } from '../../utils/treeUtils.js';
import './Controls.css';

export default function SheetInput({ currentId, currentGid, onSheetChange }) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const history = getHistory();

  async function handleApply() {
    setError('');
    const raw = inputValue.trim();
    if (!raw) return;
    try {
      const { id, gid } = await parseSheetUrl(raw);
      onSheetChange(id, gid);
      setInputValue('');
    } catch (err) {
      setError(err.message);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleApply();
  }

  function handleHistoryChange(e) {
    const val = e.target.value;
    if (!val) return;
    const [id, gid] = val.split('::');
    onSheetChange(id, gid);
  }

  const editUrl = buildSheetEditUrl(currentId, currentGid);

  return (
    <div className="controls-group sheet-input-group">
      <div className="sheet-url-row">
        <input
          className="sheet-url-input"
          type="text"
          placeholder="Cole aqui a URL da planilha Google"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="button" className="btn btn-secondary" onClick={handleApply}>
          Usar
        </button>
      </div>
      {error && <p className="input-error">{error}</p>}
      <a className="btn-link" href={editUrl} target="_blank" rel="noopener noreferrer">
        Abrir planilha
      </a>
      {history.length > 0 && (
        <div className="history-row">
          <span className="history-label">Recentes</span>
          <select className="history-select" defaultValue="" onChange={handleHistoryChange}>
            <option value="">Árvores recentes...</option>
            {history.map(h => (
              <option key={`${h.id}::${h.gid}`} value={`${h.id}::${h.gid}`}>
                {h.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
