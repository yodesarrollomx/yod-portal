# Checklist de auditoría — por entrega (`series.csv` + `fuentes.csv` + notas + checkpoints)

Astra · v1 · 2026-11-01. Se aplica íntegro a cada frente y a cada versión reentregada. Resultado: APROBADO básico / APROBADO medio / RECHAZADO, con dictamen.

## A. Formato (automático, antes de leer contenido)
- [ ] 14 columnas en el orden del contrato; UTF-8; coma; sin filas vacías; `valor` numérico sin separadores.
- [ ] `geografia`, `calidad`, `periodo` solo con valores permitidos; `fecha_consulta` = fecha real de lectura.
- [ ] Todo `fuente_id` existe en `fuentes.csv`; toda fuente `extraída` tiene al menos una fila.
- [ ] Sin `serie_id` + `periodo` + `geografia` + `segmento` duplicados.

## B. Muestreo de valores (mínimo 8 por frente)
- [ ] 8 filas: 2 de P o Q, 2 de desplazadores, 2 `estimado`, 1 `declarado`/`prensa`, 1 del año 2026. Prioridad a valores que mueven el diagrama.
- [ ] Reabro `url` + `localizador` y llego al número en <2 minutos. Si no: HALLAZGO.
- [ ] Valor, unidad, periodo, cobertura y segmento coinciden con la fuente. Anoto la versión o corte de la fuente al momento de mi lectura.
- [ ] `estimado`: recalculo con la fórmula de la nota; coincide a ±0.5%.
- [ ] Más de 1 fallo en 8: amplío a 16; más de 2 en 16: RECHAZADO.

## C. Unidades y cobertura
- [ ] Cada `serie_id` tiene una sola unidad y una sola geografía en todos sus años.
- [ ] Nada estatal o ciudad-ENOE etiquetado como municipio; conversiones solo con fila `estimado` y fórmula.
- [ ] Nominal vs real, promedio anual vs diciembre, flujo vs stock, y año fiscal vs calendario declarados.
- [ ] 2026: `2026-MM` o `2026-Qn` salvo cierre de fuente; nunca comparado con años completos.

## D. Definiciones
- [ ] Registro RUV ≠ DTU ≠ vendida ≠ inventario; nueva ≠ usada ≠ mejoramiento; crédito ≠ cofinanciamiento ≠ vivienda.
- [ ] Regla de deduplicación de cofinanciamientos escrita, aplicada y verificable.
- [ ] Bandas de precio y segmentos armonizados entre años o separados por `serie_id`.
- [ ] Programas: etapa (anunciada / asignada / en construcción / entregada) explícita; sin dobles conteos entre CONAVI, INFONAVIT, Sonora y Sello H.

## E. `calidad`
- [ ] `observado` solo en documento oficial o primario abierto por el productor.
- [ ] HCV, IIEG, prensa o cámara citando a otro: `declarado` o `prensa`, nunca `observado`.
- [ ] `por verificar` con el intento descrito (qué URL, qué error, qué día). Cuento y comparo con el umbral del nivel.
- [ ] Ninguna cifra heredada del trabajo previo sin reapertura.

## F. Contradicciones y notas
- [ ] Toda discrepancia entre fuentes de la misma variable aparece con ambos valores, fuentes, cortes y resolución.
- [ ] `notas-*.md` termina con "Hallazgos para el auditor" y una tabla serie × año de huecos.
- [ ] Checkpoints con horas UTC coherentes con los tiempos de modificación de archivos.
- [ ] Nada en notas sugiere déficit, causalidad ni "mercado" más allá de lo que la serie mide.

## G. Formato del dictamen (uno por hallazgo)
```
H-<frente>-<nn> | severidad: bloqueante / mayor / menor
hallazgo:     qué está mal, en una frase
evidencia:    archivo, fila(s) (serie_id, periodo), URL y localizador reabiertos, versión/corte de la fuente, fecha-hora UTC de mi lectura
corrección:   acción concreta sobre la fila o la nota (qué valor, qué calidad, qué serie_id, qué nota)
responsable:  Terra 1 / 2 / 3 / Sol Integración
resolución:   criterio verificable para cerrar (p. ej. "la fila reabre al valor X con calidad Y; recalculo coincide")
```
Bloqueante = afecta P, Q, DTU, inventario, empleo, tasa o cartera, o viola un "Prohibido" del contrato → RECHAZADO. Mayor = resto de series o calidad mal asignada → no pasa a medio. Menor = formato o redacción. Reentrega: solo reaudito los hallazgos abiertos más un nuevo muestreo de 4 filas.
