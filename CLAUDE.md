# Jacareí em Dados — Guia de Desenvolvimento

## Visão Geral

Dashboard web interativo para visualização dos dados do Censo IBGE 2022 de Jacareí - SP.
Permite explorar indicadores demográficos por setor censitário: população, domicílios, distribuição por sexo e pirâmide etária.

## Stack

| Camada | Tecnologia |
|---|---|
| Pré-processamento | Python 3.10+ · geopandas · pandas |
| Frontend | React 18 · Vite · TypeScript · Tailwind CSS v4 |
| Mapa | react-leaflet + Leaflet |
| Gráficos | recharts (distribuição por sexo) · CSS puro (pirâmide etária) |

## Estrutura do Projeto

```
jacarei-em-dados/
├── dados/
│   ├── Jacarei_Agregados_demografia.csv   # Dados demográficos por setor (IBGE)
│   └── Jacarei_setores_malha.gpkg         # Malha vetorial dos setores (IBGE)
├── dicionario_ibge/
│   ├── dicionario_setores_cencitarios_demografia.csv
│   └── dicionario_setores_cencitarios_malha.csv
├── scripts/
│   └── preprocess.py                      # Gera frontend/public/jacarei_setores_merged.geojson
├── frontend/
│   ├── public/
│   │   └── jacarei_setores_merged.geojson # GeoJSON gerado (548 setores)
│   └── src/
│       ├── types.ts
│       ├── App.tsx
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── FilterBar.tsx
│       │   ├── Map.tsx
│       │   ├── Dashboard.tsx
│       │   ├── SummaryCards.tsx
│       │   ├── SexDistribution.tsx
│       │   ├── AgePyramid.tsx
│       │   └── NoDataMessage.tsx
│       ├── hooks/
│       │   ├── useGeoData.ts
│       │   ├── useFilters.ts
│       │   └── useDashboard.ts
│       └── utils/
│           ├── constants.ts
│           ├── aggregation.ts
│           └── formatting.ts
├── pyproject.toml
└── CLAUDE.md
```

## Dados

### Chave de junção
- GPKG: coluna `CD_SETOR` (15 dígitos, ex: `352440205000001`)
- CSV: coluna `CD_setor` — padronizada para `CD_SETOR` no preprocessing

### Mapeamento de colunas demográficas

| Coluna | Descrição |
|---|---|
| V01006 | Total de moradores |
| V01007 | Sexo masculino (total) |
| V01008 | Sexo feminino (total) |
| V01009–V01019 | Masculino por faixa etária (0-4, 5-9, 10-14, 15-19, 20-24, 25-29, 30-39, 40-49, 50-59, 60-69, 70+) |
| V01020–V01030 | Feminino por faixa etária (mesmas 11 faixas) |
| V0002 | Total de domicílios (do GPKG) |
| AREA_KM2 | Área em km² (do GPKG) |

### Setores sem dados (16 no total)
O GPKG tem 548 setores; o CSV tem 532. Os 16 sem dados são áreas industriais, corpos d'água ou zonas rurais sem população. O app exibe `NoDataMessage` nesses casos.

### Valores "X"
Dados suprimidos pelo IBGE por sigilo estatístico. Tratados como `0` no preprocessing.

## Como Rodar

### 1. Pré-processamento (primeira vez ou ao atualizar dados)

```bash
# Criar ambiente virtual
python3 -m venv .venv
source .venv/bin/activate
pip install geopandas pandas

# Gerar GeoJSON
python scripts/preprocess.py
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Acesse: http://localhost:5173
```

### 3. Build para produção

```bash
cd frontend
npm run build
# Arquivos em frontend/dist/
```

## Arquitetura Frontend

### Fluxo de dados
```
GeoJSON (fetch uma vez) → useGeoData
                        → useFilters (filtros + setor selecionado)
                        → useDashboard (agrega/seleciona dados)
                        → Dashboard + MapView (renderização)
```

### Interações do mapa
- **Padrão**: contorno preto, sem preenchimento
- **Hover**: preenchimento azul claro (`#3B82F6`, opacity 0.40)
- **Selecionado**: preenchimento azul escuro (`#1D4ED8`, opacity 0.65)
- **Filtros**: AND entre Distrito + Urbana/Rural + Favela; re-agrega e chama `fitBounds`

### Pirâmide etária
Implementada com CSS flexbox puro (não recharts) para garantir alinhamento perfeito entre as barras masculinas e femininas. Valores em porcentagem relativa ao maior valor entre todas as faixas.

## Decisões Técnicas

- **GeoJSON estático**: toda a agregação acontece no browser; não há backend.
- **Simplificação de geometrias**: `tolerance=0.0003` no geopandas (reduz de ~3MB para ~1MB mantendo qualidade visual).
- **CRS**: reprojetado de EPSG:4674 (SIRGAS 2000) para EPSG:4326 (WGS84) no preprocessing.
- **Tailwind v4**: usa `@import "tailwindcss"` em vez do `@tailwind base/components/utilities` da v3.
