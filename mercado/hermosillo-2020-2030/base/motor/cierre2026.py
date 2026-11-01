#!/usr/bin/env python3
"""C11a · Cierre estimado 2026 (Sol Integración) — criterios-fase2.md, «C11 → C12, Cierre 2026».

Q_2026 = Q(ene–jul 2026) ÷ s, con s_y = Q(ene–jul y) ÷ Q(y) para cada año con meses completos (misma fórmula de
deduplicación que el Q anual). Centro = mediana de s; rango = mín–máx. Exige ≥3 años.
P_2026 (nominal) = promedio(Q1,Q2 2026) × r, con r_y = promedio anual ÷ promedio(Q1,Q2) del índice SHF Hermosillo,
años 2021–2025. Centro = mediana; rango = mín–máx.
P real (§2.2): deflactor del mismo periodo = INPC nacional promedio anual (C07). Precios de 2025: P_real = P × INPC̄_2025 / INPC̄_t.
INPC̄_2026 aún no existe: se estima con el promedio ene–MM observado y los meses restantes a la inflación esperada dic–dic
(encuesta Banxico, C07): INPC̄_2026 ≈ INPC̄(ene–MM) × (1+π)^((12−MM)/24). Se declara como estimado.
Todo se lee de 01_base/series-integradas.csv; aquí no hay números.
"""
import csv, json, os, statistics, sys
from collections import defaultdict

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERIES = os.path.join(RAIZ, "01_base", "series-integradas.csv")
OUT = os.path.join(RAIZ, "02_cruces", "cierre2026.json")

TIPO = {"conyugal": "creditos-infonavit-nueva-tipo-conyugal-mensual", "individual": "creditos-infonavit-nueva-tipo-individual-mensual",
        "unamos": "creditos-infonavit-nueva-tipo-unamos-mensual", "nodisp": "creditos-infonavit-nueva-tipo-no-disponible-mensual"}
ESQ = {"apoyo": "creditos-infonavit-nueva-esq-apoyo-infonavit-mensual", "cofinavit": "creditos-infonavit-nueva-esq-cofinavit-mensual",
       "total": "creditos-infonavit-nueva-esq-infonavit-total-mensual"}
OTROS = {"fovissste": "creditos-fovissste-nueva-mensual", "cnbv": "creditos-cnbv-nueva-mensual"}
Q_ANUAL = "q-viviendas-financiadas-nueva-dedup"
SHF_Q = "shf-indice-hermosillo"
INPC_ANUAL, INPC_ACUM = "f2-inpc-promedio-anual", "f2-inpc-promedio-anual-acum"
PI_EXP = "f2-exp-inflacion"


def leer():
    s = defaultdict(dict)
    with open(SERIES, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["geografia"] not in ("municipio Hermosillo", "nacional"):
                continue
            try:
                s[r["serie_id"]][r["periodo"]] = (float(r["valor"]), r)
            except ValueError:
                pass
    return s


def v(s, sid, per, req=True):
    x = s.get(sid, {}).get(per)
    if x is None:
        if req:
            raise KeyError(f"{sid} {per}")
        return 0.0
    return x[0]


ANUAL_DE = {ESQ["apoyo"]: "creditos-infonavit-nueva-esq-apoyo-infonavit", ESQ["cofinavit"]: "creditos-infonavit-nueva-esq-cofinavit",
            ESQ["total"]: "creditos-infonavit-nueva-esq-infonavit-total", OTROS["fovissste"]: "creditos-fovissste-nueva", OTROS["cnbv"]: "creditos-cnbv-nueva",
            TIPO["conyugal"]: "creditos-infonavit-nueva-tipo-conyugal", TIPO["individual"]: "creditos-infonavit-nueva-tipo-individual",
            TIPO["unamos"]: "creditos-infonavit-nueva-tipo-unamos"}
CEROS = []  # meses ausentes tratados como cero (el cubo omite combinaciones vacías) SÓLO si los meses presentes suman el anual


def vm(s, sid, y, m, opcional=False):
    per = f"{y}-{m:02d}"
    if per in s.get(sid, {}):
        return s[sid][per][0]
    if opcional:
        return 0.0
    presentes = [s[sid][f"{y}-{k:02d}"][0] for k in range(1, 13) if f"{y}-{k:02d}" in s.get(sid, {})]
    anual = s.get(ANUAL_DE.get(sid, ""), {}).get(str(y))
    if presentes and anual is not None and abs(sum(presentes) - anual[0]) < 0.5:
        CEROS.append(f"{sid} {per}")
        return 0.0
    raise KeyError(f"{sid} {per}")


def q_meses(s, y, meses):
    t = {k: sum(vm(s, sid, y, m, k == "nodisp") for m in meses) for k, sid in TIPO.items()}
    e = {k: sum(vm(s, sid, y, m) for m in meses) for k, sid in ESQ.items()}
    o = {k: sum(vm(s, sid, y, m) for m in meses) for k, sid in OTROS.items()}
    viv = t["individual"] + t["nodisp"] + (t["conyugal"] + t["unamos"]) / 2
    return viv - e["cofinavit"] - e["apoyo"] - e["total"] + o["fovissste"] + o["cnbv"], dict(t, **e, **o)


def main():
    s = leer()
    # ── Q ──
    anios_q, partes, control = [], {}, {}
    for y in range(2020, 2026):
        try:
            q7, _ = q_meses(s, y, range(1, 8))
            q12, _ = q_meses(s, y, range(1, 13))
        except KeyError:
            continue
        qa = v(s, Q_ANUAL, str(y))
        partes[y] = q7 / qa
        control[y] = {"ene_jul": round(q7, 1), "suma_12_meses": round(q12, 1), "q_anual": qa, "dif_12m_vs_anual": round(q12 - qa, 1)}
        anios_q.append(y)
    if len(anios_q) < 3:
        sys.exit(f"Cierre 2026: sólo {len(anios_q)} año(s) con meses completos {anios_q}; el criterio exige ≥3 (falta C15).")
    q26_7, comp26 = q_meses(s, 2026, range(1, 8))
    sh = list(partes.values())
    Q = {"centro": q26_7 / statistics.median(sh), "min": q26_7 / max(sh), "max": q26_7 / min(sh)}
    # ── P nominal ──
    r = {}
    for y in range(2021, 2026):
        qs = [v(s, SHF_Q, f"{y}-Q{k}") for k in (1, 2, 3, 4)]
        r[y] = (sum(qs) / 4) / ((qs[0] + qs[1]) / 2)
    p1s = (v(s, SHF_Q, "2026-Q1") + v(s, SHF_Q, "2026-Q2")) / 2
    rv = list(r.values())
    Pn = {"centro": p1s * statistics.median(rv), "min": p1s * min(rv), "max": p1s * max(rv)}
    # ── deflactor INPC promedio anual (precios de 2025) ──
    inpc = {p: x[0] for p, x in s.get(INPC_ANUAL, {}).items()}
    acum = s.get(INPC_ACUM, {})
    pi = s.get(PI_EXP, {}).get("2026")
    if "2025" in inpc and acum and pi is not None:
        per_acum, (inpc_acum, _) = sorted(acum.items())[-1]
        mm = int(per_acum[5:7])
        inpc26 = inpc_acum * (1 + pi[0] / 100) ** ((12 - mm) / 24)
        f = inpc["2025"] / inpc26
        Pr = {k: round(x * f, 3) for k, x in Pn.items()}
        inpc_blk = {"promedio_2025": inpc["2025"], "acumulado_2026": {"periodo": per_acum, "valor": inpc_acum},
                    "inflacion_esperada_2026": pi[0], "promedio_2026_estimado": round(inpc26, 4), "factor_a_precios_2025": round(f, 6)}
    else:
        Pr, inpc_blk = None, {"pendiente": "falta INPC promedio anual 2025, acumulado 2026 o inflación esperada 2026 (C07)"}
    out = {
        "Q": {k: round(x, 1) for k, x in Q.items()},
        "P_nominal": {k: round(x, 3) for k, x in Pn.items()},
        "P_real": Pr,
        "unidad_P_real": "índice SHF 2017=100 a precios de 2025 (INPC nacional promedio anual)",
        "Q_ene_jul_2026": round(q26_7, 1), "Q_componentes_ene_jul_2026": comp26,
        "participacion_ene_jul": {str(y): round(x, 4) for y, x in partes.items()}, "control_Q": {str(y): c for y, c in control.items()},
        "meses_ausentes_como_cero": sorted(set(CEROS)),
        "P_1S_2026": round(p1s, 3), "razon_anual_1S": {str(y): round(x, 4) for y, x in r.items()},
        "inpc": inpc_blk,
        "metodo": "Q: ene–jul 2026 ÷ participación ene–jul (misma fórmula de deduplicación), centro = mediana, rango = mín–máx de los años con meses. "
                  "P: promedio 1S2026 × razón (promedio anual ÷ promedio 1S) 2021–2025. Es un cierre ESTIMADO, no un dato.",
        "calidad": "estimado",
    }
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1, sort_keys=True)
    print(json.dumps({k: out[k] for k in ("Q", "P_nominal", "P_real", "participacion_ene_jul", "razon_anual_1S")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
