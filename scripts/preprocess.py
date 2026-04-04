"""
Pré-processamento dos dados do Censo IBGE 2022 para Jacareí - SP.
Gera um GeoJSON mesclando a malha espacial (GPKG) com múltiplos CSVs censitários.
"""

import os
import sys
import pandas as pd
import geopandas as gpd
import topojson

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS_DIR = os.path.join(BASE_DIR, "dados")
GPKG_PATH = os.path.join(DADOS_DIR, "Jacarei_setores_malha.gpkg")
OUTPUT_PATH = os.path.join(BASE_DIR, "frontend", "public", "jacarei_setores_merged.geojson")

# Prefixo dos setores de Jacareí (município 3524402)
JACAREI_PREFIX = "3524402"

# ── Definição das categorias de dados ────────────────────────────────────────
# Cada categoria especifica o arquivo CSV, a coluna-chave e as colunas a extrair.
# CSVs nacionais (BR) são filtrados para Jacareí automaticamente.
# O CSV local de demografia (Jacarei_Agregados_demografia.csv) já contém apenas Jacareí.

CATEGORIES = {
    "demografia": {
        "file": "Jacarei_Agregados_demografia.csv",
        "key_col": "CD_setor",
        "columns": [f"V{str(i).zfill(5)}" for i in range(1006, 1042)],
        "national": False,
    },
    "cor_ou_raca": {
        "file": "Agregados_por_setores_cor_ou_raca_BR.csv",
        "key_col": "CD_SETOR",
        "columns": [f"V{str(i).zfill(5)}" for i in range(1317, 1322)],
        "national": True,
    },
    "alfabetizacao": {
        "file": "Agregados_por_setores_alfabetizacao_BR.csv",
        "key_col": "CD_setor",
        "columns": [f"V{str(i).zfill(5)}" for i in range(748, 761)],
        "national": True,
    },
    "domicilio": {
        "file": "Agregados_por_setores_caracteristicas_domicilio1_BR.csv",
        "key_col": "CD_setor",
        "columns": (
            [f"V{str(i).zfill(5)}" for i in range(17, 27)]    # V00017..V00026 (moradores)
            + [f"V{str(i).zfill(5)}" for i in range(47, 53)]  # V00047..V00052 (tipo)
        ),
        "national": True,
    },
    "parentesco": {
        "file": "Agregados_por_setores_parentesco_BR.csv",
        "key_col": "CD_SETOR",
        "columns": [f"V{str(i).zfill(5)}" for i in range(1062, 1069)],
        "national": True,
    },
    "indigenas": {
        "file": "Agregados_por_setores_pessoas_indigenas_BR.csv",
        "key_col": "CD_SETOR",
        "columns": ["V01690", "V01691", "V01692", "V01696", "V01697", "V01698", "V01699"],
        "national": True,
    },
    "quilombolas": {
        "file": "Agregados_por_setores_pessoas_quilombolas_BR.csv",
        "key_col": "CD_SETOR",
        "columns": ["V03196", "V03197", "V03198", "V03199", "V03200", "V03201", "V03202"],
        "national": True,
    },
    "renda": {
        "file": "Agregados_por_setores_renda_responsavel_BR.csv",
        "key_col": "CD_SETOR",
        "columns": ["V06001", "V06004"],  # V06001=total responsáveis, V06004=rendimento médio
        "national": True,
        "float_cols": ["V06004"],  # vírgula decimal: "3312,06" → 3312.06
    },
}


def load_gpkg(path: str) -> gpd.GeoDataFrame:
    """Carrega o GPKG, normaliza CD_SETOR e reprojeta para WGS84."""
    gdf = gpd.read_file(path)

    # Normalizar nome da coluna chave para maiúsculas
    gdf.columns = [c.upper() if c.lower() == "cd_setor" else c for c in gdf.columns]
    if "CD_SETOR" not in gdf.columns:
        candidates = [c for c in gdf.columns if "setor" in c.lower()]
        if candidates:
            gdf = gdf.rename(columns={candidates[0]: "CD_SETOR"})
        else:
            raise ValueError("Coluna CD_SETOR não encontrada no GPKG.")

    # Garantir CRS WGS84
    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)

    return gdf


def simplify_geometries(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Simplifica geometrias preservando bordas compartilhadas (topology-aware)."""
    topo = topojson.Topology(gdf, toposimplify=0.0003)
    return topo.to_gdf()


def normalize_gpkg_columns(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Padroniza colunas de estatísticas do GPKG e trata SITUACAO nula."""
    # Colunas estatísticas para maiúsculas
    rename_map = {}
    for col in gdf.columns:
        if col.upper() in ("V0001", "V0002", "V0003", "V0004", "V0005", "V0006", "V0007"):
            rename_map[col] = col.upper()
    if rename_map:
        gdf = gdf.rename(columns=rename_map)

    # Tratar SITUACAO nula (massas d'água)
    for c in ["CD_SITUACAO", "CD_SIT"]:
        if c in gdf.columns and "SITUACAO" in gdf.columns:
            mask_null = gdf["SITUACAO"].isna()
            gdf.loc[mask_null, "SITUACAO"] = "Massa d'água"
            break

    return gdf


def load_and_filter_csv(
    filepath: str,
    key_col: str,
    columns: list[str],
    national: bool,
    **kwargs,
) -> pd.DataFrame:
    """
    Lê um CSV censitário, filtra para Jacareí (se nacional),
    limpa valores "X" e retorna apenas as colunas necessárias.
    """
    # Ler apenas as colunas necessárias + chave
    usecols = [key_col] + [c for c in columns if c != key_col]
    df = pd.read_csv(filepath, sep=";", dtype=str, usecols=usecols)

    # Normalizar chave
    df = df.rename(columns={key_col: "CD_SETOR"})
    df["CD_SETOR"] = df["CD_SETOR"].astype(str).str.strip()

    # Filtrar para Jacareí se for CSV nacional
    if national:
        df = df[df["CD_SETOR"].str.startswith(JACAREI_PREFIX)].copy()

    # Limpar valores "X" e converter para numérico
    float_cols = set(kwargs.get("float_cols", []))
    cols_present = [c for c in columns if c in df.columns]
    for col in cols_present:
        if col in float_cols:
            df[col] = clean_float_column(df[col])
        else:
            df[col] = clean_column(df[col])

    return df[["CD_SETOR"] + cols_present]


def clean_column(series: pd.Series) -> pd.Series:
    """Substitui 'X' por 0, limpa espaços e converte para int."""
    return (
        series
        .replace("X", "0")
        .str.strip()
        .pipe(pd.to_numeric, errors="coerce")
        .fillna(0)
        .astype(int)
    )


def clean_float_column(series: pd.Series) -> pd.Series:
    """Substitui 'X' por 0, trata vírgula decimal brasileira e converte para float."""
    return (
        series
        .replace("X", "0")
        .str.strip()
        .str.replace(",", ".", regex=False)
        .pipe(pd.to_numeric, errors="coerce")
        .fillna(0.0)
    )


def merge_category(
    gdf: gpd.GeoDataFrame,
    category_name: str,
    config: dict,
) -> gpd.GeoDataFrame:
    """Mescla uma categoria de dados no GeoDataFrame via left join."""
    filepath = os.path.join(DADOS_DIR, config["file"])

    if not os.path.exists(filepath):
        print(f"  AVISO: Arquivo não encontrado para '{category_name}': {config['file']}. Ignorando.")
        return gdf

    print(f"  Mesclando {category_name} ({config['file']})...")
    df = load_and_filter_csv(
        filepath=filepath,
        key_col=config["key_col"],
        columns=config["columns"],
        national=config["national"],
        float_cols=config.get("float_cols", []),
    )
    print(f"    {len(df)} setores com dados.")

    gdf = gdf.merge(df, on="CD_SETOR", how="left")
    return gdf


def main():
    print("Lendo malha espacial (GPKG)...")
    gdf = load_gpkg(GPKG_PATH)
    print(f"  {len(gdf)} setores carregados. CRS: {gdf.crs}")

    print("  Simplificando geometrias (topojson)...")
    gdf = simplify_geometries(gdf)

    gdf = normalize_gpkg_columns(gdf)
    gdf["CD_SETOR"] = gdf["CD_SETOR"].astype(str).str.strip()

    print("\nMesclando categorias de dados censitários...")
    for name, config in CATEGORIES.items():
        gdf = merge_category(gdf, name, config)

    # Converter colunas de dados para numérico (preservando NaN nos left joins)
    all_data_cols = []
    for config in CATEGORIES.values():
        all_data_cols.extend(config["columns"])
    for col in all_data_cols:
        if col in gdf.columns:
            gdf[col] = pd.to_numeric(gdf[col], errors="coerce")

    # Estatísticas
    missing = gdf["V01006"].isna().sum() if "V01006" in gdf.columns else "N/A"
    print(f"\n  {len(gdf)} setores no resultado final.")
    print(f"  {missing} setores sem dados demográficos (áreas sem população).")

    # Exportar
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    print(f"\nExportando GeoJSON para: {OUTPUT_PATH}")
    gdf.to_file(OUTPUT_PATH, driver="GeoJSON")

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"  Arquivo gerado com {size_kb:.0f} KB.")
    print("\nPré-processamento concluído com sucesso!")


if __name__ == "__main__":
    main()
