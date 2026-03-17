"""
Pré-processamento dos dados do Censo IBGE 2022 para Jacareí - SP.
Gera um GeoJSON mesclando a malha espacial (GPKG) com os dados demográficos (CSV).
"""

import os
import sys
import pandas as pd
import geopandas as gpd
import topojson

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GPKG_PATH = os.path.join(BASE_DIR, "dados", "Jacarei_setores_malha.gpkg")
CSV_PATH = os.path.join(BASE_DIR, "dados", "Jacarei_Agregados_demografia.csv")
OUTPUT_PATH = os.path.join(BASE_DIR, "frontend", "public", "jacarei_setores_merged.geojson")

DEMO_COLS = [f"V{str(i).zfill(5)}" for i in range(1006, 1042)]  # V01006..V01041


def main():
    print("Lendo malha espacial (GPKG)...")
    gdf = gpd.read_file(GPKG_PATH)
    print(f"  {len(gdf)} setores carregados. CRS: {gdf.crs}")

    # Normalizar nome da coluna chave para maiúsculas
    gdf.columns = [c.upper() if c.lower() == "cd_setor" else c for c in gdf.columns]
    if "CD_SETOR" not in gdf.columns:
        # Alguns layers usam nome diferente – tentar encontrar
        candidates = [c for c in gdf.columns if "setor" in c.lower()]
        if candidates:
            gdf = gdf.rename(columns={candidates[0]: "CD_SETOR"})
        else:
            print("ERRO: Coluna CD_SETOR não encontrada no GPKG.", file=sys.stderr)
            sys.exit(1)

    # Garantir CRS WGS84
    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
        print("  Reprojetando para EPSG:4326...")
        gdf = gdf.to_crs(epsg=4326)

    # Simplificar geometrias preservando bordas compartilhadas entre setores
    print("  Simplificando geometrias (topojson)...")
    topo = topojson.Topology(gdf, toposimplify=0.0003)
    gdf = topo.to_gdf()

    # Padronizar colunas de estatísticas do GPKG (minúsculas → maiúsculas)
    rename_map = {}
    for col in gdf.columns:
        if col.upper() in ("V0001", "V0002", "V0003", "V0004", "V0005", "V0006", "V0007"):
            rename_map[col] = col.upper()
    if rename_map:
        gdf = gdf.rename(columns=rename_map)

    # Tratar SITUACAO nula (massas d'água – CD_SITUACAO == 9 ou CD_SIT == 9)
    sit_col = None
    for c in ["CD_SITUACAO", "CD_SIT"]:
        if c in gdf.columns:
            sit_col = c
            break
    if sit_col and "SITUACAO" in gdf.columns:
        mask_null = gdf["SITUACAO"].isna()
        gdf.loc[mask_null, "SITUACAO"] = "Massa d'água"

    print("\nLendo dados demográficos (CSV)...")
    df = pd.read_csv(CSV_PATH, sep=";", dtype=str)
    print(f"  {len(df)} setores com dados demográficos.")

    # Padronizar chave
    df = df.rename(columns={"CD_setor": "CD_SETOR"})
    df["CD_SETOR"] = df["CD_SETOR"].astype(str).str.strip()
    gdf["CD_SETOR"] = gdf["CD_SETOR"].astype(str).str.strip()

    # Substituir "X" por 0 e converter para int (nullable)
    demo_cols_present = [c for c in DEMO_COLS if c in df.columns]
    for col in demo_cols_present:
        df[col] = df[col].replace("X", "0").str.strip()
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    print("\nMesclando malha + dados demográficos...")
    gdf["CD_SETOR"] = gdf["CD_SETOR"].astype(str)
    df["CD_SETOR"] = df["CD_SETOR"].astype(str)
    merged = gdf.merge(df, on="CD_SETOR", how="left")
    print(f"  {len(merged)} setores no resultado final.")
    missing = merged["V01006"].isna().sum()
    print(f"  {missing} setores sem dados demográficos (áreas sem população).")

    # Converter colunas demográficas com NaN para int nullable do pandas
    for col in demo_cols_present:
        if col in merged.columns:
            merged[col] = pd.to_numeric(merged[col], errors="coerce")

    # Garantir que a pasta de destino existe
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    print(f"\nExportando GeoJSON para: {OUTPUT_PATH}")
    merged.to_file(OUTPUT_PATH, driver="GeoJSON")

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"  Arquivo gerado com {size_kb:.0f} KB.")
    print("\nPré-processamento concluído com sucesso!")


if __name__ == "__main__":
    main()
