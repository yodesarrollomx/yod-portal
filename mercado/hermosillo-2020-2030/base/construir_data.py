#!/usr/bin/env python3
"""Construye 03_visual/data.json a partir de 01_base/series-integradas.csv y 02_cruces/supuestos.csv.

Reglas: ningún número se escribe a mano aquí; todo sale de series.csv con su fuente.
Los puntos de equilibrio (P_t, Q_t) son derivados y quedan marcados como 'estimado' con fórmula.
"""
import csv, json, os, re
from collections import defaultdict

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RAIZ, "01_base", "series-integradas.csv")
OUT = os.path.join(RAIZ, "03_visual", "data.json")

rows = list(csv.DictReader(open(SRC, newline="", encoding="utf-8-sig")))
def num(v):
    try: return float(str(v).replace(",", ""))
    except ValueError: return None
for r in rows: r["valor_num"] = num(r["valor"])

def get(frente, sid, periodo, segmento=None):
    for r in rows:
        if r["frente"] == frente and r["serie_id"] == sid and r["periodo"] == periodo and (segmento is None or r["segmento"] == segmento):
            return r
    return None

def serie(frente, sid, segmento=None, geografia=None):
    out = [r for r in rows if r["frente"] == frente and r["serie_id"] == sid and (segmento is None or r["segmento"] == segmento) and (geografia is None or r["geografia"] == geografia)]
    return sorted(out, key=lambda r: r["periodo"])

def pack(r, formula=None):
    if r is None: return None
    d = {"valor": r["valor_num"], "variable": r["variable"], "periodo": r["periodo"], "calidad": r["calidad"], "fuente_id": r["fuente_id"],
         "url": r["url"], "localizador": r["localizador"], "unidad": r["unidad"], "geografia": r["geografia"],
         "fecha_corte": r["fecha_corte"], "nota": r["nota"][:400]}
    if formula: d["formula"] = formula
    return d

ANIOS = ["2020", "2021", "2022", "2023", "2024", "2025"]
eq = {}
for a in ANIOS:
    inf = get("demanda", "creditos-infonavit-nueva", a); fov = get("demanda", "creditos-fovissste-nueva", a); cnbv = get("demanda", "creditos-cnbv-nueva", a)
    suma3 = get("demanda", "estimado-creditos-nueva-suma-infonavit-fovissste-cnbv", a)
    cota = get("demanda", "estimado-compras-nueva-sin-doble-conteo-cofinanciamiento", a)
    cubo = get("demanda", "financiamientos-sniiv-nueva-total", a)
    conavi = get("demanda", "financ-sniiv-nueva-conavi", a)
    m_inf = get("demanda", "monto-infonavit-nueva", a); m_cnbv = get("demanda", "monto-cnbv-nueva", a)
    p_inf = (m_inf["valor_num"] / inf["valor_num"]) if (m_inf and inf and inf["valor_num"]) else None
    p_cnbv = (m_cnbv["valor_num"] / cnbv["valor_num"]) if (m_cnbv and cnbv and cnbv["valor_num"]) else None
    p_total = get("precios-financiamiento", "fin-sniiv-nueva-monto-medio", a)
    eq[a] = {
        "anio": int(a), "estado": "observado",
        "Q": {"base": pack(suma3, "INFONAVIT nueva + FOVISSSTE nueva + CNBV nueva (suma simple; cofinanciamientos sin deduplicar)"),
              "min": pack(cota, "suma simple − Cofinavit − Apoyo INFONAVIT (pareo con banca, sin verificar)"),
              "max": pack(cubo, "cubo SNIIV Financiamientos, destino vivienda nueva, todos los organismos (incluye CONAVI y Banjército)"),
              "componentes": {"infonavit": pack(inf), "fovissste": pack(fov), "cnbv": pack(cnbv), "conavi": pack(conavi)}},
        "P": {"base": {"valor": round(p_inf) if p_inf else None, "calidad": "estimado", "formula": "monto total INFONAVIT vivienda nueva ÷ créditos INFONAVIT vivienda nueva (SNIIV, municipio)",
                       "insumos": {"monto": pack(m_inf), "creditos": pack(inf)}, "unidad": "MXN por crédito", "nombre": "Crédito promedio INFONAVIT · vivienda nueva"},
              "alt_banca": {"valor": round(p_cnbv) if p_cnbv else None, "calidad": "estimado", "formula": "monto total banca (CNBV) vivienda nueva ÷ créditos banca vivienda nueva (SNIIV, municipio)",
                            "insumos": {"monto": pack(m_cnbv), "creditos": pack(cnbv)}, "unidad": "MXN por crédito", "nombre": "Crédito promedio banca · vivienda nueva"},
              "alt_total": pack(p_total, "monto total de financiamientos vivienda nueva ÷ acciones (todos los organismos; 2025 incluye CONAVI)")},
    }

# 2026 al corte (ene–jul) y mismo periodo 2025
def suma_mensual(frente, sid, anio, meses):
    vals = [get(frente, sid, f"{anio}-{m:02d}") for m in meses]
    if any(v is None for v in vals): return None, vals
    return sum(v["valor_num"] for v in vals), vals
meses = list(range(1, 8))
inf26, _ = suma_mensual("demanda", "creditos-infonavit-nueva-mensual", 2026, meses)
fov26, _ = suma_mensual("demanda", "creditos-fovissste-nueva-mensual", 2026, meses)
cnbv26, _ = suma_mensual("demanda", "creditos-cnbv-nueva-mensual", 2026, meses)
tot26, _ = suma_mensual("demanda", "financiamientos-sniiv-nueva-total-mensual", 2026, meses)
inf25p, _ = suma_mensual("demanda", "creditos-infonavit-nueva-mensual", 2025, meses)
fov25p, _ = suma_mensual("demanda", "creditos-fovissste-nueva-mensual", 2025, meses)
cnbv25p, _ = suma_mensual("demanda", "creditos-cnbv-nueva-mensual", 2025, meses)
tot25p, _ = suma_mensual("demanda", "financiamientos-sniiv-nueva-total-mensual", 2025, meses)
p26 = get("precios-financiamiento", "fin-sniiv-nueva-monto-medio", "2026-07")
ref_mensual = get("demanda", "creditos-infonavit-nueva-mensual", "2026-07")
eq["2026"] = {
    "anio": 2026, "estado": "al corte", "corte": "2026-07-31", "meses": "enero–julio",
    "Q": {"base": {"valor": (inf26 + fov26 + cnbv26) if None not in (inf26, fov26, cnbv26) else None, "calidad": "estimado",
                   "formula": "suma ene–jul 2026 de INFONAVIT + FOVISSSTE + CNBV vivienda nueva (series mensuales SNIIV)",
                   "url": ref_mensual["url"] if ref_mensual else "", "localizador": "series mensuales 2026-01..2026-07 en series.csv (frente demanda)"},
          "mismo_periodo_2025": {"valor": (inf25p + fov25p + cnbv25p) if None not in (inf25p, fov25p, cnbv25p) else None, "calidad": "estimado", "formula": "misma suma, ene–jul 2025"},
          "max": {"valor": tot26, "calidad": "estimado", "formula": "cubo Financiamientos vivienda nueva, suma ene–jul 2026 (todos los organismos)"},
          "max_mismo_periodo_2025": {"valor": tot25p, "calidad": "estimado", "formula": "cubo Financiamientos vivienda nueva, suma ene–jul 2025"},
          "componentes": {"infonavit": {"valor": inf26}, "fovissste": {"valor": fov26}, "cnbv": {"valor": cnbv26}}},
    "P": {"base": None, "alt_total": pack(p26, "monto total ÷ acciones, ene–jul 2026, todos los organismos (incluye CONAVI)")},
}

# Oferta por año
of = {}
for a in ANIOS + ["2026"]:
    of[a] = {
        "dtu": pack(get("oferta", "prod-dtu-ruv", a, "n/a") or get("oferta", "prod-dtu-ruv", a)),
        "registro": pack(get("oferta", "reg-ruv", a, "n/a") or get("oferta", "reg-ruv", a)),
        "inventario_dic": pack(get("oferta", "inv-ruv", f"{a}-12", "n/a") or get("oferta", "inv-ruv", f"{a}-12")),
    }
of["2026"]["dtu_ene_jul"] = pack(get("oferta", "prod-dtu-ruv-acum-ene-jul", "2026-07") or get("oferta", "prod-dtu-ruv-acum-ene-jul", "2026"))
of["2026"]["registro_ene_jul"] = pack(get("oferta", "reg-ruv-acum-ene-jul", "2026-07") or get("oferta", "reg-ruv-acum-ene-jul", "2026"))
of["2026"]["inventario_jul"] = pack(get("oferta", "inv-ruv", "2026-07", "n/a") or get("oferta", "inv-ruv", "2026-07"))
of["2025"]["dtu_ene_jul"] = pack(get("oferta", "prod-dtu-ruv-acum-ene-jul", "2025-07") or get("oferta", "prod-dtu-ruv-acum-ene-jul", "2025"))
of["2025"]["registro_ene_jul"] = pack(get("oferta", "reg-ruv-acum-ene-jul", "2025-07") or get("oferta", "reg-ruv-acum-ene-jul", "2025"))

# Desplazadores (contexto por año, con fuente)
def pk_list(frente, sid, segmento=None, geografia=None):
    return [pack(r) for r in serie(frente, sid, segmento, geografia)]
despl = {
    "tasa_hipotecaria_banxico_dic": pk_list("precios-financiamiento", "tasa-hipotecaria-banxico-nuevos"),
    "tasa_objetivo_banxico": pk_list("precios-financiamiento", "tasa-objetivo-banxico"),
    "uma_diaria": pk_list("precios-financiamiento", "uma-valor-diario"),
    "inflacion_nacional_dic_dic": pk_list("precios-financiamiento", "inflacion-nacional-dic-dic"),
    "inflacion_hermosillo_dic_dic": pk_list("precios-financiamiento", "inflacion-hermosillo-dic-dic"),
    "infonavit_monto_max": pk_list("precios-financiamiento", "infonavit-monto-max-credito"),
    "shf_var_anual_hermosillo": pk_list("precios-financiamiento", "precio-shf-var-acum-anual", None, "municipio Hermosillo") + pk_list("precios-financiamiento", "precio-shf-var-4t-anual", None, "municipio Hermosillo"),
    "shf_precio_medio_sonora": pk_list("precios-financiamiento", "precio-shf-medio-mxn", None, "Sonora"),
    "costo_construccion_ceico_hermosillo": pk_list("oferta", "costo-ceico-hermosillo-total"),
    "empleo_imss_hermosillo": pk_list("demanda", "empleo-imss-hermosillo-stock"),
    "remesas_hermosillo_anual": pk_list("demanda", "remesas-hermosillo-anual"),
    "poblacion": pk_list("demanda", "poblacion-censo-2020") + pk_list("demanda", "poblacion-conapo-coespo"),
    "viviendas_habitadas_2020": pk_list("demanda", "viviendas-particulares-habitadas-censo-2020"),
    "creditos_usada_infonavit": pk_list("demanda", "creditos-infonavit-usada"),
    "escrituras_canadevi": pk_list("oferta", "escrit-canadevi-nueva") + pk_list("oferta", "escrit-canadevi-nueva-acum-ene-jun"),
    "hcv_produccion_declarada": pk_list("oferta", "prod-hcv-canadevi"),
    "programas_hermosillo": pk_list("precios-financiamiento", "prog-hermosillo-viviendas") + pk_list("precios-financiamiento", "prog-sello-h-hermosillo") + pk_list("precios-financiamiento", "prog-canadevi-plan-privado") + pk_list("oferta", "cartera-suma-programas-hermosillo"),
    "itaee_sonora": pk_list("precios-financiamiento", "macro-itaee-sonora-4t"),
}

# Supuestos
sup = list(csv.DictReader(open(os.path.join(RAIZ, "02_cruces", "supuestos.csv"), newline="", encoding="utf-8-sig")))
for s in sup:
    for k in ("base", "minimo", "maximo"): s[k] = float(s[k])

# Fuentes citadas (dedup por url)
fuentes = {}
def add_f(d):
    if isinstance(d, dict):
        if d.get("url") and d["url"].startswith("http"):
            fuentes.setdefault(d["url"], {"url": d["url"], "fuente_id": d.get("fuente_id", ""), "calidad": d.get("calidad", ""), "n": 0})
            fuentes[d["url"]]["n"] += 1
        for v in d.values(): add_f(v)
    elif isinstance(d, list):
        for v in d: add_f(v)
add_f(eq); add_f(of); add_f(despl)

# Conteos de calidad
from collections import Counter
cal = Counter(r["calidad"] for r in rows)

data = {
    "meta": {"titulo": "Hermosillo 2020–2030 · Oferta y demanda de vivienda nueva", "version": "v1 · 2026-11-01",
             "estado_auditoria": "Fase 1: 1,331 valores extraídos por tres frentes; muestreo independiente 26/26 coincidencias (Lunas); dictamen de Astra pendiente. Eje de precio provisional (crédito promedio, no precio de vivienda).",
             "alcance": "Vivienda nueva formal, municipio de Hermosillo (clave 26/030). Usada y renta fuera del diagrama.",
             "corte_sniiv": "2026-07-31", "fecha_consulta": "2026-11-01", "filas_base": len(rows), "calidad": dict(cal),
             "metodo": "Curvas de elasticidad constante que pasan por el punto observado (P_t, Q_t): Q_D = Q_t·(P/P_t)^(−e_d), Q_S = Q_t·(P/P_t)^(e_s). Las pendientes (e_d, e_s) son SUPUESTO ajustable, no dato. Ver 04_auditoria/metodo-curvas.md."},
    "equilibrio": eq, "oferta": of, "desplazadores": despl, "supuestos": sup, "fuentes": sorted(fuentes.values(), key=lambda f: -f["n"]),
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("OK", OUT, os.path.getsize(OUT), "bytes;", len(fuentes), "fuentes")
for a in ANIOS + ["2026"]:
    e = eq[a]; q = e["Q"]["base"]["valor"] if e["Q"]["base"] else None
    p = e["P"]["base"]["valor"] if e["P"]["base"] else None
    pt = e["P"]["alt_total"]["valor"] if e["P"]["alt_total"] else None
    print(a, "Q", q, "Qmin", (e["Q"].get("min") or {}).get("valor"), "Qmax", (e["Q"].get("max") or {}).get("valor"), "P_inf", p, "P_total", pt,
          "| DTU", (of[a]["dtu"] or {}).get("valor"), "reg", (of[a]["registro"] or {}).get("valor"), "inv", (of[a]["inventario_dic"] or {}).get("valor"))
