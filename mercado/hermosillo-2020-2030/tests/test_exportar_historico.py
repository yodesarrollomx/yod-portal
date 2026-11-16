"""Regression tests for the public export boundary."""
from datetime import date
from pathlib import Path
import sys
from unittest import TestCase

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "base"))
from exportar_historico import FIELDS, official_source, period_end, public_rows


class PublicScopeTest(TestCase):
    def test_publishes_only_verified_observations_with_official_sources(self):
        record = dict.fromkeys(FIELDS, "")
        record.update(indicador="Viviendas", valor="0", visibilidad="publica", estado="verificado",
                      unidad="viviendas", naturaleza="observación", frecuencia="anual", periodo="2025", nivel_geo="municipio",
                      url="https://sniiv.sedatu.gob.mx/api/data", referencia="@dato conservado")
        invalid = (
            {"visibilidad": "interna"},
            {"estado": "declarado"},
            {"naturaleza": "proyección de fuente"},
            {"indicador": "Meta de hogares"},
            {"periodo": "2026"},
            {"periodo": "2026-T4", "frecuencia": "trimestral"},
            {"valor": "1,73"},
            {"nivel_geo": "localidad"},
            {"url": "https://inegi.org.mx.ejemplo.test"},
            {"url": "https://www.inegi.org.mx/archivo?token=secreto"},
        )
        rows = [record, dict(record, nota="NO PUBLICAR"), *(dict(record, **change) for change in invalid)]
        result = list(public_rows(rows, date(2026, 11, 16)))
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0][FIELDS.index("valor")], "0")
        self.assertEqual(result[0][FIELDS.index("referencia")], "")
        self.assertNotIn("NO PUBLICAR", result[0])

    def test_periods_have_ended_and_sources_are_https(self):
        self.assertEqual(period_end("2024-02"), date(2024, 2, 29))
        self.assertEqual(period_end("2026", annual_schedule=True), date(2026, 1, 1))
        self.assertEqual(period_end("2025-Q3"), date(2025, 9, 30))
        self.assertIsNone(period_end("2025-02-29"))
        self.assertFalse(official_source("https://name@hermosillo.gob.mx:443"))
        self.assertFalse(official_source("http://www.inegi.org.mx/x"))
