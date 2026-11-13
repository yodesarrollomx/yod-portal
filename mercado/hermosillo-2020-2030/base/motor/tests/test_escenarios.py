#!/usr/bin/env python3
"""Pruebas sintéticas del motor v2 (no usan datos reales). Ejecutar: python3 -I 02_cruces/tests/test_escenarios.py"""
import csv, math, os, sys, tempfile, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import escenarios as E

SUP = [  # parametro, base, minimo, maximo
    ("e_d", 0.7, 0.3, 1.5), ("e_s", 1.5, 0.5, 3.0), ("e_ext", 1.0, 1.0, 1.0), ("e_y", 0.8, 0.5, 1.0), ("e_r", -0.39, -0.6, -0.2),
]


def escribir(path, cols, filas):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(cols); w.writerows(filas)


def sup_file(d, extra=()):
    p = os.path.join(d, "supuestos.csv")
    escribir(p, ["parametro", "base", "minimo", "maximo", "unidad", "tipo", "justificacion", "url"],
             [(a, b, c, e, "x", "supuesto", "prueba", "test") for a, b, c, e in list(SUP) + list(extra)])
    return p


def par_file(d, filas):
    p = os.path.join(d, "parametros.csv")
    escribir(p, ["escenario", "anio", "variable", "valor", "calidad", "fuente", "nota"],
             [(e, a, v, x, "supuesto", "test", "prueba") for e, a, v, x in filas])
    return p


ARR = {"Q": {"min": 2900.0, "centro": 3000.0, "max": 3100.0}, "P": {"min": 99.0, "centro": 100.0, "max": 101.0}}


def test_cruce_identidades():
    dlp, dlq = E.cruce(0.03, 0.03, 0.7, 1.5)
    assert abs(dlp) < 1e-12 and abs(dlq - 0.03) < 1e-12          # ambos desplazamientos iguales: precio fijo
    dlp, dlq = E.cruce(0.022, 0.0, 0.7, 1.5)
    assert abs(dlp - 0.01) < 1e-12 and abs(dlq - 0.015) < 1e-12   # sólo demanda: Δln P = δd/(e_d+e_s)


def test_trayectoria_central_y_banda():
    with tempfile.TemporaryDirectory() as d:
        sup = E.leer_supuestos(sup_file(d))
        filas = []
        for a in E.ANIOS:
            filas += [("base", a, "g_empleo", 2.0), ("base", a, "g_ingreso_real", 1.0), ("base", a, "g_tasa_hip_rel", -2.0), ("base", a, "s_pipeline", 1.5)]
        params = E.leer_parametros(par_file(d, filas))
        out = E.correr(ARR, params, sup)
        assert [f["anio"] for f in out] == list(E.ANIOS)
        dd = 1.0 * math.log(1.02) + 0.8 * math.log(1.01) - 0.39 * math.log(0.98)
        ds = math.log(1.015)
        dlp, dlq = (dd - ds) / 2.2, (1.5 * dd + 0.7 * ds) / 2.2
        assert abs(out[0]["P_real"] - 100 * math.exp(dlp)) < 1e-3
        assert abs(out[3]["Q"] - 3000 * math.exp(4 * dlq)) < 0.1
        for f in out:
            assert f["Q_min"] <= f["Q_min_abanico"] <= f["Q"] <= f["Q_max_abanico"] <= f["Q_max"]
            assert f["P_real_min"] <= f["P_real"] <= f["P_real_max"]
            assert f["disp"]["Q"] % 50 == 0 if "disp" in f else True
        assert out[0]["Q_min"] < 2900 * math.exp(dlq) + 1   # el rango de 2027 incluye el del arranque


def test_techo_recalcula_precio_sobre_oferta():
    with tempfile.TemporaryDirectory() as d:
        sup = E.leer_supuestos(sup_file(d, [("q_max_hist", 3000, 3000, 3000), ("e_ref", 100, 100, 100), ("e_ultimo", 100, 100, 100), ("anio_ultimo_empleo", 2026, 2026, 2026)]))
        filas = [("alto", a, "g_empleo", 0.0) for a in E.ANIOS] + [("alto", a, "s_pipeline", 10.0) for a in E.ANIOS]
        params = E.leer_parametros(par_file(d, filas))
        out = E.correr(ARR, params, sup)
        f = out[0]
        assert f["techo_activo"] and abs(f["Q"] - 3000) < 0.1
        # §2.6 v2: Q fijo en el techo (= arranque) y P sobre la curva de oferta desplazada +10 %: 100·e^{(0 − ln 1.10)/1.5}
        assert abs(f["P_real"] - 100 * math.exp(-math.log(1.10) / 1.5)) < 1e-3 and abs(f["P_real"] - 93.844) < 1e-3


def test_rechazos():
    with tempfile.TemporaryDirectory() as d:
        for filas, msg in (([("base", 2027, "g_empleo", 1), ("base", 2027, "g_hogares", 1)], "margen extensivo"),
                           ([("base", 2026, "s_pipeline", 1)], "sólo se admite g_empleo 2026"),
                           ([("base", 2027, "techo_q", 1)], "fuera de contrato"),
                           ([("medio", 2027, "g_empleo", 1)], "escenario fuera de contrato"),
                           ([("base", 2027, "s_pipeline", 2), ("base", 2027, "s_cartera", 1)], "M3")):
            try:
                E.leer_parametros(par_file(d, filas))
            except ValueError as e:
                assert msg in str(e), (msg, str(e))
                continue
            raise AssertionError("no rechazó: " + msg)


def test_cartera_incremental_admitida():
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "parametros.csv")
        escribir(p, ["escenario", "anio", "variable", "valor", "calidad", "fuente", "nota"],
                 [("base", 2027, "s_pipeline", 2, "supuesto", "test", "prueba"), ("base", 2027, "s_cartera", 1, "supuesto", "test", "Incremental sobre pipeline: prueba")])
        assert len(E.leer_parametros(p)) == 2


def test_techo_igual_en_sensibilidad_hogares():
    with tempfile.TemporaryDirectory() as d:
        sup = E.leer_supuestos(sup_file(d, [("q_max_hist", 3000, 3000, 3000), ("e_ref", 100, 100, 100), ("e_ultimo", 100, 100, 100), ("anio_ultimo_empleo", 2026, 2026, 2026)]))
        completos = E.leer_parametros(par_file(d, [("base", a, "g_empleo", 5.0) for a in E.ANIOS]))
        hog = {(k[0], k[1], "g_hogares"): dict(v, variable="g_hogares") for k, v in completos.items()}
        a = E.correr(ARR, completos, sup)
        b = E.correr(ARR, hog, sup, "g_hogares", params_techo=completos)
        assert [round(f["techo_q"], 1) for f in a] == [round(f["techo_q"], 1) for f in b] == [3150.0, 3307.5, 3472.9, 3646.5]


def test_determinista():
    with tempfile.TemporaryDirectory() as d:
        sup = E.leer_supuestos(sup_file(d))
        params = E.leer_parametros(par_file(d, [("bajo", a, "g_empleo", -1.0) for a in E.ANIOS]))
        a, b = E.correr(ARR, params, sup), E.correr(ARR, params, sup)
        assert json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)


if __name__ == "__main__":
    n = 0
    for k, f in list(globals().items()):
        if k.startswith("test_"):
            f(); n += 1; print("OK", k)
    print(f"{n}/{n} OK")
