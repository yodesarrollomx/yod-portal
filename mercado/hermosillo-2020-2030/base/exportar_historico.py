#!/usr/bin/env python3
"""Export a reviewable, current public CSV from the normalized Datos tab."""
import argparse
from calendar import monthrange
import csv
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path
import re
import tempfile
from urllib.parse import parse_qsl, urlsplit

FIELDS = (
    "serie_id", "indicador", "valor", "unidad", "periodo", "frecuencia", "geografia",
    "nivel_geo", "segmento", "naturaleza", "fuente", "url", "referencia", "estado",
)
PRIMARY_DOMAINS = ("gob.mx", "inegi.org.mx", "banxico.org.mx", "infonavit.org.mx", "ruv.org.mx")
PUBLIC_LEVELS = {"municipio", "ciudad", "zona metropolitana", "entidad", "estado", "país", "zona catastral", "tramo vial"}
LAMUDI_PRICES = {
    "Precio unitario mediano anunciado de venta": ("https://www.lamudi.com.mx/precios-inmuebles/venta/sonora/hermosillo/", "MXN/m²", "venta"),
    "Precio unitario mediano anunciado de renta": ("https://www.lamudi.com.mx/precios-inmuebles/renta/sonora/hermosillo/", "MXN/m²/mes", "renta"),
}
PRIVATE_QUERY = {"access_token", "api_key", "apikey", "auth", "key", "password", "secret", "token"}
EXCLUDED = re.compile(r"escenario|proyec|pron[oó]st|supuest|estimad|derivad|anunci|meta\b|prueba", re.I)
PERIOD = re.compile(r"(\d{4})(?:-(?:[QT]([1-4])|(\d{2})(?:-(\d{2}))?))?", re.I)
NUMBER = re.compile(r"[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?(?:e[+-]?\d+)?", re.I)


def period_end(period, annual_schedule=False):
    match = PERIOD.fullmatch(period)
    if not match:
        return None
    year, quarter, month, day = match.groups()
    try:
        year = int(year)
        if not any((quarter, month, day)) and annual_schedule:
            return date(year, 1, 1)
        month = int(quarter) * 3 if quarter else int(month or 12)
        return date(year, month, int(day) if day else monthrange(year, month)[1])
    except ValueError:
        return None


def official_source(url):
    try:
        parsed = urlsplit(url)
        host = parsed.hostname or ""
        return (
            parsed.scheme == "https" and not parsed.username and not parsed.password
            and parsed.port in (None, 443)
            and any(host == domain or host.endswith("." + domain) for domain in PRIMARY_DOMAINS)
            and not any(key.casefold() in PRIVATE_QUERY for key, _ in parse_qsl(parsed.query))
        )
    except ValueError:
        return False


def public_portal_price(row):
    definition = LAMUDI_PRICES.get(row["indicador"])
    if not definition or row["fuente"] != "Lamudi México":
        return False
    url, unit, operation = definition
    return (row["url"] == url and row["unidad"] == unit and row["frecuencia"] == "mensual"
            and row["geografia"] == "Hermosillo" and row["nivel_geo"] == "municipio"
            and row["segmento"] in {f"Casa · {operation}", f"Departamento · {operation}"})


def public_rows(rows, as_of):
    exported = set()
    for row in rows:
        if row.get("visibilidad", "").strip().casefold() != "publica":
            continue
        if row["estado"].strip().casefold() != "verificado":
            continue
        portal = public_portal_price(row)
        official = official_source(row["url"]) and not EXCLUDED.search(" ".join(row[key] for key in ("indicador", "naturaleza")))
        if not (portal or official):
            continue
        if row["nivel_geo"].strip().casefold() not in PUBLIC_LEVELS:
            continue
        annual_schedule = row["naturaleza"].strip().casefold() == "valor_catastral"
        end = period_end(row["periodo"], annual_schedule)
        if end is None or end > as_of:
            continue
        try:
            if not NUMBER.fullmatch(row["valor"].strip()):
                continue
            value = Decimal(row["valor"].strip().replace(",", ""))
        except InvalidOperation:
            continue
        if not value.is_finite() or not row["indicador"].strip() or not row["unidad"].strip():
            continue
        public_fields = {key: sheet_safe_text(row[key].strip()) for key in FIELDS}
        public_fields["valor"] = str(value)
        public_fields["referencia"] = "Histórico mensual · " + row["periodo"] if portal else ""
        record = tuple(public_fields[key] for key in FIELDS)
        if record not in exported:
            exported.add(record)
            yield record


def sheet_safe_text(text):
    return "'" + text if text.startswith(("=", "+", "-", "@")) else text


def export(source, destination, as_of):
    with source.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream, strict=True)
        if not set((*FIELDS, "visibilidad")).issubset(reader.fieldnames or ()):
            raise ValueError("El archivo debe usar la cabecera de la pestaña Datos.")
        rows = sorted(public_rows(reader, as_of), key=lambda row: (row[0], row[4], row[6], row[7], row[11], row[2]))
    if not rows:
        raise ValueError("Ninguna observación verificable pasó el filtro público.")
    with tempfile.NamedTemporaryFile(mode="w", dir=destination.parent, encoding="utf-8", newline="", delete=False) as target:
        temporary = Path(target.name)
        try:
            writer = csv.writer(target, lineterminator="\n")
            writer.writerow(FIELDS)
            writer.writerows(rows)
            target.close()
            temporary.replace(destination)
        finally:
            temporary.unlink(missing_ok=True)
    return len(rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("datos", type=Path, help="Exportación CSV de la pestaña Datos")
    parser.add_argument("salida", type=Path, help="Corte público CSV revisable")
    parser.add_argument("--corte", required=True, type=date.fromisoformat, help="Fecha límite ISO YYYY-MM-DD")
    args = parser.parse_args()
    print(f"{export(args.datos, args.salida, args.corte)} observaciones públicas")
