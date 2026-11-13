#!/usr/bin/env python3
"""C09 · Supuestos de escenarios 2027–2030 · Terra-9 · 2026-11-01.

Reproducible con:  python3 -I 01_base/f2-c09-supuestos/calculos.py   (desde la raíz del estudio o desde cualquier lugar)
Lee SOLO: 01_base/series-integradas.csv, 01_base/f2-c03-cartera-publica/cartera.csv, 01_base/f2-c04-cartera-privada/cartera.csv.
Escribe SOLO en su carpeta: parametros.csv, supuestos.csv, probabilidades.csv, parametros-sensibilidad-hogares.csv.

Contrato de salida = docstring de 02_cruces/escenarios.py (v2): cada «valor» de parametros.csv es % de VARIACIÓN ANUAL contra
el año previo (el motor encadena); s_cartera es sólo la parte que no está en la tubería (aquí: el segmento Popular/Bienestar,
que s_pipeline no cubre), y su nota dice «incremental sobre pipeline».

Ningún número de parametros/probabilidades se teclea: todo sale de las series. Las únicas constantes son DECISIONES DE SUPUESTO,
declaradas abajo con su justificación (y repetidas en las notas de cada fila).
"""
import csv, math, os, statistics, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
SERIES = os.path.join(RAIZ, "01_base", "series-integradas.csv")
CART3 = os.path.join(RAIZ, "01_base", "f2-c03-cartera-publica", "cartera.csv")
CART4 = os.path.join(RAIZ, "01_base", "f2-c04-cartera-privada", "cartera.csv")
SI = "01_base/series-integradas.csv"
C3 = "01_base/f2-c03-cartera-publica/cartera.csv"
ESC = ("bajo", "base", "alto")
ANIOS = (2027, 2028, 2029, 2030)

# =====================================================================================================================
# DECISIONES DE SUPUESTO (únicas constantes; todo lo demás se deriva de los datos)
# =====================================================================================================================
# Elasticidades precio: copiadas de 02_cruces/supuestos.csv (Astra, metodo-curvas §3) sin cambio.
E_D = (0.7, 0.3, 1.5)            # base, mín, máx
E_S = (1.5, 0.5, 3.0)
E_Y = (0.8, 0.5, 1.0)            # Fontenla y González (2009), ingreso permanente 0.8; rango supuesto (criterios §2.3)
E_R = (-0.39, -0.6, -0.2)        # Fontenla y González (2009), elasticidad a la tasa (cambio RELATIVO)
# e_ext: respuesta de Q (crédito formal) al empleo formal. 1.0 = proporcionalidad: el universo elegible para crédito
# INFONAVIT/FOVISSSTE escala 1:1 con los cotizantes. Rango 0.5–1.5: abajo, los empleos nuevos tardan en acumular puntos
# (≈2 años de cotización) y son de salario bajo; arriba, la formalización eleva la demanda de crédito más que proporcional.
# Sin estimación local (n=5 no identifica). Coincide con el preregistro de C10 (e_ext = 1.0).
E_EXT = (1.0, 0.5, 1.5)
# Forma de la distribución gamma del rezago (C01 notas, convolución gamma: «formas 6–12 / 3 / 1.5» para μ bajo/central/alto).
FORMA = {"rapido": 6.0, "central": 3.0, "lento": 1.5}
# Años de inicios de obra que entran a la ponderación (k = 0..K). Más atrás no hay datos (la serie empieza en 2020).
K_MAX = 5
# Probabilidad de 'en_proyecto' y 'anunciada' sin evidencia local (criterios §2.5 d): centro del intervalo [0, etapa siguiente].
FACTOR_SIN_EVIDENCIA = 0.5
# Parte de la cartera INFONAVIT que se VENDE con crédito (dictamen-C03 R-C03-1: la renta no entra). Sin cifra publicada
# (C03: «vivienda en renta de INFONAVIT, mención sin cifra»): base 1.0; bajo 0.5 (supuesto de rango amplio).
F_VENTA = {"bajo": 0.5, "base": 1.0, "alto": 1.0}
# (Reentrega: se quitó RETRASO_POP; la lentitud Popular ahora sale de la calibración contra el DTU Popular observado, R-C09-1.)
# Meses desde el corte de datos (2026-07) hasta el fin del año t: h_t = 12·(t − 2026) + MESES_RESTO_2026.
MESES_RESTO_2026 = 5
POP = ("Popular hasta 158", "Popular hasta 200")
# Cifras de la auditoría de C01 (04_auditoria/dictamen-C01.md, Astra-2, 21:40Z) mientras llega la reentrega de C01:
#  · a = 0.678 (fracción registro→DTU, convolución forma 3; 0.633–0.728) — §B y §C.
#  · rezago registro→DTU 8–24 meses (método acumulado L = 8; mejor ajuste μ = 24); el central 14 es CONVENCIÓN — R-C01-4.
#  · verificación→DTU: método acumulado L = 7 (la convolución da 9/12/23) — §B.
# Si la reentrega trae rangos más amplios en f2-rezago-*, el código toma el más amplio (min de los bajos, max de los altos).
AUD_C01 = {"a_registro": 0.678, "mu_reg_min": 8.0, "mu_reg_max": 24.0, "mu_ver_min": 7.0}
# Fechas de referencia Censo 2020 (15-mar-2020) y EIC 2025 (15-oct-2025, = fecha_corte de f2-poblacion-eic2025): R-C06-4.
FECHA_CENSO, FECHA_EIC = (2020, 3, 15), (2025, 10, 15)


# =====================================================================================================================
# lectura
# =====================================================================================================================
def _num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


FILAS = list(csv.DictReader(open(SERIES, encoding="utf-8")))


def serie(sid, seg=None):
    out = {}
    for r in FILAS:
        if r["serie_id"] == sid and (seg is None or r["segmento"] == seg):
            v = _num(r["valor"])
            if v is not None:
                out[r["periodo"]] = v
    if not out:
        raise SystemExit(f"serie vacía: {sid} {seg or ''}")
    return out


def segmentos(sid):
    """{periodo: {segmento: valor}}"""
    out = {}
    for r in FILAS:
        if r["serie_id"] == sid and _num(r["valor"]) is not None:
            out.setdefault(r["periodo"], {})[r["segmento"]] = float(r["valor"])
    return out


def serie_opt(sid, periodo):
    try:
        return serie(sid).get(periodo)
    except SystemExit:
        return None


def cartera(path):
    return list(csv.DictReader(open(path, encoding="utf-8")))


med = statistics.median
pct = lambda x: 100.0 * x


# =====================================================================================================================
# utilidades: gamma
# =====================================================================================================================
def gamma_p(a, x):
    """P(a, x) regularizada inferior (serie de potencias; suficiente para x < 60)."""
    if x <= 0:
        return 0.0
    s = term = 1.0 / a
    n = 1
    while term > 1e-14 * s and n < 2000:
        term *= x / (a + n)
        s += term
        n += 1
    return min(1.0, s * math.exp(-x + a * math.log(x) - math.lgamma(a)))


def F_rezago(h, mu, k):
    """CDF del rezago gamma con media mu (meses) y forma k."""
    return gamma_p(k, h / (mu / k)) if h > 0 else 0.0


def pesos_anuales(mu, k, K=K_MAX):
    """Cohorte iniciada de manera uniforme dentro del año Y: w_j = fracción que obtiene DTU en Y+j (j=0..K) y masa truncada."""
    us = [0.05 + 0.1 * i for i in range(120)]
    w = []
    for j in range(K + 1):
        w.append(sum(F_rezago(12 * (j + 1) - u, mu, k) - F_rezago(12 * j - u, mu, k) for u in us) / len(us))
    return w, 1.0 - sum(w)


# =====================================================================================================================
# 1. DEMANDA
# =====================================================================================================================
q = serie("q-viviendas-financiadas-nueva-dedup")
Q_HIST = {int(p): v for p, v in q.items() if len(p) == 4}
Q_MAX_ANIO = max(Q_HIST, key=Q_HIST.get)
Q_MAX = Q_HIST[Q_MAX_ANIO]

# --- empleo: Sonora (Gob. Sonora citando IMSS, «trabajadores asegurados», diciembre) como aproximación de Hermosillo ---
son = serie("f2-imss-puestos-dic-sonora")
SON = {int(p[:4]): v for p, v in son.items()}
G_SON = {y: SON[y] / SON[y - 1] - 1 for y in sorted(SON) if y - 1 in SON}           # 2022–2025, misma base
EMP = {"base": med(G_SON.values()), "bajo": min(G_SON.values()), "alto": max(G_SON.values())}
iieg = serie("f2-imss-puestos-var-anual-sonora-iieg")                              # otra base: sólo sensibilidad
son_st = serie("empleo-imss-sonora-stock")                                          # misma base (Gob. Sonora/IMSS), prensa
son_jun26, son_oct = son_st["2026-06"], son_st["2025-10"]
E26_ALTO = son_jun26 / SON[2025] - 1                                                # jun-2026 sostenido a dic
E26_BAJO = son_jun26 * (SON[2025] / son_oct) / SON[2025] - 1                        # + caída oct→dic igual a 2025
E26_BASE = math.sqrt((1 + E26_ALTO) * (1 + E26_BAJO)) - 1
EMP26 = {"bajo": E26_BAJO, "base": E26_BASE, "alto": E26_ALTO}
hmo = serie("empleo-imss-hermosillo-stock")                                          # sólo contraste de signo (R-C05-2)
HMO_H1 = hmo["2026-06"] / hmo["2025-12"] - 1
SON_H1 = E26_ALTO

# --- ingreso real por trabajador ---
pib = serie("f2-exp-pib")
pib_min26 = serie("f2-exp-pib-min")["2026"]
DISP_PIB = pib["2026"] - pib_min26                                                  # dispersión publicada (2026)
ING = {"base": {}, "bajo": {}, "alto": {}}
sal_real = serie("f2-imss-salario-real-var-sonora")
SAL_MED = med(sal_real.values())
itaee = serie("macro-itaee-sonora-4t")
# R-C07-1: la banda de PIB 2027+ NO sale de la encuesta; sale de los extremos observados 2021–2025 de los dos indicadores
# de ingreso disponibles (actividad: ITAEE Sonora 4T a/a; ingreso por trabajador: salario real de cotización Sonora).
OBS_ING = list(itaee.values()) + list(sal_real.values())
ING_MIN, ING_MAX = min(OBS_ING), max(OBS_ING)
# REENTREGA R-C09-7: el PIB agregado incluye el crecimiento del empleo (margen extensivo, que ya entra por e_ext·g_empleo).
# Ingreso por trabajador = (1+actividad)/(1+empleo) − 1, el MISMO concepto en los tres escenarios:
#   base = (1+PIB mediana Banxico)/(1+g_empleo base) − 1;
#   bajo/alto = extremos observados 2022–2025 de (1+ITAEE Sonora 4T a/a)/(1+empleo Sonora dic/dic) − 1 (misma geografía en
#   numerador y denominador; 2021 no tiene empleo de la misma base). La banda sigue saliendo de extremos observados (R-C07-1).
ITAEE_Y = {int(p[:4]): v / 100 for p, v in itaee.items()}
ING_PT = {y: (1 + ITAEE_Y[y]) / (1 + G_SON[y]) - 1 for y in sorted(ITAEE_Y) if y in G_SON}
ING_PT_MIN, ING_PT_MAX = min(ING_PT.values()), max(ING_PT.values())
for a in ANIOS:
    b = pib[str(a)] if str(a) in pib else pib[max(pib)]                              # 2029–2030 = último publicado (2028)
    ING["base"][a] = 100 * ((1 + b / 100) / (1 + EMP["base"]) - 1)
    ING["bajo"][a] = 100 * ING_PT_MIN
    ING["alto"][a] = 100 * ING_PT_MAX
sm = serie("salario-minimo-general-diario")
SM_G = {int(p): sm[p] / sm[str(int(p) - 1)] - 1 for p in sm if str(int(p) - 1) in sm}

# --- tasa hipotecaria (cambio RELATIVO) ---
th = serie("f2-tasa-hipotecaria-mensual")
TH_DIC = {int(p[:4]): v for p, v in th.items() if p.endswith("-12")}
TH_REL = {y: TH_DIC[y] / TH_DIC[y - 1] - 1 for y in sorted(TH_DIC) if y - 1 in TH_DIC and 2021 <= y <= 2025}
TH_ULT = th[max(th)]
TH_NIV_MIN = min(TH_DIC[y] for y in range(2021, 2026))                              # extremos observados 2021–2025
TH_NIV_MAX = max(TH_DIC[y] for y in range(2021, 2026))
SUBE_MAX, BAJA_MAX = max(TH_REL.values()), min(TH_REL.values())
TASA = {"base": {a: 0.0 for a in ANIOS}, "alto": {}, "bajo": {}}
r_alto = r_bajo = TH_ULT
for a in ANIOS:
    n_alto = max(TH_NIV_MIN, r_alto * (1 + BAJA_MAX)); TASA["alto"][a] = n_alto / r_alto - 1; r_alto = n_alto
    n_bajo = min(TH_NIV_MAX, r_bajo * (1 + SUBE_MAX)); TASA["bajo"][a] = n_bajo / r_bajo - 1; r_bajo = n_bajo
obj = serie("f2-exp-tasa-fondeo")                                                 # encuesta: tasa de fondeo ≈ objetivo
dif = serie("f2-diferencial-hipotecaria-objetivo")

# =====================================================================================================================
# 2. OFERTA — universo RUV (registro, verificación = inicio de obra, DTU)
# =====================================================================================================================
reg_m, ver_m, dtu_m = serie("f2-registro-mensual"), serie("f2-verificacion-mensual"), serie("f2-dtu-mensual")
anual = lambda m, y, meses=range(1, 13): sum(m.get(f"{y}-{i:02d}", 0.0) for i in meses)
R = {y: anual(reg_m, y) for y in range(2020, 2026)}
V = {y: anual(ver_m, y) for y in range(2020, 2026)}
D = {y: anual(dtu_m, y) for y in range(2020, 2026)}
SH_V = {y: anual(ver_m, y, range(1, 8)) / V[y] for y in range(2021, 2026)}          # participación ene–jul
SH_D = {y: anual(dtu_m, y, range(1, 8)) / D[y] for y in range(2021, 2026)}

seg = {k: segmentos(k) for k in ("f2-registro-segmento", "f2-verificacion-segmento", "f2-dtu-segmento",
                                 "f2-registro-segmento-acum", "f2-verificacion-segmento-acum", "f2-dtu-segmento-acum")}


def mercado_popular(sid, y):
    d = seg[sid].get(str(y)) or seg[sid + "-acum"].get(f"{y}-07")
    pop = sum(v for s, v in d.items() if s in POP)
    return sum(d.values()) - pop, pop


VM, VP, DM, DP, RM, RP = {}, {}, {}, {}, {}, {}
for y in range(2020, 2027):
    VM[y], VP[y] = mercado_popular("f2-verificacion-segmento", y)
    DM[y], DP[y] = mercado_popular("f2-dtu-segmento", y)
    RM[y], RP[y] = mercado_popular("f2-registro-segmento", y)
# 2026 sólo ene–jul (acumulado): cierre con la misma fórmula que cierre2026 (ene–jul ÷ participación ene–jul, mediana 2021–2025)
SHD_MED, SHV = med(SH_D.values()), {"base": med(SH_V.values()), "alto": min(SH_V.values()), "bajo": max(SH_V.values())}
DM26, DP26 = DM[2026] / SHD_MED, DP[2026] / SHD_MED
DT26 = DM26 + DP26
VM26 = {e: VM[2026] / SHV[e] for e in ESC}

# rango del rezago: el más amplio entre las series de C01 (incluida la reentrega -rango-min/-max) y dictamen-C01
_r = lambda sid: [v for v in (serie_opt(sid, "2026-07"),) if v is not None]
mu_v = {"central": serie("f2-rezago-verificacion-dtu-meses")["2026-07"],
        "rapido": min(_r("f2-rezago-verificacion-dtu-meses-bajo") + _r("f2-rezago-verificacion-dtu-meses-rango-min") + [AUD_C01["mu_ver_min"]]),
        "lento": max(_r("f2-rezago-verificacion-dtu-meses-alto") + _r("f2-rezago-verificacion-dtu-meses-rango-max"))}
mu_r = {"central": serie("f2-rezago-registro-dtu-meses")["2026-07"],
        "rapido": min(_r("f2-rezago-registro-dtu-meses-bajo") + _r("f2-rezago-registro-dtu-meses-rango-min") + [AUD_C01["mu_reg_min"]]),
        "lento": max(_r("f2-rezago-registro-dtu-meses-alto") + _r("f2-rezago-registro-dtu-meses-rango-max") + [AUD_C01["mu_reg_max"]])}
REZ = {"base": "central", "alto": "rapido", "bajo": "lento"}

# --- tubería de MERCADO (segmentos no Popular): DTU esperado = a · Σ w_j · inicios(Y−j); a calibrada al DTU 2026 observado ---
VM_MIN_OBS = min(VM[y] for y in range(2021, 2026))


def inicios_mercado(esc):
    v = {y: VM[y] for y in range(2020, 2026)}
    v[2026] = VM26[esc]
    for y in range(2027, 2031):
        v[y] = VM_MIN_OBS if esc == "bajo" else VM26[esc]
    return v


def esperado_mercado(esc):
    w, trunc = pesos_anuales(mu_v[REZ[esc]], FORMA[REZ[esc]])
    v = inicios_mercado(esc)
    E = {y: sum(w[j] * v[y - j] for j in range(len(w))) for y in range(2026, 2031)}
    a = DM26 / E[2026]
    return {y: a * E[y] for y in E}, w, trunc, a


EMK = {e: esperado_mercado(e) for e in ESC}
# R-C10-3 (dictamen-C10, mayor): la tubería con rezago fijo no pasó el backtest → s_pipeline 2027–2030 entra SOLO como
# SUPUESTO de rango amplio que incluye la variación anual del DTU observado 2021–2025. La tubería de mercado de arriba
# (ln(E_t/E_2026) con E_2026 = DTU 2026) queda sólo como REFERENCIA del valor base (diseño posterior al backtest, no validado).
S_REF = {y: EMK["base"][0][y] / EMK["base"][0][y - 1] - 1 for y in ANIOS}
# Sensibilidad de la referencia al μ (R-C09-2): μ = 12 es CONVENCIÓN (C01 central); 16 = mediana efectiva del mejor ajuste;
# 18.5 = media efectiva del mejor ajuste (f2-rezago-verificacion-dtu-meses-mejor-ajuste-*). Mismo método, forma 3.
MU_SENS = (mu_v["central"], serie("f2-rezago-verificacion-dtu-meses-mejor-ajuste-mediana-efectiva")["2026-07"],
           serie("f2-rezago-verificacion-dtu-meses-mejor-ajuste-media-efectiva")["2026-07"])


def ref_mu(mu):
    w, _ = pesos_anuales(mu, FORMA["central"])
    v = inicios_mercado("base")
    E = {y: sum(w[j] * v[y - j] for j in range(len(w))) for y in range(2026, 2031)}
    return {y: E[y] / E[y - 1] - 1 for y in ANIOS}


REF_MU = {mu: ref_mu(mu) for mu in MU_SENS}
G_DTU = {y: D[y] / D[y - 1] - 1 for y in range(2021, 2026)}                         # DTU TOTAL: sólo para la prueba de R-C09-3
GD_MIN, GD_MAX = min(G_DTU.values()), max(G_DTU.values())
# REENTREGA R-C09-2 (§2.4 v3 a): el rango sale del MISMO universo que cubre la tubería = DTU de MERCADO.
# Año de rebote: 2021 (+55 % sobre 2020, año del cierre COVID: el API no trae registro ni verificación en abr-2020) se EXCLUYE
# de la muestra, y la misma exclusión vale para los dos extremos (el mínimo, 2022, no cambia; con 2021 el máximo sería +55 %).
G_DM_TODOS = {y: DM[y] / DM[y - 1] - 1 for y in range(2021, 2026)}
ANIO_REBOTE = 2021
G_DM = {y: g for y, g in G_DM_TODOS.items() if y != ANIO_REBOTE}
GM_MIN, GM_MAX = min(G_DM.values()), max(G_DM.values())
GM_MIN_ANIO, GM_MAX_ANIO = min(G_DM, key=G_DM.get), max(G_DM, key=G_DM.get)
# REENTREGA R-C09-3 (§2.4 v3 d): piso y tope = NIVELES observados. Candidatos: DTU de mercado anual 2021–2025 y el rango 2026e
# (ene–jul ÷ participación ene–jul máxima / mínima observada 2021–2025, la misma fórmula del cierre). Ya no se usa el producto
# inicios máx. × conversión máx. (3,806: producto de extremos de años distintos).
DM26_RANGO = (DM[2026] / max(SH_D.values()), DM[2026] / min(SH_D.values()))
DT26_RANGO = (anual(dtu_m, 2026, range(1, 8)) / max(SH_D.values()), anual(dtu_m, 2026, range(1, 8)) / min(SH_D.values()))
NIV_DM = {str(y): DM[y] for y in range(2021, 2026)} | {"2026e-min": DM26_RANGO[0], "2026e-max": DM26_RANGO[1]}
DM_PISO_ID = min(NIV_DM, key=NIV_DM.get); DM_PISO = NIV_DM[DM_PISO_ID]
DM_TECHO_ID = max(NIV_DM, key=NIV_DM.get); DM_TECHO = NIV_DM[DM_TECHO_ID]
CONV_MK = {y: DM[y] / VM[y - 1] for y in range(2021, 2026)}
EM_PATH = {"base": dict(EMK["base"][0])}
for e, g, lim in (("bajo", GM_MIN, DM_PISO), ("alto", GM_MAX, DM_TECHO)):
    p = {2026: DM26}
    for y in ANIOS:
        p[y] = max(lim, p[y - 1] * (1 + g)) if e == "bajo" else min(lim, p[y - 1] * (1 + g))
    EM_PATH[e] = p
S_PIPE = {e: {y: EM_PATH[e][y] / EM_PATH[e][y - 1] - 1 for y in ANIOS} for e in ESC}

# diagnóstico en muestra (posterior a C10; NO es validación): mismo método, inicios observados, DTU de mercado observado
DIAG = {}
wb, _ = pesos_anuales(mu_v["central"], FORMA["central"])
for y in (2024, 2025):
    e_y = sum(wb[j] * VM[y - j] for j in range(len(wb)) if y - j >= 2020)
    e_p = sum(wb[j] * VM[y - 1 - j] for j in range(len(wb)) if y - 1 - j >= 2020)
    DIAG[y] = (e_y / e_p - 1, DM[y] / DM[y - 1] - 1)
vm26b = VM26["base"]
e_y = sum(wb[j] * ({**VM, 2026: vm26b}[2026 - j]) for j in range(len(wb)) if 2026 - j >= 2020)
e_p = sum(wb[j] * VM[2025 - j] for j in range(len(wb)) if 2025 - j >= 2020)
DIAG[2026] = (e_y / e_p - 1, DM26 / DM[2025] - 1)

# =====================================================================================================================
# 3. PROBABILIDADES POR ETAPA (conversión observada en Hermosillo, universo RUV completo)
# =====================================================================================================================
A_R = {y: D[y] / R[y - 1] for y in range(2021, 2026)}                              # DTU(Y) ÷ registro(Y−1)
A_V = {y: D[y] / V[y - 1] for y in range(2021, 2026)}                              # DTU(Y) ÷ inicio de obra(Y−1)
AR_AGREGADO = sum(D[y] for y in A_R) / sum(R[y - 1] for y in A_R)                  # contraste propio
aR = {"base": AUD_C01["a_registro"], "bajo": min(A_R.values()), "alto": min(1.0, max(A_R.values()))}
aV = {"base": sum(D[y] for y in A_V) / sum(V[y - 1] for y in A_V), "bajo": min(A_V.values()), "alto": min(1.0, max(A_V.values()))}
NIVEL = {"base": "base", "bajo": "bajo", "alto": "alto"}


def p_registrada(h, nivel):
    r = REZ[nivel]
    return aR[nivel] * F_rezago(h, mu_r[r], FORMA[r])


def p_construccion(h, nivel):
    r = REZ[nivel]
    return aV[nivel] * F_rezago(h, mu_v[r], FORMA[r])


def p_proyecto(h, nivel):
    if nivel == "bajo":
        return 0.0
    if nivel == "alto":
        return p_registrada(h, "base")
    return FACTOR_SIN_EVIDENCIA * p_registrada(h, "base")


def p_anunciada(h, nivel):
    if nivel == "bajo":
        return 0.0
    if nivel == "alto":
        return p_proyecto(h, "base")
    return FACTOR_SIN_EVIDENCIA * p_proyecto(h, "base")


h_fin = lambda y: 12 * (y - 2026) + MESES_RESTO_2026
CONV = {"registro": {h: p_registrada(h, "base") for h in (12, 24)}, "verificacion": {h: p_construccion(h, "base") for h in (12, 24)},
        "registro_rango": {h: (p_registrada(h, "bajo"), p_registrada(h, "alto")) for h in (12, 24)},
        "verificacion_rango": {h: (p_construccion(h, "bajo"), p_construccion(h, "alto")) for h in (12, 24)}}
POP25 = (DP[2026], VP[2025], DP[2026] / VP[2025], anual(dtu_m, 2026, range(1, 8)) / V[2025])

# =====================================================================================================================
# 4. CARTERA (sólo lo que NO cubre s_pipeline: segmento Popular/Bienestar con crédito INFONAVIT; CONAVI fuera)
# =====================================================================================================================
c3 = cartera(CART3)


def ultima(cid):
    """Misma cartera en fechas distintas: vale el último dato con etapa explícita; los previos amplían la banda."""
    fs = sorted((r for r in c3 if r["cartera_id"] == cid and r["geografia"] == "municipio Hermosillo"), key=lambda r: r["fecha_dato"])
    return fs[-1], [int(r["unidades"]) for r in fs]


alt_u, alt_band = ultima("infonavit-bienestar-hmo-altares")
pro_u, pro_band = ultima("infonavit-bienestar-hmo-programa")
assert alt_u["etapa"] == "en_construccion" and pro_u["etapa"] == "en_proyecto"
U_ALT, U_PRO = int(alt_u["unidades"]), int(pro_u["unidades"])
# Duplicado posible Altares ⊂ programa: el conjunto mayor fija el valor; el menor sólo amplía la banda (alto = distintos).
UNID = {"base": (U_ALT, U_PRO - U_ALT),
        "bajo": (min(alt_band), min(pro_band) - min(alt_band)),
        "alto": (max(alt_band), U_PRO)}
c4 = cartera(CART4)
SELLO_PRIV = sorted({(r["fecha_dato"], int(r["unidades"]), r["etapa"]) for r in c4 if r["cartera_id"] == "sello-h-privada"})

# Conversión observada DEL SEGMENTO Popular (evidencia a del mismo segmento; dictamen-C01 §C: aplicar la a y el μ generales a
# una tubería mayoritariamente Popular es extrapolar). a_pop = DTU Popular(Y) ÷ inicio de obra Popular(Y−1), Y = 2021…2026e.
A_POP = {y: (DP26 if y == 2026 else DP[y]) / VP[y - 1] for y in range(2021, 2027)}
aPOP = {"base": sum(DP26 if y == 2026 else DP[y] for y in A_POP) / sum(VP[y - 1] for y in A_POP),
        "bajo": min(A_POP.values())}
# Conversión (cociente de flujo) 2021–2025, sin 2026e: ΣDTU Popular 2021–2025 ÷ Σ verificación Popular 2020–2024 (≈0.63).
A_POP_2125 = sum(DP[y] for y in range(2021, 2026)) / sum(VP[y - 1] for y in range(2021, 2026))

# ---------------------------------------------------------------------------------------------------------------------
# REENTREGA R-C09-1 (§2.4 v3 b): CALIBRACIÓN del calendario Popular contra el DTU Popular observado al corte.
# Calendario = FRACCIÓN FINAL con rezago: entregas = a_c · F(h), F = gamma verificación→DTU «mejor ajuste global» de C01
# (μ = 23, forma 1.5). Ya no se usa el cociente de flujo a_pop (que contiene el rezago) multiplicado por otro rezago.
# a_c se fija para que el calendario, aplicado a TODAS las cohortes mensuales observadas de verificación Popular
# (RUV 2020-01…2026-07, cohorte a mitad de mes), reproduzca el DTU Popular ene–jul 2026 observado (44).
# ---------------------------------------------------------------------------------------------------------------------
POP_SEG_V = segmentos("f2-verificacion-segmento-mensual")
POP_SEG_D = segmentos("f2-dtu-segmento-mensual")
VPM = {p: sum(v for s, v in d.items() if s in POP) for p, d in POP_SEG_V.items()}
DPM = {p: sum(v for s, v in d.items() if s in POP) for p, d in POP_SEG_D.items()}
idx = lambda p: 12 * int(p[:4]) + int(p[5:7]) - 1
MESES_OBJ = [f"2026-{m:02d}" for m in range(1, 8)]
DP_OBJ = sum(DPM[p] for p in MESES_OBJ)                                             # 44 (todas las cohortes)
assert abs(DP_OBJ - DP[2026]) < 1e-9, "DTU Popular ene–jul 2026 mensual ≠ acumulado"
L_RV = serie("f2-rezago-registro-verificacion-meses")["2026-07"]                     # 2 m (C01)
MU_POP, K_POP = mu_v["lento"], FORMA["lento"]                                        # 23 m, forma 1.5


def unidad_pred(meses, mu, k, coh=VPM, frac=None):
    """DTU por unidad de a_c en los meses dados, desde las cohortes coh (o las ponderadas por frac)."""
    tot = 0.0
    for p in meses:
        t = idx(p)
        for c, v in coh.items():
            age0 = t - (idx(c) + 0.5)
            if age0 + 1 <= 0:
                continue
            tot += v * (F_rezago(age0 + 1, mu, k) - F_rezago(age0, mu, k))
    return tot


def calibrar(mu, k):
    return DP_OBJ / unidad_pred(MESES_OBJ, mu, k)


A_C = calibrar(MU_POP, K_POP)
CAL_REPRO = A_C * unidad_pred(MESES_OBJ, MU_POP, K_POP)                              # = 44 por construcción
# prueba fuera de la calibración (no se ajusta con ella): DTU Popular anual 2024 y 2025 con el mismo a_c y las cohortes
# observadas desde 2020-01 (las cohortes previas a 2020 no existen en la serie: el calendario se queda corto en 2020–2022)
CAL_FUERA = {y: (A_C * unidad_pred([f"{y}-{m:02d}" for m in range(1, 13)], MU_POP, K_POP), DP[y]) for y in (2024, 2025)}
# La prueba del auditor (dictamen-C09 §C): el calendario de Terra-9 (a_pop 0.3735 × F lento) aplicado a la cohorte 2025
COH25 = {p: v for p, v in VPM.items() if p.startswith("2025-")}
PRUEBA_T9 = aPOP["base"] * unidad_pred(MESES_OBJ, MU_POP, K_POP, coh=COH25)
PRUEBA_T9_TODAS = aPOP["base"] * unidad_pred(MESES_OBJ, MU_POP, K_POP)
PRUEBA_NUEVA_25 = A_C * unidad_pred(MESES_OBJ, MU_POP, K_POP, coh=COH25)
_us = [0.05 + 0.1 * i for i in range(120)]
PRUEBA_T9_UNIF = aPOP["base"] * VP[2025] * sum(F_rezago(19 - u, MU_POP, K_POP) - F_rezago(12 - u, MU_POP, K_POP) for u in _us) / len(_us)
# sensibilidad de la calibración al rezago (cada combinación recalibrada a 44): sólo nota
CAL_SENS = {(mu, k): calibrar(mu, k) for mu in (mu_v["rapido"], mu_v["central"], mu_v["lento"]) for k in (6.0, 3.0, 1.5)}


def p_pop(h, esc, etapa, mu=MU_POP, k=K_POP, a=None):
    """Probabilidad acumulada de DTU de la cartera Popular/Bienestar a h meses del corte (sólo base y sensibilidad).
    en_construccion: a_c·F(h); en_proyecto: 0.5·a_c·F(h − L_rv) (tiene que iniciar obra antes; sin evidencia local, §2.5 d)."""
    a = A_C if a is None else a
    if etapa == "en_construccion":
        return a * F_rezago(h, mu, k)
    return FACTOR_SIN_EVIDENCIA * a * F_rezago(h - L_RV, mu, k)


# Ningún insumo fuera de lo observado (§2.4): el DTU Popular anual no supera el máximo observado del segmento 2020–2025;
# lo que excede no se pierde: pasa al año siguiente (cola). Sin esta cota, el calendario RUV general daría >3,000 entregas
# Popular en 2027, cinco veces el máximo observado (y el segmento entregó 44 en ene–jul 2026).
DP_MAX_OBS = max(DP[y] for y in range(2020, 2026))
DP_MAX_ANIO = max(range(2020, 2026), key=lambda y: DP[y])


def esperado_popular(esc, mu=MU_POP, k=K_POP, a=None, unid=None):
    """DTU Popular esperado por año: Popular 2026e (sin programas) + parte vendida de INFONAVIT, con cota y cola.
    base: calendario calibrado (fracción final con rezago); bajo: 0 entregas de cartera (rango desde 0, dictamen R-C09-1);
    alto: cociente SIN rezago con la conversión Popular 2021–2025 (DTU(Y) = a·inicios(Y−1); las unidades cuentan como
    iniciadas en 2026), con la cota anual observada."""
    uc, up = UNID[esc] if unid is None else unid
    out, cola, sin_cota = {2026: DP26}, 0.0, {}
    for y in ANIOS:
        h1, h0 = h_fin(y), h_fin(y - 1)
        if esc == "bajo":
            inc = 0.0
        elif esc == "alto":
            inc = A_POP_2125 * (uc + up) if y == ANIOS[0] else 0.0
        else:
            inc = uc * (p_pop(h1, esc, "en_construccion", mu, k, a) - p_pop(h0, esc, "en_construccion", mu, k, a)) + \
                  up * (p_pop(h1, esc, "en_proyecto", mu, k, a) - p_pop(h0, esc, "en_proyecto", mu, k, a))
        disp = cola + F_VENTA[esc] * inc
        entrega = min(max(DP_MAX_OBS - DP26, 0.0), disp)
        cola = disp - entrega
        out[y] = DP26 + entrega
        sin_cota[y] = DP26 + F_VENTA[esc] * inc
    out["cola_2030"] = cola
    out["sin_cota"] = sin_cota
    return out


EPOP = {e: esperado_popular(e) for e in ESC}


def s_cart_de(ep, em):
    return {y: ((em[y] + ep[y]) / (em[y - 1] + ep[y - 1])) / (em[y] / em[y - 1]) - 1 for y in ANIOS}


S_CART = {e: s_cart_de(EPOP[e], EM_PATH[e]) for e in ESC}
# Sensibilidad (NO entra al motor): s_cartera 2027 del base con otras ventanas/rezagos, sobre la misma senda de mercado del base
SENS_CART = {f"μ={mu:.0f} forma {k:g} (a_c={ac:.3f})": s_cart_de(esperado_popular("base", mu, k, ac), EM_PATH["base"])[2027]
             for (mu, k), ac in CAL_SENS.items()}
SENS_CART["Terra-9: a_pop 0.374 × F lento (sin calibrar)"] = s_cart_de(esperado_popular("base", MU_POP, K_POP, aPOP["base"]), EM_PATH["base"])[2027]
SENS_CART["las 5,634 como en_construccion (si las verificaciones Popular 2025–26 fueran del programa)"] = \
    s_cart_de(esperado_popular("base", unid=(U_PRO, 0)), EM_PATH["base"])[2027]
SENS_RANGO = (min(SENS_CART.values()), max(SENS_CART.values()))

# =====================================================================================================================
# 5. INVENTARIO TERMINADO (freno) — meses de VENTAS RUV (dictamen-C02 R-C02-1), sin el corte 2025-11 (copia de 2025-09)
# =====================================================================================================================
ind, con, una = (serie(f"creditos-infonavit-nueva-tipo-{t}-mensual") for t in ("individual", "conyugal", "unamos"))
fov = serie("creditos-fovissste-nueva-mensual")
proxy = serie("f2-inv-terminado-proxy")


def ventas_ruv_12(fin):
    y, m = int(fin[:4]), int(fin[5:])
    tot = 0.0
    for i in range(12):
        mm, yy = m - i, y
        while mm <= 0:
            mm += 12; yy -= 1
        p = f"{yy}-{mm:02d}"
        tot += ind[p] + (con[p] + una[p]) / 2 + fov[p]
    return tot


MESES_INV = {c: proxy[c] / (ventas_ruv_12(c) / 12) for c in ("2024-12", "2025-12", "2026-07")}
M_ULT, M_MAX = MESES_INV["2026-07"], max(MESES_INV.values())
V12_ULT = ventas_ruv_12("2026-07")
FRENO = -(M_MAX - M_ULT) * (V12_ULT / 12) / DT26
# REENTREGA R-C09-3 (§2.4 v3 c): el freno del bajo se apila sobre la peor variación de mercado sólo si el δs total de 2027
# queda dentro del mínimo observado del DTU total 2021–2025; si no, el freno no entra (regla declarada antes de correr).
_tot_bajo27 = (1 + S_PIPE["bajo"][2027]) * (1 + S_CART["bajo"][2027]) * (1 + FRENO) - 1
FRENO_ENTRA = _tot_bajo27 >= GD_MIN
S_INV = {"base": {a: 0.0 for a in ANIOS}, "alto": {a: 0.0 for a in ANIOS},
         "bajo": {a: (FRENO if (a == 2027 and FRENO_ENTRA) else 0.0) for a in ANIOS}}
# Prueba R-C09-3 por año: δs total = (1+s_pipeline)(1+s_cartera)(1+s_inventario) − 1 contra el DTU total observado 2021–2025
DS_TOT = {e: {y: (1 + S_PIPE[e][y]) * (1 + S_CART[e][y]) * (1 + S_INV[e][y]) - 1 for y in ANIOS} for e in ESC}
EXCESO = {e: {y: (DS_TOT[e][y] - GD_MAX if DS_TOT[e][y] > GD_MAX else (DS_TOT[e][y] - GD_MIN if DS_TOT[e][y] < GD_MIN else 0.0))
              for y in ANIOS} for e in ESC}
# Bienio (hallazgo de R-C09-3): variación acumulada 2026→2028 del DTU total del escenario contra el peor/mejor bienio observado
NIV_TOT = {e: {2026: EM_PATH[e][2026] + EPOP[e][2026]} for e in ESC}
for e in ESC:
    for y in ANIOS:
        NIV_TOT[e][y] = NIV_TOT[e][y - 1] * (1 + DS_TOT[e][y])
BIENIO_OBS = {y: D[y] / D[y - 2] - 1 for y in range(2022, 2026)}
BIENIO_ESC = {e: NIV_TOT[e][2028] / NIV_TOT[e][2026] - 1 for e in ESC}

# =====================================================================================================================
# 6. HOGARES (sólo sensibilidad, §2.3) — C06, sin auditar
# =====================================================================================================================
# dictamen-C06 §F: ruta EIC al centro (único nivel observado 2025), CONAPO sólo como cota alta, al motor sólo %Δ.
import datetime as _dt
POB_H20 = serie("f2-poblacion-hogares-hermosillo")["2020"]
POB_EIC = serie("f2-poblacion-eic2025")["2025"]
ANIOS_EIC = (_dt.date(*FECHA_EIC) - _dt.date(*FECHA_CENSO)).days / 365.25
G_POB_EIC = (POB_EIC / POB_H20) ** (1 / ANIOS_EIC) - 1                              # ≈0.665 % (R-C06-4)
TAM20 = serie("f2-tamano-hogar")["2020"]
ts = serie("f2-tamano-hogar-sonora")
PEND_TAM = (ts["2025"] - ts["2020"]) / 5                                             # cifras publicadas (redondeadas)
tam = lambda y, s: TAM20 + s * (y - 2020)
ID_HOG_ALTO = next(i for i in ("f2-hogares-estimados-conapo-alto", "f2-hogares-estimados-alto") if serie_opt(i, "2030") is not None)
hog_alto = serie(ID_HOG_ALTO)                                                        # CONAPO + tendencia rápida (cota alta)
HOGS = {"base": {a: (1 + G_POB_EIC) * tam(a - 1, PEND_TAM) / tam(a, PEND_TAM) - 1 for a in ANIOS},
        "bajo": {a: G_POB_EIC for a in ANIOS},
        "alto": {a: hog_alto[str(a)] / hog_alto[str(a - 1)] - 1 for a in ANIOS}}

# =====================================================================================================================
# 7. ESCRITURA
# =====================================================================================================================
F_EMP = f"{SI}:f2-imss-puestos-dic-sonora:2021-12..2025-12"
F_EMP26 = f"{SI}:f2-imss-puestos-dic-sonora:2025-12; {SI}:empleo-imss-sonora-stock:2025-10,2026-06"
F_PIB = f"{SI}:f2-exp-pib:2026..2028; {SI}:f2-exp-pib-min:2026"
F_SAL = f"{SI}:f2-imss-salario-real-var-sonora:2022..2025-12"
F_TASA = f"{SI}:f2-tasa-hipotecaria-mensual:2020-12..2026-06; {SI}:f2-exp-tasa-fondeo:2026,2027"
F_SEG = f"{SI}:f2-verificacion-segmento+f2-dtu-segmento:2020..2025 (+ -acum 2026-07); f2-verificacion-mensual+f2-dtu-mensual:2021-01..2026-07; f2-rezago-verificacion-dtu-meses*:2026-07"
F_CART = f"{C3}:infonavit-bienestar-hmo-altares,infonavit-bienestar-hmo-programa; {SI}:f2-dtu-segmento-acum:2026-07; 01_base/f2-c09-supuestos/probabilidades.csv"
F_INV = f"{SI}:f2-inv-terminado-proxy:2024-12,2025-12,2026-07; creditos-infonavit-nueva-tipo-*-mensual+creditos-fovissste-nueva-mensual"
R4 = lambda x: round(x, 4)
# R-C09-4 (§2.3 v3): los ids bajo/base/alto no cambian (el motor los exige); la descripción dice lo que combinan.
EXT = {"bajo": "Escenario «menos demanda y menos oferta» (id bajo: extremo conjunto de Q hacia abajo; NO acota el precio)",
       "base": "Escenario base",
       "alto": "Escenario «más demanda y más oferta» (id alto: extremo conjunto de Q hacia arriba; NO acota el precio)"}
SON_TXT = "Sonora como aproximación de Hermosillo (la serie municipal IMSS 2019–2024 no existe en esta sesión, C05)"
# R-C09-5: rótulo del techo
TECHO_TXT = ("Techo con empleo de Sonora (proxy estatal); sesgo probable a la baja; con el empleo de Hermosillo el techo del base "
             "probablemente no se activa (Hermosillo +5.14 % frente a Sonora +2.66 % en el 1S2026, dictamen-C09 R-C09-5)")
TECHO_ALTO = "En este escenario la Q es el techo (techo activo en el motor; dictamen-C09 R-C09-5)"

filas = []


def fila(esc, a, var, valor, calidad, fuente, nota):
    filas.append(dict(escenario=esc, anio=a, variable=var, valor=R4(pct(valor)), calidad=calidad, fuente=fuente, nota=nota))


for e in ESC:
    fila(e, 2026, "g_empleo", EMP26[e], "estimado", F_EMP26,
         f"{SON_TXT}. Empleo al cierre 2026 (sólo alimenta el techo). Cotas con datos de 2026: alto = jun-2026/dic-2025 − 1 = {pct(E26_ALTO):.2f} % "
         f"(junio sostenido a diciembre); bajo = jun-2026 × (dic-2025/oct-2025) / dic-2025 − 1 = {pct(E26_BAJO):.2f} % (se repite la caída estacional "
         f"oct→dic de 2025); base = media geométrica de las cotas = {pct(E26_BASE):.2f} %. {EXT[e]}. Contraste no usado: Hermosillo dic-2025→jun-2026 "
         f"+{pct(HMO_H1):.2f} % vs Sonora +{pct(SON_H1):.2f} % (prensa; Hermosillo crece más, sesgo a la baja del proxy). {TECHO_TXT}."
         + (f" {TECHO_ALTO}." if e == "alto" else ""))
    for a in ANIOS:
        # R-C09-6: 2027–2030 es una senda de escenario (mediana/mín/máx aplicados al futuro) → calidad supuesto (precedente R-C06-3)
        fila(e, a, "g_empleo", EMP[e], "supuesto", F_EMP,
             f"Senda de escenario (supuesto, R-C09-6) construida con datos estimado-sonora, proxy estatal (R-C05-2). {TECHO_TXT}."
             + (f" {TECHO_ALTO}." if e == "alto" else "") +
             f" {SON_TXT}; los flujos de Hermosillo sólo contrastan el signo (positivos en ene–jun 2024 y 2025, "
             f"cuando Sonora cayó): por eso la banda incluye 0. Variación dic/dic de trabajadores asegurados de Sonora, sólo base Gob. Sonora 2021–2025: "
             + ", ".join(f"{y} {pct(g):+.2f} %" for y, g in sorted(G_SON.items()))
             + f". {EXT[e]} = {'mediana' if e == 'base' else ('mínimo' if e == 'bajo' else 'máximo')} = {pct(EMP[e]):+.2f} %. 2021 no entra: sólo existe en la base IIEG "
             f"(+{iieg['2021-12']:.2f} %, otra definición; con ella la mediana sería {pct(med(list(G_SON.values()) + [iieg['2021-12'] / 100])):.2f} %).")
        ING_TXT = ("Concepto (R-C09-7): ingreso real POR TRABAJADOR = (1+actividad)/(1+empleo) − 1, el mismo en los tres escenarios; el PIB agregado "
                   "ya incluye el crecimiento del empleo, que entra aparte por e_ext·g_empleo (usarlo tal cual contaba dos veces el margen extensivo). ")
        PT_TXT = ", ".join(f"{y} {pct(v):+.2f} %" for y, v in ING_PT.items())
        fila(e, a, "g_ingreso_real", ING[e][a] / 100, "supuesto", F_PIB + f"; {F_EMP}" if e == "base" else f"{SI}:macro-itaee-sonora-4t:2022-Q4..2025-Q4; {F_EMP}",
             ING_TXT + ((f"Base = (1 + PIB real mediana Encuesta Banxico sep-2026 {pib[str(a)] if str(a) in pib else pib[max(pib)]:.2f} % "
                         f"({a if str(a) in pib else max(pib)}; 2029–2030 repiten 2028, último publicado)) ÷ (1 + g_empleo base {pct(EMP['base']):+.2f} %) − 1 "
                         f"= {ING[e][a]:.2f} %. La mediana del salario real de cotización Sonora 2022–2025 ({SAL_MED:.2f} %) NO es base: esos años traen aumentos "
                         f"del salario mínimo de " + ", ".join(f"{y} +{pct(g):.0f} %" for y, g in sorted(SM_G.items()) if 2022 <= y <= 2026)
                         + " (nominal), una política, no ingreso permanente.") if e == "base" else
                        (f"{EXT[e]} (R-C07-1: extremos observados, no la encuesta): {'mínimo' if e == 'bajo' else 'máximo'} 2022–2025 de (1 + ITAEE Sonora 4T a/a) ÷ "
                         f"(1 + empleo Sonora dic/dic) − 1 = {PT_TXT} → {ING[e][a]:.2f} %. Ambos son Sonora, no Hermosillo; 2021 no entra (sin empleo de la "
                         f"misma base). Reemplaza la mezcla anterior de ITAEE (actividad) y salario real. "
                         f"Extremo conjunto: la combinación no se observó (R-C09-10). La actividad implícita, (1 + ingreso) × (1 + empleo) − 1 = "
                         f"{pct((1 + ING[e][a] / 100) * (1 + EMP[e]) - 1):+.1f} %/año, queda fuera del ITAEE Sonora observado 2022–2025 "
                         f"({pct(min(ITAEE_Y[y] for y in ING_PT)):+.1f} a {pct(max(ITAEE_Y[y] for y in ING_PT)):+.1f} %); el δd resultante sí queda dentro de la historia (δd implícito 2021–2023, C10)."
                         + (f" Compuesto 4 años: +{pct((1 + ING[e][a] / 100) ** 4 - 1):.0f} % real: extremo, no expectativa." if e == "alto" else ""))))
        fila(e, a, "g_tasa_hip_rel", TASA[e][a], "supuesto", F_TASA,
             (f"Cambio RELATIVO de la hipotecaria bancaria (elasticidad e_r, no «por punto»). Base 0: la encuesta Banxico espera objetivo {obj['2026']:.2f} al cierre "
              f"de 2026 y de 2027 (sin cambio) y la hipotecaria no siguió al objetivo (diferencial {min(dif.values()):.2f} a {max(dif.values()):.2f} pp; "
              f"nivel {TH_NIV_MIN:.2f}–{TH_NIV_MAX:.2f} desde 2020): se mantiene en {TH_ULT:.2f} (jun-2026).") if e == "base" else
             (f"{EXT[e]}: baja al ritmo de la mayor caída anual observada ({pct(BAJA_MAX):+.2f} %, dic-24→dic-25), sin perforar el mínimo observado {TH_NIV_MIN:.2f}. "
              f"Fórmula r_t = max({TH_NIV_MIN:.2f}, r_(t−1)·(1{pct(BAJA_MAX):+.2f} %)), desde {TH_ULT:.2f}.") if e == "alto" else
             (f"{EXT[e]}: sube al ritmo de la mayor alza anual observada ({pct(SUBE_MAX):+.2f} %, 2022) hasta el máximo observado {TH_NIV_MAX:.2f} y ahí se queda. "
              f"Fórmula r_t = min({TH_NIV_MAX:.2f}, r_(t−1)·(1+{pct(SUBE_MAX):.2f} %)), desde {TH_ULT:.2f}."))
        em, w, trunc, acal = EMK["base"]
        GM_TXT = ", ".join(f"{y} {pct(g):+.1f} %" for y, g in G_DM_TODOS.items())
        NIV_TXT = ", ".join(f"{k} {v:.0f}" for k, v in NIV_DM.items())
        fila(e, a, "s_pipeline", S_PIPE[e][a], "supuesto", F_SEG,
             f"La tubería no pasó el backtest C10 (R-C10-3): s_pipeline es SUPUESTO de rango amplio. Universo (R-C09-2, §2.4 v3 a): DTU RUV de MERCADO = todos "
             f"los segmentos menos Popular ≤200 UMA (las dos etiquetas Popular del API van en s_cartera; «Económica», ≈1 vivienda/año, cuenta como mercado). "
             f"Variación anual observada del DTU de mercado: {GM_TXT}. {ANIO_REBOTE} se excluye en los dos extremos: es el rebote sobre 2020, año del cierre COVID "
             f"(el API no trae registro ni verificación en abr-2020); con él el máximo sería {pct(G_DM_TODOS[ANIO_REBOTE]):+.1f} % y el mínimo no cambia. "
             f"Rango de la tasa = {pct(GM_MIN):+.1f} % ({GM_MIN_ANIO}) a {pct(GM_MAX):+.1f} % ({GM_MAX_ANIO}). Niveles observados para piso y tope (§2.4 v3 d): {NIV_TXT} "
             f"(2026e = ene–jul {DM[2026]:.0f} ÷ participación ene–jul máx./mín. 2021–2025). "
             + ((f"Base = REFERENCIA de tubería (diseño posterior al backtest, no validado por C10): ln(E_t/E_2026) con E_t = a·Σ_j w_j·inicios_(t−j), "
                 f"inicios = verificación de mercado (2026 = ene–jul {VM[2026]:.0f} ÷ {SHV['base']:.3f} = {VM26['base']:.0f}; 2027+ = ritmo 2026), w = rezago gamma "
                 f"μ={mu_v['central']:.0f} m forma 3 (μ = 12 es CONVENCIÓN de C01, el extremo bajo de la sensibilidad por ventana; masa truncada {trunc:.3f}), "
                 f"a = {acal:.3f} tal que E_2026 = DTU de mercado 2026e ({DM[2026]:.0f} ÷ {SHD_MED:.3f} = {DM26:.0f}). E_{a} ÷ E_{a-1} = {em[a]:.0f} ÷ {em[a-1]:.0f}. "
                 f"Con otro μ (forma 3): " + "; ".join(f"μ={mu:g} → {pct(REF_MU[mu][a]):+.1f} %" for mu in MU_SENS)
                 + f" (16 = mediana y 18.5 = media efectiva del mejor ajuste). Contraste en muestra (no validación): "
                 + "; ".join(f"{y} referencia {pct(p):+.1f} % vs observado {pct(o):+.1f} %" for y, (p, o) in DIAG.items()) + " (falla el signo de 2024).") if e == "base" else
                (f"{EXT[e]}: DTU de mercado {'cae' if e == 'bajo' else 'sube'} a la variación anual {'mínima' if e == 'bajo' else 'máxima'} observada "
                 f"({pct(GM_MIN if e == 'bajo' else GM_MAX):+.1f} %) cada año, sin salir de los niveles observados: "
                 + (f"piso = menor nivel observado ({DM_PISO_ID}: {DM_PISO:.0f})" if e == "bajo" else
                    f"tope = mayor nivel observado ({DM_TECHO_ID}: {DM_TECHO:.0f}); reemplaza el 3,806 (producto de extremos de años distintos, §2.4 v3 d)")
                 + f". Nivel {EM_PATH[e][a-1]:.0f} → {EM_PATH[e][a]:.0f}. Acumulado del DTU total del escenario 2026→2028: {pct(BIENIO_ESC[e]):+.1f} % contra el "
                   f"{'peor' if e == 'bajo' else 'mejor'} bienio observado {pct(min(BIENIO_OBS.values()) if e == 'bajo' else max(BIENIO_OBS.values())):+.1f} %"
                 + (f" (excede {pct(BIENIO_ESC[e] - min(BIENIO_OBS.values())):+.1f} pp: la regla §2.4 v3 c es anual y lo acota el piso de nivel observado; "
                    f"se declara, no se corrige)" if e == 'bajo' and BIENIO_ESC[e] < min(BIENIO_OBS.values()) else "")
                 + (f"; aquí manda el nivel: la tasa {pct(GM_MAX if e == 'alto' else GM_MIN):+.1f} % llevaría a {EM_PATH[e][a-1] * (1 + (GM_MAX if e == 'alto' else GM_MIN)):.0f}, "
                    f"fuera del {'tope' if e == 'alto' else 'piso'}, y queda en {pct(S_PIPE[e][a]):+.1f} %"
                    if abs(S_PIPE[e][a] - (GM_MAX if e == 'alto' else GM_MIN)) > 1e-9 and abs(S_PIPE[e][a]) > 1e-12 else "") + ".")))
        uc, up = UNID[e]
        CAL_TXT = (f"Calibración (R-C09-1, §2.4 v3 b): calendario = fracción final con rezago, entregas = a_c·F(h), F gamma verificación→DTU «mejor ajuste global» "
                   f"de C01 (μ={MU_POP:.0f} m, forma {K_POP:g}); a_c = {A_C:.4f} hace que el calendario aplicado a todas las cohortes mensuales de verificación Popular "
                   f"observadas (2020-01…2026-07) reproduzca el DTU Popular ene–jul 2026: {CAL_REPRO:.1f} contra {DP_OBJ:.0f} observados (tolerancia ±10 %). "
                   f"Fuera de la calibración: 2024 {CAL_FUERA[2024][0]:.0f} vs {CAL_FUERA[2024][1]:.0f} y 2025 {CAL_FUERA[2025][0]:.0f} vs {CAL_FUERA[2025][1]:.0f} "
                   f"observados: el calendario calibrado describe a las cohortes 2025–26, que dominan, y NO reproduce el flujo Popular viejo (faltan cohortes anteriores a "
                   f"2020 y las viejas convertían más rápido); por eso el Popular 2026e ({DP26:.0f}/año) se conserva como nivel y la cartera es incremental. "
                   f"El calendario anterior (a_pop {aPOP['base']:.3f} × F) daba {PRUEBA_T9_UNIF:.0f} DTU sólo de la cohorte 2025 con cohorte uniforme en el año "
                   f"({PRUEBA_T9:.0f} con sus meses reales; {PRUEBA_T9_TODAS:.0f} con todas las cohortes) contra {DP_OBJ:.0f}; el calibrado da {PRUEBA_NUEVA_25:.0f} de la "
                   f"cohorte 2025 y {CAL_REPRO:.0f} con todas. Ya no se multiplica un cociente de flujo por otro rezago. en_proyecto: 0.5·a_c·F(h − {L_RV:.0f} m) "
                   f"(rezago registro→verificación de C01; sin evidencia local, §2.5 d). ")
        RANGO_TXT = (f"Amplitud: s_cartera 2027 va de {pct(S_CART['bajo'][2027]):+.1f} % (menos oferta: 0 entregas de cartera; el Popular se sostiene en "
                     f"{DP26:.0f}/año) a {pct(S_CART['alto'][2027]):+.1f} % (más oferta: cociente sin rezago con la conversión Popular 2021–2025, {A_POP_2125:.3f}, "
                     f"que llena la cota); base {pct(S_CART['base'][2027]):+.1f} %. Sensibilidad del base 2027 (no entra al motor): {pct(SENS_RANGO[0]):+.1f} % a "
                     f"{pct(SENS_RANGO[1]):+.1f} % según rezago, forma, a_pop sin calibrar o etapa (dictamen: +2.1 % con a 2026, +17.0 % con a 2021–2025 sobre la "
                     f"senda de mercado del base, que es el mismo nivel Popular {DP_MAX_OBS:.0f} que usa el alto); esa incertidumbre la cubre el par bajo–alto, NO la "
                     f"banda del motor del base (que sólo recorre elasticidades y arranque). ")
        fila(e, a, "s_cartera", S_CART[e][a], "supuesto", F_CART + "; " + f"{SI}:f2-verificacion-segmento-mensual+f2-dtu-segmento-mensual:2020-01..2026-07",
             f"incremental sobre pipeline: s_pipeline sólo cubre segmentos de mercado; aquí entra el segmento Popular/Bienestar con crédito INFONAVIT (CONAVI fuera: "
             f"precio administrado, R-C03-1; 3,108 y 320 fuera; Sello H privada y agregados 20,861/20,000 fuera, R-C04-1). Unidades: Altares {uc} en_construccion + "
             f"{up} en_proyecto del programa INFONAVIT ({U_PRO} al {pro_u['fecha_dato']}; el conjunto mayor fija el valor, Altares {alt_band} sólo amplía la banda). "
             f"Parte vendida {F_VENTA[e]:.1f}. Entregas Popular esperadas {EPOP[e][a]:.0f} (sin cota {EPOP[e]['sin_cota'][a]:.0f}; año previo {EPOP[e][a-1]:.0f}; "
             f"Popular 2026e = {DP[2026]:.0f} ÷ {SHD_MED:.3f}; cota = DTU Popular máximo observado {DP_MAX_OBS:.0f} ({DP_MAX_ANIO}), el exceso pasa al año siguiente; "
             f"cola al cierre de 2030: {EPOP[e]['cola_2030']:.0f}). "
             + (CAL_TXT if e == "base" else "") + RANGO_TXT +
             f"Riesgo de doble conteo: el precio tope de Vivienda para el Bienestar (862,000, SIDOF; ≈242 UMA mensuales) rebasa el límite Popular de 200 UMA; si una "
             f"parte se registra como «Tradicional» estaría en s_pipeline y en s_cartera a la vez (Altares, «de uno a dos salarios mínimos», apunta a Popular). "
             + (f"Exceso de δs total {a} sobre el máximo observado del DTU total ({pct(GD_MAX):+.1f} %): {pct(DS_TOT[e][a]):+.1f} %, {100 * EXCESO[e][a]:+.1f} pp; novedad "
                f"documentada: verificación Popular (inicio de obra) {VP[2025]:.0f} en 2025 y {VP[2026]:.0f} en ene–jul 2026, contra un máximo anual de "
                f"{max(VP[y] for y in range(2020, 2025)):.0f} en 2020–2024 (RUV), y el programa INFONAVIT de {U_PRO} viviendas (prensa). "
                if EXCESO[e][a] > 0 else "")
             + f"Fórmula en el mismo universo DTU: (1+s_cartera) = [(mercado_t + Popular_t) ÷ (mercado_(t−1) + Popular_(t−1))] ÷ (mercado_t ÷ mercado_(t−1)). {EXT[e]}.")
        fila(e, a, "s_inventario", S_INV[e][a], "supuesto", F_INV,
             (f"Freno de inventario terminado: meses de ventas RUV (INFONAVIT dedup + FOVISSSTE nueva, 12 m) = "
              + ", ".join(f"{c} {m:.2f}" for c, m in MESES_INV.items())
              + (f" (2025-11 excluido: copia de 2025-09). Bajan: sin sobreoferta acumulada, sin freno (0). {EXT[e]}." if e != "bajo" or a != 2027 else
                 f" (2025-11 excluido). {EXT[e]}: el inventario vuelve al máximo observado ({M_MAX:.2f} m); el exceso ({M_MAX:.2f} − {M_ULT:.2f}) × ventas mensuales "
                 f"{V12_ULT/12:.1f} = {pct(FRENO):+.2f} % de las entregas 2026 ({DT26:.0f}), una vez. "
                 + (f"Se apila sobre la peor variación de mercado ({pct(GM_MIN):+.1f} %) porque el δs total de 2027 ({pct(DS_TOT[e][2027]):+.1f} %) queda dentro del "
                    f"mínimo observado del DTU total ({pct(GD_MIN):+.1f} %, 2022) (regla declarada antes de correr, §2.4 v3 c). No se puede descartar que la caída de 2022 "
                    f"ya incluyera un ajuste de inventario (C02 no tiene datos de 2022): la justificación descansa en que la suma no sale de lo observado."
                    if FRENO_ENTRA else f"No entra: con él el δs total de 2027 ({pct(_tot_bajo27):+.1f} %) saldría del mínimo observado ({pct(GD_MIN):+.1f} %)."))))


def escribir(path, campos, rows):
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=campos, lineterminator="\n"); w.writeheader(); w.writerows(rows)


CAMPOS_P = ["escenario", "anio", "variable", "valor", "calidad", "fuente", "nota"]
escribir(os.path.join(AQUI, "parametros.csv"), CAMPOS_P, filas)

# sensibilidad hogares: mismas filas, g_hogares en lugar de g_empleo 2027–2030 (g_empleo 2026 se queda: techo)
F_HOG = (f"{SI}:f2-poblacion-hogares-hermosillo:2020; f2-poblacion-eic2025:2025; f2-tamano-hogar:2020; f2-tamano-hogar-sonora:2020,2025; "
         f"{ID_HOG_ALTO}:2026..2030; f2-tamano-hogar-rapida")
NOTA_HOG = {
    "base": lambda a: (f"Ruta EIC: población en hogares crece {pct(G_POB_EIC):.3f} %/año (927,042 → 962,020 entre 15-mar-2020 y 15-oct-2025, "
                       f"{ANIOS_EIC:.2f} años; R-C06-4) y el tamaño medio baja {PEND_TAM:+.3f}/año desde {TAM20} (pendiente de Sonora 2020→2025 con las cifras "
                       f"publicadas 3.3→3.1, redondeadas; la pendiente sin redondear −0.0502 de dictamen-C06 R-C06-5, serie f2-tamano-hogar-rapida, daría ≈2.4 %, dentro "
                       f"de la banda; se elige la central porque es la que el auditor recomienda como centro, ≈2.0 %). g = (1+g_pob)·tam_(t−1)/tam_t − 1 = tam {tam(a-1, PEND_TAM):.4f}→{tam(a, PEND_TAM):.4f}."),
    "bajo": lambda a: f"Piso: ruta EIC con tamaño del hogar constante = crecimiento demográfico puro {pct(G_POB_EIC):.3f} %/año (dictamen-C06 §F).",
    "alto": lambda a: (f"Cota alta: proyección CONAPO 1990-2040 con tendencia rápida del tamaño ({ID_HOG_ALTO}, Δ {a}/{a-1}); "
                       f"«contradicha en nivel por la EIC 2025» (−6.5 %), por eso sólo es techo (dictamen-C06 §F)."),
}
sens = [f for f in filas if not (f["variable"] == "g_empleo" and f["anio"] in ANIOS)]
for e in ESC:
    for a in ANIOS:
        sens.append(dict(escenario=e, anio=a, variable="g_hogares", valor=R4(pct(HOGS[e][a])), calidad="supuesto", fuente=F_HOG,
                         nota=f"SÓLO SENSIBILIDAD (§2.3: nunca junto a g_empleo; al motor entra la variación, no niveles ni el puente 2021–2024). "
                              f"{EXT[e]}. " + NOTA_HOG[e](a)))
escribir(os.path.join(AQUI, "parametros-sensibilidad-hogares.csv"), CAMPOS_P, sens)

URL_FG = "https://ideas.repec.org/a/eee/jhouse/v18y2009i1p1-12.html"
sup = [
    dict(parametro="e_d", base=E_D[0], minimo=E_D[1], maximo=E_D[2], unidad="elasticidad", tipo="supuesto",
         justificacion="Copiado sin cambio de 02_cruces/supuestos.csv (Astra, metodo-curvas §3): elasticidad-precio de la demanda de vivienda nueva (flujo anual); "
                       "México −0.3 (Fontenla y González 2009), internacional −0.24 a −0.7; el flujo anual es plausiblemente más elástico.", url=URL_FG),
    dict(parametro="e_s", base=E_S[0], minimo=E_S[1], maximo=E_S[2], unidad="elasticidad", tipo="supuesto",
         justificacion="Valores copiados sin cambio de 02_cruces/supuestos.csv (Astra; el origen de la corrección es ese archivo, R-C09-8). SUPUESTO de rango amplio, "
                       "sin estimación local. El rango «OCDE 0.30–2.05» atribuido a Caldera y Johansson (2013) se atribuye al texto completo y NO está verificado: "
                       "el resumen de la página citada no da ningún rango (dictamen-C09 §B). Lo verificable de esa página es sólo el objeto del artículo (elasticidad-precio "
                       "de largo plazo de la oferta de vivienda nueva en países OCDE). El rango 0.5–3.0 no se apoya en esa cifra: cubre de oferta rígida a muy elástica; "
                       "terminadas reaccionan con rezago 12–24 meses (C01); en Hermosillo pesan agua y suelo servido.",
         url="https://econpapers.repec.org/RePEc:eee:jhouse:v:22:y:2013:i:3:p:231-249"),
    dict(parametro="e_ext", base=E_EXT[0], minimo=E_EXT[1], maximo=E_EXT[2], unidad="elasticidad de Q al empleo formal", tipo="supuesto",
         justificacion="Q crédito formal ∝ empleo formal; sin estimación local (R-C10-4). "
                       "Margen extensivo: Q es crédito formal (INFONAVIT/FOVISSSTE/banca) y el universo elegible escala con los cotizantes → 1.0 (proporcional). "
                       "Abajo 0.5: los empleos nuevos tardan ≈2 años en acumular puntos y son de salario bajo. Arriba 1.5: la formalización eleva la demanda de crédito "
                       "más que proporcional. Sin estimación local (n=5; C10: correlación δd implícito vs construido no informativa). Igual al preregistro de C10.",
         url="archivo:01_base/f2-c10-backtest/preregistro.md:§2"),
    dict(parametro="e_y", base=E_Y[0], minimo=E_Y[1], maximo=E_Y[2], unidad="elasticidad", tipo="supuesto",
         justificacion="Elasticidad-ingreso permanente de la demanda de vivienda, México 0.8 (Fontenla y González 2009); rango 0.5–1.0 de criterios-fase2 §2.3. "
                       "Se aplica a la variación del ingreso real por trabajador (ancla PIB, ver parametros.csv).", url=URL_FG),
    dict(parametro="e_r", base=E_R[0], minimo=E_R[1], maximo=E_R[2], unidad="elasticidad (sobre el cambio relativo de la tasa)", tipo="supuesto",
         justificacion="Fontenla y González 2009: «mortgage rate elasticity… −0.39». Se aplica al cambio RELATIVO de la hipotecaria (10.00 → 10.42 = +4.2 %), "
                       "nunca por punto porcentual (criterios-fase2 §2.3).", url=URL_FG),
    dict(parametro="q_max_hist", base=Q_MAX, minimo="", maximo="", unidad="viviendas", tipo="estimado",
         justificacion=f"Máximo de Q deduplicada 2020–2025 = {Q_MAX:.0f} ({Q_MAX_ANIO}), serie q-viviendas-financiadas-nueva-dedup. {TECHO_TXT}. "
                       f"En el escenario «más demanda y más oferta» (id alto) la Q es el techo.",
         url=f"archivo:{SI}:q-viviendas-financiadas-nueva-dedup:{Q_MAX_ANIO}"),
    dict(parametro="e_ref", base=SON[Q_MAX_ANIO], minimo="", maximo="", unidad="trabajadores asegurados (dic)", tipo="declarado",
         justificacion=f"E del año del máximo ({Q_MAX_ANIO}) en la MISMA serie que e_ultimo: Sonora, trabajadores asegurados IMSS, dic-{Q_MAX_ANIO} (Gob. Sonora). "
                       f"{SON_TXT}: el techo usa el crecimiento de Sonora 2021–2025 ({pct(SON[2025] / SON[Q_MAX_ANIO] - 1):+.2f} %). {TECHO_TXT}.",
         url=f"archivo:{SI}:f2-imss-puestos-dic-sonora:{Q_MAX_ANIO}-12"),
    dict(parametro="e_ultimo", base=SON[max(SON)], minimo="", maximo="", unidad="trabajadores asegurados (dic)", tipo="prensa",
         justificacion=f"Último diciembre observado de la misma serie (Sonora, dic-{max(SON)}, prensa; cuadra con 648,960 − 15,854 de Gob. Sonora, C05). {SON_TXT}. {TECHO_TXT}.",
         url=f"archivo:{SI}:f2-imss-puestos-dic-sonora:{max(SON)}-12"),
    dict(parametro="anio_ultimo_empleo", base=max(SON), minimo="", maximo="", unidad="año", tipo="estimado",
         justificacion="Año de e_ultimo; el motor encadena g_empleo desde el año siguiente (2026 = cierre estimado).", url=f"archivo:{SI}:f2-imss-puestos-dic-sonora"),
]
sup += [
    dict(parametro="a_final_popular_calibrada", base=R4(A_C), minimo=R4(min(CAL_SENS.values())), maximo=R4(max(CAL_SENS.values())), unidad="fracción final", tipo="estimado",
         justificacion=f"No lo usa el motor (insumo de s_cartera, R-C09-1). Fracción final verificación→DTU del segmento Popular, calibrada para que el calendario "
                       f"a·F (F gamma μ={MU_POP:.0f} m, forma {K_POP:g}) aplicado a las cohortes mensuales de verificación Popular 2020-01…2026-07 reproduzca el DTU Popular "
                       f"ene–jul 2026 ({CAL_REPRO:.1f} vs {DP_OBJ:.0f}). Mín–máx = misma calibración con μ {mu_v['rapido']:.0f}/{mu_v['central']:.0f}/{mu_v['lento']:.0f} y forma 6/3/1.5. "
                       f"Cocientes de flujo DTU Popular(Y) ÷ verificación Popular(Y−1) (ya no se usan con rezago): "
                       + ", ".join(f"{y} {x:.3f}" for y, x in A_POP.items()) + f"; 2021–2025 agregado {A_POP_2125:.3f} (alto).",
         url=f"archivo:{SI}:f2-verificacion-segmento-mensual+f2-dtu-segmento-mensual:2020-01..2026-07"),
    dict(parametro="techo_entregas_popular_anual", base=DP_MAX_OBS, minimo="", maximo="", unidad="viviendas/año", tipo="estimado",
         justificacion=f"No lo usa el motor. Máximo DTU Popular anual observado 2020–2025 ({DP_MAX_ANIO}); el exceso de cartera pasa al año siguiente.",
         url=f"archivo:{SI}:f2-dtu-segmento:{DP_MAX_ANIO}"),
    dict(parametro="f_venta_infonavit", base=F_VENTA["base"], minimo=F_VENTA["bajo"], maximo=F_VENTA["alto"], unidad="fracción", tipo="supuesto",
         justificacion="No lo usa el motor. Parte de la cartera INFONAVIT vendida con crédito (la renta no entra a Q, R-C03-1); sin cifra publicada.",
         url=f"archivo:{C3}"),
]
escribir(os.path.join(AQUI, "supuestos.csv"), ["parametro", "base", "minimo", "maximo", "unidad", "tipo", "justificacion", "url"], sup)

F_PR = f"{SI}:f2-registro-mensual+f2-verificacion-mensual+f2-dtu-mensual:2020-01..2025-12; f2-rezago-*-dtu-meses*:2026-07"
prob = []
ETAPAS = ("meta", "anunciada", "en_proyecto", "asignada_o_registrada", "en_construccion", "terminada", "entregada")
for et in ETAPAS:
    for a in ANIOS:
        h = h_fin(a)
        if et == "meta":
            v, ev, nota = (0.0, 0.0, 0.0), "d", "Regla criterios §2.4–2.5: una meta no es entrega; probabilidad 0 en todo horizonte."
        elif et in ("terminada", "entregada"):
            v, ev = (1.0, 1.0, 1.0), "a"
            nota = ("Ya tiene DTU: como oferta ya está en el flujo observado; su venta es demanda (Q), y el exceso se trata como freno en s_inventario."
                    if et == "terminada" else "Ya entregada: no agrega oferta futura.")
        elif et == "asignada_o_registrada":
            v, ev = (p_registrada(h, "base"), p_registrada(h, "bajo"), p_registrada(h, "alto")), "a"
            nota = (f"Conversión observada en Hermosillo registro→DTU (RUV agregado; el RUV no individualiza): p(h) = a·F(h). a = {aR['base']:.3f} "
                    f"(dictamen-C01: convolución forma 3, 0.633–0.728); contraste propio DTU(Y)÷registro(Y−1) 2021–2025 agregado {AR_AGREGADO:.3f}, anuales "
                    + ", ".join(f"{y} {x:.3f}" for y, x in A_R.items()) + f". F = rezago gamma μ={mu_r['central']:.0f} m (central por CONVENCIÓN; mejor ajuste 16–19, "
                    f"rango 8–24, dictamen-C01 R-C01-4), forma 3. h = {h} meses desde el corte 2026-07. A 12 m: {CONV['registro'][12]:.3f}; a 24 m: {CONV['registro'][24]:.3f}. "
                    f"Mín: a mínimo {aR['bajo']:.3f} y μ={mu_r['lento']:.0f}, forma 1.5; máx: a {aR['alto']:.3f} (tope 1) y μ={mu_r['rapido']:.0f}, forma 6.")
        elif et == "en_construccion":
            v, ev = (p_construccion(h, "base"), p_construccion(h, "bajo"), p_construccion(h, "alto")), "a"
            nota = (f"Inicio de verificación (≈ inicio de obra)→DTU, observado en Hermosillo: a = DTU(Y)÷verificación(Y−1) 2021–2025 (agregado {aV['base']:.3f}; anuales "
                    + ", ".join(f"{y} {x:.3f}" for y, x in A_V.items()) + f"); F gamma μ={mu_v['central']:.0f} m, forma 3. h = {h} m. A 12 m: {CONV['verificacion'][12]:.3f}; "
                    f"a 24 m: {CONV['verificacion'][24]:.3f}. Mín: a {aV['bajo']:.3f}, μ={mu_v['lento']:.0f}, forma 1.5; máx: a {aV['alto']:.3f} (tope 1), μ={mu_v['rapido']:.0f}, forma 6. "
                    f"Ojo: el segmento Popular convierte mucho más lento (cohorte 2025: {POP25[0]:.0f} DTU en ene–jul 2026 de {POP25[1]:.0f} iniciadas = {POP25[2]:.3f}, "
                    f"vs {POP25[3]:.3f} en todo el RUV); por eso s_cartera usa un calendario Popular propio, calibrado contra el DTU Popular observado (R-C09-1).")
        elif et == "en_proyecto":
            v, ev = (p_proyecto(h, "base"), 0.0, p_proyecto(h, "alto")), "d"
            nota = (f"Sin evidencia local (no registrada en RUV): supuesto con rango que incluye 0. Base = {FACTOR_SIN_EVIDENCIA} × p(asignada_o_registrada, base) "
                    f"(centro de [0, etapa siguiente]); máx = p(asignada_o_registrada, base).")
        else:
            v, ev = (p_anunciada(h, "base"), 0.0, p_anunciada(h, "alto")), "d"
            nota = (f"Sin evidencia local: supuesto con rango que incluye 0. Base = {FACTOR_SIN_EVIDENCIA} × p(en_proyecto, base); máx = p(en_proyecto, base).")
        prob.append(dict(etapa=et, anio_horizonte=a, p_base=R4(v[0]), p_min=R4(v[1]), p_max=R4(v[2]), evidencia=ev,
                         fuente=F_PR if ev == "a" and et not in ("terminada", "entregada") else "01_base/f2-c09-supuestos/calculos.py (regla)", nota=nota))
escribir(os.path.join(AQUI, "probabilidades.csv"), ["etapa", "anio_horizonte", "p_base", "p_min", "p_max", "evidencia", "fuente", "nota"], prob)

# =====================================================================================================================
# 8. CONTROLES
# =====================================================================================================================
err = []
for a in ANIOS:
    for k in ("p_base", "p_min", "p_max"):
        serie_k = [next(p[k] for p in prob if p["etapa"] == et and p["anio_horizonte"] == a) for et in ETAPAS]
        if any(serie_k[i] > serie_k[i + 1] + 1e-12 for i in range(len(serie_k) - 1)):
            err.append(f"no monótona por etapa {a} {k}: {serie_k}")
for et in ETAPAS:
    for k in ("p_base", "p_min", "p_max"):
        s_ = [next(p[k] for p in prob if p["etapa"] == et and p["anio_horizonte"] == a) for a in ANIOS]
        if any(s_[i] > s_[i + 1] + 1e-12 for i in range(len(s_) - 1)):
            err.append(f"no monótona por horizonte {et} {k}")
    for p in prob:
        if not (p["p_min"] <= p["p_base"] <= p["p_max"]):
            err.append(f"min≤base≤max falla {p['etapa']} {p['anio_horizonte']}")
if any(p["p_max"] > 0 for p in prob if p["etapa"] == "meta"):
    err.append("meta > 0")
if err:
    sys.exit("CONTROLES FALLAN:\n" + "\n".join(sorted(set(err))))

if __name__ == "__main__":
    print(f"Q máx {Q_MAX:.0f} ({Q_MAX_ANIO}); E Sonora {dict(SON)}; g Sonora {[round(pct(g), 2) for g in G_SON.values()]}")
    print(f"empleo 2026: bajo {pct(E26_BAJO):.2f} base {pct(E26_BASE):.2f} alto {pct(E26_ALTO):.2f}; Hermosillo H1 {pct(HMO_H1):.2f}")
    print(f"ingreso: {ING}; salario real mediana {SAL_MED:.3f}; SM {[(y, round(pct(g), 1)) for y, g in sorted(SM_G.items())]}")
    print(f"tasa: rel {[(y, round(pct(g), 2)) for y, g in TH_REL.items()]}; alto {[round(pct(x), 2) for x in TASA['alto'].values()]}; bajo {[round(pct(x), 2) for x in TASA['bajo'].values()]}")
    print(f"mercado V {VM}; D {DM}; Popular V {VP}; D {DP}")
    print(f"share ene-jul V {SH_V}; D {SH_D}; DM26 {DM26:.0f} DP26 {DP26:.0f} VM26 {VM26}")
    for e in ESC:
        em, w, tr, ac = EMK[e]
        print(f"  {e}: w={[round(x, 3) for x in w]} trunc={tr:.3f} a={ac:.3f} E={ {y: round(v) for y, v in em.items()} } s_pipe={[round(pct(S_PIPE[e][y]), 2) for y in ANIOS]}")
        print(f"       Epop={ {y: round(v) for y, v in EPOP[e].items() if isinstance(y, int)} } cola={EPOP[e]['cola_2030']:.0f} s_cart={[round(pct(S_CART[e][y]), 2) for y in ANIOS]} s_inv={[round(pct(S_INV[e][y]), 2) for y in ANIOS]}")
    print(f"diagnóstico en muestra (pred vs obs, mercado): { {y: (round(pct(a), 1), round(pct(b), 1)) for y, (a, b) in DIAG.items()} }")
    print(f"a_R {A_R} → {aR}; a_V {A_V} → {aV}; conv {CONV}")
    print(f"Popular 2025 cohorte {POP25}; unidades {UNID}; Sello H privada {SELLO_PRIV}")
    print(f"meses inventario {MESES_INV}; freno {pct(FRENO):.2f} %")
    print(f"hogares g: { {e: [round(pct(HOGS[e][a]), 2) for a in ANIOS] for e in ESC} }")
    print(f"REENTREGA · calibración Popular: a_c={A_C:.4f} (μ={MU_POP}, k={K_POP}); reproduce {CAL_REPRO:.2f} vs {DP_OBJ:.0f}; fuera: {CAL_FUERA}")
    print(f"  prueba del auditor (Terra-9): cohorte 2025 uniforme {PRUEBA_T9_UNIF:.1f}, meses reales {PRUEBA_T9:.1f}; todas {PRUEBA_T9_TODAS:.1f}; nuevo calendario cohorte 2025 {PRUEBA_NUEVA_25:.1f}")
    print(f"  a_c por rezago: { {k: round(v, 4) for k, v in CAL_SENS.items()} }; a_pop 2021–2025 {A_POP_2125:.4f}")
    print(f"  s_cartera 2027 sensibilidad: { {k: round(pct(v), 2) for k, v in SENS_CART.items()} }")
    print(f"  mercado: var {[(y, round(pct(g), 1)) for y, g in G_DM_TODOS.items()]}; rango {pct(GM_MIN):.1f}/{pct(GM_MAX):.1f}; niveles { {k: round(v) for k, v in NIV_DM.items()} }; piso {DM_PISO_ID} tope {DM_TECHO_ID}")
    print(f"  DTU 2026e total {DT26:.0f} rango {[round(x) for x in DT26_RANGO]}; mercado {DM26:.0f} rango {[round(x) for x in DM26_RANGO]}")
    print(f"  referencia por μ: { {mu: [round(pct(REF_MU[mu][y]), 2) for y in ANIOS] for mu in MU_SENS} }")
    print(f"  δs total por año: { {e: [round(pct(DS_TOT[e][y]), 2) for y in ANIOS] for e in ESC} }; DTU total obs {[(y, round(pct(g), 1)) for y, g in G_DTU.items()]}")
    print(f"  exceso pp: { {e: [round(100 * EXCESO[e][y], 2) for y in ANIOS] for e in ESC} }; freno entra {FRENO_ENTRA}")
    print(f"  bienio 2026→2028: { {e: round(pct(v), 1) for e, v in BIENIO_ESC.items()} }; observado { {y: round(pct(v), 1) for y, v in BIENIO_OBS.items()} }")
    print(f"  ingreso por trabajador obs {[(y, round(pct(v), 2)) for y, v in ING_PT.items()]}")
    print("controles OK; filas parametros", len(filas), "probabilidades", len(prob))
