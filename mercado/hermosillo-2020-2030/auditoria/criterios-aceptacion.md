# Criterios de aceptación — Hermosillo 2020–2030

Astra (auditoría independiente) · v1 · 2026-11-01. Aplica a `series.csv`, `fuentes.csv` y `notas-*.md` de Terra 1, 2 y 3. `CONTRATO.md` manda; esto lo concreta.

## 1. Series mínimas (2020–2026)

### 1a. Punto de equilibrio observado (P, Q)

**Q = créditos individuales de adquisición de vivienda NUEVA, deduplicados por vivienda (INFONAVIT + FOVISSSTE + banca CNBV), municipio Hermosillo, año calendario.**
- DTU/RUV es producción: terminada ≠ vendida. Va como desplazador de oferta, nunca como Q.
- Operaciones CANADEVI es lo más cercano a "venta", pero es declarado por una cámara (solo socios), sin metodología ni serie oficial continua. Sirve para conciliar (bigote del punto), no como eje.
- Créditos es la única medida municipal, anual, oficial, con segmento `nueva` y continua 2020–2026; un crédito de adquisición se ejerce solo si hubo compraventa. Debilidades a declarar: excluye contado (relevante en residencial) y duplica si no se deduplican cofinanciamientos.
- Si SNIIV publica **vivienda RUV vendida/individualizada** por municipio, es el mejor puente oferta↔demanda: extraer como `serie_id` aparte y conciliar.

**P = precio medio real de vivienda nueva a calidad constante** (`estimado`): ancla observada (valor promedio de la vivienda nueva financiada en Hermosillo, año base, SNIIV/INFONAVIT) × Índice SHF Hermosillo (nueva si existe; total con advertencia) ÷ INPC ciudad Hermosillo. Los tres insumos van como `observado`, la fórmula en `nota`.
- Por qué: el promedio de lo vendido cambia por mezcla (si entra vivienda Bienestar a precio administrado, el promedio baja aunque los precios suban y el tablero diría "cayó la demanda"). El promedio simple se entrega también como punto alterno.

| serie_id sugerido | definición | cobertura | fuente preferida / alternativas | NO se acepta |
|---|---|---|---|---|
| `q-creditos-nueva-dedup` | créditos de adquisición nueva, una vez por vivienda | municipio | SNIIV cubos S013–S016 / INFONAVIT delegación, ISSSTESON | sumar los dos créditos de un cofinanciamiento; mejora, autoconstrucción, usada |
| `q-operaciones-canadevi` | operaciones CANADEVI por banda de precio | municipio | CANADEVI (S054) / HCV (S062), prensa (S066) con `calidad` correcta | semestre como año |
| `q-ruv-vendida` | viviendas RUV individualizadas | municipio | SNIIV Oferta (S061) | confundir con DTU |
| `p-shf-indice` | índice SHF, nivel y var. anual | municipio o ZM; si solo Sonora, etiquetarlo | SHF / ficha IIEG solo como pista | portales (precio pedido) |
| `p-ancla-nueva-financiada` | valor promedio vivienda nueva financiada, año base | municipio | SNIIV / bandas CANADEVI (`estimado`) | monto de crédito como precio |
| `p-real-nueva` | ancla × índice ÷ INPC, pesos 2026 | municipio | cálculo propio | nominal sin aviso |
| `inpc-hermosillo` | INPC ciudad, promedio anual | ciudad INPC (declarar) | INEGI (S009) | — |

### 1b. Desplazadores de demanda

| serie | definición | cobertura | fuente / alternativas | NO se acepta |
|---|---|---|---|---|
| población, hogares | población anual CONAPO; hogares Censo 2020; hogares anuales = `estimado` con tamaño medio | municipio | CONAPO (S011), Censo (S001) / ENVI (Sonora). COESPO = misma base | proyectar hogares sin fila `estimado` |
| empleo formal | puestos IMSS, promedio anual y diciembre | municipio (registro patronal; advertir) | IMSS (S010) | ENOE ciudad como municipio |
| ingreso | salario base de cotización IMSS real; ingreso laboral ENOE | municipio / `ciudad Hermosillo (ENOE)` | IMSS; ENOE (S003) / ENIGH (Sonora) | mezclar ciudad y municipio en una serie |
| tasa y condiciones | tasa ponderada nuevos créditos; tasa, monto máximo y plazo INFONAVIT/FOVISSSTE por año | nacional (declarar) | Banxico (S064); reglas INFONAVIT / CNBV | tasa nacional rotulada "Hermosillo" |
| remesas | ingresos por remesas, anualizadas | municipio | Banxico CE166 (S019) | Sonora como municipio |
| migración | saldo neto migratorio CONAPO; migrantes recientes Censo | municipio | CONAPO, Censo | prensa como dato |
| elegibilidad | demanda potencial INFONAVIT | municipio | SNIIV (S014) | presentarla como demanda efectiva |

### 1c. Desplazadores de oferta

| serie | definición | cobertura | fuente / alternativas | NO se acepta |
|---|---|---|---|---|
| registro RUV | viviendas registradas | municipio | SNIIV (S061) | sumar INSUS (S036) |
| DTU | viviendas terminadas | municipio | SNIIV / CANADEVI | llamarla "vendida" |
| inventario | vivienda vigente por estatus al cierre (en proceso / terminada sin vender) | municipio | SNIIV inventario / Softec público | "vigente total" como "sin vender" |
| costos | índice CMIC-CEICO residencial Hermosillo: total, materiales, mano de obra | ciudad (CMIC) | CMIC (S056) / INPC materiales nacional | nacional sin etiqueta |
| cartera de programas | unidades por programa y etapa (anunciada / asignada / en construcción / entregada), con fecha | municipio | CONAVI, INFONAVIT, Sonora, Sello H / prensa | metas como entregas; Sello H como stock; programas traslapados sumados |
| licencias | licencias habitacionales (unidades o m²) | municipio | HDigital / IMPLAN | — |
| agua, suelo | indicadores Agua de Hermosillo; reserva territorial PMDU 2023 | municipio | S028, IMPLAN | prensa de "crisis" como dato |

Regla: Q, P, empleo IMSS, DTU e inventario son obligatoriamente municipales. Lo demás puede ser estatal o nacional si va etiquetado y nunca se "convierte" sin fila `estimado` con fórmula.

## 2. Niveles de aceptación

**Básico funcional** (pasa a integración):
1. Cada serie del §1 con ≥1 fila por año 2020–2025 y 2026 al corte, o vacío declarado en una tabla serie × año en `notas-*.md`.
2. Toda fila con `fuente_id`, `url` y `localizador` que lleven al número en <2 minutos; 14 columnas exactas; `calidad` correcta.
3. `por verificar`: ≤1 año en P y Q; ≤20% en desplazadores; todos listados con el intento.
4. Una definición por `serie_id`; `2026` solo con cierre de fuente.
5. Checkpoints con hora UTC real.

**Medio completo** (pasa a tablero):
1. 0 `por verificar` en las series que dibujan el diagrama: P, Q, DTU, inventario, empleo, tasa, cartera.
2. Q conciliada con una serie independiente (CANADEVI o RUV vendida): diferencia por año y explicación.
3. P con ancla + índice + INPC y fórmula; promedio simple aparte.
4. Contradicciones: ambos valores, fuentes, cortes y resolución (o "abierta: se grafica rango").
5. Inventario: identidad inicial + altas − ventas − retiros verificada, o explicado por qué no cierra.
6. 2026: al corte + cierre estimado con método y rango.
7. Regla de deduplicación de cofinanciamientos escrita y aplicada.

## 3. Trampas que rechazan una entrega
1. DTU frente a créditos presentado como déficit o superávit.
2. Cofinanciamientos contados dos veces (Cofinavit, Infonavit Total, Apoyo Infonavit).
3. `ciudad Hermosillo (ENOE)` o ZM usada como municipio.
4. Año completo comparado con semestre o corte parcial.
5. Metas ("20,000 viviendas a 2030") como entregas.
6. Inscripciones Sello H como stock u oferta.
7. Precio pedido de portales como precio de mercado.
8. CONAPO/COESPO, HCV/CANADEVI, o prensa que cita a CANADEVI, como fuentes independientes.
9. `observado` en valores leídos en documento de un tercero (HCV, IIEG, prensa): la calidad describe el documento abierto, no al productor original.
10. Mejoramiento, autoconstrucción o usada dentro de Q.
11. Registro RUV mezclado con DTU o con vendida.
12. Nominal y real mezclados; índice usado como nivel; SHF Sonora o SHF total rotulados "Hermosillo nueva".
13. IMSS diciembre comparado con promedios anuales; Sonora como municipio.
14. Demanda potencial INFONAVIT como demanda.
15. Vivienda Bienestar en renta sumada a ventas; unidades a precio administrado mezcladas con mercado sin etiqueta.
16. Bandas de precio de Softec, Tinsa o CANADEVI distintas entre años sin armonizar.
17. Cifras del trabajo previo sin reabrir la fuente.
