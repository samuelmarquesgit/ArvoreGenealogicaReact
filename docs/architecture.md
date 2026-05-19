# Arquitetura — Árvore Genealógica React

## Visão geral

```
Browser (React + Vite)
        │
        │  fetch /api/sheets/family
        ▼
  Express Backend ─────────── Cache em memória (TTL 6h)
        │
        │  HTTP GET (CSV export)
        ▼
  Google Sheets API (público)
```

O backend atua como proxy para evitar CORS e adiciona cache em memória no servidor.
O frontend é uma SPA React que renderiza a árvore com D3-OrgChart.

---

## Fluxo de dados

```
1. Usuário abre o app / altera planilha
2. App.jsx → useFamilyData.load()
3. api.js → GET /api/sheets/family?id=&gid=...
4. sheets.js (route) → sheetsService.fetchSheet()
     → verifica cache em memória
     → se miss: fetch do Google Sheets (CSV)
     → armazena no cache
5. sheets.js → familyService.parseCsv(text)
6. familyService.processFamilyData(rows)
     → canonicaliza nomes
     → monta mapa de pessoas
     → determina parentId de cada nó
     → infere contexto familiar (fundadores, ramos)
     → annotateVisualizationMeta() → cores HSL por profundidade/ramo
     → buildGenealogyAnalysis() → relatório de inconsistências
7. Retorna JSON: { chartData, genealogyReport, familyCtx, branches }
8. FamilyContext (useReducer) → state.chartData atualizado
9. FamilyTree.jsx renderiza D3-OrgChart com os nós anotados
```

---

## Modelo de dados — PersonNode

```ts
interface PersonNode {
  // Identidade
  id: string;           // Nome canônico (chave única)
  name: string;
  type: string;         // "Fundador" | "Filho" | "Neto" | "Bisneto" | "Tataraneto" | "Agregado"
  spouse?: string;      // Nome do cônjuge (se Agregado for ocultado na árvore)
  parentId: string | null;
  parentsLine: string;  // "Filho(a) de: X · Y"

  // Metadados de geração
  _lvl: number;         // 1=Raiz, 2=Fundador, 3=Filho, 4=Neto, 5=Bisneto, 6=Tataraneto
  _depth: number;       // Profundidade a partir da raiz virtual

  // Coloração
  _branchKey: string;   // ID do nó de nível 3 que lidera o ramo
  _cardBg: string;      // CSS background (cor ou gradiente)
  _cardBorder: string;
  _nameColor: string;
  _roleColor: string;
  _parentsColor: string;
  _spouseColor: string;
  _linkStroke: string;
  _nameSizePx: number;

  // Visão de parentesco
  _kinshipRole?: string; // "Eu" | "Pai/Mãe" | "Avô/Avó" | "Filho(a)" | "Fundo"
  _branchColor?: string; // Cor sólida no modo kinship
}
```

---

## Estado global (FamilyContext)

```
FamilyProvider (Context + useReducer)
├── sheetId / sheetGid         — planilha ativa
├── chartData: PersonNode[]    — dados da árvore (com cores)
├── genealogyReport            — análise de consistência
├── familyCtx                  — { familyLabel, founders, primaryFounderId }
├── branches                   — lista de ramos para o seletor
├── selectedIdentity           — nome selecionado em "Quem sou eu?"
├── focusedBranchKey           — ramo em foco (ou null)
├── unifiedMode                — true quando visão de parentesco ativa
├── loading / error            — estado de carregamento
└── fromCache / savedAt        — metadados da fonte
```

Ações do reducer: `SET_SHEET`, `SET_LOADING`, `SET_ERROR`, `SET_DATA`,
`SET_IDENTITY`, `SET_BRANCH_FOCUS`, `EXIT_UNIFIED`.

---

## Coloring system

### Modo padrão (árvore completa)

- **Raiz virtual**: fundo preto `#0f172a`
- **Fundadores**: gradiente azul escuro `#0f172a → #1e40af`
- **Ramos** (nível 3+): HSL determinístico por `_branchKey`
  - Hue = `hashHue(branchKey)` (função hash simples, consistente)
  - Saturation = `min(65%, 35% + min(depth, 5) × 5%)`
  - Lightness = `max(68%, 96% - depth × 4.5%)`

### Modo kinship (parentesco)

| Papel | Cor |
|-------|-----|
| Eu | `#d90429` (vermelho) |
| Linhagem paterna | `#0077b6` (azul) |
| Linhagem materna | `#9d4edd` (roxo) |
| Descendentes | `#2a9d8f` (verde-azulado) |

---

## Modos de visualização

| Modo | Ativação | Lógica no backend |
|------|----------|-------------------|
| Padrão | Default | `processFamilyData()` |
| Foco de ramo | Seletor "Ramos" | `filterBranchSubset()` |
| Kinship | "Quem sou eu?" | `processFamilyDataForKinship()` + `buildKinshipData()` |
| Unificado | Parâmetro `?who=` | combina CSVs do histórico localStorage |

---

## Cache

- **Servidor**: `Map` em memória com TTL de 6 horas (configurável via `CACHE_TTL_MS`)
- **Cliente (histórico)**: `localStorage` guarda os últimos 10 sheets visitados com label
  - Chave: `arvoregenealogica_recent_sheets_v1`
  - Usado para popular o seletor "Recentes" e "Quem sou eu?"

---

## Testes

| Camada | Framework | O que testa |
|--------|-----------|-------------|
| Backend services | Jest | `parseCsv`, `processFamilyData`, `buildKinshipData`, `filterBranchSubset` |
| Backend routes | Jest + Supertest | Todos os endpoints com mocks de `sheetsService` |
| Frontend utils | Vitest | `hashHue`, `branchColorFromKey`, `formatAgo`, `canNodeFocus` |
| Frontend components | Vitest + Testing Library | `AnalysisPanel` (render, interação, estados) |
