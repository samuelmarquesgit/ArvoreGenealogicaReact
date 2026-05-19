import React from 'react';
import './AnalysisPanel.css';

function renderTiposTable(tiposFrequency) {
  if (!tiposFrequency?.length) return <p className="dim">Nenhum.</p>;
  return (
    <table>
      <thead><tr><th>Tipo</th><th>Linhas</th></tr></thead>
      <tbody>
        {tiposFrequency.map(([t, n]) => (
          <tr key={t}><td>{t}</td><td>{n}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AnalysisPanel({ report, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="analysis-backdrop" onClick={onClose} />
      <aside className="analysis-panel" aria-label="Análise genealógica">
        <div className="analysis-head">
          <h2>Análise genealógica</h2>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
        </div>
        <div className="analysis-body">
          {!report ? (
            <p className="dim">Sem dados.</p>
          ) : (
            <>
              <h3>Tabela de ordem</h3>
              <table>
                <thead><tr><th>Ordem</th><th>Papel</th><th>Tipos aceitos</th></tr></thead>
                <tbody>
                  {report.orderTable?.map(row => (
                    <tr key={row.order}>
                      <td>{row.order}</td>
                      <td>{row.label}</td>
                      <td>{row.tiposAceitos.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3>Tipos na planilha</h3>
              {renderTiposTable(report.tiposFrequency)}

              {report.unknownTipos?.length > 0 && (
                <>
                  <h3>Tipos fora da tabela canónica</h3>
                  {report.unknownTipos.map(t => (
                    <div key={t} className="analysis-warn">{t}</div>
                  ))}
                </>
              )}

              <h3>Campos obrigatórios (Nome + Tipo + Pai/Mãe)</h3>
              {!report.requiredWarnings?.length
                ? <p>Nenhuma pendência.</p>
                : report.requiredWarnings.slice(0, 120).map((w, i) => (
                    <div key={i} className="analysis-warn">{w}</div>
                  ))
              }

              <h3>Avisos (Tipo vs. distância aos fundadores)</h3>
              {!report.warnings?.length
                ? <p>Nenhum aviso automático.</p>
                : report.warnings.slice(0, 80).map((w, i) => (
                    <div key={i} className="analysis-warn">{w}</div>
                  ))
              }
            </>
          )}
        </div>
      </aside>
    </>
  );
}
