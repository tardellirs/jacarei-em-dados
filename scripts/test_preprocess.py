"""Testes unitários para as funções auxiliares do preprocess.py."""

import pandas as pd
import pytest

from preprocess import clean_column, load_and_filter_csv, JACAREI_PREFIX

import os
import tempfile


class TestCleanColumn:
    def test_replaces_x_with_zero(self):
        s = pd.Series(["10", "X", "20"])
        result = clean_column(s)
        assert list(result) == [10, 0, 20]

    def test_strips_whitespace(self):
        s = pd.Series([" 5 ", "  10  "])
        result = clean_column(s)
        assert list(result) == [5, 10]

    def test_handles_empty_string_as_zero(self):
        s = pd.Series(["", "7"])
        result = clean_column(s)
        assert list(result) == [0, 7]

    def test_returns_int_dtype(self):
        s = pd.Series(["1", "2", "3"])
        result = clean_column(s)
        assert result.dtype == int


class TestLoadAndFilterCsv:
    def _write_csv(self, tmpdir, filename, content):
        path = os.path.join(tmpdir, filename)
        with open(path, "w") as f:
            f.write(content)
        return path

    def test_filters_national_csv_to_jacarei(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_content = (
                '"CD_SETOR";"V01317";"V01318"\n'
                '"352440205000001";"100";"50"\n'
                '"110001505000002";"200";"80"\n'
            )
            path = self._write_csv(tmpdir, "test.csv", csv_content)
            df = load_and_filter_csv(path, "CD_SETOR", ["V01317", "V01318"], national=True)
            assert len(df) == 1
            assert df.iloc[0]["CD_SETOR"].startswith(JACAREI_PREFIX)

    def test_does_not_filter_local_csv(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_content = (
                '"CD_setor";"V01006"\n'
                '"352440205000001";"211"\n'
                '"352440205000002";"150"\n'
            )
            path = self._write_csv(tmpdir, "test.csv", csv_content)
            df = load_and_filter_csv(path, "CD_setor", ["V01006"], national=False)
            assert len(df) == 2

    def test_cleans_x_values(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_content = (
                '"CD_SETOR";"V01317"\n'
                '"352440205000001";"X"\n'
            )
            path = self._write_csv(tmpdir, "test.csv", csv_content)
            df = load_and_filter_csv(path, "CD_SETOR", ["V01317"], national=True)
            assert df.iloc[0]["V01317"] == 0

    def test_normalizes_key_column(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_content = (
                '"CD_setor";"V00748"\n'
                '"352440205000001";"50"\n'
            )
            path = self._write_csv(tmpdir, "test.csv", csv_content)
            df = load_and_filter_csv(path, "CD_setor", ["V00748"], national=True)
            assert "CD_SETOR" in df.columns
            assert "CD_setor" not in df.columns
