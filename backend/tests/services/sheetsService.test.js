const { parseSheetUrl, DEFAULT_GID } = require('../../src/services/sheetsService');

describe('parseSheetUrl', () => {
  it('retorna null para string vazia', () => {
    expect(parseSheetUrl('')).toBeNull();
    expect(parseSheetUrl('   ')).toBeNull();
  });

  it('aceita ID puro (sem URL)', () => {
    const result = parseSheetUrl('13PqSDZ4y3UePTXLc3sLHiGLcsNyLMSf28uwBzeeNAoA');
    expect(result).not.toBeNull();
    expect(result.id).toBe('13PqSDZ4y3UePTXLc3sLHiGLcsNyLMSf28uwBzeeNAoA');
    expect(result.gid).toBe(DEFAULT_GID);
  });

  it('extrai id e gid de URL completa do Google Sheets', () => {
    const url = 'https://docs.google.com/spreadsheets/d/13PqSDZ4y3UePTXLc3sLHiGLcsNyLMSf28uwBzeeNAoA/edit?gid=123456789';
    const result = parseSheetUrl(url);
    expect(result.id).toBe('13PqSDZ4y3UePTXLc3sLHiGLcsNyLMSf28uwBzeeNAoA');
    expect(result.gid).toBe('123456789');
  });

  it('extrai gid do hash da URL', () => {
    const url = 'https://docs.google.com/spreadsheets/d/abcDEF123/edit#gid=987654';
    const result = parseSheetUrl(url);
    expect(result.id).toBe('abcDEF123');
    expect(result.gid).toBe('987654');
  });

  it('usa GID padrão quando URL não tem gid', () => {
    const url = 'https://docs.google.com/spreadsheets/d/abcDEF123/edit';
    const result = parseSheetUrl(url);
    expect(result.gid).toBe(DEFAULT_GID);
  });

  it('retorna null para URL inválida', () => {
    expect(parseSheetUrl('https://google.com/nao-e-planilha')).toBeNull();
    expect(parseSheetUrl('curto')).toBeNull();
  });
});
