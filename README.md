# 🗺️ Jacareí em Dados

Jacareí em Dados é um dashboard geoespacial interativo que transforma os microdados do Censo IBGE 2022 em visualizações exploráveis por setor censitário.

Navegue pelo mapa, aplique filtros por distrito e tipo de ocupação, selecione setores individualmente ou desenhe um polígono para agregar múltiplos setores de uma vez. O painel lateral exibe dados em 7 categorias: Demografia, Cor/Raça, Alfabetização, Domicílio, Parentesco, Indígenas/Quilombolas e Renda — tudo processado no próprio navegador, sem backend. O mapa possui overlay coroplético de renda que colore os setores por faixa salarial.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)
![Turf.js](https://img.shields.io/badge/Turf.js-geoespacial-00A36C)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)

---

## Funcionalidades

- **Mapa interativo** — 548 setores censitários de Jacareí renderizados via react-leaflet; hover com highlight e zoom automático por filtro
- **4 overlays coropléticos no mapa** — toolbar vertical junto ao zoom oferece: Renda (YlOrRd, faixas de SM), Densidade populacional (Blues, hab/km²), Taxa de Alfabetização 15+ (Greens, %), Cor/Raça — % preta+parda+indígena (BuPu, %); apenas um ativo por vez; legenda integrada
- **7 categorias no painel** — Demografia, Cor/Raça, Alfabetização, Domicílio, Parentesco, Indígenas/Quilombolas e Renda, navegadas por abas
- **Filtros combinados** — filtre por Distrito, Urbana/Rural e Favelas/Comunidades simultaneamente (lógica AND)
- **Seleção individual** — clique em qualquer setor para ver seus dados isolados no painel
- **Seleção por polígono** — desenhe um polígono livre no mapa; todos os setores com ≥ 40% da área dentro são selecionados automaticamente
- **Seleção editável** — após o polígono, clique para adicionar ou remover setores da seleção
- **Agregação automática** — o painel agrega dados de todos os setores selecionados em tempo real
- **Pirâmide etária** — visualização por 11 faixas etárias, masculino e feminino, em CSS flexbox puro
- **Link para mapa PDF** — acesso direto ao mapa do setor no portal do IBGE (quando disponível)
- **Sem backend** — toda a lógica roda no browser com GeoJSON estático (~1.6 MB)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilo | Tailwind CSS v4 |
| Mapa | react-leaflet + Leaflet 1.9 |
| Geoespacial | Turf.js (`@turf/intersect`, `@turf/area`) |
| Gráficos | recharts (distribuição por sexo) + CSS puro (pirâmide etária) |
| Pré-processamento | Python 3.10 + geopandas + pandas + topojson |

---

## Requisitos

- **Node.js** 18 ou superior
- **npm** 9 ou superior
- **Python** 3.10+ com `geopandas`, `pandas` e `topojson` (apenas para regenerar o GeoJSON)

Os dados brutos não estão incluídos no repositório. Faça o download direto do portal do IBGE:

| Arquivo | Fonte |
|---------|-------|
| `Jacarei_Agregados_demografia.csv` | [IBGE — Censo 2022 – Agregados por Setor Censitário](https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html) |
| `Jacarei_setores_malha.gpkg` | [IBGE — Malhas de Setores Censitários](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/26565-malhas-de-setores-censitarios-divisoes-intramunicipais.html) |

---

## Começando

### 1. Pré-processamento (gera o GeoJSON)

```bash
# Criar e ativar ambiente virtual
python3 -m venv .venv
source .venv/bin/activate

pip install geopandas pandas topojson

# Gerar o GeoJSON mesclado
python scripts/preprocess.py
# Saída: frontend/public/jacarei_setores_merged.geojson (~1 MB)
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173) no navegador.

### 3. Build para produção

```bash
cd frontend
npm run build
# Arquivos estáticos em frontend/dist/
```

---

## Como usar

1. **Explorar** — o mapa carrega com todos os 548 setores de Jacareí. O painel lateral mostra os dados agregados do município inteiro.
2. **Filtrar** — use a barra de filtros para restringir por Distrito, Urbana/Rural ou Favelas. O mapa e o painel atualizam automaticamente.
3. **Selecionar um setor** — clique em qualquer setor para ver seus dados individuais: população, domicílios, distribuição por sexo e pirâmide etária.
4. **Selecionar por polígono** — clique em *Selecionar por polígono* na barra flutuante do mapa. Clique no mapa para adicionar vértices; duplo clique ou clique no primeiro vértice para fechar. Setores com ≥ 40% de área dentro do polígono são selecionados e o painel agrega seus dados.
5. **Editar seleção** — com o polígono fechado, clique em qualquer setor para adicioná-lo ou removê-lo da seleção.
6. **Limpar** — clique no X da barra de seleção ou em *Limpar seleções* para voltar ao estado inicial.
7. **Mapa PDF** — quando um setor individual está selecionado, o botão *Mapa PDF* abre o mapa oficial do setor no portal do IBGE.
8. **Overlays no mapa** — a toolbar vertical no canto superior-esquerdo (abaixo do zoom) oferece 4 camadas de cores: *Renda*, *Densidade*, *Alfabet.* e *Cor/Raça*. Clique em um para ativar; clique novamente para desativar. Apenas um overlay por vez. A legenda aparece no canto inferior-esquerdo.

---

## Estrutura do Projeto

```
ibge-jacarei/
├── dados/
│   ├── Jacarei_Agregados_demografia.csv   # Dados demográficos (IBGE)
│   └── Jacarei_setores_malha.gpkg         # Malha vetorial dos setores (IBGE)
├── dicionario_ibge/                        # Dicionários de variáveis do IBGE
├── scripts/
│   └── preprocess.py                      # Mescla CSV + GPKG → GeoJSON
├── frontend/
│   ├── public/
│   │   └── jacarei_setores_merged.geojson # GeoJSON gerado (548 setores, ~1 MB)
│   └── src/
│       ├── App.tsx                         # Orquestrador principal
│       ├── types.ts                        # Tipos globais (SectorFeature, SelectionMode…)
│       ├── components/
│       │   ├── Map.tsx                     # MapView com toolbar flutuante
│       │   ├── DrawControl.tsx             # Desenho de polígono (Leaflet nativo)
│       │   ├── Dashboard.tsx               # Painel lateral de dados
│       │   ├── SummaryCards.tsx            # Cards de população, domicílios, área, densidade
│       │   ├── SexDistribution.tsx         # Gráfico de barras por sexo (recharts)
│       │   ├── AgePyramid.tsx              # Pirâmide etária (CSS flexbox)
│       │   ├── FilterBar.tsx               # Barra de filtros
│       │   ├── Header.tsx
│       │   ├── NoDataMessage.tsx
│       │   └── ErrorBoundary.tsx           # Captura erros de render
│       ├── hooks/
│       │   ├── useGeoData.ts               # Fetch e parse do GeoJSON
│       │   ├── useFilters.ts               # Filtros + seleção individual
│       │   ├── useSelection.ts             # Seleção múltipla por polígono
│       │   └── useDashboard.ts             # Agregação de dados para o painel
│       └── utils/
│           ├── polygonSelection.ts         # Interseção de área com Turf.js
│           ├── aggregation.ts              # Soma/média de indicadores demográficos
│           ├── constants.ts                # Centro do mapa, zoom, URLs do IBGE
│           └── formatting.ts              # Formatação de números
└── pyproject.toml
```

---

## Dados

### Chave de junção
- GPKG: coluna `CD_SETOR` (15 dígitos, ex: `352440205000001`)
- CSV: coluna `CD_setor` — padronizada para `CD_SETOR` no preprocessing

### Principais variáveis demográficas

| Coluna | Descrição |
|--------|-----------|
| V01006 | Total de moradores |
| V01007 | Sexo masculino (total) |
| V01008 | Sexo feminino (total) |
| V01009–V01019 | Masculino por faixa etária (11 faixas: 0-4 até 70+) |
| V01020–V01030 | Feminino por faixa etária (mesmas 11 faixas) |
| V0002 | Total de domicílios |
| AREA_KM2 | Área em km² |

### Setores sem dados
16 dos 548 setores não possuem dados demográficos (áreas industriais, corpos d'água ou zonas rurais sem população). O app exibe uma mensagem informativa nesses casos. Valores `"X"` (sigilo estatístico do IBGE) são tratados como `0` no preprocessing.

---

## Limitações

- **Dados estáticos** — o GeoJSON é gerado uma única vez a partir dos arquivos do IBGE. Não há atualização automática.
- **Cobertura** — apenas o município de Jacareí – SP, Censo 2022.
- **Polígono de seleção** — o limiar de 40% de área é calculado com Turf.js no browser; geometrias muito complexas podem ter leve imprecisão.
- **Setores sem PDF** — o link para o mapa PDF do IBGE só está disponível para setores urbanos e de aglomerados subnormais. Setores rurais não possuem PDF no portal.

---

## Licença

MIT License — livre para usar, modificar e distribuir.
