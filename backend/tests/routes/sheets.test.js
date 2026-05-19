const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/services/sheetsService', () => ({
  fetchSheet: jest.fn(),
  clearCache: jest.fn(),
  parseSheetUrl: jest.fn(),
  DEFAULT_ID: 'fakeId',
  DEFAULT_GID: '0',
}));

const sheetsService = require('../../src/services/sheetsService');

const SAMPLE_CSV = `Nome(s),Tipo,Pai,Mãe,Agregado
Hélio Marques,Fundador,Família Marques,,
Lúcio Marques,Filho,Hélio Marques,,`;

describe('GET /api/sheets', () => {
  it('retorna CSV em JSON quando fetchSheet tem sucesso', async () => {
    sheetsService.fetchSheet.mockResolvedValueOnce({ text: SAMPLE_CSV, fromCache: false, savedAt: Date.now() });
    const res = await request(app).get('/api/sheets');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('text');
    expect(res.body.fromCache).toBe(false);
  });

  it('retorna 502 quando planilha não está disponível', async () => {
    const err = new Error('HTTP 502');
    err.status = 502;
    sheetsService.fetchSheet.mockRejectedValueOnce(err);
    const res = await request(app).get('/api/sheets');
    expect(res.status).toBe(502);
  });
});

describe('GET /api/sheets/family', () => {
  it('retorna chartData, branches e familyCtx processados', async () => {
    sheetsService.fetchSheet.mockResolvedValueOnce({ text: SAMPLE_CSV, fromCache: false, savedAt: Date.now() });
    const res = await request(app).get('/api/sheets/family');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('chartData');
    expect(res.body).toHaveProperty('branches');
    expect(res.body).toHaveProperty('familyCtx');
    expect(Array.isArray(res.body.chartData)).toBe(true);
  });
});

describe('DELETE /api/sheets/cache', () => {
  it('chama clearCache e retorna ok', async () => {
    const res = await request(app).delete('/api/sheets/cache?id=abc&gid=0');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(sheetsService.clearCache).toHaveBeenCalledWith('abc', '0');
  });
});

describe('POST /api/sheets/parse-url', () => {
  it('retorna id e gid para URL válida', async () => {
    sheetsService.parseSheetUrl.mockReturnValueOnce({ id: 'abc123', gid: '0' });
    const res = await request(app).post('/api/sheets/parse-url').send({ url: 'https://docs.google.com/spreadsheets/d/abc123' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('abc123');
  });

  it('retorna 400 para URL inválida', async () => {
    sheetsService.parseSheetUrl.mockReturnValueOnce(null);
    const res = await request(app).post('/api/sheets/parse-url').send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
  });
});

describe('GET /health', () => {
  it('retorna ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
