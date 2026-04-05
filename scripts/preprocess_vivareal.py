"""
Pré-processamento dos dados VivaReal para o dashboard de Jacareí.

Lê dois bancos SQLite (venda e aluguel), deduplica, filtra outliers,
atribui imóveis a setores censitários via junção espacial e produz:
  - frontend/public/vivareal_por_setor.json  — métricas por setor
  - frontend/public/vivareal_mercado.json    — análise Demanda × Oferta

Fórmula de demanda (alinhada com o frontend):
    renda_corrigida = V06004 × IPCA_CORRECAO
    renda_familiar  = renda_corrigida × RENDA_MULTIPLIER
    valor_maximo    = renda_familiar × MAX_PROPERTY_FACTOR
    demanda         = V06001 / ABSORPTION_FACTOR
"""

from __future__ import annotations

import json
import os
import sqlite3
from statistics import median
from typing import Optional

import geopandas as gpd
import pandas as pd

# ── Diretórios ─────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS_DIR  = os.path.join(BASE_DIR, "dados")
GPKG_PATH  = os.path.join(DADOS_DIR, "Jacarei_setores_malha.gpkg")
OUTPUT_DIR = os.path.join(BASE_DIR, "frontend", "public")

SALES_DB_PATH  = os.path.join(DADOS_DIR, "vivareal_jacarei_20260324.db")
RENTAL_DB_PATH = os.path.join(DADOS_DIR, "vivareal_rental_20260324.db")

OUTPUT_SETOR_PATH  = os.path.join(OUTPUT_DIR, "vivareal_por_setor.json")
OUTPUT_MERCADO_PATH = os.path.join(OUTPUT_DIR, "vivareal_mercado.json")

# ── Constantes (mesmas do frontend/utils/constants.ts) ────────────────────────
IPCA_CORRECAO       = 1.1665   # correção acumulada ago/2022 → fev/2026
RENDA_MULTIPLIER    = 1.5      # renda domiciliar = renda responsável × 1,5
MAX_PROPERTY_FACTOR = 42       # valor_max = renda_familiar × 42
ABSORPTION_FACTOR   = 4        # demanda efetiva = domicílios / 4

# Tipos residenciais aceitos
RESIDENTIAL_TYPES = {
    "HOME", "APARTMENT", "CONDOMINIUM",
    "PENTHOUSE", "FLAT", "TWO_STORY_HOUSE",
}

# Limites de outliers
SALE_MIN, SALE_MAX    = 30_000,   30_000_000
RENTAL_MIN, RENTAL_MAX = 200,    50_000
PRICE_M2_SALE_MIN,   PRICE_M2_SALE_MAX   = 500,  50_000   # R$/m² para venda
PRICE_M2_RENTAL_MIN, PRICE_M2_RENTAL_MAX = 5,    2_000    # R$/m²/mês para aluguel

# 10 faixas de mercado (min inclusivo, max exclusivo)
MARKET_BRACKETS: list[dict] = [
    {"label": "Econômico",   "min": 0,         "max": 150_000},
    {"label": "Standard",    "min": 150_000,    "max": 250_000},
    {"label": "Médio-Baixo", "min": 250_000,    "max": 350_000},
    {"label": "Médio",       "min": 350_000,    "max": 500_000},
    {"label": "Médio-Alto",  "min": 500_000,    "max": 700_000},
    {"label": "Alto",        "min": 700_000,    "max": 1_000_000},
    {"label": "Alto A",      "min": 1_000_000,  "max": 1_500_000},
    {"label": "Alto AA",     "min": 1_500_000,  "max": 2_500_000},
    {"label": "Luxo",        "min": 2_500_000,  "max": 5_000_000},
    {"label": "Super Luxo",  "min": 5_000_000,  "max": float("inf")},
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def bracket_index(value: float) -> int:
    """Retorna o índice da faixa de mercado para um dado valor de imóvel."""
    for i, b in enumerate(MARKET_BRACKETS):
        if value < b["max"]:
            return i
    return len(MARKET_BRACKETS) - 1


def safe_median(values: list[float]) -> Optional[float]:
    vals = [v for v in values if v and v > 0]
    return round(median(vals)) if vals else None


def load_and_filter_residential(db_path: str, is_rental: bool) -> pd.DataFrame:
    """Carrega e filtra imóveis residenciais do banco SQLite."""
    price_col = "rental_price" if is_rental else "sale_price"
    price_min = RENTAL_MIN if is_rental else SALE_MIN
    price_max = RENTAL_MAX if is_rental else SALE_MAX

    q = f"""
        SELECT id, external_id, hash, property_type, usage_type,
               neighborhood, lat, lon,
               sale_price, rental_price, usable_area_m2,
               updated_at
        FROM listings
        WHERE {price_col} BETWEEN {price_min} AND {price_max}
          AND property_type IN ({','.join('?' * len(RESIDENTIAL_TYPES))})
    """
    if is_rental:
        q += " AND city = 'Jacareí'"

    with sqlite3.connect(db_path) as conn:
        df = pd.read_sql_query(q, conn, params=list(RESIDENTIAL_TYPES))

    # Coordenadas (0, 0) → NaN
    df.loc[(df["lat"] == 0) | (df["lon"] == 0), ["lat", "lon"]] = None

    return df


def deduplicate(df: pd.DataFrame, price_col: str) -> pd.DataFrame:
    """
    Remove duplicatas: mantém o registro mais recente para cada combinação
    (external_id não-nulo, preço, neighborhood, property_type, bedrooms, usable_area_m2).
    Para external_id nulo usa hash para identificar duplicatas.
    """
    df = df.copy()
    df["updated_at"] = pd.to_datetime(df["updated_at"], errors="coerce", utc=True)

    # Grupo 1: external_id preenchido
    has_ext = df["external_id"].notna() & (df["external_id"].str.strip() != "")
    df_ext = df[has_ext].copy()
    if not df_ext.empty:
        key_cols = ["external_id", price_col, "neighborhood", "property_type", "usable_area_m2"]
        df_ext = (
            df_ext
            .sort_values("updated_at", ascending=False, na_position="last")
            .drop_duplicates(subset=key_cols, keep="first")
        )

    # Grupo 2: external_id ausente — usa hash
    df_noext = df[~has_ext].copy()
    if not df_noext.empty:
        df_noext = df_noext.drop_duplicates(subset=["hash"], keep="first")

    return pd.concat([df_ext, df_noext], ignore_index=True)


def remove_price_m2_outliers(df: pd.DataFrame, price_col: str, is_rental: bool = False) -> pd.DataFrame:
    """Remove outliers de preço por m² quando área disponível."""
    p_min = PRICE_M2_RENTAL_MIN if is_rental else PRICE_M2_SALE_MIN
    p_max = PRICE_M2_RENTAL_MAX if is_rental else PRICE_M2_SALE_MAX
    mask_area = df["usable_area_m2"].notna() & (df["usable_area_m2"] > 0)
    price_m2 = df.loc[mask_area, price_col] / df.loc[mask_area, "usable_area_m2"]
    valid = mask_area & price_m2.between(p_min, p_max, inclusive="both")
    no_area = ~mask_area
    return df[valid | no_area].copy()


# ── Atribuição espacial ─────────────────────────────────────────────────────────

def assign_sectors(
    df: pd.DataFrame,
    gdf_sectors: gpd.GeoDataFrame,
) -> pd.DataFrame:
    """
    Atribui CD_SETOR a cada imóvel.
    - Imóveis com coordenadas: spatial join direto.
    - Imóveis sem coordenadas: distribuição proporcional pelo bairro
      com base nos imóveis geocodificados.
    """
    df = df.copy()
    df["CD_SETOR"] = None

    # ── Imóveis COM coordenadas ──────────────────────────────────────────────
    mask_coords = df["lat"].notna() & df["lon"].notna()
    df_geo = df[mask_coords].copy()

    if not df_geo.empty:
        from shapely.geometry import Point
        gdf_pts = gpd.GeoDataFrame(
            df_geo,
            geometry=[Point(lon, lat) for lat, lon in zip(df_geo["lat"], df_geo["lon"])],
            crs="EPSG:4326",
        )
        # Renomear coluna do setor para evitar conflito (left/right) no sjoin
        gdf_join = gdf_sectors[["CD_SETOR", "geometry"]].rename(
            columns={"CD_SETOR": "_CD_SETOR_right"}
        )
        joined = gpd.sjoin(gdf_pts, gdf_join, how="left", predicate="within")
        # Resultado pode ter múltiplas linhas por ponto (borda); pegar a primeira
        joined = joined[~joined.index.duplicated(keep="first")]
        df.loc[mask_coords, "CD_SETOR"] = joined["_CD_SETOR_right"].values

    # ── Mapeamento bairro → setores (proporcional) ───────────────────────────
    geocoded = df[mask_coords & df["CD_SETOR"].notna() & (df["CD_SETOR"].astype(str).str.strip() != "")].copy()
    neighborhood_map: dict[str, dict[str, float]] = {}  # bairro → {setor: proporção}

    if not geocoded.empty:
        grp = geocoded.groupby(["neighborhood", "CD_SETOR"]).size().reset_index(name="count")
        for nbhd, sub in grp.groupby("neighborhood"):
            total = sub["count"].sum()
            neighborhood_map[str(nbhd)] = {
                row["CD_SETOR"]: row["count"] / total
                for _, row in sub.iterrows()
            }

    # ── Imóveis SEM coordenadas ──────────────────────────────────────────────
    mask_no_coords = ~mask_coords
    df_no_geo = df[mask_no_coords].copy()

    if not df_no_geo.empty:
        import random
        rng = random.Random(42)

        assigned_sectors: list[Optional[str]] = []
        for _, row in df_no_geo.iterrows():
            nbhd = str(row.get("neighborhood", ""))
            prop_map = neighborhood_map.get(nbhd)
            if prop_map:
                sectors = list(prop_map.keys())
                weights = list(prop_map.values())
                setor = rng.choices(sectors, weights=weights, k=1)[0]
            else:
                setor = None  # bairro sem geocodificados → sem setor
            assigned_sectors.append(setor)

        df.loc[mask_no_coords, "CD_SETOR"] = assigned_sectors

    return df


# ── Agregação por setor ─────────────────────────────────────────────────────────

def aggregate_by_sector(
    df_sale: pd.DataFrame,
    df_rental: pd.DataFrame,
) -> dict[str, dict]:
    """Agrega métricas por setor censitário."""
    all_sectors: set[str] = set()
    for df in (df_sale, df_rental):
        valid = df["CD_SETOR"].notna()
        all_sectors.update(df.loc[valid, "CD_SETOR"].unique())

    result: dict[str, dict] = {}

    for setor in all_sectors:
        s_sale   = df_sale[df_sale["CD_SETOR"] == setor]
        s_rental = df_rental[df_rental["CD_SETOR"] == setor]

        # Preço por m² (venda)
        sale_with_area = s_sale[s_sale["usable_area_m2"].notna() & (s_sale["usable_area_m2"] > 0)]
        pm2_sale_vals = (sale_with_area["sale_price"] / sale_with_area["usable_area_m2"]).tolist()

        # Preço por m² (aluguel)
        rent_with_area = s_rental[s_rental["usable_area_m2"].notna() & (s_rental["usable_area_m2"] > 0)]
        pm2_rent_vals = (rent_with_area["rental_price"] / rent_with_area["usable_area_m2"]).tolist()

        entry: dict = {}
        cs = len(s_sale)
        cr = len(s_rental)
        msp = safe_median(s_sale["sale_price"].tolist())
        mrp = safe_median(s_rental["rental_price"].tolist())
        mpm2s = safe_median(pm2_sale_vals)
        mpm2r = safe_median(pm2_rent_vals)
        mua = safe_median((s_sale["usable_area_m2"].dropna().tolist()
                           + s_rental["usable_area_m2"].dropna().tolist()))

        # Supply by bracket (distribuição de anúncios de venda por faixa de preço)
        sb = [0] * len(MARKET_BRACKETS)
        for price in s_sale["sale_price"].dropna():
            sb[bracket_index(float(price))] += 1

        if cs > 0: entry["cs"] = cs
        if cr > 0: entry["cr"] = cr
        if msp: entry["msp"] = msp
        if mrp: entry["mrp"] = mrp
        if mpm2s: entry["mpm2s"] = mpm2s
        if mpm2r: entry["mpm2r"] = mpm2r
        if mua: entry["mua"] = mua
        # sb: array compacto com a oferta por faixa (omitir se tudo zero)
        if any(v > 0 for v in sb):
            entry["sb"] = sb

        if entry:
            result[setor] = entry

    return result


# ── Análise de Mercado (Demanda × Oferta) ─────────────────────────────────────

def compute_market_analysis(
    df_sale: pd.DataFrame,
    geojson_path: str,
) -> dict:
    """
    Calcula Demanda (do censo) × Oferta (do VivaReal) por faixa de preço.
    """
    n_brackets = len(MARKET_BRACKETS)
    demand_by_bracket = [0.0] * n_brackets
    supply_by_bracket = [0]   * n_brackets

    # ── Demanda (dados censitários do GeoJSON) ─────────────────────────────
    with open(geojson_path, encoding="utf-8") as f:
        geojson = json.load(f)

    for feature in geojson.get("features", []):
        props = feature.get("properties", {})
        v06001 = props.get("V06001")  # responsáveis com renda declarada
        v06004 = props.get("V06004")  # renda média nominal
        if not v06001 or not v06004:
            continue
        v06001 = float(v06001)
        v06004 = float(v06004)
        if v06001 <= 0 or v06004 <= 0:
            continue
        renda_corrigida = v06004 * IPCA_CORRECAO
        renda_familiar  = renda_corrigida * RENDA_MULTIPLIER
        valor_maximo    = renda_familiar * MAX_PROPERTY_FACTOR
        demanda         = v06001 / ABSORPTION_FACTOR
        idx = bracket_index(valor_maximo)
        demand_by_bracket[idx] += demanda

    # ── Oferta (imóveis de venda) ──────────────────────────────────────────
    for price in df_sale["sale_price"].dropna():
        idx = bracket_index(float(price))
        supply_by_bracket[idx] += 1

    # ── Montar resultado ──────────────────────────────────────────────────
    brackets_out = []
    for i, b in enumerate(MARKET_BRACKETS):
        demand  = round(demand_by_bracket[i], 1)
        supply  = supply_by_bracket[i]
        gap     = round(demand - supply, 1)
        max_str = f"R$ {b['max']:,.0f}".replace(",", ".") if b["max"] != float("inf") else "Acima"
        brackets_out.append({
            "label":     b["label"],
            "min":       b["min"],
            "max":       None if b["max"] == float("inf") else b["max"],
            "max_label": max_str,
            "demand":    demand,
            "supply":    supply,
            "gap":       gap,
        })

    # ── Sumário ───────────────────────────────────────────────────────────
    sale_prices = df_sale["sale_price"].dropna().tolist()
    rental_prices_all = df_sale["rental_price"].dropna().tolist()

    # Buscar aluguel do arquivo de rental
    # (passado externamente via df_rental_all)
    summary = {
        "total_sale":           len(df_sale),
        "median_sale_price":    safe_median(sale_prices),
        "total_demand":         round(sum(demand_by_bracket), 1),
        "total_supply":         len(df_sale),
    }

    return {"brackets": brackets_out, "summary": summary}


def compute_rental_summary(df_rental: pd.DataFrame) -> dict:
    """Sumário de aluguel para o JSON de mercado."""
    prices = df_rental["rental_price"].dropna().tolist()
    pm2 = []
    for _, row in df_rental.iterrows():
        if row.get("usable_area_m2") and row["usable_area_m2"] > 0:
            pm2.append(row["rental_price"] / row["usable_area_m2"])
    return {
        "total_rental":         len(df_rental),
        "median_rental_price":  safe_median(prices),
        "median_rental_pm2":    safe_median(pm2),
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    import datetime

    geojson_path = os.path.join(OUTPUT_DIR, "jacarei_setores_merged.geojson")
    if not os.path.exists(geojson_path):
        raise FileNotFoundError(
            f"GeoJSON não encontrado: {geojson_path}\n"
            "Execute primeiro: python scripts/preprocess.py"
        )

    print("Carregando malha de setores (GPKG)...")
    gdf_sectors = gpd.read_file(GPKG_PATH)
    # Normalizar CRS e coluna chave
    if gdf_sectors.crs is None or gdf_sectors.crs.to_epsg() != 4326:
        gdf_sectors = gdf_sectors.to_crs(epsg=4326)
    cols_lower = {c: c.upper() for c in gdf_sectors.columns if c.lower() == "cd_setor"}
    if cols_lower:
        gdf_sectors = gdf_sectors.rename(columns=cols_lower)
    print(f"  {len(gdf_sectors)} setores carregados.")

    # ── Carregar imóveis ─────────────────────────────────────────────────────
    print("\nCarregando imóveis de venda...")
    df_sale_raw = load_and_filter_residential(SALES_DB_PATH, is_rental=False)
    print(f"  {len(df_sale_raw)} imóveis residenciais de venda (antes dedup).")

    print("Carregando imóveis de aluguel (Jacareí)...")
    df_rental_raw = load_and_filter_residential(RENTAL_DB_PATH, is_rental=True)
    print(f"  {len(df_rental_raw)} imóveis residenciais de aluguel (antes dedup).")

    # ── Deduplicação ─────────────────────────────────────────────────────────
    print("\nDeduplicando...")
    df_sale   = deduplicate(df_sale_raw,   "sale_price")
    df_rental = deduplicate(df_rental_raw, "rental_price")
    df_sale   = remove_price_m2_outliers(df_sale,   "sale_price",   is_rental=False)
    df_rental = remove_price_m2_outliers(df_rental, "rental_price", is_rental=True)
    print(f"  Venda após dedup/filtro: {len(df_sale)}")
    print(f"  Aluguel após dedup/filtro: {len(df_rental)}")

    # ── Atribuição espacial ───────────────────────────────────────────────────
    print("\nAtribuindo imóveis a setores censitários...")
    df_sale   = assign_sectors(df_sale,   gdf_sectors)
    df_rental = assign_sectors(df_rental, gdf_sectors)
    sale_with_setor   = df_sale["CD_SETOR"].notna().sum()
    rental_with_setor = df_rental["CD_SETOR"].notna().sum()
    print(f"  Venda com setor: {sale_with_setor}/{len(df_sale)} "
          f"({100*sale_with_setor/max(len(df_sale),1):.1f}%)")
    print(f"  Aluguel com setor: {rental_with_setor}/{len(df_rental)} "
          f"({100*rental_with_setor/max(len(df_rental),1):.1f}%)")

    # ── Agregação por setor ──────────────────────────────────────────────────
    print("\nAgregando por setor...")
    setor_data = aggregate_by_sector(df_sale, df_rental)
    print(f"  {len(setor_data)} setores com dados imobiliários.")

    # ── Análise de mercado ────────────────────────────────────────────────────
    print("\nCalculando análise Demanda × Oferta...")
    market = compute_market_analysis(df_sale, geojson_path)
    rental_summary = compute_rental_summary(df_rental)

    # Combinar sumários
    sale_pm2_vals: list[float] = []
    for _, row in df_sale.iterrows():
        if row.get("usable_area_m2") and row["usable_area_m2"] > 0:
            sale_pm2_vals.append(row["sale_price"] / row["usable_area_m2"])

    market["summary"].update(rental_summary)
    market["summary"]["median_sale_pm2"] = safe_median(sale_pm2_vals)

    mercado_json = {
        "metadata": {
            "total_sale":          len(df_sale),
            "total_rental":        len(df_rental),
            "sale_with_setor":     int(sale_with_setor),
            "rental_with_setor":   int(rental_with_setor),
            "absorption_factor":   ABSORPTION_FACTOR,
            "income_multiplier":   RENDA_MULTIPLIER,
            "max_property_factor": MAX_PROPERTY_FACTOR,
            "ipca_correction":     IPCA_CORRECAO,
            "generated_at":        datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "residential_types":   sorted(RESIDENTIAL_TYPES),
        },
        "brackets": market["brackets"],
        "summary":  market["summary"],
    }

    # ── Gravar outputs ────────────────────────────────────────────────────────
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"\nGravando {OUTPUT_SETOR_PATH}...")
    with open(OUTPUT_SETOR_PATH, "w", encoding="utf-8") as f:
        json.dump(setor_data, f, ensure_ascii=False, separators=(",", ":"))
    size_kb = os.path.getsize(OUTPUT_SETOR_PATH) / 1024
    print(f"  {size_kb:.1f} KB — {len(setor_data)} setores")

    print(f"\nGravando {OUTPUT_MERCADO_PATH}...")
    with open(OUTPUT_MERCADO_PATH, "w", encoding="utf-8") as f:
        json.dump(mercado_json, f, ensure_ascii=False, indent=2)
    size_kb = os.path.getsize(OUTPUT_MERCADO_PATH) / 1024
    print(f"  {size_kb:.1f} KB")

    # ── Resumo da análise ─────────────────────────────────────────────────────
    print("\n── Análise Demanda × Oferta ─────────────────────────────────")
    print(f"  {'Faixa':<12}  {'Demanda':>8}  {'Oferta':>8}  {'Saldo':>8}")
    for b in mercado_json["brackets"]:
        saldo = b["gap"]
        sinal = "+" if saldo > 0 else ""
        print(f"  {b['label']:<12}  {b['demand']:>8.1f}  {b['supply']:>8}  {sinal}{saldo:>7.1f}")

    print(f"\n  Demanda total: {market['summary']['total_demand']:,.1f} domicílios")
    print(f"  Oferta total:  {market['summary']['total_supply']:,} anúncios")
    print("\nPré-processamento VivaReal concluído com sucesso!")


if __name__ == "__main__":
    main()
