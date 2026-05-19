import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../src/components/ui/LoadingSpinner.jsx';

describe('LoadingSpinner', () => {
  it('exibe a mensagem padrão', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Carregando dados…')).toBeDefined();
  });

  it('exibe mensagem personalizada', () => {
    render(<LoadingSpinner message="Unificando árvores…" />);
    expect(screen.getByText('Unificando árvores…')).toBeDefined();
  });

  it('renderiza o elemento spinner', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.spinner')).not.toBeNull();
  });

  it('renderiza o overlay', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.loader-overlay')).not.toBeNull();
  });
});
