import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../../src/components/ui/ErrorMessage.jsx';

describe('ErrorMessage', () => {
  it('não renderiza quando message é null', () => {
    const { container } = render(<ErrorMessage message={null} onClose={vi.fn()} />);
    expect(container.querySelector('.error-panel')).toBeNull();
  });

  it('não renderiza quando message é undefined', () => {
    const { container } = render(<ErrorMessage onClose={vi.fn()} />);
    expect(container.querySelector('.error-panel')).toBeNull();
  });

  it('renderiza a mensagem de erro', () => {
    render(<ErrorMessage message="Erro ao carregar planilha." onClose={vi.fn()} />);
    expect(screen.getByText('Erro ao carregar planilha.')).toBeDefined();
  });

  it('exibe o título padrão', () => {
    render(<ErrorMessage message="algo errado" onClose={vi.fn()} />);
    expect(screen.getByText('Não foi possível carregar')).toBeDefined();
  });

  it('chama onClose ao clicar em Fechar', () => {
    const onClose = vi.fn();
    render(<ErrorMessage message="Erro" onClose={onClose} />);
    fireEvent.click(screen.getByText('Fechar'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
