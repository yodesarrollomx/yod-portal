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

# Precondición de Astra (criterios-fase2.md, C11): series multi-geografía, multi-unidad, claves prog-* duplicadas y la suma heredada
# de programas NO se leen. Cualquier intento aborta.
VETADAS = re.compile(r"^(precio-shf-var-|precio-shf-medi.*-mxn$|canadevi-hermosillo-escrituradas-anual$|prog-|cartera-)|derrama")  # cartera-*: superada por f2-c03/f2-c04 cartera.csv (R-C03-6)

def get(frente, sid, periodo, segmento=None):
    assert not VETADAS.search(sid), f"serie vetada por la auditoría: {sid}"
    for r in rows:
        if r["frente"] == frente and r["serie_id"] == sid and r["periodo"] == periodo and (segmento is None or r["segmento"] == segmento):
            return r
    return None

def serie(frente, sid, segmento=None, geografia=None):
    assert not VETADAS.search(sid), f"serie vetada por la auditoría: {sid}"
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
# Deflactor (criterios-fase2 §2.2): INPC nacional PROMEDIO ANUAL (C07), precios de 2025: P_real = P × INPC̄_2025 / INPC̄_t.
# Si C07 aún no entrega el promedio anual, se usa el dic–dic de la Fase 1 rotulado «provisional».
inpc_prom = {r["periodo"]: r for r in rows if r["serie_id"] == "f2-inpc-promedio-anual" and r["valor_num"] is not None and re.fullmatch(r"\d{4}", r["periodo"])}
DEFLACTOR_OK = all(str(y) in inpc_prom for y in range(2020, 2026))
infl = {r["periodo"]: r for r in serie("precios-financiamiento", "inflacion-nacional-dic-dic")}
def factor_precios(a):
    """Divide el índice nominal entre este factor para pasarlo a precios de 2025."""
    a = int(a)
    if DEFLACTOR_OK:
        return inpc_prom[str(a)]["valor_num"] / inpc_prom["2025"]["valor_num"]
    f = 1.0
    for y in range(a + 1, 2026):
        r = infl.get(str(y))
        if r and r["valor_num"] is not None: f /= (1 + r["valor_num"] / 100)
    return f
DEFL_TXT = ("índice SHF nominal × INPC promedio anual 2025 ÷ INPC promedio anual del año (INEGI, C07): precios de 2025" if DEFLACTOR_OK
            else "PROVISIONAL: índice nominal ÷ inflación dic–dic acumulada hasta 2025 (falta el INPC promedio anual de C07)")
eq = {}
for a in ANIOS:
    inf = get("demanda", "creditos-infonavit-nueva", a); fov = get("demanda", "creditos-fovissste-nueva", a); cnbv = get("demanda", "creditos-cnbv-nueva", a)
    suma3 = get("demanda", "estimado-creditos-nueva-suma-infonavit-fovissste-cnbv", a)
    cubo = get("demanda", "financiamientos-sniiv-nueva-total", a)
    conavi = get("demanda", "financ-sniiv-nueva-conavi", a)
    qd = get("integracion", "q-viviendas-financiadas-nueva-dedup", a)
    viv_inf = get("integracion", "viviendas-infonavit-nueva-dedup", a)
    tipo = {k: get("integracion", f"creditos-infonavit-nueva-tipo-{k}", a) for k in ("individual", "conyugal", "unamos", "no-disponible")}
    esq = {k: get("demanda", f"creditos-infonavit-nueva-esq-{k}", a) for k in ("cofinavit", "apoyo-infonavit", "infonavit-total")}
    p_idx = get("integracion", "p-shf-indice-hermosillo-anual", a)
    m_inf = get("demanda", "monto-infonavit-nueva", a)
    p_cred = (m_inf["valor_num"] / inf["valor_num"]) if (m_inf and inf and inf["valor_num"]) else None
    fp = factor_precios(a)
    eq[a] = {
        "anio": int(a), "estado": "observado",
        "Q": {"base": pack(qd, "viviendas financiadas deduplicadas (ver fórmula en la fila)"),
              "min": pack(qd, "igual a la base: la deduplicación ya es la cota conservadora"),
              "max": pack(suma3, "suma simple de acciones INFONAVIT + FOVISSSTE + CNBV (sin deduplicar; cota superior)"),
              "cubo": pack(cubo, "cubo SNIIV Financiamientos, destino vivienda nueva, todos los organismos (incluye CONAVI y Banjército)"),
              "componentes": {"infonavit_acciones": pack(inf), "infonavit_viviendas": pack(viv_inf), "fovissste": pack(fov), "cnbv": pack(cnbv), "conavi": pack(conavi),
                               "tipo": {k: pack(v) for k, v in tipo.items() if v}, "esquemas_banco": {k: pack(v) for k, v in esq.items() if v}}},
        "P": {"base": pack(p_idx, "promedio anual del índice SHF de precios de la vivienda, Hermosillo (2017=100)"),
              "real": {"valor": round(p_idx["valor_num"] / fp, 2) if p_idx else None, "calidad": "estimado", "unidad": "índice 2017=100, precios de 2025",
                       "formula": DEFL_TXT, "factor": round(fp, 6), "deflactor_definitivo": DEFLACTOR_OK,
                       "nombre": "Índice SHF Hermosillo en términos reales"},
              "credito_promedio_infonavit": {"valor": round(p_cred) if p_cred else None, "calidad": "estimado", "formula": "monto total INFONAVIT vivienda nueva ÷ acciones (contexto, no es precio)",
                                             "unidad": "MXN por crédito"}},
    }

# 2026 al corte (ene–jul) y mismo periodo 2025
q26 = get("integracion", "q-viviendas-financiadas-nueva-dedup", "2026-07")
q25p = get("integracion", "q-viviendas-financiadas-nueva-dedup-ene-jul-2025", "2025-07")
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
p26 = get("integracion", "p-shf-indice-hermosillo-anual", "2026-Q2")
p26q1 = get("integracion", "shf-indice-hermosillo", "2026-Q1"); p26q2 = get("integracion", "shf-indice-hermosillo", "2026-Q2")
CIERRE = os.path.join(RAIZ, "02_cruces", "cierre2026.json")
cierre = json.load(open(CIERRE, encoding="utf-8")) if os.path.exists(CIERRE) else None
eq["2026"] = {
    "anio": 2026, "estado": "al corte", "corte": "2026-07-31", "meses": "enero–julio",
    "Q": {"base": pack(q26, "viviendas financiadas deduplicadas, ene–jul 2026"),
          "mismo_periodo_2025": pack(q25p, "misma fórmula, ene–jul 2025"),
          "max": {"valor": (inf26 + fov26 + cnbv26) if None not in (inf26, fov26, cnbv26) else None, "calidad": "estimado", "formula": "suma simple de acciones ene–jul 2026 (INFONAVIT + FOVISSSTE + CNBV)"},
          "max_mismo_periodo_2025": {"valor": (inf25p + fov25p + cnbv25p) if None not in (inf25p, fov25p, cnbv25p) else None, "calidad": "estimado", "formula": "suma simple de acciones ene–jul 2025"},
          "cubo": {"valor": tot26, "calidad": "estimado", "formula": "cubo Financiamientos vivienda nueva, suma ene–jul 2026 (todos los organismos)"},
          "componentes": {"infonavit_acciones": {"valor": inf26}, "fovissste": {"valor": fov26}, "cnbv": {"valor": cnbv26}}},
    "P": {"base": pack(p26, "promedio de Q1 y Q2 2026 del índice SHF Hermosillo (al corte)"),
          "q1": pack(p26q1), "q2": pack(p26q2),
          "real": ({"valor": round(p26["valor_num"] * cierre["inpc"]["factor_a_precios_2025"], 2), "calidad": "estimado", "unidad": "índice 2017=100, precios de 2025",
                    "formula": "promedio ene–jun 2026 × INPC̄ 2025 ÷ INPC̄ 2026 estimado (cierre2026.json)", "factor": cierre["inpc"]["factor_a_precios_2025"]}
                   if cierre and cierre.get("P_real") else None)},
    "cierre": cierre,
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
    "shf_indice_hermosillo_trimestral": pk_list("integracion", "shf-indice-hermosillo"),
    "shf_indice_sonora_trimestral": pk_list("integracion", "shf-indice-sonora"),
    "viviendas_infonavit_dedup": pk_list("integracion", "viviendas-infonavit-nueva-dedup"),
    "q_dedup": pk_list("integracion", "q-viviendas-financiadas-nueva-dedup"),
    "costo_construccion_ceico_hermosillo": pk_list("oferta", "costo-ceico-hermosillo-total"),
    "empleo_imss_hermosillo": pk_list("demanda", "empleo-imss-hermosillo-stock"),
    "remesas_hermosillo_anual": pk_list("demanda", "remesas-hermosillo-anual"),
    "poblacion": pk_list("demanda", "poblacion-censo-2020") + pk_list("demanda", "poblacion-conapo-coespo"),
    "viviendas_habitadas_2020": pk_list("demanda", "viviendas-particulares-habitadas-censo-2020"),
    "creditos_usada_infonavit": pk_list("demanda", "creditos-infonavit-usada"),
    "escrituras_canadevi": pk_list("oferta", "escrit-canadevi-nueva") + pk_list("oferta", "escrit-canadevi-nueva-acum-ene-jun"),
    "hcv_produccion_declarada": pk_list("oferta", "prod-hcv-canadevi"),
    "itaee_sonora": pk_list("precios-financiamiento", "macro-itaee-sonora-4t"),
    # Fase 2
    "inventario_terminado_proxy": pk_list("f2-c02-inventario", "f2-inv-terminado-proxy"),
    "inventario_meses_ventas_ruv": pk_list("f2-c02-inventario", "f2-inv-terminado-proxy-meses-ventas-ruv12"),
    "tuberia_12m_sin_dtu": pk_list("f2-c01-pipeline", "f2-pipeline-registradas-12m-sin-dtu"),
    "rezago_registro_dtu": pk_list("f2-c01-pipeline", "f2-rezago-registro-dtu-meses"),
}

# Escenarios (C11), backtest (C10) y cartera por etapa (C03/C04), si existen
def leer_json(*partes):
    ruta = os.path.join(RAIZ, *partes)
    return json.load(open(ruta, encoding="utf-8")) if os.path.exists(ruta) else None
escenarios = leer_json("02_cruces", "escenarios.json")
backtest = None
_bt = leer_json("01_base", "f2-c10-backtest", "resultados.json")
if _bt:
    tabla = []
    for k, r in sorted(((_bt.get("metricas") or {}).get("A") or {}).get("por_anio", {}).items()):
        serie, anio_bt = k.rsplit("_", 1)
        tabla.append({"Serie": "Viviendas (Q)" if serie == "Q" else "Precio real (P)", "Año": anio_bt, "Observado": r["observado"], "Método (A)": r["proyectado"],
                      "Error método %": r["error_pct"], "Inercia": r["ingenuo"], "Error inercia %": r["error_pct_ingenuo"], "Dentro del rango": "sí" if r["dentro_banda"] else "no"})
    frases = re.findall(r"«([^»]+)»", (_bt.get("veredicto_texto") or "").split("R1")[0])
    backtest = {"veredicto_texto": ("Prueba con información hasta 2023: " + "; ".join(frases) + ".") if frases else "Prueba con información hasta 2023: sin frases de alerta activadas.",
                "veredicto_completo": _bt.get("veredicto_texto"), "tabla": tabla,
                "nota_preregistro": "Parámetros fijados antes de correr (01_base/f2-c10-backtest/preregistro.md). Variante A: reglas de escenario con datos ≤ 2023. "
                                    "Inercia: Q igual a 2023 y P creciendo al promedio real 2021–2023.",
                # dictamen-C10 §D: el titular va acompañado de estas cinco precisiones (texto del auditor, sin números propios)
                "precisiones": ["Es una prueba pseudo-fuera de muestra: las elasticidades se fijaron conociendo 2020–2025.",
                                "Dos años no prueban exactitud.",
                                "La variante condicional no pudo correrse con datos de Hermosillo (falta el empleo municipal); con aproximaciones no contuvo el precio.",
                                "La dirección del precio se equivocó en los dos años.",
                                "A dos años, el rango de viviendas es muy ancho: contener el dato no es acertar."],
                "fuente": "01_base/f2-c10-backtest/resultados.json"}
cartera = []
for ch in ("f2-c03-cartera-publica", "f2-c04-cartera-privada"):
    ruta = os.path.join(RAIZ, "01_base", ch, "cartera.csv")
    if os.path.exists(ruta):
        for r in csv.DictReader(open(ruta, newline="", encoding="utf-8-sig")):
            r["chunk"] = ch
            cartera.append(r)

# Supuestos (C09 manda cuando existe)
SUP_C09 = os.path.join(RAIZ, "01_base", "f2-c09-supuestos", "supuestos.csv")
sup = list(csv.DictReader(open(SUP_C09 if os.path.exists(SUP_C09) else os.path.join(RAIZ, "02_cruces", "supuestos.csv"), newline="", encoding="utf-8-sig")))
for s in sup:
    for k in ("base", "minimo", "maximo"): s[k] = float(s[k]) if s.get(k) not in (None, "") else None

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
add_f(eq); add_f(of); add_f(despl); add_f(cartera)

# Conteos de calidad
from collections import Counter
cal = Counter(r["calidad"] for r in rows)

data = {
    "meta": {"titulo": "Hermosillo 2020–2030 · Oferta y demanda de vivienda nueva", "version": "v3 · 2026-11-01",
             "estado_auditoria": ("Fase 2 en curso: cierre estimado 2026 y escenarios 2027–2030 con supuestos auditados por chunk (04_auditoria/). " if escenarios else "Fase 2 en curso: cierre estimado 2026 publicado; escenarios 2027–2030 en auditoría. ") + "Precio real a precios de 2025 (INPC promedio anual); índice SHF base 2017 = 100.",
             "alcance": "Vivienda nueva formal, municipio de Hermosillo (clave 26/030). Usada y renta fuera del diagrama.",
             "corte_sniiv": "2026-07-31", "fecha_consulta": "2026-11-01", "filas_base": len(rows), "calidad": dict(cal),
             "ejes": {"P": "Índice SHF de precios de la vivienda, Hermosillo, promedio anual, 2017=100 (toda la vivienda con avalúo, nueva y usada). Real: precios de 2025 con INPC nacional promedio anual; nominal como referencia histórica.", "Q": "Viviendas nuevas financiadas en el municipio por año: INFONAVIT (deduplicando Conyugal y Unamos Créditos: dos créditos, una vivienda; y descontando esquemas con banco) + FOVISSSTE + banca CNBV. Rango hasta la suma simple de acciones."},
             "metodo": "Curvas de elasticidad constante que pasan por el punto observado (P_t, Q_t): Q_D = Q_t·(P/P_t)^(−e_d), Q_S = Q_t·(P/P_t)^(e_s). Las pendientes (e_d, e_s) son SUPUESTO ajustable, no dato. Ver 04_auditoria/metodo-curvas.md."},
    "equilibrio": eq, "oferta": of, "desplazadores": despl, "supuestos": sup, "fuentes": sorted(fuentes.values(), key=lambda f: -f["n"]),
    "escenarios": escenarios, "backtest": backtest, "cartera": cartera,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("OK", OUT, os.path.getsize(OUT), "bytes;", len(fuentes), "fuentes")
for a in ANIOS + ["2026"]:
    e = eq[a]; q = (e["Q"]["base"] or {}).get("valor"); p = (e["P"]["base"] or {}).get("valor"); pr = (e["P"].get("real") or {}).get("valor")
    print(a, "Q", q, "Qmax", (e["Q"].get("max") or {}).get("valor"), "P", p, "P_real", pr,
          "| DTU", (of[a]["dtu"] or {}).get("valor"), "reg", (of[a]["registro"] or {}).get("valor"), "inv", (of[a]["inventario_dic"] or {}).get("valor"))
