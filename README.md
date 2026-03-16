# Jacareí em Dados

Painel web interativo para exploração dos dados do **Censo IBGE 2022** do município de **Jacareí – SP**.

Visualize indicadores demográficos por setor censitário: população, domicílios, distribuição por sexo e pirâmide etária.

---

## Funcionalidades

- **Mapa interativo** com todos os 548 setores censitários de Jacareí
- **Clique em um setor** para ver os dados demográficos daquele setor
- **Cards de resumo**: população, domicílios, área e densidade demográfica
- **Distribuição por Sexo**: barra horizontal com percentuais masculino/feminino
- **Pirâmide Etária**: 11 faixas etárias com barras espelhadas M/F
- **Filtros** por Distrito, Situação (Urbana/Rural) e Favelas e Comunidades Urbanas
- Totais municipais agregados no estado inicial (sem seleção)
- Setores sem dados demográficos tratados com mensagem informativa

---

## Stack

| Camada | Tecnologia |
|---|---|
| Pré-processamento | Python · geopandas · pandas |
| Frontend | React + Vite + TypeScript |
| Estilização | Tailwind CSS v4 |
| Mapa | Leaflet via react-leaflet |
| Gráficos | recharts + CSS |

---

## Como Executar

### Pré-requisitos

- Python 3.10+
- Node.js 18+

### 1. Pré-processamento dos dados

Gera o GeoJSON mesclando a malha espacial com os dados demográficos:

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install geopandas pandas

python scripts/preprocess.py
```

O arquivo `frontend/public/jacarei_setores_merged.geojson` será gerado (já incluído no repositório).

### 2. Iniciar o painel

```bash
cd frontend
npm install
npm run dev
```

Acesse em: `http://localhost:5173`

### 3. Build para produção

```bash
cd frontend
npm run build
# Arquivos estáticos em frontend/dist/
```

---

## Estrutura de Diretórios

```
jacarei-em-dados/
├── dados/
│   ├── Jacarei_Agregados_demografia.csv   # Dados demográficos por setor
│   └── Jacarei_setores_malha.gpkg         # Malha vetorial dos setores
├── dicionario_ibge/                        # Dicionários de variáveis IBGE
├── scripts/
│   └── preprocess.py                      # Script de pré-processamento
├── frontend/                              # Aplicação React
│   ├── public/
│   │   └── jacarei_setores_merged.geojson # GeoJSON processado
│   └── src/
│       ├── components/
│       ├── hooks/
│       └── utils/
└── pyproject.toml
```

---

## Fonte dos Dados

Os dados utilizados são de acesso público, disponibilizados pelo **IBGE**:

- **Malha dos Setores Censitários 2022**: [IBGE Malhas Territoriais](https://www.ibge.gov.br/geociencias/downloads-geociencias.html)
- **Resultados do Censo 2022 por Setor**: [IBGE Censo 2022 – Agregados por Setor Censitário](https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html)

---

## Licença

MIT
