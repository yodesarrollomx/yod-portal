#!/usr/bin/env python3
"""C11 · Motor de escenarios 2027–2030 (Sol Integración) · v2 (reglas §2 de 04_auditoria/criterios-fase2.md).

Aritmética exacta en logaritmos (elasticidad constante):
    Δln P = (δd − δs) / (e_d + e_s)
    Δln Q = (e_s·δd + e_d·δs) / (e_d + e_s)
P es REAL (índice SHF deflactado con INPC promedio anual del mismo periodo). Al mostrar: % = eˣ − 1.

Demanda (δd, en log):  e_ext·ln(1+g_margen) + e_y·ln(1+g_ingreso_real) + e_r·ln(1+g_tasa_hip_rel) + ln(1+d_otro)
    g_margen = g_empleo (base, porque Q es crédito formal) — o g_hogares sólo en la corrida de sensibilidad.
    Nunca los dos a la vez (contaría doble): el motor lo rechaza.
    e_r es una ELASTICIDAD sobre el cambio RELATIVO de la tasa hipotecaria (no «por punto porcentual»).
Oferta (δs, en log):   ln(1+s_pipeline) + ln(1+s_cartera) + ln(1+s_inventario) + ln(1+s_otro)
    Todas medidas dentro del mismo universo (entregas esperadas ÷ entregas observadas comparables).

Punto de partida: el cierre estimado de 2026 (02_cruces/cierre2026.json, con rango). El rango de 2027 incluye el del cierre.
Banda: envolvente de {arranque 3×3 (Q y P mín/centro/máx)} × {e_d, e_s, e_ext, e_y, e_r en mín/base/máx} (3^5 = 243 mallas).
Abanico (sólo pendientes): e_d × e_s con el arranque al centro y e_ext, e_y, e_r en su base.
Techo de absorción (§2.6 v2): techo_t = Q_max_hist × E_t / E_ref, con E = empleo IMSS del escenario (g_empleo acumulado
desde el último año observado; se calcula SIEMPRE con g_empleo, también en la corrida de sensibilidad con hogares).
El techo limita la absorción (demanda): si Q lo rebasa, Q = techo y P sale de la curva de OFERTA:
Δln P = (Δln Q − δs) / e_s. Se marca «techo activo».

Ningún número se escribe aquí. Entradas:
  01_base/f2-c09-supuestos/parametros.csv   escenario,anio,variable,valor,calidad,fuente,nota   (nota obligatoria)
      valor = % de VARIACIÓN ANUAL contra el año previo (se encadena año tras año), nunca acumulado contra 2025.
      s_cartera = sólo la parte NO registrada aún en RUV (incremental sobre la tubería): si un año trae s_pipeline y s_cartera
      distintos de 0, la nota de s_cartera debe decir «incremental sobre pipeline» o el motor la rechaza (M3).
      variables: g_empleo | g_hogares | g_ingreso_real | g_tasa_hip_rel | d_otro | s_pipeline | s_cartera | s_inventario | s_otro
      años: 2026 sólo para g_empleo (empleo al cierre 2026, alimenta el techo); escenarios 2027–2030.
  01_base/f2-c09-supuestos/supuestos.csv    parametro,base,minimo,maximo,unidad,tipo,justificacion,url
      e_d, e_s, e_ext, e_y, e_r  (+ techo: q_max_hist, e_ref, e_ultimo, anio_ultimo_empleo — o se omite el techo)
  02_cruces/cierre2026.json                 lo genera cierre2026.py
Salidas: 02_cruces/escenarios.csv y 02_cruces/escenarios.json (determinista: mismo insumo → mismo hash).
"""
import csv, json, math, os, sys, itertools

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C09 = os.path.join(RAIZ, "01_base", "f2-c09-supuestos")
PARAM = os.path.join(C09, "parametros.csv")
SUP = os.path.join(C09, "supuestos.csv")
CIERRE = os.path.join(RAIZ, "02_cruces", "cierre2026.json")
OUT_CSV = os.path.join(RAIZ, "02_cruces", "escenarios.csv")
OUT_JSON = os.path.join(RAIZ, "02_cruces", "escenarios.json")

D_VARS = ("g_empleo", "g_hogares", "g_ingreso_real", "g_tasa_hip_rel", "d_otro")
S_VARS = ("s_pipeline", "s_cartera", "s_inventario", "s_otro")
ESCENARIOS = ("bajo", "base", "alto")
ANIOS = (2027, 2028, 2029, 2030)
ELAST = ("e_d", "e_s", "e_ext", "e_y", "e_r")


def ln1(pct):
    """porcentaje → log (2.5 → ln 1.025)."""
    return math.log1p(pct / 100.0)


def cruce(dd, ds, ed, es):
    """δd, δs en log. Devuelve (Δln P, Δln Q)."""
    den = ed + es
    return (dd - ds) / den, (es * dd + ed * ds) / den


def leer_parametros(path=PARAM):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Falta {path}: lo entrega el chunk C09")
    p = {}
    with open(path, newline="", encoding="utf-8-sig") as f:
        for i, r in enumerate(csv.DictReader(f), 2):
            if not (r.get("nota") or "").strip():
                raise ValueError(f"fila {i}: parámetro sin justificación")
            if not (r.get("fuente") or "").strip():
                raise ValueError(f"fila {i}: parámetro sin fuente (si es propio: calidad=supuesto y fuente=archivo de C09)")
            v, a, esc = r["variable"], int(r["anio"]), r["escenario"]
            if v not in D_VARS + S_VARS:
                raise ValueError(f"fila {i}: variable fuera de contrato: {v}")
            if esc not in ESCENARIOS:
                raise ValueError(f"fila {i}: escenario fuera de contrato: {esc}")
            if a == 2026 and v != "g_empleo":
                raise ValueError(f"fila {i}: 2026 es cierre estimado con datos; sólo se admite g_empleo 2026 (techo)")
            if a not in ANIOS and a != 2026:
                raise ValueError(f"fila {i}: año fuera de 2026–2030: {a}")
            if (esc, a, v) in p:
                raise ValueError(f"fila {i}: clave duplicada {(esc, a, v)}")
            p[(esc, a, v)] = dict(r, valor=float(r["valor"]))
    for esc in ESCENARIOS:
        for a in ANIOS:
            if (esc, a, "g_empleo") in p and (esc, a, "g_hogares") in p:
                raise ValueError(f"{esc} {a}: g_empleo y g_hogares a la vez (doble conteo del margen extensivo, §2.3)")
            sp, sc = p.get((esc, a, "s_pipeline")), p.get((esc, a, "s_cartera"))
            if sp and sc and sp["valor"] != 0 and sc["valor"] != 0 and "incremental sobre pipeline" not in sc["nota"].lower():
                raise ValueError(f"{esc} {a}: s_pipeline y s_cartera a la vez sin «incremental sobre pipeline» en la nota de s_cartera (doble conteo, M3)")
    return p


def leer_supuestos(path=SUP):
    out = {}
    with open(path, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            out[r["parametro"]] = {k: (float(r[k]) if r.get(k) not in (None, "") else None) for k in ("base", "minimo", "maximo")} | {"fila": r}
    falta = [e for e in ELAST if e not in out]
    if falta:
        raise ValueError(f"supuestos.csv sin {falta}")
    return out


def val(params, esc, a, v):
    r = params.get((esc, a, v))
    return r["valor"] if r else 0.0


def deltas(params, esc, a, el, margen="g_empleo"):
    """Devuelve δd, δs (log) y su desglose (log) para un escenario y año."""
    if margen == "g_hogares":
        m = val(params, esc, a, "g_hogares") if (esc, a, "g_hogares") in params else None
        if m is None:
            raise ValueError(f"sensibilidad hogares sin g_hogares en {esc} {a}")
    else:
        m = val(params, esc, a, "g_empleo")
    comp_d = {"margen": el["e_ext"] * ln1(m), "ingreso": el["e_y"] * ln1(val(params, esc, a, "g_ingreso_real")),
              "tasa": el["e_r"] * ln1(val(params, esc, a, "g_tasa_hip_rel")), "otro": ln1(val(params, esc, a, "d_otro"))}
    comp_s = {v[2:]: ln1(val(params, esc, a, v)) for v in S_VARS}
    return sum(comp_d.values()), sum(comp_s.values()), comp_d, comp_s


def techo_path(params, esc, sup):
    """techo_t = q_max_hist × E_t / e_ref; E_t = e_ultimo × Π(1+g_empleo) desde el año siguiente al último observado."""
    if not all(k in sup for k in ("q_max_hist", "e_ref", "e_ultimo", "anio_ultimo_empleo")):
        return {}
    E = sup["e_ultimo"]["base"]
    a0 = int(sup["anio_ultimo_empleo"]["base"])
    out = {}
    for a in range(a0 + 1, 2031):
        E *= 1 + val(params, esc, a, "g_empleo") / 100
        if a in ANIOS:
            out[a] = sup["q_max_hist"]["base"] * E / sup["e_ref"]["base"]
    return out


def correr(arranque, params, sup, margen="g_empleo", params_techo=None):
    """arranque: {'Q': {centro,min,max}, 'P': {centro,min,max}} del cierre 2026 (P real). Filas por escenario/año.
    params_techo: parámetros con g_empleo para el techo (en la sensibilidad con hogares, los completos)."""
    el_base = {e: sup[e]["base"] for e in ELAST}
    rango = lambda e: (sup[e]["minimo"], sup[e]["base"], sup[e]["maximo"])
    malla = list(itertools.product(*(rango(e) for e in ELAST)))   # orden de ELAST: e_d, e_s, e_ext, e_y, e_r
    starts = list(itertools.product(("min", "centro", "max"), repeat=2))
    base_tuple = tuple(el_base[e] for e in ELAST)
    filas = []
    for esc in ESCENARIOS:
        if not any(k[0] == esc and k[1] in ANIOS for k in params):
            continue
        techo = techo_path(params_techo if params_techo is not None else params, esc, sup)
        trayectorias = {}
        for (sq, sp), tup in itertools.product(starts, malla):
            el = dict(zip(ELAST, tup)); ed, es = el["e_d"], el["e_s"]
            lnP, lnQ = math.log(arranque["P"][sp]), math.log(arranque["Q"][sq])
            tray = []
            for a in ANIOS:
                dd, ds, cd, cs = deltas(params, esc, a, el, margen)
                dlp, dlq = cruce(dd, ds, ed, es)
                lnP_prev, lnQ_prev = lnP, lnQ
                lnP, lnQ = lnP + dlp, lnQ + dlq
                topado = False
                if a in techo and lnQ > math.log(techo[a]):
                    lnQ = math.log(techo[a])
                    lnP = lnP_prev + ((lnQ - lnQ_prev) - ds) / es   # §2.6 v2: sobre la curva de OFERTA del año
                    topado = True
                tray.append(dict(anio=a, lnP=lnP, lnQ=lnQ, dd=dd, ds=ds, cd=cd, cs=cs, topado=topado))
            trayectorias[(sq, sp) + tup] = tray
        central = trayectorias[("centro", "centro") + base_tuple]
        abanico = [k for k in trayectorias if k[:2] == ("centro", "centro") and k[4:] == base_tuple[2:]]
        for i, t in enumerate(central):
            Ps = [math.exp(tr[i]["lnP"]) for tr in trayectorias.values()]
            Qs = [math.exp(tr[i]["lnQ"]) for tr in trayectorias.values()]
            Pe = [math.exp(trayectorias[k][i]["lnP"]) for k in abanico]
            Qe = [math.exp(trayectorias[k][i]["lnQ"]) for k in abanico]
            filas.append({
                "escenario": esc, "anio": t["anio"], "margen": margen,
                "P_real": round(math.exp(t["lnP"]), 3), "Q": round(math.exp(t["lnQ"]), 1),
                "P_real_min_abanico": round(min(Pe), 3), "P_real_max_abanico": round(max(Pe), 3),
                "Q_min_abanico": round(min(Qe), 1), "Q_max_abanico": round(max(Qe), 1),
                "P_real_min": round(min(Ps), 3), "P_real_max": round(max(Ps), 3),
                "Q_min": round(min(Qs), 1), "Q_max": round(max(Qs), 1),
                "dlnD": round(t["dd"], 6), "dlnS": round(t["ds"], 6),
                "pct_D": round(math.expm1(t["dd"]) * 100, 3), "pct_S": round(math.expm1(t["ds"]) * 100, 3),
                **{f"d_{k}_pct": round(math.expm1(v) * 100, 3) for k, v in t["cd"].items()},
                **{f"s_{k}_pct": round(math.expm1(v) * 100, 3) for k, v in t["cs"].items()},
                "techo_q": round(techo[t["anio"]], 1) if t["anio"] in techo else None,
                "techo_activo": t["topado"],
                "techo_activo_en_banda": any(tr[i]["topado"] for tr in trayectorias.values()),
            })
    return filas


def redondeo_disp(f):
    """§2.7: Q al múltiplo de 50 más cercano, P a 1 punto del índice."""
    q = lambda x: int(round(x / 50.0) * 50)
    p = lambda x: int(round(x))
    return {"Q": q(f["Q"]), "Q_min": q(f["Q_min"]), "Q_max": q(f["Q_max"]),
            "P_real": p(f["P_real"]), "P_real_min": p(f["P_real_min"]), "P_real_max": p(f["P_real_max"])}


def main():
    cierre = json.load(open(CIERRE, encoding="utf-8"))
    if not cierre.get("P_real"):
        sys.exit("Escenarios: el cierre 2026 no tiene P real (falta el INPC promedio anual de C07). P nominal no se usa en escenarios (§2.2).")
    arr = {"Q": cierre["Q"], "P": cierre["P_real"]}
    params, sup = leer_parametros(), leer_supuestos()
    filas = correr(arr, params, sup, "g_empleo")
    sens = []
    PARAM_HOG = os.path.join(C09, "parametros-sensibilidad-hogares.csv")   # C09 la entrega aparte (el motor rechaza empleo + hogares juntos)
    if os.path.exists(PARAM_HOG):
        sens = correr(arr, leer_parametros(PARAM_HOG), sup, "g_hogares", params_techo=params)
    elif any(k[2] == "g_hogares" for k in params):
        p_h = {k: v for k, v in params.items() if k[2] != "g_empleo" or k[1] == 2026}
        sens = correr(arr, p_h, sup, "g_hogares", params_techo=params)
    # Cruces de precio (§2.3 precisión, R-C09-4): los escenarios bajo/alto mueven demanda y oferta en la misma dirección y NO acotan P.
    # Se arman, sin números nuevos, con la demanda de un extremo y la oferta del otro.
    cruces = []
    if all(any(k[0] == e for k in params) for e in ("bajo", "alto")):
        for nombre, dem, ofe in (("presion", "alto", "bajo"), ("alivio", "bajo", "alto")):
            cp = {}
            for (e, a, v), r in params.items():
                lado = dem if (v in D_VARS) else ofe
                if e == lado:
                    cp[("base", a, v)] = dict(r, escenario="base")
            for f in correr(arr, cp, sup, "g_empleo", params_techo=cp):
                f["escenario"] = nombre
                cruces.append(f)
    for f in filas + sens + cruces:
        f["disp"] = redondeo_disp(f)
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as fh:
        campos = [k for k in filas[0].keys() if k != "disp"]
        w = csv.DictWriter(fh, fieldnames=campos, extrasaction="ignore"); w.writeheader(); w.writerows(filas + sens)
    bloque = {
        "metodo": "criterios-fase2 §2: Δln P=(δd−δs)/(e_d+e_s); Δln Q=(e_s·δd+e_d·δs)/(e_d+e_s); P real (INPC promedio anual); "
                  "banda = envolvente de arranque 2026 (Q y P mín/centro/máx) × e_d, e_s, e_ext, e_y, e_r (mín/base/máx); abanico = e_d × e_s; "
                  "techo de absorción §2.6 v2 (P sobre la curva de oferta)",
        "leyenda_rango": "Rango condicionado a supuestos; no es intervalo de confianza. No se atribuye probabilidad a ningún escenario. "
                         "El rango cubre el cierre estimado de 2026 y las cinco elasticidades (precio de demanda y de oferta, empleo, ingreso y tasa) en su mínimo y máximo.",
        "arranque_2026": cierre,
        "filas": filas,
        "sensibilidad_hogares": sens,
        "cruces_precio": cruces,
        "nombres": {"bajo": "menos demanda y menos oferta", "base": "base", "alto": "más demanda y más oferta",
                    "presion": "más demanda con menos oferta (cruce)", "alivio": "menos demanda con más oferta (cruce)"},
        "nota_cruces": "Los escenarios «más» y «menos» mueven demanda y oferta en la misma dirección: son extremos de la cantidad, no del precio. "
                       "Los cruces combinan la demanda de un extremo con la oferta del otro y muestran hasta dónde podría ir el precio con los mismos supuestos.",
        "parametros": [dict(escenario=k[0], anio=k[1], variable=k[2], valor=v["valor"], calidad=v["calidad"], fuente=v["fuente"], nota=v["nota"])
                       for k, v in sorted(params.items())],
        "supuestos": {k: {kk: v[kk] for kk in ("base", "minimo", "maximo")} | {"tipo": v["fila"].get("tipo"), "unidad": v["fila"].get("unidad"),
                      "justificacion": v["fila"].get("justificacion"), "url": v["fila"].get("url")} for k, v in sorted(sup.items())},
    }
    with open(OUT_JSON, "w", encoding="utf-8") as fh:
        json.dump(bloque, fh, ensure_ascii=False, indent=1, sort_keys=True)
    for r in filas + sens + cruces:
        d = r["disp"]
        print(r["margen"][2:], r["escenario"], r["anio"], "P", d["P_real"], f"[{d['P_real_min']}–{d['P_real_max']}]", "Q", d["Q"],
              f"[{d['Q_min']}–{d['Q_max']}]", "D%", r["pct_D"], "S%", r["pct_S"], "TECHO" if r["techo_activo"] else "")


if __name__ == "__main__":
    main()
