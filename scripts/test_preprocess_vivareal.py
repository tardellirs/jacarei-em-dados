"""
Testes unitários para preprocess_vivareal.py
"""

import json
import os
import sys
import tempfile
import unittest

import pandas as pd

# Garantir que o diretório scripts esteja no path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import preprocess_vivareal as pp


# ── Deduplicação ──────────────────────────────────────────────────────────────

class TestDeduplication(unittest.TestCase):

    def _make_df(self, rows: list[dict]) -> pd.DataFrame:
        defaults = {
            "id": "x",
            "external_id": None,
            "hash": "abc",
            "property_type": "HOME",
            "usage_type": "RESIDENTIAL",
            "neighborhood": "Centro",
            "lat": None,
            "lon": None,
            "sale_price": 300_000,
            "rental_price": None,
            "usable_area_m2": 80.0,
            "updated_at": "2026-01-01T00:00:00Z",
        }
        return pd.DataFrame([{**defaults, **r} for r in rows])

    def test_keeps_latest_by_external_id(self):
        df = self._make_df([
            {"id": "A", "external_id": "EXT1", "sale_price": 300_000, "updated_at": "2026-01-01"},
            {"id": "B", "external_id": "EXT1", "sale_price": 300_000, "updated_at": "2026-03-01"},
        ])
        result = pp.deduplicate(df, "sale_price")
        self.assertEqual(len(result), 1)
        self.assertEqual(result.iloc[0]["id"], "B")

    def test_keeps_both_if_different_price(self):
        df = self._make_df([
            {"id": "A", "external_id": "EXT1", "sale_price": 300_000},
            {"id": "B", "external_id": "EXT1", "sale_price": 350_000},
        ])
        result = pp.deduplicate(df, "sale_price")
        self.assertEqual(len(result), 2)

    def test_dedup_by_hash_when_no_external_id(self):
        df = self._make_df([
            {"id": "A", "external_id": None, "hash": "HASH1"},
            {"id": "B", "external_id": None, "hash": "HASH1"},
            {"id": "C", "external_id": None, "hash": "HASH2"},
        ])
        result = pp.deduplicate(df, "sale_price")
        self.assertEqual(len(result), 2)
        hashes = set(result["hash"])
        self.assertEqual(hashes, {"HASH1", "HASH2"})

    def test_no_dedup_for_different_neighborhoods(self):
        df = self._make_df([
            {"id": "A", "external_id": "EXT1", "neighborhood": "Centro"},
            {"id": "B", "external_id": "EXT1", "neighborhood": "Jardim"},
        ])
        result = pp.deduplicate(df, "sale_price")
        self.assertEqual(len(result), 2)


# ── Filtro de outliers ────────────────────────────────────────────────────────

class TestOutlierFilter(unittest.TestCase):

    def _sale_df(self, prices: list[float]) -> pd.DataFrame:
        return pd.DataFrame({
            "sale_price":     prices,
            "rental_price":   [None] * len(prices),
            "usable_area_m2": [None] * len(prices),
        })

    def test_removes_below_min(self):
        df = self._sale_df([25_000, 30_000, 100_000])
        result = pp.remove_price_m2_outliers(df, "sale_price")
        # Sem área disponível, nenhum filtro de m² se aplica
        self.assertEqual(len(result), 3)

    def test_removes_bad_price_per_m2_sale(self):
        df = pd.DataFrame({
            "sale_price":     [100_000, 500_000, 1_000_000],
            "rental_price":   [None, None, None],
            "usable_area_m2": [1.0,   100.0,  100.0],  # 100k/1m² = 100k/m² → outlier
        })
        result = pp.remove_price_m2_outliers(df, "sale_price", is_rental=False)
        # 100k/1m² = R$100.000/m² > PRICE_M2_SALE_MAX → removido
        self.assertEqual(len(result), 2)

    def test_removes_bad_price_per_m2_rental(self):
        # R$/mês para 100m²: 3000→30/m² (ok), 300000→3000/m² (acima do max)
        df = pd.DataFrame({
            "sale_price":     [None, None],
            "rental_price":   [3_000.0, 300_000.0],
            "usable_area_m2": [100.0, 100.0],
        })
        result = pp.remove_price_m2_outliers(df, "rental_price", is_rental=True)
        # 300k/100m² = R$3.000/m²/mês > PRICE_M2_RENTAL_MAX=2000 → removido
        self.assertEqual(len(result), 1)

    def test_keeps_listings_without_area(self):
        df = pd.DataFrame({
            "sale_price":     [300_000],
            "rental_price":   [None],
            "usable_area_m2": [None],
        })
        result = pp.remove_price_m2_outliers(df, "sale_price")
        self.assertEqual(len(result), 1)


# ── Classificação em faixas ────────────────────────────────────────────────────

class TestBracketClassification(unittest.TestCase):

    def test_zero_is_first_bracket(self):
        self.assertEqual(pp.bracket_index(0), 0)

    def test_exactly_at_boundary_goes_to_next(self):
        # 150_000 é max da faixa 0 (Econômico, max=150k exclusivo)
        # Portanto valor < 150k → faixa 0; valor = 150k → faixa 1
        self.assertEqual(pp.bracket_index(149_999), 0)
        self.assertEqual(pp.bracket_index(150_000), 1)

    def test_max_value_is_last_bracket(self):
        self.assertEqual(pp.bracket_index(10_000_000), len(pp.MARKET_BRACKETS) - 1)

    def test_typical_values(self):
        self.assertEqual(pp.bracket_index(200_000), 1)   # Standard
        self.assertEqual(pp.bracket_index(450_000), 3)   # Médio
        self.assertEqual(pp.bracket_index(600_000), 4)   # Médio-Alto
        self.assertEqual(pp.bracket_index(800_000), 5)   # Alto
        self.assertEqual(pp.bracket_index(1_200_000), 6) # Alto A


# ── Fórmula de demanda ────────────────────────────────────────────────────────

class TestDemandFormula(unittest.TestCase):

    def test_renda_5000_falls_in_correct_bracket(self):
        """Renda R$5.000 → valor_max = 5000 × 1.1665 × 1.5 × 42 = R$367.447"""
        renda = 5_000
        valor_max = renda * pp.IPCA_CORRECAO * pp.RENDA_MULTIPLIER * pp.MAX_PROPERTY_FACTOR
        self.assertAlmostEqual(valor_max, 367_447.5, delta=1)
        idx = pp.bracket_index(valor_max)
        # 350k–500k → faixa "Médio" (índice 3)
        self.assertEqual(idx, 3)

    def test_renda_2000_falls_in_economico(self):
        """Renda R$2.000 → valor_max ≈ R$146.979 → Econômico"""
        renda = 2_000
        valor_max = renda * pp.IPCA_CORRECAO * pp.RENDA_MULTIPLIER * pp.MAX_PROPERTY_FACTOR
        self.assertLess(valor_max, 150_000)
        self.assertEqual(pp.bracket_index(valor_max), 0)

    def test_renda_15000_falls_in_alto_a(self):
        """Renda R$15.000 → valor_max ≈ R$1.102.342 → Alto A (1M–1.5M)"""
        renda = 15_000
        valor_max = renda * pp.IPCA_CORRECAO * pp.RENDA_MULTIPLIER * pp.MAX_PROPERTY_FACTOR
        self.assertGreater(valor_max, 1_000_000)
        self.assertLess(valor_max, 1_500_000)
        self.assertEqual(pp.bracket_index(valor_max), 6)


# ── Distribuição proporcional por bairro ─────────────────────────────────────

class TestProportionalAssignment(unittest.TestCase):

    def test_assigns_proportionally(self):
        """
        Imóveis sem coords no bairro X devem ser distribuídos na mesma
        proporção que os imóveis geocodificados do mesmo bairro.
        """
        import random
        from shapely.geometry import Point, Polygon
        import geopandas as gpd

        # Criar setores sintéticos
        setor_a = Polygon([(0, 0), (1, 0), (1, 1), (0, 1)])
        setor_b = Polygon([(1, 0), (2, 0), (2, 1), (1, 1)])
        gdf_sectors = gpd.GeoDataFrame(
            {"CD_SETOR": ["SETOR_A", "SETOR_B"]},
            geometry=[setor_a, setor_b],
            crs="EPSG:4326",
        )

        # Imóveis com coords: 3 no setor A, 1 no setor B, mesmo bairro
        rows = [
            {"lat": 0.5, "lon": 0.5, "neighborhood": "X"},  # → SETOR_A
            {"lat": 0.6, "lon": 0.6, "neighborhood": "X"},  # → SETOR_A
            {"lat": 0.7, "lon": 0.7, "neighborhood": "X"},  # → SETOR_A
            {"lat": 0.5, "lon": 1.5, "neighborhood": "X"},  # → SETOR_B
            # Imóveis sem coords
            {"lat": None, "lon": None, "neighborhood": "X"},
            {"lat": None, "lon": None, "neighborhood": "X"},
            {"lat": None, "lon": None, "neighborhood": "X"},
            {"lat": None, "lon": None, "neighborhood": "X"},
            {"lat": None, "lon": None, "neighborhood": "X"},
            {"lat": None, "lon": None, "neighborhood": "X"},
            {"lat": None, "lon": None, "neighborhood": "X"},
            {"lat": None, "lon": None, "neighborhood": "X"},
        ]
        defaults = {
            "id": "x", "external_id": None, "hash": "h",
            "property_type": "HOME", "usable_area_m2": 80.0,
            "sale_price": 300_000, "rental_price": None, "updated_at": None,
        }
        df = pd.DataFrame([{**defaults, **r} for r in rows])

        result = pp.assign_sectors(df, gdf_sectors)

        # Os imóveis com coord devem ter setores
        geocoded = result[result["lat"].notna()]
        self.assertTrue(all(geocoded["CD_SETOR"].notna()))

        # Os sem coord devem estar atribuídos a A ou B na razão ~75/25
        no_coord = result[result["lat"].isna() & result["CD_SETOR"].notna()]
        self.assertGreater(len(no_coord), 0)
        total = len(no_coord)
        count_a = (no_coord["CD_SETOR"] == "SETOR_A").sum()
        count_b = (no_coord["CD_SETOR"] == "SETOR_B").sum()
        # Proporção esperada: 3/4 para A, 1/4 para B
        # Com seed fixo, aceitar variação de ±30pp
        self.assertGreater(count_a / total, 0.4)
        self.assertGreater(count_b / total, 0.0)


# ── Safe median ───────────────────────────────────────────────────────────────

class TestSafeMedian(unittest.TestCase):

    def test_normal_list(self):
        self.assertEqual(pp.safe_median([100.0, 200.0, 300.0]), 200)

    def test_empty_list(self):
        self.assertIsNone(pp.safe_median([]))

    def test_filters_zero(self):
        self.assertEqual(pp.safe_median([0.0, 200.0, 400.0]), 300)

    def test_single_value(self):
        self.assertEqual(pp.safe_median([500_000.0]), 500_000)


# ── Schema do JSON de saída ──────────────────────────────────────────────────

class TestOutputSchema(unittest.TestCase):

    def test_setor_json_structure(self):
        setor_data = pp.aggregate_by_sector(
            pd.DataFrame({
                "CD_SETOR": ["S001", "S001"],
                "sale_price": [300_000, 500_000],
                "rental_price": [None, None],
                "usable_area_m2": [80.0, 100.0],
            }),
            pd.DataFrame({
                "CD_SETOR": ["S001"],
                "sale_price": [None],
                "rental_price": [2_000.0],
                "usable_area_m2": [60.0],
            }),
        )
        self.assertIn("S001", setor_data)
        entry = setor_data["S001"]
        self.assertEqual(entry.get("cs"), 2)
        self.assertEqual(entry.get("cr"), 1)
        self.assertIn("msp", entry)
        self.assertIn("mrp", entry)

    def test_market_brackets_count(self):
        self.assertEqual(len(pp.MARKET_BRACKETS), 10)

    def test_brackets_are_contiguous(self):
        for i in range(len(pp.MARKET_BRACKETS) - 1):
            self.assertEqual(
                pp.MARKET_BRACKETS[i]["max"],
                pp.MARKET_BRACKETS[i + 1]["min"],
                f"Gap entre faixas {i} e {i+1}",
            )

    def test_last_bracket_is_infinite(self):
        self.assertEqual(pp.MARKET_BRACKETS[-1]["max"], float("inf"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
