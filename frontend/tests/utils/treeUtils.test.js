import { describe, it, expect } from 'vitest';
import { formatAgo, buildSheetEditUrl, canNodeFocus, VIRTUAL_ROOT_ID } from '../../src/utils/treeUtils.js';

describe('formatAgo', () => {
  it('retorna "agora há pouco" para timestamps recentes', () => {
    expect(formatAgo(Date.now() - 10000)).toBe('agora há pouco');
  });

  it('retorna string em minutos', () => {
    const result = formatAgo(Date.now() - 5 * 60 * 1000);
    expect(result).toMatch(/há \d+ min/);
  });

  it('retorna string em horas', () => {
    const result = formatAgo(Date.now() - 3 * 60 * 60 * 1000);
    expect(result).toMatch(/há \d+ h/);
  });

  it('retorna string vazia para timestamp nulo', () => {
    expect(formatAgo(null)).toBe('');
  });
});

describe('buildSheetEditUrl', () => {
  it('constrói URL correta do Google Sheets', () => {
    const url = buildSheetEditUrl('abc123', '0');
    expect(url).toBe('https://docs.google.com/spreadsheets/d/abc123/edit?gid=0#gid=0');
  });
});

describe('canNodeFocus', () => {
  const familyCtx = { founders: ['Hélio Marques'] };

  it('retorna false para o nó raiz virtual', () => {
    const node = { id: VIRTUAL_ROOT_ID, _branchKey: '__raiz__' };
    expect(canNodeFocus(node, familyCtx)).toBe(false);
  });

  it('retorna false para fundadores', () => {
    const node = { id: 'Hélio Marques', _branchKey: '__fundadores__' };
    expect(canNodeFocus(node, familyCtx)).toBe(false);
  });

  it('retorna true para nó de ramo comum', () => {
    const node = { id: 'Lúcio Marques', _branchKey: 'Lúcio Marques' };
    expect(canNodeFocus(node, familyCtx)).toBe(true);
  });

  it('retorna false para chave __desconhecido__', () => {
    const node = { id: 'X', _branchKey: '__desconhecido__' };
    expect(canNodeFocus(node, familyCtx)).toBe(false);
  });
});
