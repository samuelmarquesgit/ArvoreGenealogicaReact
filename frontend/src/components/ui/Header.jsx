import React, { useState } from 'react';
import { formatAgo } from '../../utils/treeUtils.js';
import SheetInput from '../Controls/SheetInput.jsx';
import KinshipSelector from '../Controls/KinshipSelector.jsx';
import BranchSelector from '../Controls/BranchSelector.jsx';
import './Header.css';

export default function Header({
  familyCtx, fromCache, savedAt,
  currentId, currentGid,
  branches, focusedBranchKey,
  selectedIdentity, unifiedMode,
  onSheetChange, onRefresh, onFit, onExport,
  onOpenAnalysis, onSetIdentity, onExitUnified, onBranchFocus, onBranchReset,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusText = fromCache
    ? `Cache · atualizado ${formatAgo(savedAt)} · TTL 6h`
    : savedAt ? 'Lido agora da planilha' : '';

  return (
    <header className={`app-header${menuOpen ? ' menu-open' : ''}`}>
      <div className="header-brand">
        <div className="brand-text">
          <h1 className="brand-title">Árvore genealógica — {familyCtx?.familyLabel || 'Família'}</h1>
          <p className="brand-subtitle">Role o mouse ou pince para dar zoom.</p>
          {statusText && <span className="data-status">{statusText}</span>}
          <p className="legend-hint">
            Cada <strong>cor</strong> segue o ramo de um filho(a) direto; tons mais escuros = mais fundo na linha.
            Cartões <strong>menores</strong> = gerações mais novas.
          </p>
        </div>
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu de configurações"
        >
          <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} />
        </button>
      </div>

      <nav className="header-controls">
        <div className="controls-row">
          <button type="button" className="btn btn-secondary" onClick={onBranchReset}>
            Toda a família
          </button>
          <button type="button" className="btn btn-primary" onClick={onFit}>
            Enquadrar tudo
          </button>
          <button type="button" className="btn btn-primary" onClick={onExport}>
            Salvar imagem
          </button>
          <button type="button" className="btn btn-secondary" onClick={onRefresh} title="Buscar dados frescos">
            Atualizar da planilha
          </button>
          <button type="button" className="btn btn-secondary" onClick={onOpenAnalysis}>
            Análise da planilha
          </button>
        </div>

        <div className="controls-row">
          <SheetInput
            currentId={currentId}
            currentGid={currentGid}
            onSheetChange={onSheetChange}
          />
          <KinshipSelector
            selectedIdentity={selectedIdentity}
            onSelect={onSetIdentity}
            onExit={onExitUnified}
          />
          {!unifiedMode && (
            <BranchSelector
              branches={branches}
              focusedBranchKey={focusedBranchKey}
              onFocus={onBranchFocus}
              onReset={onBranchReset}
            />
          )}
        </div>
      </nav>

      {unifiedMode && (
        <div className="unified-badge">
          <span>🌐 Modo Unificado Ativo</span>
          <button type="button" onClick={onExitUnified} className="unified-close">×</button>
        </div>
      )}
    </header>
  );
}
