const Papa = require('papaparse');

const VIRTUAL_ROOT_ID = 'FAMILIA_ROOT';

const GENEALOGY_ORDER_TABLE = Object.freeze([
  { order: 0, label: 'Fundadores', tiposAceitos: ['Fundador', 'Fundadora', 'Tataravó', 'Ancestral', 'Raiz'] },
  { order: 1, label: 'Filho(a)', tiposAceitos: ['Filho', 'Filha'] },
  { order: 2, label: 'Neto(a)', tiposAceitos: ['Neto', 'Net', 'Neta'] },
  { order: 3, label: 'Bisneto(a)', tiposAceitos: ['Bisneto', 'Bisneta'] },
  { order: 4, label: 'Tataraneto(a)', tiposAceitos: ['Tataraneto', 'Tataraneta', 'Tatrarneto'] },
]);


function normalizeTipoKey(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function normalizeNameToken(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function hashHue(str) {
  let h = 216;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function getGenerationLevel(tipoRaw) {
  const t = normalizeTipoKey(tipoRaw);
  if (!t) return 5;
  if (t.includes('tataravô') || t.includes('tataravó') || t.includes('fundador')) return 2;
  if (t.includes('bisneto') || t.includes('bisneta')) return 5;
  if (t.includes('neto') || t.includes('neta')) return 4;
  if (t.includes('tataraneto') || t.includes('tataraneta')) return 6;
  if (t.includes('bisavô') || t.includes('bisavó')) return 3;
  if (t.includes('filho') || t.includes('filha')) return 3;
  return 5;
}

function rankFromDeclaredTipo(tipoRaw) {
  const t = normalizeTipoKey(tipoRaw);
  if (!t || t === 'agregado' || t === 'membro') return null;
  for (const row of GENEALOGY_ORDER_TABLE) {
    if (row.tiposAceitos.some(a => normalizeTipoKey(a) === t)) return row.order;
  }
  return null;
}

function labelForOrder(order) {
  const row = GENEALOGY_ORDER_TABLE.find(r => r.order === order);
  return row ? row.label : '—';
}

function depthBelowFounders(personId, people, foundersSet) {
  if (foundersSet.has(personId)) return 0;
  let depth = 0;
  let cur = personId;
  for (let i = 0; i < 80; i++) {
    const n = people.get(cur);
    if (!n || !n.parentId) return null;
    if (foundersSet.has(n.parentId)) return depth + 1;
    cur = n.parentId;
    depth++;
  }
  return null;
}

function inferFamilyContext(people, rawData, canonicalizeName, vRootId) {
  const markerCount = new Map();
  rawData.forEach(row => {
    const pai = canonicalizeName(row['Pai']);
    const mae = canonicalizeName(row['Mãe']);
    [pai, mae].forEach(parent => {
      if (!parent) return;
      if (people.has(parent)) return;
      const k = normalizeNameToken(parent);
      if (!k.includes('familia')) return;
      markerCount.set(parent, (markerCount.get(parent) || 0) + 1);
    });
  });

  let familyLabel = 'Família';
  if (markerCount.size) {
    familyLabel = Array.from(markerCount.entries()).sort((a, b) => b[1] - a[1])[0][0];
  }

  const founders = [];
  people.forEach(p => {
    if (!p.parentId || p.parentId === vRootId) founders.push(p.id);
  });

  const childrenByParent = new Map();
  people.forEach(n => {
    if (!n.parentId) return;
    if (!childrenByParent.has(n.parentId)) childrenByParent.set(n.parentId, []);
    childrenByParent.get(n.parentId).push(n.id);
  });

  const countDesc = id => {
    let c = 0;
    const st = [...(childrenByParent.get(id) || [])];
    while (st.length) {
      const cur = st.pop();
      c += 1;
      const kids = childrenByParent.get(cur);
      if (kids && kids.length) st.push(...kids);
    }
    return c;
  };

  const primaryFounderId = founders.length
    ? founders.slice().sort((a, b) => countDesc(b) - countDesc(a))[0]
    : null;

  return { familyLabel, founders, foundersSet: new Set(founders), primaryFounderId };
}

function buildGenealogyAnalysis(people, rawData, familyCtx) {
  const warnings = [];
  const tiposFrequency = new Map();
  const unknownTipos = new Set();
  const requiredWarnings = [];

  rawData.forEach(row => {
    const name = row['Nome(s)']?.trim();
    const tipo = row['Tipo']?.trim();
    const pai = row['Pai']?.trim();
    const mae = row['Mãe']?.trim();
    if (!name) return;
    if (!tipo) requiredWarnings.push(`${name}: campo "Tipo" está vazio.`);
    if (!pai && !mae) requiredWarnings.push(`${name}: preencha pelo menos "Pai" ou "Mãe".`);
    if (!tipo) return;
    tiposFrequency.set(tipo, (tiposFrequency.get(tipo) || 0) + 1);
    const tk = normalizeTipoKey(tipo);
    if (rankFromDeclaredTipo(tipo) === null && tk !== 'agregado' && tk !== 'membro') {
      unknownTipos.add(tipo);
    }
  });

  people.forEach((p, id) => {
    const declared = rankFromDeclaredTipo(p.type);
    const depth = depthBelowFounders(id, people, familyCtx.foundersSet);
    if (p.type && normalizeTipoKey(p.type) === 'agregado') return;
    if (declared === null || depth === null) return;
    if (declared !== depth && depth >= 0) {
      warnings.push(
        `${id}: Tipo="${p.type}" (ordem ${declared}, ${labelForOrder(declared)}), ` +
        `mas distância aos fundadores é ${depth} ("${labelForOrder(depth)}"). Revise Pai/Mãe ou o Tipo.`
      );
    }
  });

  return {
    orderTable: GENEALOGY_ORDER_TABLE,
    tiposFrequency: Array.from(tiposFrequency.entries()).sort((a, b) => b[1] - a[1]),
    unknownTipos: Array.from(unknownTipos).sort(),
    requiredWarnings,
    warnings,
  };
}

function depthFromVirtualRoot(id, byId) {
  const n = byId.get(id);
  if (n && n._lvl != null) return n._lvl - 1;
  if (id === VIRTUAL_ROOT_ID) return 0;
  let depth = 0;
  let cur = id;
  const seen = new Set();
  while (cur !== VIRTUAL_ROOT_ID) {
    if (seen.has(cur)) break;
    seen.add(cur);
    const node = byId.get(cur);
    if (!node || !node.parentId) break;
    cur = node.parentId;
    depth++;
  }
  return depth;
}

function branchKeyUnderFounders(id, byId, familyCtx) {
  if (id === VIRTUAL_ROOT_ID) return '__raiz__';
  if (familyCtx.foundersSet.has(id)) return '__fundadores__';
  let cur = id;
  const seen = new Set();
  for (let i = 0; i < 150; i++) {
    if (seen.has(cur)) return '__ciclo__';
    seen.add(cur);
    const n = byId.get(cur);
    if (!n) return '__sem_dados__';
    if (!n.parentId || n.parentId === VIRTUAL_ROOT_ID) return cur;
    if (n._lvl === 3) return cur;
    cur = n.parentId;
  }
  return '__desconhecido__';
}

function annotateVisualizationMeta(chartData, familyCtx) {
  const byId = new Map(chartData.map(n => [n.id, n]));

  chartData.forEach(n => {
    n._depth = depthFromVirtualRoot(n.id, byId);
  });

  const branchHeads = chartData.filter(n => n._lvl === 3 && n.id !== VIRTUAL_ROOT_ID);
  const childrenByParent = new Map();
  chartData.forEach(n => {
    if (n.parentId) {
      if (!childrenByParent.has(n.parentId)) childrenByParent.set(n.parentId, []);
      childrenByParent.get(n.parentId).push(n.id);
    }
  });

  const tagLineage = (rootId, key) => {
    const stack = [rootId];
    while (stack.length) {
      const cid = stack.pop();
      const cn = byId.get(cid);
      if (cn) {
        cn._branchKey = key;
        const kids = childrenByParent.get(cid) || [];
        stack.push(...kids);
      }
    }
  };

  chartData.forEach(n => {
    if (n.id === VIRTUAL_ROOT_ID) n._branchKey = '__raiz__';
    else if (familyCtx.foundersSet.has(n.id)) n._branchKey = '__fundadores__';
    else if (!n._branchKey) n._branchKey = branchKeyUnderFounders(n.id, byId, familyCtx);
  });

  branchHeads.forEach(head => tagLineage(head.id, head.id));

  chartData.forEach(n => {
    if ((!n._branchKey || n._branchKey === n.id || n._branchKey === '__desconhecido__') && n.spouse) {
      const partner = byId.get(n.spouse);
      if (partner && partner._branchKey && !partner._branchKey.startsWith('__')) {
        n._branchKey = partner._branchKey;
      }
    }
  });

  chartData.forEach(n => {
    if (n.id === VIRTUAL_ROOT_ID) {
      Object.assign(n, {
        _cardBg: '#0f172a', _cardBorder: '#1e3a8a',
        _nameColor: '#f8fafc', _roleColor: '#94a3b8',
        _linkStroke: '#1e40af', _nameSizePx: 18.5,
      });
      return;
    }

    const d = n._depth;
    const key = String(n._branchKey || '');
    const isFounder = familyCtx.foundersSet.has(n.id);

    if (isFounder) {
      Object.assign(n, {
        _cardBg: 'linear-gradient(165deg, #0f172a 0%, #1e40af 100%)',
        _cardBorder: '#0c1422', _nameColor: '#f8fafc',
        _roleColor: '#cbd5e1', _parentsColor: '#94a3b8',
        _spouseColor: '#fde047', _nameSizePx: 16.5,
        _linkStroke: '#475569',
      });
    } else {
      const hue = hashHue(key);
      const saturation = Math.min(65, 35 + Math.min(d, 5) * 5);
      const lightness = Math.max(68, 96 - d * 4.5);
      Object.assign(n, {
        _cardBg: `hsl(${hue} ${saturation}% ${lightness}%)`,
        _cardBorder: `hsl(${hue} 45% ${Math.max(22, 52 - d * 3)}%)`,
        _nameColor: `hsl(${hue} 35% ${Math.max(8, 18 - d * 0.8)}%)`,
        _roleColor: `hsl(${hue} 30% 30%)`,
        _parentsColor: `hsl(${hue} 25% 34%)`,
        _spouseColor: `hsl(${(hue + 40) % 360} 50% 36%)`,
        _linkStroke: `hsla(${hue}, 45%, 42%, 0.85)`,
        _nameSizePx: Math.max(11.5, 14.5 - d * 0.6),
      });
    }
  });
}

function processFamilyData(rawData) {
  const people = new Map();
  const canonicalByNorm = new Map();

  rawData.forEach(row => {
    const nameTxt = (row['Nome(s)'] || '').trim();
    if (!nameTxt) return;
    const norm = normalizeNameToken(nameTxt);
    if (!canonicalByNorm.has(norm)) canonicalByNorm.set(norm, nameTxt);
  });

  function canonicalizeName(t) {
    const norm = normalizeNameToken(t);
    return canonicalByNorm.get(norm) || (t || '').trim();
  }

  rawData.forEach(row => {
    const name = canonicalizeName(row['Nome(s)']);
    if (!name) return;
    const type = (row['Tipo'] || '').trim();
    if (!people.has(name)) {
      people.set(name, {
        id: name, name, type,
        spouse: canonicalizeName(row['Agregado']),
        father: canonicalizeName(row['Pai']),
        mother: canonicalizeName(row['Mãe']),
        _lvl: getGenerationLevel(type),
      });
    } else {
      const p = people.get(name);
      if (type) { p.type = type; p._lvl = getGenerationLevel(type); }
      if (row['Agregado']) p.spouse = canonicalizeName(row['Agregado']);
      if (row['Pai']) p.father = canonicalizeName(row['Pai']);
      if (row['Mãe']) p.mother = canonicalizeName(row['Mãe']);
    }
    [row['Pai'], row['Mãe']].forEach(parRaw => {
      const par = canonicalizeName(parRaw);
      if (par && !people.has(par) && !normalizeNameToken(par).includes('familia')) {
        people.set(par, { id: par, name: par, type: 'Ancestral', spouse: '', _lvl: 2 });
      }
    });
  });

  const spousesToHide = new Set();
  people.forEach(p => {
    const partner = p.spouse;
    if (!partner || !people.has(partner)) return;
    const partnerNode = people.get(partner);
    const pIsAgregado = normalizeTipoKey(p.type) === 'agregado';
    const parIsAgregado = normalizeTipoKey(partnerNode.type) === 'agregado';
    if (pIsAgregado && !parIsAgregado) {
      spousesToHide.add(p.name);
      partnerNode.spouse = p.name;
      p._lvl = partnerNode._lvl;
    } else if (parIsAgregado && !pIsAgregado) {
      spousesToHide.add(partner);
      p.spouse = partner;
    }
  });

  people.forEach(p => {
    const father = p.father;
    const mother = p.mother;
    let chosenParent = null;
    if (father && !spousesToHide.has(father)) chosenParent = father;
    else if (mother && !spousesToHide.has(mother)) chosenParent = mother;
    else if (father && spousesToHide.has(father)) {
      const hiddenNode = people.get(father);
      if (hiddenNode?.spouse && !spousesToHide.has(hiddenNode.spouse)) chosenParent = hiddenNode.spouse;
    } else if (mother && spousesToHide.has(mother)) {
      const hiddenNode = people.get(mother);
      if (hiddenNode?.spouse && !spousesToHide.has(hiddenNode.spouse)) chosenParent = hiddenNode.spouse;
    }
    p.parentId = chosenParent || VIRTUAL_ROOT_ID;

    if (p.father && p.mother) p.parentsLine = `Filho(a) de: ${p.father} · ${p.mother}`;
    else if (p.father || p.mother) p.parentsLine = `Filho(a) de: ${p.father || p.mother}`;
    else p.parentsLine = '';
  });

  const familyCtx = inferFamilyContext(people, rawData, canonicalizeName, VIRTUAL_ROOT_ID);

  const chartData = [{
    id: VIRTUAL_ROOT_ID,
    name: familyCtx.familyLabel || 'Família',
    type: 'Raiz', parentId: null, _lvl: 1,
  }];

  people.forEach(p => {
    if (!spousesToHide.has(p.name)) chartData.push(p);
  });

  const idsInChart = new Set(chartData.map(n => n.id));
  chartData.forEach(n => {
    if (n.parentId && !idsInChart.has(n.parentId)) n.parentId = VIRTUAL_ROOT_ID;
  });

  annotateVisualizationMeta(chartData, familyCtx);

  const genealogyReport = buildGenealogyAnalysis(people, rawData, familyCtx);
  return { chartData, genealogyReport, familyCtx };
}

function processFamilyDataForKinship(rawData) {
  const canonicalByNorm = new Map();
  rawData.forEach(row => {
    const rawName = row['Nome(s)']?.trim();
    const norm = normalizeNameToken(rawName);
    if (rawName && norm && !canonicalByNorm.has(norm)) canonicalByNorm.set(norm, rawName);
  });

  function canonicalizeName(raw) {
    const txt = (raw || '').trim();
    if (!txt) return '';
    const norm = normalizeNameToken(txt);
    return canonicalByNorm.get(norm) || txt;
  }

  function getTypeWeight(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('ancestral')) return 10;
    if (t.includes('membro')) return 8;
    if (t.includes('filho')) return 5;
    if (t.includes('agregado')) return 1;
    return 0;
  }

  const people = new Map();
  rawData.forEach(row => {
    const nameText = row['Nome(s)']?.trim();
    if (!nameText) return;
    const type = row['Tipo']?.trim() || 'Membro';
    const spouse = canonicalizeName(row['Agregado']);
    const father = canonicalizeName(row['Pai']);
    const mother = canonicalizeName(row['Mãe']);
    const name = canonicalizeName(nameText);
    const currentWeight = getTypeWeight(type);
    let parentsLine = '';
    if (father && mother) parentsLine = `Filho(a) de: ${father} · ${mother}`;
    else if (father) parentsLine = `Filho(a) de: ${father}`;
    else if (mother) parentsLine = `Filho(a) de: ${mother}`;

    if (!people.has(name)) {
      people.set(name, { id: name, name, type, spouse: spouse || '', parentId: father || mother || null, parentsLine, _weight: currentWeight });
    } else {
      const p = people.get(name);
      if (currentWeight > (p._weight || 0)) {
        p.type = type;
        p.parentId = father || mother || p.parentId;
        p.parentsLine = parentsLine || p.parentsLine;
        p._weight = currentWeight;
      }
      if (spouse && !p.spouse.includes(spouse)) p.spouse = p.spouse ? `${p.spouse} & ${spouse}` : spouse;
    }
    if (spouse && !people.has(spouse)) {
      people.set(spouse, { id: spouse, name: spouse, type: 'Agregado', spouse: name, parentId: null, parentsLine: '', _weight: 1 });
    }
  });

  return { people };
}

function buildKinshipData(focusId, peopleMap) {
  if (!focusId || !peopleMap.has(focusId)) return [];

  const childrenByParent = new Map();
  const parentsByChild = new Map();

  peopleMap.forEach(p => {
    const parents = [];
    if (p.parentsLine) {
      const matches = p.parentsLine.match(/de: ([^|·]+)(?:[·|]|$)/g);
      if (matches) {
        matches.forEach(m => {
          const n = m.replace(/de: |[·|]/g, '').trim();
          if (n && peopleMap.has(n)) parents.push(n);
        });
      }
    }
    if (p.parentId && !p.parentId.includes('ROOT') && peopleMap.has(p.parentId)) {
      if (!parents.includes(p.parentId)) parents.push(p.parentId);
    }
    parents.forEach(pid => {
      if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
      childrenByParent.get(pid).push(p.id);
      if (!parentsByChild.has(p.id)) parentsByChild.set(p.id, []);
      parentsByChild.get(p.id).push(pid);
    });
  });

  const kinshipData = [];
  const focusPerson = peopleMap.get(focusId);
  kinshipData.push({
    id: focusId, name: focusPerson.name, type: 'VOCÊ', spouse: focusPerson.spouse,
    parentId: null, parentsLine: focusPerson.parentsLine, _kinshipRole: 'Eu', _branchColor: '#d90429',
  });

  const parents = parentsByChild.get(focusId) || [];
  let paternalParent = null;
  let maternalParent = null;
  parents.forEach(pid => {
    const p = peopleMap.get(pid);
    const isFemale = /a$|e$/.test(p.name.toLowerCase().split(' ')[0]);
    if (isFemale && !maternalParent) maternalParent = pid;
    else if (!isFemale && !paternalParent) paternalParent = pid;
  });
  if (!paternalParent && parents.length > 0) paternalParent = parents[0];
  if (!maternalParent && parents.length > 1) maternalParent = parents.find(p => p !== paternalParent);

  function addAncestors(startId, branchParentId, color, depth) {
    if (depth > 4) return;
    const p = peopleMap.get(startId);
    if (!p) return;
    const kId = `anc_${color.slice(1)}_${startId}`;
    const roles = ['Pai/Mãe', 'Avô/Avó', 'Bisavô/Bisavó', 'Trisavô/Trisavó'];
    kinshipData.push({ id: kId, name: p.name, type: p.type, spouse: p.spouse, parentId: branchParentId, parentsLine: p.parentsLine, _kinshipRole: roles[depth] || 'Ancestral', _branchColor: color });
    (parentsByChild.get(startId) || []).forEach(apid => addAncestors(apid, kId, color, depth + 1));
  }

  if (paternalParent) {
    const branchId = `${focusId}_paternal`;
    kinshipData.push({ id: branchId, name: 'LINHAGEM PATERNA', type: 'Ascendentes', parentId: focusId, _kinshipRole: 'Fundo', _branchColor: '#0077b6' });
    addAncestors(paternalParent, branchId, '#0077b6', 0);
  }
  if (maternalParent) {
    const branchId = `${focusId}_maternal`;
    kinshipData.push({ id: branchId, name: 'LINHAGEM MATERNA', type: 'Ascendentes', parentId: focusId, _kinshipRole: 'Fundo', _branchColor: '#9d4edd' });
    addAncestors(maternalParent, branchId, '#9d4edd', 0);
  }

  const children = childrenByParent.get(focusId) || [];
  if (children.length > 0) {
    const branchId = `${focusId}_descendants`;
    kinshipData.push({ id: branchId, name: 'DESCENDENTES', type: 'Família', parentId: focusId, _kinshipRole: 'Fundo', _branchColor: '#2a9d8f' });
    const addDescendants = (cid, parentOfNode, depth) => {
      if (depth > 4) return;
      const c = peopleMap.get(cid);
      if (!c) return;
      const kId = `desc_${cid}`;
      kinshipData.push({ id: kId, name: c.name, type: c.type, spouse: c.spouse, parentId: parentOfNode, parentsLine: c.parentsLine, _kinshipRole: depth === 0 ? 'Filho(a)' : 'Neto(a)', _branchColor: '#2a9d8f' });
      (childrenByParent.get(cid) || []).forEach(ckid => addDescendants(ckid, kId, depth + 1));
    };
    children.forEach(cid => addDescendants(cid, branchId, 0));
  }

  return kinshipData;
}

function filterBranchSubset(fullData, branchKey) {
  if (!branchKey || !fullData.length || branchKey === '__raiz__') return fullData;
  const byId = new Map(fullData.map(n => [n.id, n]));
  const keep = new Set();
  fullData.forEach(n => {
    if (n._branchKey === branchKey || n.id === branchKey) keep.add(n.id);
  });
  let more = true;
  while (more) {
    more = false;
    keep.forEach(id => {
      const n = byId.get(id);
      if (n && n.parentId && !keep.has(n.parentId)) { keep.add(n.parentId); more = true; }
    });
  }
  return fullData.filter(n => keep.has(n.id));
}

function getBranchEntries(data) {
  const out = [];
  const byId = new Map(data.map(n => [n.id, n]));
  const processedPairs = new Set();
  data.forEach(n => {
    if (n._lvl !== 3 || n.id === VIRTUAL_ROOT_ID) return;
    const isAgregado = normalizeTipoKey(n.type) === 'agregado';
    const partner = n.spouse ? byId.get(n.spouse) : null;
    if (isAgregado && !partner) return;
    const pairId = partner ? [n.id, partner.id].sort().join('::') : n.id;
    if (processedPairs.has(pairId)) return;
    processedPairs.add(pairId);
    let label = n.name;
    if (partner) label = isAgregado ? `${partner.name} + ${n.name}` : `${n.name} + ${partner.name}`;
    out.push({ key: n.id, label });
  });
  out.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  return out;
}

function parseCsv(csvText) {
  if (!csvText || !csvText.trim()) return [];
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: 'greedy' });
  if (result.errors && result.errors.length) {
    const critical = result.errors.filter(e => e.type === 'FieldMismatch');
    if (critical.length) throw new Error(`Erro ao interpretar CSV: ${critical[0].message}`);
  }
  return result.data;
}

module.exports = {
  parseCsv,
  processFamilyData,
  processFamilyDataForKinship,
  buildKinshipData,
  filterBranchSubset,
  getBranchEntries,
  VIRTUAL_ROOT_ID,
  GENEALOGY_ORDER_TABLE,
};
