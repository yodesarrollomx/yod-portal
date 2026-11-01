#!/usr/bin/env python3
"""Frente INTEGRACIÓN (Sol Integración, 1-nov-2026): series extraídas por el integrador tras el dictamen
de la Fase 1 (R1 y R3) y series derivadas del diagrama. Escribe 01_base/integracion/series.csv.
Todos los valores observados fueron leídos el 2026-11-01 de los API públicos del SNIIV (SEDATU) con WebFetch;
las URLs son GET públicos reproducibles en navegador."""
import csv, os
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(RAIZ, "01_base", "integracion", "series.csv")
COLS = ["serie_id","variable","unidad","geografia","segmento","periodo","valor","fuente_id","url","localizador","fecha_corte","fecha_consulta","calidad","nota"]
HOY = "2026-11-01"
rows = []
def add(sid, var, unidad, geo, seg, per, val, fid, url, loc, corte, cal, nota):
    rows.append(dict(serie_id=sid, variable=var, unidad=unidad, geografia=geo, segmento=seg, periodo=per, valor=val, fuente_id=fid, url=url, localizador=loc, fecha_corte=corte, fecha_consulta=HOY, calidad=cal, nota=nota))

# ── 1. Índice SHF de precios de la vivienda, niveles trimestrales (base 2018=100), API ShfPriceAPI del SNIIV ──
SHF_URL = "https://sniiv.sedatu.gob.mx/api/ShfPriceAPI/GetTerritorialVariation?baseYear={y1}&baseQuarter={q1}&finalYear={y2}&finalQuarter={q2}"
# (año, trimestre, Hermosillo, Sonora) leídos por pares base→final; cada par devuelve initialValue y finalValue
shf = {
 (2019,1):(112.07,111.33),(2019,2):(114.52,113.72),(2019,3):(116.60,115.65),(2019,4):(118.63,117.41),
 (2020,1):(121.06,119.73),(2020,2):(123.30,121.80),(2020,3):(125.34,123.72),(2020,4):(127.89,126.21),
 (2021,1):(131.46,129.78),(2021,2):(134.06,132.49),(2021,3):(135.89,134.29),(2021,4):(137.18,135.52),
 (2022,1):(139.53,137.79),(2022,2):(143.13,141.18),(2022,3):(147.09,144.98),(2022,4):(149.95,147.74),
 (2023,1):(155.49,153.07),(2023,2):(160.96,158.38),(2023,3):(165.71,162.90),(2023,4):(170.01,167.09),
 (2024,1):(175.24,172.14),(2024,2):(178.92,175.62),(2024,3):(182.94,179.48),(2024,4):(186.96,183.34),
 (2025,1):(191.74,188.03),(2025,2):(197.11,193.55),(2025,3):(201.14,197.81),(2025,4):(203.73,200.57),
 (2026,1):(209.36,206.10),(2026,2):(214.71,211.35),
}
NOTA_SHF = ("Índice SHF de Precios de la Vivienda (SHF), nivel trimestral, año base 2018=100, tal como lo sirve el API ShfPriceAPI "
            "del SNIIV (página Inicio/Precios_de_vivienda). Vigencia actual del índice: la SHF revisa trimestres previos, por eso las "
            "variaciones derivadas pueden diferir en décimas de los boletines de la época. Cada llamada base→final devuelve initialValue "
            "(trimestre base) y finalValue (trimestre final). Cubre toda la vivienda con avalúo (nueva y usada): no hay desglose nueva/usada por municipio.")
for (y,q),(h,s) in sorted(shf.items()):
    # par usado: (Q1→Q2) o (Q3→Q4) del mismo año
    q1, q2 = (1,2) if q in (1,2) else (3,4)
    url = SHF_URL.format(y1=y,q1=q1,y2=y,q2=q2)
    campo = "initialValue" if q==q1 else "finalValue"
    add("shf-indice-hermosillo","Índice SHF de precios de la vivienda · Hermosillo (nivel)","índice 2018=100","municipio Hermosillo","total",f"{y}-Q{q}",h,"INT-01",url,f"objeto municipalities con stateCode='26' y municipalityCode='030', campo '{campo}'","2026-Q2","observado",NOTA_SHF)
    add("shf-indice-sonora","Índice SHF de precios de la vivienda · Sonora (nivel)","índice 2018=100","Sonora","total",f"{y}-Q{q}",s,"INT-01",url,f"objeto states con stateCode='26', campo '{campo}'","2026-Q2","observado",NOTA_SHF)
# promedio anual (P del diagrama)
for y in range(2019, 2026):
    vals=[shf[(y,q)][0] for q in (1,2,3,4)]
    add("p-shf-indice-hermosillo-anual","Índice SHF Hermosillo · promedio anual (P del diagrama)","índice 2018=100","municipio Hermosillo","total",str(y),round(sum(vals)/4,2),"INT-01",SHF_URL.format(y1=y,q1=1,y2=y,q2=4),"promedio simple de los cuatro trimestres de shf-indice-hermosillo","2026-Q2","estimado","Promedio simple de Q1–Q4 del nivel trimestral observado. Es el eje de precio del diagrama: índice de precios a calidad constante (SHF), nominal; el tablero ofrece deflactarlo con INPC nacional.")
add("p-shf-indice-hermosillo-anual","Índice SHF Hermosillo · promedio ene–jun (al corte)","índice 2018=100","municipio Hermosillo","total","2026-Q2",round((shf[(2026,1)][0]+shf[(2026,2)][0])/2,2),"INT-01",SHF_URL.format(y1=2026,q1=1,y2=2026,q2=2),"promedio simple de Q1 y Q2 2026","2026-Q2","estimado","Promedio de los dos trimestres disponibles de 2026: NO es cierre anual.")

# ── 2. INFONAVIT vivienda nueva por tipo de crédito (acciones), anual ──
TIPO_URL = "https://sniiv.sedatu.gob.mx/api/CuboAPI/GetInfonavit/2020,2026/26/030/anio,tipo_credito,modalidad"
tipo = {  # año: (Individual, Conyugal, Unamos Creditos 2, No disponible)
 2020:(1293,202,316,52), 2021:(1687,256,578,0), 2022:(1454,174,614,0), 2023:(1292,202,612,0),
 2024:(1257,420,876,0), 2025:(1163,552,1814,0), 2026:(747,354,1274,0),
}
NOTA_TIPO = ("Acciones de crédito INFONAVIT, modalidad 'Nueva', por tipo_credito. 'Conyugal' y 'Unamos Creditos 2' son créditos de dos "
             "derechohabientes para UNA vivienda: el SNIIV los cuenta como dos acciones (el monto por acción, ~555–674 mil, es menor que el "
             "individual, ~866 mil en 2025). 2026 = enero–julio (corte 31-jul-2026), no año completo.")
for y,(ind,cony,una,nd) in tipo.items():
    per = "2026-07" if y==2026 else str(y)
    for sid,lab,v in (("creditos-infonavit-nueva-tipo-individual","Individual",ind),("creditos-infonavit-nueva-tipo-conyugal","Conyugal",cony),("creditos-infonavit-nueva-tipo-unamos","Unamos Creditos 2",una),("creditos-infonavit-nueva-tipo-no-disponible","No disponible",nd)):
        if v==0 and lab=="No disponible": continue
        add(sid,f"Créditos INFONAVIT vivienda nueva · tipo {lab}","créditos","municipio Hermosillo","nueva",per,v,"DEM-01",TIPO_URL,f"objeto tipo_credito='{lab}', modalidad='Nueva', año={y}; campo 'acciones'" + (" (2026 acumula ene–jul)" if y==2026 else ""),"2026-07-31","observado",NOTA_TIPO)

# ── 3. Mensual 2025–2026 por tipo y por esquema (para comparar ene–jul) ──
MES_TIPO_URL = "https://sniiv.sedatu.gob.mx/api/CuboAPI/GetInfonavit/2025,2026/26/030/anio,mes,tipo_credito,modalidad"
MES_ESQ_URL = "https://sniiv.sedatu.gob.mx/api/CuboAPI/GetInfonavit/2025,2026/26/030/anio,mes,modalidad,esquema"
MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
mt = { # (año, mes): (Conyugal, Individual, Unamos)
 (2025,1):(52,109,88),(2025,2):(54,76,100),(2025,3):(42,98,108),(2025,4):(36,104,114),(2025,5):(56,128,152),(2025,6):(42,91,130),(2025,7):(50,106,176),
 (2025,8):(36,89,168),(2025,9):(40,53,164),(2025,10):(46,102,250),(2025,11):(38,97,186),(2025,12):(60,110,178),
 (2026,1):(36,73,194),(2026,2):(38,97,174),(2026,3):(50,123,154),(2026,4):(26,74,140),(2026,5):(48,127,204),(2026,6):(90,146,230),(2026,7):(66,107,178),
}
me = { # (año, mes): (Apoyo infonavit, Cofinavit, Tradicional, Infonavit total)
 (2025,1):(29,20,189,11),(2025,2):(9,9,208,4),(2025,3):(29,10,197,12),(2025,4):(24,11,207,12),(2025,5):(42,15,259,20),(2025,6):(21,15,218,9),(2025,7):(29,21,275,7),
 (2025,8):(18,10,249,16),(2025,9):(6,13,223,15),(2025,10):(27,12,347,12),(2025,11):(12,19,271,19),(2025,12):(15,17,302,14),
 (2026,1):(13,16,267,7),(2026,2):(19,10,263,17),(2026,3):(24,11,278,14),(2026,4):(17,11,196,16),(2026,5):(11,19,334,15),(2026,6):(20,10,426,10),(2026,7):(21,11,306,13),
}
for (y,m),(c,i,u) in sorted(mt.items()):
    per=f"{y}-{m:02d}"
    for sid,lab,v in (("creditos-infonavit-nueva-tipo-conyugal-mensual","Conyugal",c),("creditos-infonavit-nueva-tipo-individual-mensual","Individual",i),("creditos-infonavit-nueva-tipo-unamos-mensual","Unamos Creditos 2",u)):
        add(sid,f"Créditos INFONAVIT vivienda nueva · tipo {lab} · mensual","créditos","municipio Hermosillo","nueva",per,v,"DEM-01",MES_TIPO_URL,f"objeto año={y}, mes='{MESES[m-1]}', tipo_credito='{lab}', modalidad='Nueva'; campo 'acciones'","2026-07-31","observado",NOTA_TIPO)
for (y,m),(a,co,tr,to) in sorted(me.items()):
    per=f"{y}-{m:02d}"
    for sid,lab,v in (("creditos-infonavit-nueva-esq-apoyo-infonavit-mensual","Apoyo infonavit",a),("creditos-infonavit-nueva-esq-cofinavit-mensual","Cofinavit",co),("creditos-infonavit-nueva-esq-tradicional-mensual","Tradicional",tr),("creditos-infonavit-nueva-esq-infonavit-total-mensual","Infonavit total",to)):
        add(sid,f"Créditos INFONAVIT vivienda nueva · esquema {lab} · mensual","créditos","municipio Hermosillo","nueva",per,v,"DEM-01",MES_ESQ_URL,f"objeto año={y}, mes='{MESES[m-1]}', modalidad='Nueva', esquema='{lab}'; campo 'acciones'","2026-07-31","observado","Esquemas con participación bancaria (Cofinavit, Apoyo Infonavit, Infonavit total) pueden aparecer también en la banca (CNBV).")

# ── 4. Q deduplicada (derivada) ──
esq = {2020:(226,52,18),2021:(278,109,33),2022:(172,200,50),2023:(215,251,70),2024:(225,299,127),2025:(172,261,151)}  # cofinavit, apoyo, total (series demanda)
fov = {2020:296,2021:334,2022:247,2023:264,2024:274,2025:229}
cnbv = {2020:1338,2021:1730,2022:1861,2023:1666,2024:1368,2025:1035}
FORM = ("Q = [Individual + No disponible + (Conyugal + Unamos Creditos 2)/2] (INFONAVIT nueva) − Cofinavit − Apoyo Infonavit − Infonavit total "
        "+ FOVISSSTE nueva (Adquisición) + banca CNBV 'Adquisición de Vivienda Nueva'. Supuestos: (a) Conyugal/Unamos = dos acciones por vivienda; "
        "(b) los esquemas con banco se cuentan también en CNBV (pareo sin verificar con el organismo). Excluye CONAVI (precio administrado), mejoramiento, suelo, usada.")
for y in range(2020,2026):
    ind,cony,una,nd = tipo[y]; co,ap,to = esq[y]
    viv_inf = ind + nd + (cony+una)/2
    q = viv_inf - co - ap - to + fov[y] + cnbv[y]
    add("q-viviendas-financiadas-nueva-dedup","Viviendas nuevas financiadas (deduplicadas) · Q del diagrama","viviendas","municipio Hermosillo","nueva",str(y),round(q),"INT-02",TIPO_URL,"cálculo propio sobre creditos-infonavit-nueva-tipo-*, creditos-infonavit-nueva-esq-*, creditos-fovissste-nueva y creditos-cnbv-nueva","2026-07-31","estimado",FORM + f" Año {y}: INFONAVIT viviendas={viv_inf:.0f}, esquemas con banco={co+ap+to}, FOVISSSTE={fov[y]}, CNBV={cnbv[y]}.")
    add("viviendas-infonavit-nueva-dedup","Viviendas nuevas financiadas por INFONAVIT (deduplicadas)","viviendas","municipio Hermosillo","nueva",str(y),round(viv_inf),"INT-02",TIPO_URL,"Individual + No disponible + (Conyugal + Unamos)/2","2026-07-31","estimado","Supuesto: Conyugal y Unamos Creditos 2 son dos acciones por vivienda.")
# 2026 ene–jul y mismo periodo 2025
def dedup_meses(y, meses, fov_v, cnbv_v):
    c=sum(mt[(y,m)][0] for m in meses); i=sum(mt[(y,m)][1] for m in meses); u=sum(mt[(y,m)][2] for m in meses)
    a=sum(me[(y,m)][0] for m in meses); co=sum(me[(y,m)][1] for m in meses); to=sum(me[(y,m)][3] for m in meses)
    viv = i + (c+u)/2
    return viv - co - a - to + fov_v + cnbv_v, viv, (c,i,u,a,co,to)
q26, viv26, d26 = dedup_meses(2026, range(1,8), 155, 568)   # FOVISSSTE y CNBV nueva ene–jul 2026 (series mensuales demanda)
q25p, viv25p, d25 = dedup_meses(2025, range(1,8), 129, 678) # ene–jul 2025
add("q-viviendas-financiadas-nueva-dedup","Viviendas nuevas financiadas (deduplicadas) · ene–jul 2026","viviendas","municipio Hermosillo","nueva","2026-07",round(q26),"INT-02",MES_TIPO_URL,"suma ene–jul 2026 de las series mensuales por tipo y esquema; FOVISSSTE 155 y CNBV 568 ene–jul 2026 (frente demanda)","2026-07-31","estimado",FORM + f" ene–jul 2026: Conyugal {d26[0]}, Individual {d26[1]}, Unamos {d26[2]}, Apoyo {d26[3]}, Cofinavit {d26[4]}, Infonavit total {d26[5]}.")
add("q-viviendas-financiadas-nueva-dedup-ene-jul-2025","Viviendas nuevas financiadas (deduplicadas) · ene–jul 2025 (comparable)","viviendas","municipio Hermosillo","nueva","2025-07",round(q25p),"INT-02",MES_TIPO_URL,"suma ene–jul 2025 de las series mensuales por tipo y esquema; FOVISSSTE 129 y CNBV 678 ene–jul 2025 (frente demanda)","2026-07-31","estimado",FORM + f" ene–jul 2025: Conyugal {d25[0]}, Individual {d25[1]}, Unamos {d25[2]}, Apoyo {d25[3]}, Cofinavit {d25[4]}, Infonavit total {d25[5]}.")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f, fieldnames=COLS); w.writeheader(); w.writerows(rows)
with open(os.path.join(RAIZ,"01_base","integracion","fuentes.csv"),"w",newline="",encoding="utf-8") as f:
    w=csv.writer(f); w.writerow(["fuente_id","nombre","organismo","nivel","url","tipo","cobertura","periodicidad","acceso","fecha_consulta","estado","limite"])
    w.writerow(["INT-01","Índice SHF de Precios de la Vivienda · API ShfPriceAPI (SNIIV)","SHF / SEDATU","federal","https://sniiv.sedatu.gob.mx/Inicio/Precios_de_vivienda","api","municipio, estado","trimestral 2005-I a 2026-II","abierto",HOY,"extraída","Toda la vivienda con avalúo (nueva+usada); vigencia actual del índice (revisado)."])
    w.writerow(["INT-02","Cálculo propio Q deduplicada","Sol Integración","n/a","",  "derivado","municipio","anual + ene–jul","n/a",HOY,"derivada","Depende de dos supuestos declarados (dos acciones por vivienda en Conyugal/Unamos; esquemas con banco también en CNBV)."])
print(len(rows), "filas;", "Q dedup:", [r['valor'] for r in rows if r['serie_id']=='q-viviendas-financiadas-nueva-dedup'], "| P anual:", [r['valor'] for r in rows if r['serie_id']=='p-shf-indice-hermosillo-anual'])
