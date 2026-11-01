#!/usr/bin/env python3
"""Integra los series.csv de los tres frentes, valida el contrato y arma la tabla anual.

Uso: python3 -I integrar.py
Salidas:
  01_base/series-integradas.csv   (todas las filas válidas, con columna 'frente')
  02_cruces/validacion.md         (errores de contrato, conteos por calidad)
  02_cruces/tabla-anual.csv       (pivot año x serie_id, solo periodos anuales YYYY)
"""
import csv, os, re, sys
from collections import Counter, defaultdict

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRENTES = ["oferta", "demanda", "precios-financiamiento", "integracion"]
COLS = ["serie_id","variable","unidad","geografia","segmento","periodo","valor",
        "fuente_id","url","localizador","fecha_corte","fecha_consulta","calidad","nota"]
CALIDADES = {"observado","declarado","prensa","estimado","por verificar"}
GEOS = {"municipio Hermosillo","ciudad Hermosillo (ENOE)","ZM Hermosillo","Sonora","nacional"}
PERIODO = re.compile(r"^\d{4}(-(0[1-9]|1[0-2])|-Q[1-4])?$")

def leer(frente):
    ruta = os.path.join(RAIZ, "01_base", frente, "series.csv")
    if not os.path.exists(ruta):
        return None, [f"{frente}: no existe series.csv"]
    errores, filas = [], []
    with open(ruta, newline="", encoding="utf-8-sig") as f:
        r = csv.DictReader(f)
        faltan = [c for c in COLS if c not in (r.fieldnames or [])]
        if faltan:
            errores.append(f"{frente}: faltan columnas {faltan}; encontradas {r.fieldnames}")
        for i, fila in enumerate(r, start=2):
            fila = {k: (v or "").strip() for k, v in fila.items() if k}
            fila["frente"] = frente
            p = []
            if not fila.get("serie_id"): p.append("serie_id vacío")
            if fila.get("calidad") not in CALIDADES: p.append(f"calidad inválida '{fila.get('calidad')}'")
            if fila.get("geografia") not in GEOS: p.append(f"geografia no normalizada '{fila.get('geografia')}'")
            if not PERIODO.match(fila.get("periodo","")): p.append(f"periodo inválido '{fila.get('periodo')}'")
            v = fila.get("valor","").replace(",", "")
            try:
                fila["valor_num"] = float(v)
            except ValueError:
                if fila.get("calidad") == "por verificar":
                    fila["valor_num"] = None
                else:
                    p.append(f"valor no numérico '{fila.get('valor')}'")
            if fila.get("calidad") != "por verificar":
                if not fila.get("url","").startswith("http"): p.append("sin URL")
                if len(fila.get("localizador","")) < 4: p.append("localizador vacío")
            if p:
                errores.append(f"{frente} fila {i} ({fila.get('serie_id')}, {fila.get('periodo')}): " + "; ".join(p))
            filas.append(fila)
    return filas, errores

def main():
    todas, reporte = [], ["# Validación de integración", ""]
    for fr in FRENTES:
        filas, errs = leer(fr)
        if filas is None:
            reporte.append(f"- **{fr}**: sin archivo todavía")
            continue
        c = Counter(f.get("calidad") for f in filas)
        reporte.append(f"- **{fr}**: {len(filas)} filas · " + ", ".join(f"{k}: {v}" for k, v in sorted(c.items())) + f" · errores de contrato: {len(errs)}")
        for e in errs:
            reporte.append(f"  - {e}")
        todas.extend(filas)
    if not todas:
        print("\n".join(reporte)); return
    # series integradas
    out = os.path.join(RAIZ, "01_base", "series-integradas.csv")
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["frente"] + COLS, extrasaction="ignore")
        w.writeheader()
        for fila in todas:
            w.writerow(fila)
    # inventario de series
    reporte += ["", "## Series por frente (serie_id · geografía · segmento · periodos · calidades)"]
    por_serie = defaultdict(list)
    for fila in todas:
        por_serie[(fila["frente"], fila["serie_id"])].append(fila)
    for (fr, sid), filas in sorted(por_serie.items()):
        per = sorted({f["periodo"] for f in filas})
        cal = Counter(f["calidad"] for f in filas)
        geo = sorted({f["geografia"] for f in filas}); seg = sorted({f["segmento"] for f in filas})
        reporte.append(f"- {fr} · `{sid}` · {'/'.join(geo)} · {'/'.join(seg)} · {per[0]}…{per[-1]} ({len(per)}) · " + ", ".join(f"{k} {v}" for k, v in cal.items()))
    # tabla anual
    anuales = [f for f in todas if re.fullmatch(r"\d{4}", f["periodo"]) and f.get("valor_num") is not None]
    series_ids = sorted({f["serie_id"] for f in anuales})
    anios = sorted({f["periodo"] for f in anuales})
    tabla = defaultdict(dict)
    for f in anuales:
        key = f["serie_id"] if f["segmento"] in ("n/a","total","nueva") else f"{f['serie_id']}[{f['segmento']}]"
        if f["geografia"] != "municipio Hermosillo": key += "{" + f["geografia"] + "}"
        tabla[f["periodo"]][key] = f["valor_num"]
    cols = sorted({k for a in tabla.values() for k in a})
    with open(os.path.join(RAIZ, "02_cruces", "tabla-anual.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["anio"] + cols)
        for a in anios:
            w.writerow([a] + [tabla[a].get(c, "") for c in cols])
    reporte += ["", f"Tabla anual: {len(anios)} años × {len(cols)} series → 02_cruces/tabla-anual.csv"]
    with open(os.path.join(RAIZ, "02_cruces", "validacion.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(reporte) + "\n")
    print("\n".join(reporte))

if __name__ == "__main__":
    main()
