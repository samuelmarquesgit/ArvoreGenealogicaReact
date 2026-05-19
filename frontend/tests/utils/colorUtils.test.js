import { describe, it, expect } from 'vitest';
import { hashHue, branchColorFromKey, kinshipBadgeColor } from '../../src/utils/colorUtils.js';

describe('hashHue', () => {
  it('retorna número entre 0 e 359', () => {
    const hue = hashHue('Lúcio Marques');
    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  });

  it('retorna valor consistente para a mesma string', () => {
    expect(hashHue('Eduardo')).toBe(hashHue('Eduardo'));
  });

  it('retorna valores diferentes para strings diferentes', () => {
    expect(hashHue('Lúcio')).not.toBe(hashHue('Eduardo'));
  });

  it('lida com string vazia', () => {
    const hue = hashHue('');
    expect(typeof hue).toBe('number');
    expect(hue).toBeGreaterThanOrEqual(0);
  });
});

describe('branchColorFromKey', () => {
  it('retorna cor HSL para chave válida', () => {
    const color = branchColorFromKey('LucioMarques', 2);
    expect(color).toMatch(/^hsl\(/);
  });

  it('retorna cor neutra para chave __raiz__', () => {
    expect(branchColorFromKey('__raiz__')).toBe('#94a3b8');
  });

  it('retorna cor neutra para chave nula', () => {
    expect(branchColorFromKey(null)).toBe('#94a3b8');
  });
});

describe('kinshipBadgeColor', () => {
  it('retorna vermelho para role Eu', () => {
    expect(kinshipBadgeColor('Eu')).toBe('#d90429');
  });

  it('retorna azul para role Pai/Mãe', () => {
    expect(kinshipBadgeColor('Pai/Mãe')).toBe('#0077b6');
  });

  it('retorna verde para role Filho(a)', () => {
    expect(kinshipBadgeColor('Filho(a)')).toBe('#2a9d8f');
  });

  it('retorna cor padrão para role desconhecido', () => {
    expect(kinshipBadgeColor('Primo')).toBe('#64748b');
  });
});
