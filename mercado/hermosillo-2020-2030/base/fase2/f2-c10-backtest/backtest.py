#!/usr/bin/env python3
"""C10 · Backtest del método de curvas (Terra-8). Reproducible: python3 -I backtest.py

Aplica EXACTAMENTE lo escrito en preregistro.md (hash en checkpoints.md). Importa cruce() de 02_cruces/escenarios.py.
Los únicos números tecleados son los preregistrados: e_ext = 1.0 [0.5–1.5] (no está en supuestos.csv; ver preregistro §2),
los años del diseño, el rezago central/rango de C01 (14; 10–24; verificación 12; 9–23) y la ventana de calibración 2022–2023.
Las demás elasticidades se leen de 02_cruces/supuestos.csv.
Salidas (en esta carpeta): resultados.json, series.csv.
"""
import csv, json, math, os, sys, itertools, importlib.util, statistics

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
BASE = os.path.join(RAIZ, "01_base")
SI = os.path.join(BASE, "series-integradas.csv")
C01 = os.path.join(BASE, "f2-c01-pipeline", "series.csv")
C05 = os.path.join(BASE, "f2-c05-empleo", "series.csv")
C07 = os.path.join(BASE, "f2-c07-credito", "series.csv")
SUP = os.path.join(RAIZ, "02_cruces", "supuestos.csv")

spec = importlib.util.spec_from_file_location("escenarios", os.path.join(RAIZ, "02_cruces", "escenarios.py"))
_esc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(_esc)
cruce = _esc.cruce  # misma aritmética que el motor de escenarios

# ---- diseño preregistrado -------------------------------------------------------------------
E_EXT = dict(base=1.0, minimo=0.5, maximo=1.5)          # preregistro §2 (supuesto; no está en supuestos.csv)
ANIOS_HIST = (2021, 2022, 2023, 2024, 2025)
ANIOS_INFO = (2021, 2022, 2023)                           # información ≤ 2023
ANIOS_PROY = (2024, 2025)
ANIO_BASE = 2023
L_C, L_RANGO = 14, (10, 14, 24)                           # C01 registro→DTU
LV_C, LV_RANGO = 12, (9, 12, 23)                          # C01 verificación→DTU (sensibilidad S2)
CALIB = (2022, 2023)                                      # calibración de a (≤ 2023)
CAL_OK = {"observado", "declarado", "prensa", "estimado"}  # `por verificar` no entra al titular


# ---- lectura -------------------------------------------------------------------------------
def filas(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def serie(rows, sid, geo=None):
    """periodo -> (valor, calidad). Un serie_id = una definición; duplicados con distinto valor = error."""
    out, geos = {}, set()
    for r in rows:
        if r["serie_id"] != sid or (geo and r["geografia"] != geo):
            continue
        if (r["valor"] or "").strip() == "":
            continue  # fila `por verificar` sin valor: ausente, no se inventa
        geos.add(r["geografia"])
        v = float(r["valor"])
        if r["periodo"] in out and abs(out[r["periodo"]][0] - v) > 1e-9:
            raise ValueError(f"{sid} {r['periodo']}: valores distintos")
        out[r["periodo"]] = (v, r["calidad"])
    if len(geos) > 1:
        raise ValueError(f"{sid} mezcla geografías {geos}")
    return out


def sup_elast():
    d = {}
    for r in filas(SUP):
        d[r["parametro"]] = dict(base=float(r["base"]), minimo=float(r["minimo"]), maximo=float(r["maximo"]))
    for k in ("e_d", "e_s", "e_y", "e_r"):
        if k not in d:
            raise ValueError(f"supuestos.csv sin {k}")
    return d


EL = sup_elast()
EL["e_ext"] = E_EXT

SIr, C01r, C05r, C07r = filas(SI), filas(C01), filas(C05), filas(C07)
INSUMOS = {}

# Q, P
Qs = serie(SIr, "q-viviendas-financiadas-nueva-dedup", "municipio Hermosillo")
Pns = serie(SIr, "p-shf-indice-hermosillo-anual", "municipio Hermosillo")
Q = {y: Qs[str(y)][0] for y in range(2020, 2026)}
Pn = {y: Pns[str(y)][0] for y in range(2020, 2026)}
INSUMOS["Q"] = dict(serie_id="q-viviendas-financiadas-nueva-dedup", calidad=sorted({Qs[str(y)][1] for y in range(2020, 2026)}))
INSUMOS["P_nominal"] = dict(serie_id="p-shf-indice-hermosillo-anual", calidad=sorted({Pns[str(y)][1] for y in range(2020, 2026)}))

# deflactor titular: INPC promedio anual (C07); respaldo: dic–dic encadenado (rotulado provisional)
inpc = serie(C07r, "f2-inpc-promedio-anual", "nacional")
if all(str(y) in inpc for y in range(2020, 2026)):
    INPC = {y: inpc[str(y)][0] for y in range(2020, 2026)}
    DEFLACTOR = "INPC promedio anual (C07 f2-inpc-promedio-anual)"
    INSUMOS["deflactor"] = dict(serie_id="f2-inpc-promedio-anual", calidad=sorted({inpc[str(y)][1] for y in range(2020, 2026)}))
else:
    pi = serie(SIr, "inflacion-nacional-dic-dic", "nacional")
    INPC = {2020: 1.0}
    for y in range(2021, 2026):
        INPC[y] = INPC[y - 1] * (1 + pi[str(y)][0] / 100)
    DEFLACTOR = "deflactor provisional dic–dic (inflacion-nacional-dic-dic encadenada)"
    INSUMOS["deflactor"] = dict(serie_id="inflacion-nacional-dic-dic", provisional=True)
pi_dd = serie(SIr, "inflacion-nacional-dic-dic", "nacional")
INPC_DD = {2020: 1.0}
for y in range(2021, 2026):
    INPC_DD[y] = INPC_DD[y - 1] * (1 + pi_dd[str(y)][0] / 100)


def reales(infl):
    """ln P real a precios de 2025 (constante aditiva en logs: no cambia ningún Δ ni error)."""
    return {y: math.log(Pn[y]) - math.log(infl[y]) + math.log(infl[2025]) for y in range(2020, 2026)}


lnQ = {y: math.log(Q[y]) for y in Q}
lnP = reales(INPC)
lnP_dd = reales(INPC_DD)

# tasa hipotecaria (dic, nacional)
tasa = serie(SIr, "tasa-hipotecaria-banxico-nuevos", "nacional")
TASA = {y: tasa[f"{y}-12"][0] for y in range(2020, 2026)}
INSUMOS["tasa"] = dict(serie_id="tasa-hipotecaria-banxico-nuevos", periodo="diciembre", geografia="nacional")
dlnr = {t: math.log(TASA[t] / TASA[t - 1]) for t in ANIOS_HIST}

# oferta C01
reg_s, dtu_s, ver_s = (serie(C01r, s, "municipio Hermosillo") for s in ("f2-registro-mensual", "f2-dtu-mensual", "f2-verificacion-mensual"))


def a_indice(periodo):
    y, m = periodo.split("-")
    return int(y) * 12 + int(m) - 1


REG = {a_indice(p): v[0] for p, v in reg_s.items()}
VER = {a_indice(p): v[0] for p, v in ver_s.items()}
DTU_M = {a_indice(p): v[0] for p, v in dtu_s.items()}
DTU = {y: sum(DTU_M[y * 12 + m] for m in range(12)) for y in range(2020, 2026)}
INSUMOS["oferta"] = dict(serie_ids=["f2-registro-mensual", "f2-dtu-mensual", "f2-verificacion-mensual"], nota="abr-2020 imputado 0 por C01 (estimado)")


def rezagada(origen, y, L):
    return sum(origen[y * 12 + m - L] for m in range(12))


def ds_pipeline(origen, L):
    """δs_t = ln(a·R_t^L / DTU_{t−1}); a calibrada con 2022–2023. Devuelve {t: δs} para t=2022..2025 y a."""
    a = sum(DTU[y] for y in CALIB) / sum(rezagada(origen, y, L) for y in CALIB)
    return {t: math.log(a * rezagada(origen, t, L) / DTU[t - 1]) for t in range(2022, 2026)}, a


# ---- demanda construida (B) ----------------------------------------------------------------
def dd_construida(dln_emp, dln_ing, dln_tasa, ext, ey, er, anios):
    """Sólo años con todos los términos pedidos disponibles; los términos None se omiten SOLO si el llamador lo declara parcial."""
    out = {}
    for t in anios:
        tot, ok = 0.0, True
        for dl, el in ((dln_emp, ext), (dln_ing, ey), (dln_tasa, er)):
            if dl is None:
                continue
            if t not in dl or dl[t] is None:
                ok = False
                break
            tot += el * dl[t]
        if ok:
            out[t] = tot
    return out


def dln_nivel(niveles, anios):
    """niveles: {año: valor}; Δln para cada año t con niveles en t y t−1."""
    return {t: math.log(niveles[t] / niveles[t - 1]) for t in anios if t in niveles and t - 1 in niveles}


def hermosillo_c05(sid, calidades):
    s = serie(C05r, sid, "municipio Hermosillo")
    out = {}
    for y in range(2019, 2026):
        p = f"{y}-12"
        if p in s and s[p][1] in calidades:
            out[y] = s[p][0]
    return out


def lvl_dic(sid_geo, sid, calidades, periodos_prefer):
    s = serie(C05r, sid, sid_geo)
    out = {}
    for y in range(2019, 2026):
        for p in periodos_prefer(y):
            if p in s and s[p][1] in calidades:
                out[y] = s[p][0]
                break
    return out


# inflación dic–dic para ingreso (C05, observado)
infl_dic = serie(C05r, "inpc-nacional-var-dic", "nacional")
PI_DIC = {y: infl_dic[f"{y}-12"][0] / 100 for y in range(2020, 2026)}
INSUMOS["deflactor_ingreso"] = dict(serie_id="inpc-nacional-var-dic (C05)", nota="stock de diciembre ÷ deflactor de diciembre")


def dln_ingreso_real(niveles, anios):
    d = dln_nivel(niveles, anios)
    return {t: v - math.log(1 + PI_DIC[t]) for t, v in d.items()}


# empleo/ingreso Hermosillo (titular) y alternativas
emp_h = hermosillo_c05("f2-imss-puestos-dic", CAL_OK)
sal_h = hermosillo_c05("f2-imss-salario-diario", CAL_OK)
emp_h_pv = hermosillo_c05("f2-imss-puestos-dic", CAL_OK | {"por verificar"})
sal_h_pv = hermosillo_c05("f2-imss-salario-diario", CAL_OK | {"por verificar"})
disp_B_completa = all(y in emp_h and y in sal_h for y in range(2020, 2026))
emp_s = lvl_dic("Sonora", "f2-imss-puestos-dic-sonora", CAL_OK, lambda y: (f"{y}-12",))
sal_s = lvl_dic("Sonora", "f2-imss-salario-diario-sonora", CAL_OK, lambda y: (f"{y}", f"{y}-12"))


# ---- proyección ---------------------------------------------------------------------------
def tray(dd, ds, ed, es, lnQ0, lnP0):
    """Trayectoria acumulada desde 2023; dd, ds = {año: δ}."""
    q, p, out = lnQ0, lnP0, {}
    for t in ANIOS_PROY:
        dlp, dlq = cruce(dd[t], ds[t], ed, es)
        q, p = q + dlq, p + dlp
        out[t] = (q, p)
    return out


MALLA = list(itertools.product((EL["e_d"]["minimo"], EL["e_d"]["base"], EL["e_d"]["maximo"]),
                               (EL["e_s"]["minimo"], EL["e_s"]["base"], EL["e_s"]["maximo"])))
PAR_BASE = (EL["e_d"]["base"], EL["e_s"]["base"])


def envolvente(trays):
    b = {}
    for t in ANIOS_PROY:
        qs = [tr[t][0] for tr in trays]
        ps = [tr[t][1] for tr in trays]
        b[t] = dict(Q=(min(qs), max(qs)), P=(min(ps), max(ps)))
    return b


def historia(lnP_):
    h = {}
    for ed, es in MALLA:
        h[(ed, es)] = {t: dict(dlnQ=lnQ[t] - lnQ[t - 1], dlnP=lnP_[t] - lnP_[t - 1],
                               dd=(lnQ[t] - lnQ[t - 1]) + ed * (lnP_[t] - lnP_[t - 1]),
                               ds=(lnQ[t] - lnQ[t - 1]) - es * (lnP_[t] - lnP_[t - 1])) for t in ANIOS_HIST}
    return h


def variante_A(lnP_, coherente=True, agregador=statistics.median):
    H = historia(lnP_)
    Hb = H[PAR_BASE]
    tr_esc, tr_ancha, central = [], [], None
    for par in MALLA:
        ed, es = par
        src = H[par] if coherente else Hb
        dd = [src[t]["dd"] for t in ANIOS_INFO]
        ds = [src[t]["ds"] for t in ANIOS_INFO]
        niv = {"bajo": (min(dd), min(ds)), "base": (agregador(dd), agregador(ds)), "alto": (max(dd), max(ds))}
        for nombre, (d_, s_) in niv.items():
            tr = tray({t: d_ for t in ANIOS_PROY}, {t: s_ for t in ANIOS_PROY}, ed, es, lnQ[ANIO_BASE], lnP_[ANIO_BASE])
            tr_esc.append(tr)
            if nombre == "base" and par == PAR_BASE:
                central = (tr, d_, s_)
        for d_ in (min(dd), agregador(dd), max(dd)):
            for s_ in (min(ds), agregador(ds), max(ds)):
                tr_ancha.append(tray({t: d_ for t in ANIOS_PROY}, {t: s_ for t in ANIOS_PROY}, ed, es, lnQ[ANIO_BASE], lnP_[ANIO_BASE]))
    return dict(central=central[0], dd_base=central[1], ds_base=central[2], banda=envolvente(tr_esc), banda_ancha=envolvente(tr_ancha), hist=H)


def variante_B(dd, origen_oferta, L_c, L_rango, lnP_):
    """dd: {2024, 2025: δd}. Oferta = pipeline con rezago L; banda = malla e × rezago."""
    trs, central, ds_c, a_c = [], None, None, None
    for L in L_rango:
        ds, a = ds_pipeline(origen_oferta, L)
        for ed, es in MALLA:
            tr = tray(dd, ds, ed, es, lnQ[ANIO_BASE], lnP_[ANIO_BASE])
            trs.append(tr)
            if L == L_c and (ed, es) == PAR_BASE:
                central, ds_c, a_c = tr, ds, a
    return dict(central=central, ds=ds_c, a=a_c, banda=envolvente(trs))


# auto-chequeo de aritmética (§2.1): cruce(δd, δs) con las mismas elasticidades reproduce ΔlnP y ΔlnQ de la historia
for _par, _h in historia(lnP).items():
    for _t, _v in _h.items():
        _dlp, _dlq = cruce(_v["dd"], _v["ds"], _par[0], _par[1])
        assert abs(_dlp - _v["dlnP"]) < 1e-12 and abs(_dlq - _v["dlnQ"]) < 1e-12, (_par, _t)

# ---- ingenuos ----------------------------------------------------------------------------
g_P = (lnP[ANIO_BASE] - lnP[2020]) / 3
ING = {t: (lnQ[ANIO_BASE], lnP[ANIO_BASE] + (t - ANIO_BASE) * g_P) for t in ANIOS_PROY}
g_P_dd = (lnP_dd[ANIO_BASE] - lnP_dd[2020]) / 3
ING_DD = {t: (lnQ[ANIO_BASE], lnP_dd[ANIO_BASE] + (t - ANIO_BASE) * g_P_dd) for t in ANIOS_PROY}


# ---- métricas ----------------------------------------------------------------------------
def signo(x):
    return (x > 0) - (x < 0)


def pearson(x, y):
    n = len(x)
    if n < 3:
        return None
    mx, my = sum(x) / n, sum(y) / n
    sx = math.sqrt(sum((a - mx) ** 2 for a in x))
    sy = math.sqrt(sum((b - my) ** 2 for b in y))
    return None if sx == 0 or sy == 0 else sum((a - mx) * (b - my) for a, b in zip(x, y)) / (sx * sy)


def rangos(x):
    o = sorted(range(len(x)), key=lambda i: x[i])
    r = [0.0] * len(x)
    i = 0
    while i < len(o):
        j = i
        while j + 1 < len(o) and x[o[j + 1]] == x[o[i]]:
            j += 1
        for k in range(i, j + 1):
            r[o[k]] = (i + j) / 2 + 1
        i = j + 1
    return r


def corr_block(imp, con, anios):
    anios = [t for t in anios if t in imp and t in con]
    x, y = [imp[t] for t in anios], [con[t] for t in anios]
    return dict(anios=anios, n=len(anios), pearson=pearson(x, y),
                spearman=pearson(rangos(x), rangos(y)) if len(anios) >= 3 else None,
                aciertos_signo=sum(signo(a) == signo(b) for a, b in zip(x, y)),
                implicito=[round(v, 5) for v in x], construido=[round(v, 5) for v in y])


def metricas(central, banda, ing, lnP_, banda_ancha=None):
    obs = {t: (lnQ[t], lnP_[t]) for t in ANIOS_PROY}
    m = {"por_anio": {}, "mae_log": {}}
    for i, var in ((0, "Q"), (1, "P_real")):
        for t in ANIOS_PROY:
            err = central[t][i] - obs[t][i]
            e_ing = ing[t][i] - obs[t][i]
            lo, hi = banda[t]["Q" if i == 0 else "P"]
            row = dict(proyectado=math.exp(central[t][i]), observado=math.exp(obs[t][i]),
                       error_log=err, error_pct=math.expm1(err) * 100, abs_error_log=abs(err),
                       signo_ok=signo(central[t][i] - lnQ[ANIO_BASE] if i == 0 else central[t][i] - lnP_[ANIO_BASE]) ==
                       signo(obs[t][i] - (lnQ[ANIO_BASE] if i == 0 else lnP_[ANIO_BASE])),
                       banda=[math.exp(lo), math.exp(hi)], ancho_banda_log=hi - lo,
                       cambio_observado_vs_2023_pct=math.expm1(obs[t][i] - (lnQ[ANIO_BASE] if i == 0 else lnP_[ANIO_BASE])) * 100,
                       dentro_banda=bool(lo - 1e-12 <= obs[t][i] <= hi + 1e-12),
                       ingenuo=math.exp(ing[t][i]), error_log_ingenuo=e_ing, error_pct_ingenuo=math.expm1(e_ing) * 100,
                       metodo_mejor_que_ingenuo=bool(abs(err) < abs(e_ing)))
            if banda_ancha is not None:
                lo2, hi2 = banda_ancha[t]["Q" if i == 0 else "P"]
                row["banda_ancha"] = [math.exp(lo2), math.exp(hi2)]
                row["dentro_banda_ancha"] = bool(lo2 - 1e-12 <= obs[t][i] <= hi2 + 1e-12)
            m["por_anio"][f"{var}_{t}"] = row
        m["mae_log"][var] = dict(metodo=sum(abs(central[t][i] - obs[t][i]) for t in ANIOS_PROY) / 2,
                                 ingenuo=sum(abs(ing[t][i] - obs[t][i]) for t in ANIOS_PROY) / 2)
        m["mae_log"][var]["metodo_supera_a_ingenuo"] = bool(m["mae_log"][var]["metodo"] < m["mae_log"][var]["ingenuo"])
    m["max_abs_error_log_h2"] = max(abs(m["por_anio"][f"Q_2025"]["error_log"]), abs(m["por_anio"][f"P_real_2025"]["error_log"]))
    return m


def jf(x, n=6):
    if isinstance(x, float):
        return round(x, n)
    if isinstance(x, dict):
        return {str(k): jf(v, n) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [jf(v, n) for v in x]
    return x


def proyeccion_pub(tr):
    return {str(t): dict(Q=round(math.exp(tr[t][0]), 1), P_real=round(math.exp(tr[t][1]), 3)) for t in ANIOS_PROY}


# =============================================================================================
R = {}
# --- historia titular
HA = variante_A(lnP)
hist_pub = {}
for t in ANIOS_HIST:
    h = HA["hist"][PAR_BASE][t]
    hist_pub[str(t)] = dict(Q=Q[t], P_nominal=Pn[t], INPC=INPC[t], P_real=math.exp(lnP[t]), dlnQ=h["dlnQ"], dlnP_real=h["dlnP"],
                            pct_Q=math.expm1(h["dlnQ"]) * 100, pct_P_real=math.expm1(h["dlnP"]) * 100,
                            delta_d_implicito=h["dd"], delta_s_implicito=h["ds"],
                            pct_D=math.expm1(h["dd"]) * 100, pct_S=math.expm1(h["ds"]) * 100)

# --- A titular
mA = metricas(HA["central"], HA["banda"], ING, lnP, HA["banda_ancha"])
R["variante_A"] = dict(
    definicion="Incondicional: δd y δs implícitos 2021–2023 (mediana=base; mín/máx conjuntos=bajo/alto), mismas elasticidades en descomposición y proyección, malla e_d×e_s 3×3; acumulado desde 2023.",
    deflactor=DEFLACTOR,
    punto_titular=proyeccion_pub(HA["central"]), delta_d_base=HA["dd_base"], delta_s_base=HA["ds_base"],
    pct_D_base=math.expm1(HA["dd_base"]) * 100, pct_S_base=math.expm1(HA["ds_base"]) * 100,
    banda_titular={str(t): dict(Q=[math.exp(HA["banda"][t]["Q"][0]), math.exp(HA["banda"][t]["Q"][1])],
                                P_real=[math.exp(HA["banda"][t]["P"][0]), math.exp(HA["banda"][t]["P"][1])]) for t in ANIOS_PROY},
    banda_ancha={str(t): dict(Q=[math.exp(HA["banda_ancha"][t]["Q"][0]), math.exp(HA["banda_ancha"][t]["Q"][1])],
                              P_real=[math.exp(HA["banda_ancha"][t]["P"][0]), math.exp(HA["banda_ancha"][t]["P"][1])]) for t in ANIOS_PROY},
    historia=hist_pub)

# --- ingenuo
R["ingenuo"] = dict(
    definicion="Q_t = Q_2023; P real crece a ḡ = (ln P_2023 − ln P_2020)/3 por año.",
    g_P_real_anual_pct=math.expm1(g_P) * 100,
    proyeccion=proyeccion_pub(ING))

# --- B: demanda candidata por variante
dln_tasa = dlnr
oferta_reg = {L: ds_pipeline(REG, L) for L in L_RANGO}
oferta_ver = {L: ds_pipeline(VER, L) for L in LV_RANGO}
dd_hist_impl = {t: HA["hist"][PAR_BASE][t]["dd"] for t in ANIOS_HIST}
ds_hist_impl = {t: HA["hist"][PAR_BASE][t]["ds"] for t in ANIOS_HIST}


def correr_B(nombre, dd_dict, rotulo, origen=REG, L_c=L_C, L_rango=L_RANGO, lnP_=None, ing=None, etiqueta_dd=""):
    lnP_ = lnP if lnP_ is None else lnP_
    ing = ING if ing is None else ing
    if not all(t in dd_dict for t in ANIOS_PROY):
        return dict(estado="no disponible", motivo="δd no construible para 2024 y 2025 con los insumos admitidos", rotulo=rotulo)
    B = variante_B({t: dd_dict[t] for t in ANIOS_PROY}, origen, L_c, L_rango, lnP_)
    met = metricas(B["central"], B["banda"], ing, lnP_)
    cor = corr_block(dd_hist_impl if lnP_ is lnP else {t: historia(lnP_)[PAR_BASE][t]["dd"] for t in ANIOS_HIST}, dd_dict, ANIOS_HIST)
    return dict(estado="calculada", rotulo=rotulo, etiqueta_dd=etiqueta_dd,
                delta_d_construido={str(t): v for t, v in dd_dict.items()},
                delta_s_pipeline={str(t): v for t, v in B["ds"].items()}, a_calibrada=B["a"],
                punto=proyeccion_pub(B["central"]),
                banda={str(t): dict(Q=[math.exp(B["banda"][t]["Q"][0]), math.exp(B["banda"][t]["Q"][1])],
                                    P_real=[math.exp(B["banda"][t]["P"][0]), math.exp(B["banda"][t]["P"][1])]) for t in ANIOS_PROY},
                metricas=met, correlacion_delta_d=cor)


e_ext, e_y, e_r = EL["e_ext"]["base"], EL["e_y"]["base"], EL["e_r"]["base"]
sens = {}

# B-completa (titular): sólo Hermosillo con calidad admitida
if disp_B_completa:
    dd_c = dd_construida(dln_nivel(emp_h, ANIOS_HIST), dln_ingreso_real(sal_h, ANIOS_HIST) if sal_h else None, dln_tasa, e_ext, e_y, e_r, ANIOS_HIST)
    B_tit = correr_B("B-completa", dd_c, "titular: empleo e ingreso de Hermosillo, calidad admitida")
else:
    B_tit = dict(estado="no disponible",
                 motivo="C05 no obtuvo empleo IMSS ni salario de cotización de Hermosillo para 2020–2024 con calidad admitida (sólo dic-2025 en prensa; 2019–2024 `por verificar`). No se completa con Sonora ni con valores por verificar (preregistro §7).",
                 empleo_hermosillo_calidad_admitida={str(y): v for y, v in emp_h.items()},
                 salario_hermosillo_calidad_admitida={str(y): v for y, v in sal_h.items()})

# sensibilidades de B (rotuladas; posteriores al titular pero previstas en el preregistro §7 y §11)
sens["B-parcial-solo-tasa"] = correr_B("B-parcial", dd_construida(None, None, dln_tasa, e_ext, e_y, e_r, ANIOS_HIST),
                                       "SENSIBILIDAD · δd = solo el término de tasa hipotecaria (nacional, dic/dic); NO es el δd completo; sin empleo ni ingreso", etiqueta_dd="e_r·Δln(tasa)")
dd_s = dd_construida(dln_nivel(emp_s, ANIOS_HIST), dln_ingreso_real(sal_s, ANIOS_HIST), dln_tasa, e_ext, e_y, e_r, ANIOS_HIST)
sens["B-sonora"] = correr_B("B-sonora", dd_s, "SENSIBILIDAD · empleo y salario de SONORA (no Hermosillo) + tasa nacional; 2021 sin δd (falta dic-2020 de la misma definición); declarado como proxy estatal",
                            etiqueta_dd="e_ext·Δln(puestos Sonora)+e_y·Δln(salario real Sonora)+e_r·Δln(tasa)")
dd_pv = dd_construida(dln_nivel(emp_h_pv, ANIOS_HIST), dln_ingreso_real(sal_h_pv, ANIOS_HIST), dln_tasa, e_ext, e_y, e_r, ANIOS_HIST)
sens["B-por-verificar-Hermosillo"] = correr_B("B-pv", dd_pv, "SENSIBILIDAD · valores de Hermosillo de C05 con calidad `por verificar` (fuente no reabierta); no son dato",
                                              etiqueta_dd="e_ext·Δln(puestos Hermosillo pv)+e_y·Δln(salario Hermosillo pv)+e_r·Δln(tasa)")
# S2: oferta con verificación→DTU
for k in ("B-parcial-solo-tasa", "B-sonora", "B-por-verificar-Hermosillo"):
    ddk = {"B-parcial-solo-tasa": dd_construida(None, None, dln_tasa, e_ext, e_y, e_r, ANIOS_HIST), "B-sonora": dd_s, "B-por-verificar-Hermosillo": dd_pv}[k]
    sens[k + "+S2-verificacion"] = correr_B(k, ddk, "SENSIBILIDAD S2 · oferta con verificación→DTU (L=12; 9–23) en lugar de registro→DTU", origen=VER, L_c=LV_C, L_rango=LV_RANGO)
# S1: deflactor dic–dic
HA_dd = variante_A(lnP_dd)
sens["A+S1-deflactor-dic-dic"] = dict(rotulo="SENSIBILIDAD S1 · deflactor provisional dic–dic", punto=proyeccion_pub(HA_dd["central"]),
                                      metricas=metricas(HA_dd["central"], HA_dd["banda"], ING_DD, lnP_dd))
# S3: δ de A fijos a la historia con elasticidades base; sólo la malla en cruce()
HA_fix = variante_A(lnP, coherente=False)
sens["A+S3-delta-fijos-base"] = dict(rotulo="SENSIBILIDAD S3 · δ implícitos con elasticidades base; la malla sólo entra en cruce()", punto=proyeccion_pub(HA_fix["central"]),
                                     metricas=metricas(HA_fix["central"], HA_fix["banda"], ING, lnP))
# S4: media en lugar de mediana
HA_med = variante_A(lnP, agregador=lambda v: sum(v) / len(v))
sens["A+S4-media"] = dict(rotulo="SENSIBILIDAD S4 · media en lugar de mediana", punto=proyeccion_pub(HA_med["central"]),
                          metricas=metricas(HA_med["central"], HA_med["banda"], ING, lnP))
# S6: extremos de e_ext, e_y, e_r sobre B-sonora y B-por-verificar (punto central)
s6 = {}
for nombre, emp_n, sal_n in (("B-sonora", emp_s, sal_s), ("B-por-verificar-Hermosillo", emp_h_pv, sal_h_pv)):
    ds_c, _ = ds_pipeline(REG, L_C)
    errs = []
    for ex, ey_, er_ in itertools.product((EL["e_ext"]["minimo"], EL["e_ext"]["maximo"]), (EL["e_y"]["minimo"], EL["e_y"]["maximo"]), (EL["e_r"]["minimo"], EL["e_r"]["maximo"])):
        d_ = dd_construida(dln_nivel(emp_n, ANIOS_HIST), dln_ingreso_real(sal_n, ANIOS_HIST), dln_tasa, ex, ey_, er_, ANIOS_HIST)
        if not all(t in d_ for t in ANIOS_PROY):
            continue
        tr = tray(d_, ds_c, PAR_BASE[0], PAR_BASE[1], lnQ[ANIO_BASE], lnP[ANIO_BASE])
        errs.append(dict(e_ext=ex, e_y=ey_, e_r=er_, error_log_Q_2025=tr[2025][0] - lnQ[2025], error_log_P_2025=tr[2025][1] - lnP[2025],
                         error_log_Q_2024=tr[2024][0] - lnQ[2024], error_log_P_2024=tr[2024][1] - lnP[2024]))
    s6[nombre] = errs
sens["S6-extremos-e_ext-e_y-e_r"] = dict(rotulo="SENSIBILIDAD S6 · e_ext, e_y, e_r en extremos (punto central, e_d=0.7, e_s=1.5, L=14)", combinaciones=s6)

# diagnóstico de oferta: δs implícito vs δs de pipeline (registro, L=14), 2022–2025 (n=4; 2022–2023 in-sample por a)
ds_c14, a14 = oferta_reg[L_C]
diag_oferta = dict(corr_ds=corr_block(ds_hist_impl, ds_c14, (2022, 2023, 2024, 2025)),
                   nota="δs implícito (e_s=1.5) vs δs pipeline registro→DTU L=14; a calibrada con 2022–2023, así que 2022–2023 son in-sample; n=4", a_L14=a14,
                   ds_pipeline_por_rezago={str(L): {str(t): v for t, v in oferta_reg[L][0].items()} for L in L_RANGO})

R["variante_B"] = dict(
    definicion="Condicional: δd con desplazadores realizados (e_ext·Δln empleo + e_y·Δln ingreso real + e_r·Δln tasa) y δs = pipeline RUV (registro→DTU, L=14; 10–24); sin cartera ni inventario por no existir vintage 2023; malla e_d×e_s × rezago; acumulado desde 2023.",
    titular=B_tit,
    vintage="No existe vintage de cartera de 2023; la oferta de B es sólo pipeline RUV (s_cartera = s_inventario = 0). Datos al 2026-11-01 (pseudo-fuera de muestra).",
    sensibilidades=sens, diagnostico_oferta=diag_oferta)

# --- métricas globales
R["metricas"] = dict(
    A=mA,
    B_titular=(B_tit.get("metricas") if B_tit.get("estado") == "calculada" else "no disponible"),
    correlacion_delta_d_titular=(B_tit.get("correlacion_delta_d") if B_tit.get("estado") == "calculada" else "no disponible"),
    correlacion_delta_d_sensibilidades={k: v.get("correlacion_delta_d") for k, v in sens.items() if isinstance(v, dict) and v.get("estado") == "calculada" and "correlacion_delta_d" in v and "+S2" not in k},
    sensibilidad_mismo_P_ingenuo=dict(g_P_real_anual_pct=math.expm1(g_P) * 100),
)

# --- veredicto (preregistro §9)
frases, detalle, fuera_anios = [], [], []
for var in ("Q", "P_real"):
    for t in ANIOS_PROY:
        r = mA["por_anio"][f"{var}_{t}"]
        if not r["dentro_banda"]:
            detalle.append(f"A · {var} {t}: observado {r['observado']:.1f} fuera de la banda titular [{r['banda'][0]:.1f}, {r['banda'][1]:.1f}] (error {r['error_pct']:+.1f} % del punto central)")
            fuera_anios.append(t)
tit_B = B_tit if B_tit.get("estado") == "calculada" else None
if tit_B:
    for var in ("Q", "P_real"):
        for t in ANIOS_PROY:
            r = tit_B["metricas"]["por_anio"][f"{var}_{t}"]
            if not r["dentro_banda"]:
                detalle.append(f"B · {var} {t}: fuera de banda")
                fuera_anios.append(t)
fuera_anios = sorted(set(fuera_anios))
R1 = bool(detalle)
if R1:
    frases.append("; ".join(f"«el método no contuvo {a}»" for a in fuera_anios))
no_supera = [f"A · {v}" for v in ("Q", "P_real") if not mA["mae_log"][v]["metodo_supera_a_ingenuo"]]
if tit_B:
    no_supera += [f"B · {v}" for v in ("Q", "P_real") if not tit_B["metricas"]["mae_log"][v]["metodo_supera_a_ingenuo"]]
R2 = bool(no_supera)
if R2:
    frases.append("«en 2024–2025 el método no superó a la inercia»")
ensanche = mA["max_abs_error_log_h2"] if not tit_B else max(mA["max_abs_error_log_h2"], tit_B["metricas"]["max_abs_error_log_h2"])
R["metricas"]["reglas_veredicto"] = dict(R1_fuera_de_banda=R1, R1_detalle=detalle, R2_no_supero_ingenuo=R2, R2_detalle=no_supera,
                                         R3_ensanche_minimo_log=ensanche, R3_ensanche_minimo_pct=math.expm1(ensanche) * 100, R3_aplica=R1,
                                         R3_error_h2_por_variable=dict(Q=abs(mA["por_anio"]["Q_2025"]["error_log"]), P_real=abs(mA["por_anio"]["P_real_2025"]["error_log"])))


def fmt(v):
    return f"{v:+.1f} %"


def resumen_A():
    s = []
    for t in ANIOS_PROY:
        q, p = mA["por_anio"][f"Q_{t}"], mA["por_anio"][f"P_real_{t}"]
        s.append(f"{t}: Q proyectado {q['proyectado']:.0f} vs observado {q['observado']:.0f} (error {fmt(q['error_pct'])}; ingenuo {fmt(q['error_pct_ingenuo'])}); "
                 f"P real proyectado {p['proyectado']:.1f} vs observado {p['observado']:.1f} (error {fmt(p['error_pct'])}; ingenuo {fmt(p['error_pct_ingenuo'])})")
    return " | ".join(s)


texto = []
if frases:
    texto.append("Frases de §3 activadas (criterios-fase2): " + "; ".join(frases) + ".")
texto.append("Variante A (incondicional, titular): " + resumen_A() + ".")
def _pos(var, t):
    r = mA["por_anio"][f"{var}_{t}"]
    return (math.log(r["observado"]) - math.log(r["banda"][0])) / (math.log(r["banda"][1]) - math.log(r["banda"][0]))


texto.append("R1 (fuera de banda titular) " + ("SE ACTIVA." if R1 else "NO se activa: no se emite «el método no contuvo 2024/2025».") +
             " Contexto de la banda titular de A: Q 2024 [" + f"{mA['por_anio']['Q_2024']['banda'][0]:.0f}, {mA['por_anio']['Q_2024']['banda'][1]:.0f}] y 2025 [{mA['por_anio']['Q_2025']['banda'][0]:.0f}, {mA['por_anio']['Q_2025']['banda'][1]:.0f}]"
             f" (ancho log {mA['por_anio']['Q_2024']['ancho_banda_log']:.2f} y {mA['por_anio']['Q_2025']['ancho_banda_log']:.2f}); P real 2024 [{mA['por_anio']['P_real_2024']['banda'][0]:.1f}, {mA['por_anio']['P_real_2024']['banda'][1]:.1f}] y 2025 [{mA['por_anio']['P_real_2025']['banda'][0]:.1f}, {mA['por_anio']['P_real_2025']['banda'][1]:.1f}]. "
             f"Posición del observado dentro de la banda (0 = borde inferior, 1 = superior): Q {_pos('Q', 2024):.2f} y {_pos('Q', 2025):.2f}; P real {_pos('P_real', 2024):.2f} y {_pos('P_real', 2025):.2f}. "
             "Acierto de signo del punto central de A (cambio vs 2023): " + "; ".join(f"{v.replace('_', ' ')} {t}: {'sí' if mA['por_anio'][f'{v}_{t}']['signo_ok'] else 'no'}" for v in ("Q", "P_real") for t in ANIOS_PROY) + ".")
if R1:
    texto.append("Fuera de banda titular: " + "; ".join(detalle) + ".")
else:
    texto.append("En la variante A los observados de Q y P real de 2024 y 2025 quedaron dentro de la banda titular (escenarios × malla de elasticidades).")
if R2:
    texto.append("Frente a la inercia, el MAE log 2024–2025 no mejoró en: " + ", ".join(no_supera) + ".")
else:
    texto.append("El MAE log 2024–2025 del método fue menor que el del ingenuo en Q y en P real.")
texto.append("Variante B titular: " + ("calculada." if tit_B else "NO DISPONIBLE: no existe empleo IMSS ni salario de cotización de Hermosillo 2020–2024 con calidad admitida (C05); lo que sigue es sensibilidad con proxies (Sonora / por verificar / sólo tasa), no titular."))
# sensibilidades de B y diagnóstico de oferta (no titulares), generados desde los resultados
for k in ("B-parcial-solo-tasa", "B-sonora"):
    v = sens[k]
    if v.get("estado") != "calculada":
        continue
    fb = [kk.replace("_", " ") for kk, r in v["metricas"]["por_anio"].items() if not r["dentro_banda"]]
    c = v["correlacion_delta_d"]
    texto.append(f"Sensibilidad {k} (no titular): fuera de banda: {', '.join(fb) or 'ninguno'}; MAE log Q {v['metricas']['mae_log']['Q']['metodo']:.3f} y P real {v['metricas']['mae_log']['P_real']['metodo']:.3f} "
                 f"(ingenuo {v['metricas']['mae_log']['Q']['ingenuo']:.3f} y {v['metricas']['mae_log']['P_real']['ingenuo']:.3f}); correlación δd implícito vs construido Pearson {c['pearson']:.2f}, Spearman {c['spearman']:.2f}, n={c['n']}.")
_ds = diag_oferta["ds_pipeline_por_rezago"][str(L_C)]
texto.append(f"Diagnóstico de oferta: el pipeline registro→DTU (L=14) anunciaba δs de {math.expm1(_ds['2024'])*100:+.0f} % (2024) y {math.expm1(_ds['2025'])*100:+.0f} % (2025) mientras el DTU observado creció "
             f"{(DTU[2024]/DTU[2023]-1)*100:+.0f} % y {(DTU[2025]/DTU[2024]-1)*100:+.0f} %; correlación con el δs implícito Pearson {diag_oferta['corr_ds']['pearson']:.2f}, Spearman {diag_oferta['corr_ds']['spearman']:.2f}, n=4: el rezago de C01 no está identificado (como C01 advierte), por eso la oferta de B no es confiable.")
texto.append(f"Ensanche mínimo exigido a la banda 2027–2030 si R1 aplica: error absoluto máximo de h=2 = {mA['max_abs_error_log_h2']:.3f} en log ({math.expm1(ensanche)*100:.1f} %); aplica = {R1}.")
texto.append("Pseudo-fuera de muestra: vintage de datos actual y elasticidades fijadas con la serie 2020–2025 ya disponible; favorece al método. Dos puntos (2024, 2025) no prueban exactitud ni su ausencia.")
R["veredicto_texto"] = " ".join(texto)
R["meta"] = dict(deflactor_titular=DEFLACTOR, elasticidades={k: v for k, v in EL.items()},
                 e_ext_nota="fijada en preregistro (1.0 [0.5–1.5]); no está en supuestos.csv",
                 malla_e_d_x_e_s=[list(p) for p in MALLA], insumos=INSUMOS)

with open(os.path.join(AQUI, "resultados.json"), "w", encoding="utf-8") as fh:
    json.dump(jf(R), fh, ensure_ascii=False, indent=1, sort_keys=True)

# ---- series.csv (14 columnas, calidad estimado) -----------------------------------------------
COLS = ["serie_id", "variable", "unidad", "geografia", "segmento", "periodo", "valor", "fuente_id", "url", "localizador", "fecha_corte", "fecha_consulta", "calidad", "nota"]
FILAS = []
INSUMOS_TXT = "01_base/series-integradas.csv; 01_base/f2-c01-pipeline/series.csv; 01_base/f2-c07-credito/series.csv; 01_base/f2-c05-empleo/series.csv; 02_cruces/supuestos.csv"
# R-C10-1 (dictamen): `url` = fuente primaria del dato comparado (Q: SNIIV Infonavit vía q-viviendas-financiadas-nueva-dedup; P: SHF vía p-shf-indice-hermosillo-anual;
# correlaciones y métricas mixtas: la de Q). `localizador` = ruta de la clave en resultados.json.
URL_Q = "https://sniiv.sedatu.gob.mx/api/CuboAPI/GetInfonavit/2020,2026/26/030/anio,tipo_credito,modalidad"


def url_p(anio):
    return f"https://sniiv.sedatu.gob.mx/api/ShfPriceAPI/GetTerritorialVariation?baseYear={anio}&baseQuarter=1&finalYear={anio}&finalQuarter=4"


_CAMPO = {"proyectado": "proyectado", "observado": "observado", "error-log": "error_log", "error-pct": "error_pct", "signo-ok": "signo_ok",
          "dentro-banda": "dentro_banda", "dentro-banda-ancha": "dentro_banda_ancha"}
_SENS = {"sonora": "B-sonora", "parcial-tasa": "B-parcial-solo-tasa", "por-verificar": "B-por-verificar-Hermosillo"}


def ruta_json(sid, periodo):
    """Ruta (punteada) de la clave de resultados.json que contiene el valor de la fila `sid`/`periodo`."""
    import re
    V = {"q": "Q", "p-real": "P_real"}
    m = re.fullmatch(r"f2-c10-(a|ingenuo)-(q|p-real)-(mae-log)", sid)
    if m:
        return f"metricas.A.mae_log.{V[m.group(2)]}." + ("metodo" if m.group(1) == "a" else "ingenuo")
    m = re.fullmatch(r"f2-c10-a-error-abs-max-h2", sid)
    if m:
        return "metricas.A.max_abs_error_log_h2"
    m = re.fullmatch(r"f2-c10-(a|ingenuo)-(q|p-real)-(proyectado|observado|error-log|error-pct|signo-ok|dentro-banda-ancha|dentro-banda)", sid)
    if m:
        campo = _CAMPO[m.group(3)] + ("_ingenuo" if m.group(1) == "ingenuo" else "")
        return f"metricas.A.por_anio.{V[m.group(2)]}_{periodo}.{campo}"
    m = re.fullmatch(r"f2-c10-b-(sonora|parcial-tasa|por-verificar)-corr-delta-d", sid)
    if m:
        return f"variante_B.sensibilidades.{_SENS[m.group(1)]}.correlacion_delta_d.pearson"
    m = re.fullmatch(r"f2-c10-b-(sonora|parcial-tasa|por-verificar)-(q|p-real)-(error-log|dentro-banda)", sid)
    if m:
        return f"variante_B.sensibilidades.{_SENS[m.group(1)]}.metricas.por_anio.{V[m.group(2)]}_{periodo}.{_CAMPO[m.group(3)]}"
    raise KeyError(sid)


def fila(sid, var, unidad, periodo, valor, nota, seg="nueva"):
    url = url_p(periodo if periodo in ("2020", "2021", "2022", "2023", "2024", "2025") else "2025") if "-p-real" in sid else URL_Q
    loc = "01_base/f2-c10-backtest/resultados.json → " + ruta_json(sid, periodo)
    nota = nota + " Insumos del cálculo: " + INSUMOS_TXT + "."
    FILAS.append([sid, var, unidad, "municipio Hermosillo", seg, periodo, f"{valor:.6f}".rstrip("0").rstrip(".") if isinstance(valor, float) else valor,
                  "F2C10-01", url, loc, "2026-07-31", "2026-11-01", "estimado", nota])


base_nota = "Backtest C10 (preregistro.md, sha256 en checkpoints.md). Pseudo-fuera de muestra: datos al 2026-11-01. Dos años no prueban exactitud. "
for t in ANIOS_PROY:
    for var, slug, u in (("Q", "q", "viviendas"), ("P_real", "p-real", "índice SHF a precios de 2025")):
        r = mA["por_anio"][f"{var}_{t}"]
        n = base_nota + f"Variante A incondicional (escenario base, e_d=0.7, e_s=1.5, mediana δ 2021–2023, acumulado desde 2023); deflactor: {DEFLACTOR}. "
        fila(f"f2-c10-a-{slug}-proyectado", f"Backtest A: {var} proyectado", u, str(t), r["proyectado"], n)
        fila(f"f2-c10-a-{slug}-observado", f"Backtest: {var} observado (misma base)", u, str(t), r["observado"], n)
        fila(f"f2-c10-a-{slug}-error-log", f"Backtest A: error logarítmico de {var} (ln proy − ln obs)", "ln", str(t), r["error_log"], n)
        fila(f"f2-c10-a-{slug}-error-pct", f"Backtest A: error de {var}", "%", str(t), r["error_pct"], n + "= e^x − 1 sobre el error log.")
        fila(f"f2-c10-a-{slug}-signo-ok", f"Backtest A: acierto de signo de {var} vs 2023 (1=sí)", "binario", str(t), int(r["signo_ok"]), n)
        fila(f"f2-c10-a-{slug}-dentro-banda", f"Backtest A: observado de {var} dentro de la banda titular (1=sí)", "binario", str(t), int(r["dentro_banda"]), n + f"Banda titular = escenarios bajo/base/alto × malla e_d×e_s; rango [{r['banda'][0]:.1f}, {r['banda'][1]:.1f}].")
        fila(f"f2-c10-a-{slug}-dentro-banda-ancha", f"Backtest A: observado de {var} dentro de la banda ancha (1=sí)", "binario", str(t), int(r["dentro_banda_ancha"]), n + f"Banda ancha (secundaria): δd y δs independientes × malla; rango [{r['banda_ancha'][0]:.1f}, {r['banda_ancha'][1]:.1f}].")
        fila(f"f2-c10-ingenuo-{slug}-error-log", f"Backtest ingenuo: error logarítmico de {var}", "ln", str(t), r["error_log_ingenuo"], base_nota + "Ingenuo: Q_t = Q_2023; P real al crecimiento promedio 2021–2023.")
        fila(f"f2-c10-ingenuo-{slug}-error-pct", f"Backtest ingenuo: error de {var}", "%", str(t), r["error_pct_ingenuo"], base_nota + "Ingenuo: Q_t = Q_2023; P real al crecimiento promedio 2021–2023.")
for var, slug in (("Q", "q"), ("P_real", "p-real")):
    fila(f"f2-c10-a-{slug}-mae-log", f"Backtest A: MAE log 2024–2025 de {var}", "ln", "2025", mA["mae_log"][var]["metodo"], base_nota + "Métrica sobre 2024–2025 (periodo = 2025 por contrato). Promedio de |error log| de 2024 y 2025.")
    fila(f"f2-c10-ingenuo-{slug}-mae-log", f"Backtest ingenuo: MAE log 2024–2025 de {var}", "ln", "2025", mA["mae_log"][var]["ingenuo"], base_nota + "Métrica sobre 2024–2025 (periodo = 2025 por contrato). Promedio de |error log| de 2024 y 2025.")
fila("f2-c10-a-error-abs-max-h2", "Backtest A: error absoluto máximo de h=2 (referencia; R3 no se activó, no ensanchar la banda 2027–2030)", "ln", "2025", ensanche, base_nota + f"Referencia; R3 no se activó, no ensanchar (R3 aplica = {R1}).")
for k, v in sens.items():
    if isinstance(v, dict) and v.get("estado") == "calculada" and "+S2" not in k:
        sfx = {"B-sonora": "-sonora", "B-parcial-solo-tasa": "-parcial-tasa", "B-por-verificar-Hermosillo": "-por-verificar"}.get(k, "-sens")
        for t in ANIOS_PROY:
            for var, slug in (("Q", "q"), ("P_real", "p-real")):
                r = v["metricas"]["por_anio"][f"{var}_{t}"]
                n = base_nota + "SENSIBILIDAD (no titular; B-completa no disponible). " + v["rotulo"]
                fila(f"f2-c10-b{sfx}-{slug}-error-log", f"Backtest B sensibilidad{sfx}: error log de {var}", "ln", str(t), r["error_log"], n)
                fila(f"f2-c10-b{sfx}-{slug}-dentro-banda", f"Backtest B sensibilidad{sfx}: {var} dentro de la banda (1=sí)", "binario", str(t), int(r["dentro_banda"]), n)
        c = v["correlacion_delta_d"]
        if c.get("pearson") is not None:
            fila(f"f2-c10-b{sfx}-corr-delta-d", f"Backtest B sensibilidad{sfx}: correlación Pearson δd implícito vs construido", "coeficiente", "2025", c["pearson"],
                 base_nota + f"Métrica sobre {min(c['anios'])}–{max(c['anios'])} (periodo = 2025 por contrato). SENSIBILIDAD. n={c['n']} (no es prueba). " + v["rotulo"])
# R-C10-1: el estado de B titular («no disponible») va en notas.md y en resultados.json (variante_B.titular.estado), no como fila.
with open(os.path.join(AQUI, "series.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh, quoting=csv.QUOTE_ALL)
    w.writerow(COLS)
    w.writerows(FILAS)

# resumen en pantalla
print("deflactor:", DEFLACTOR)
print("B titular:", B_tit.get("estado"))
print(R["veredicto_texto"])
