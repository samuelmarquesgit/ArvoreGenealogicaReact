const cache = require('../../src/middleware/cache');

beforeEach(() => {
  cache.del('test-key');
});

describe('cache', () => {
  it('retorna null para chave inexistente', () => {
    expect(cache.get('chave-inexistente')).toBeNull();
  });

  it('armazena e recupera um valor', () => {
    cache.set('test-key', 'valor-teste');
    const entry = cache.get('test-key');
    expect(entry).not.toBeNull();
    expect(entry.value).toBe('valor-teste');
    expect(typeof entry.savedAt).toBe('number');
  });

  it('remove o valor com del', () => {
    cache.set('test-key', 'abc');
    cache.del('test-key');
    expect(cache.get('test-key')).toBeNull();
  });

  it('expira entrada após TTL', () => {
    jest.useFakeTimers();
    cache.set('test-key', 'expira');

    jest.advanceTimersByTime(7 * 60 * 60 * 1000);

    expect(cache.get('test-key')).toBeNull();
    jest.useRealTimers();
  });

  it('não expira antes do TTL', () => {
    jest.useFakeTimers();
    cache.set('test-key', 'valido');

    jest.advanceTimersByTime(1 * 60 * 60 * 1000);

    expect(cache.get('test-key')).not.toBeNull();
    jest.useRealTimers();
  });
});
