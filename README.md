# Árvore Genealógica — Família Marques

Aplicação web para visualização interativa de árvores genealógicas via Google Sheets.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | Node.js + Express |
| Frontend | React 18 + Vite |
| Testes backend | Jest + Supertest |
| Testes frontend | Vitest + Testing Library |
| Documentação API | OpenAPI 3.1 |

---

## Estrutura do projeto

```
ArvoreGenealogicaReact/
├── backend/                  # API Express
│   ├── src/
│   │   ├── app.js            # Express app
│   │   ├── server.js         # Entry point
│   │   ├── routes/
│   │   │   └── sheets.js     # Endpoints /api/sheets
│   │   ├── services/
│   │   │   ├── sheetsService.js  # Proxy + cache do Google Sheets
│   │   │   └── familyService.js  # Processamento da árvore genealógica
│   │   └── middleware/
│   │       ├── cache.js          # Cache em memória com TTL
│   │       └── errorHandler.js
│   ├── tests/
│   │   ├── routes/sheets.test.js
│   │   └── services/familyService.test.js
│   └── docs/openapi.yaml     # Especificação OpenAPI 3.1
│
├── frontend/                 # SPA React + Vite
│   ├── src/
│   │   ├── App.jsx           # Componente raiz + orquestração
│   │   ├── store/
│   │   │   └── FamilyContext.jsx  # Estado global (Context + useReducer)
│   │   ├── hooks/
│   │   │   ├── useFamilyData.js   # Lógica de carregamento + histórico
│   │   │   └── useLocalStorage.js
│   │   ├── services/
│   │   │   └── api.js         # Chamadas ao backend
│   │   ├── components/
│   │   │   ├── FamilyTree/    # Wrapper D3-OrgChart
│   │   │   ├── Controls/      # SheetInput, KinshipSelector, BranchSelector
│   │   │   ├── AnalysisPanel/ # Painel de análise genealógica
│   │   │   └── ui/            # Header, LoadingSpinner, ErrorMessage
│   │   └── utils/
│   │       ├── colorUtils.js  # Funções de cor (hue, HSL, kinship badges)
│   │       └── treeUtils.js   # Helpers de árvore e URL
│   └── tests/
│       ├── components/AnalysisPanel.test.jsx
│       └── utils/colorUtils.test.js, treeUtils.test.js
│
└── docs/
    └── architecture.md
```

---

## Início rápido

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev       # http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

O Vite faz proxy de `/api` para `localhost:3001` automaticamente.

---

## Testes

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# Com cobertura
cd backend && npm test -- --coverage
cd frontend && npm run test:coverage
```

---

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| GET | `/api/sheets` | CSV bruto da planilha (proxy) |
| GET | `/api/sheets/family` | Árvore processada (JSON) |
| DELETE | `/api/sheets/cache` | Invalida cache do servidor |
| POST | `/api/sheets/parse-url` | Extrai id/gid de URL do Sheets |

Veja a especificação completa em [backend/docs/openapi.yaml](backend/docs/openapi.yaml).

---

## Formato da planilha Google Sheets

| Coluna | Obrigatório | Descrição |
|--------|-------------|-----------|
| `Nome(s)` | ✅ | Nome completo da pessoa |
| `Tipo` | ✅ | `Fundador`, `Filho`, `Neta`, `Bisneto`, `Tataraneto`, `Agregado` |
| `Pai` | ✅* | Nome do pai (ou marcador `Família X` para fundadores) |
| `Mãe` | ✅* | Nome da mãe |
| `Agregado` | ❌ | Cônjuge não-consanguíneo |

*Pelo menos um entre Pai e Mãe deve ser preenchido.

---

## Modos de visualização

- **Padrão** — árvore completa, colorida por ramo
- **Foco de ramo** — subárvore filtrada via seletor "Ramos"
- **Parentesco (Kinship)** — seleção de identidade pelo campo "Quem sou eu?"
- **Unificado** — combina múltiplas planilhas do histórico

---

## Variáveis de ambiente (backend)

Copie `.env.example` para `.env`:

```
PORT=3001
CACHE_TTL_MS=21600000        # 6 horas
DEFAULT_SHEET_ID=...         # ID padrão da planilha
DEFAULT_SHEET_GID=0          # ABA padrão
```
