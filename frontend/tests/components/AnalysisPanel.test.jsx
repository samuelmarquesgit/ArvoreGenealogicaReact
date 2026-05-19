import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalysisPanel from '../../src/components/AnalysisPanel/AnalysisPanel.jsx';

const SAMPLE_REPORT = {
  orderTable: [
    { order: 0, label: 'Fundadores', tiposAceitos: ['Fundador'] },
    { order: 1, label: 'Filho(a)', tiposAceitos: ['Filho', 'Filha'] },
  ],
  tiposFrequency: [['Filho', 3], ['Fundador', 1]],
  unknownTipos: ['TipoEsquisito'],
  requiredWarnings: ['João: campo "Tipo" está vazio.'],
  warnings: ['Lúcio: Tipo="Filho" mas distância é 0.'],
};

describe('AnalysisPanel', () => {
  it('não renderiza quando isOpen é false', () => {
    render(<AnalysisPanel report={SAMPLE_REPORT} isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Análise genealógica')).toBeNull();
  });

  it('renderiza quando isOpen é true', () => {
    render(<AnalysisPanel report={SAMPLE_REPORT} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Análise genealógica')).toBeDefined();
  });

  it('exibe tabela de ordem', () => {
    render(<AnalysisPanel report={SAMPLE_REPORT} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Fundadores')).toBeDefined();
    expect(screen.getByText('Filho(a)')).toBeDefined();
  });

  it('exibe tipos desconhecidos', () => {
    render(<AnalysisPanel report={SAMPLE_REPORT} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('TipoEsquisito')).toBeDefined();
  });

  it('exibe avisos obrigatórios', () => {
    render(<AnalysisPanel report={SAMPLE_REPORT} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('João: campo "Tipo" está vazio.')).toBeDefined();
  });

  it('chama onClose ao clicar em Fechar', () => {
    const onClose = vi.fn();
    render(<AnalysisPanel report={SAMPLE_REPORT} isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Fechar'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('chama onClose ao clicar no backdrop', () => {
    const onClose = vi.fn();
    const { container } = render(<AnalysisPanel report={SAMPLE_REPORT} isOpen={true} onClose={onClose} />);
    fireEvent.click(container.querySelector('.analysis-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('exibe "Sem dados." quando report é null', () => {
    render(<AnalysisPanel report={null} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Sem dados.')).toBeDefined();
  });
});
