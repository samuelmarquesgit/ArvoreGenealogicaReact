const {
  parseCsv,
  processFamilyData,
  processFamilyDataForKinship,
  buildKinshipData,
  filterBranchSubset,
  getBranchEntries,
  VIRTUAL_ROOT_ID,
} = require('../../src/services/familyService');

const SAMPLE_CSV = `Nome(s),Tipo,Pai,Mãe,Agregado
Hélio Marques,Fundador,Família Marques,,Celina Marques
Celina Marques,Fundadora,Família Souza,,Hélio Marques
Lúcio Marques,Filho,Hélio Marques,Celina Marques,Regina Souza
Regina Souza,Agregado,,,Lúcio Marques
Eduardo Marques,Filho,Hélio Marques,Celina Marques,
Ana Marques,Neta,Lúcio Marques,Regina Souza,`;

describe('parseCsv', () => {
  it('parseia CSV com cabeçalho e retorna array de objetos', () => {
    const rows = parseCsv(SAMPLE_CSV);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(6);
    expect(rows[0]['Nome(s)']).toBe('Hélio Marques');
  });

  it('lança erro em CSV completamente inválido', () => {
    expect(() => parseCsv('')).not.toThrow();
  });
});

describe('processFamilyData', () => {
  let result;
  beforeEach(() => {
    const rows = parseCsv(SAMPLE_CSV);
    result = processFamilyData(rows);
  });

  it('retorna chartData com nó raiz virtual', () => {
    expect(result.chartData.some(n => n.id === VIRTUAL_ROOT_ID)).toBe(true);
  });

  it('oculta cônjuge com tipo Agregado do chartData', () => {
    const ids = result.chartData.map(n => n.id);
    expect(ids).not.toContain('Regina Souza');
  });

  it('coloca Hélio como fundador diretamente abaixo da raiz', () => {
    const helio = result.chartData.find(n => n.name === 'Hélio Marques');
    expect(helio).toBeDefined();
    expect(helio.parentId).toBe(VIRTUAL_ROOT_ID);
  });

  it('filhos de Hélio têm parentId correto', () => {
    const lucio = result.chartData.find(n => n.name === 'Lúcio Marques');
    expect(lucio).toBeDefined();
    expect(lucio.parentId).toBe('Hélio Marques');
  });

  it('annotateVisualizationMeta atribui _cardBg a todos os nós', () => {
    result.chartData.forEach(n => {
      expect(n._cardBg).toBeDefined();
    });
  });

  it('genealogyReport contém orderTable com 5 entradas', () => {
    expect(result.genealogyReport.orderTable).toHaveLength(5);
  });

  it('familyCtx identifica fundadores', () => {
    expect(result.familyCtx.founders.length).toBeGreaterThan(0);
  });
});

describe('filterBranchSubset', () => {
  it('retorna dados completos quando branchKey é nulo', () => {
    const rows = parseCsv(SAMPLE_CSV);
    const { chartData } = processFamilyData(rows);
    const filtered = filterBranchSubset(chartData, null);
    expect(filtered.length).toBe(chartData.length);
  });

  it('filtra apenas nós do ramo e seus ancestrais', () => {
    const rows = parseCsv(SAMPLE_CSV);
    const { chartData } = processFamilyData(rows);
    const lucio = chartData.find(n => n.name === 'Lúcio Marques');
    if (lucio && lucio._branchKey) {
      const filtered = filterBranchSubset(chartData, lucio._branchKey);
      expect(filtered.some(n => n.id === VIRTUAL_ROOT_ID)).toBe(true);
      expect(filtered.some(n => n.name === 'Lúcio Marques')).toBe(true);
    }
  });
});

describe('processFamilyDataForKinship + buildKinshipData', () => {
  it('constrói mapa de pessoas para visão de parentesco', () => {
    const rows = parseCsv(SAMPLE_CSV);
    const { people } = processFamilyDataForKinship(rows);
    expect(people.has('Lúcio Marques')).toBe(true);
  });

  it('buildKinshipData retorna nó "Eu" como raiz', () => {
    const rows = parseCsv(SAMPLE_CSV);
    const { people } = processFamilyDataForKinship(rows);
    const kinship = buildKinshipData('Lúcio Marques', people);
    const eu = kinship.find(n => n._kinshipRole === 'Eu');
    expect(eu).toBeDefined();
    expect(eu.name).toBe('Lúcio Marques');
    expect(eu.parentId).toBeNull();
  });

  it('retorna array vazio se focusId não existe', () => {
    const rows = parseCsv(SAMPLE_CSV);
    const { people } = processFamilyDataForKinship(rows);
    const kinship = buildKinshipData('Pessoa Inexistente', people);
    expect(kinship).toEqual([]);
  });
});

describe('getBranchEntries', () => {
  it('retorna array de ramos ordenados', () => {
    const rows = parseCsv(SAMPLE_CSV);
    const { chartData } = processFamilyData(rows);
    const branches = getBranchEntries(chartData);
    expect(Array.isArray(branches)).toBe(true);
  });
});
