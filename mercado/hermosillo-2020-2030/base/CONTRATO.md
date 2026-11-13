# Contrato de datos — Hermosillo 2020–2030 (base comparable)

Versión 1 · 2026-11-01 · Sol Integración (Claude principal). Cualquier cambio al contrato lo hace solo Sol Integración.

## Objetivo del producto final
Diagrama de oferta y demanda de vivienda nueva formal del municipio de Hermosillo, año por año 2020–2030: curvas cruzadas (precio en eje vertical, cantidad en horizontal) que se desplazan de un año al siguiente, con el punto de equilibrio observado (precio medio, unidades vendidas) para 2020–2026 y escenarios con rango para 2027–2030. Cada posición de curva debe poder explicarse con 2–4 variables medidas (desplazadores) y cada número debe rastrearse a fuente + localizador.

## Archivo 1: `series.csv` (formato largo, UTF-8, separador coma, comillas dobles)
Columnas, exactamente en este orden:
1. `serie_id` — slug estable, minúsculas, guiones: ej. `prod-dtu-ruv`, `creditos-infonavit-nueva`, `precio-shf-indice`.
2. `variable` — nombre legible en español.
3. `unidad` — `viviendas`, `créditos`, `hogares`, `personas`, `puestos`, `MXN`, `MXN/mes`, `índice`, `%`, `MXN millones`, etc.
4. `geografia` — uno de: `municipio Hermosillo`, `ciudad Hermosillo (ENOE)`, `ZM Hermosillo`, `Sonora`, `nacional`.
5. `segmento` — `nueva`, `usada`, `renta`, `total`, o banda de precio en MXN (ej. `≤1.05 mdp`), o `n/a`.
6. `periodo` — `YYYY`, `YYYY-MM`, `YYYY-Qn`. Anual preferido; mensual/trimestral si es la unidad de la fuente.
7. `valor` — número sin separadores de miles; punto decimal.
8. `fuente_id` — ID del archivo `fuentes.csv`.
9. `url` — URL exacta donde se leyó el valor.
10. `localizador` — página, tabla, fila/columna, nombre de filtro o celda; lo suficiente para que un auditor llegue al número en <2 minutos.
11. `fecha_corte` — corte de la fuente (ej. `2026-07-31`) o `n/d`.
12. `fecha_consulta` — `2026-11-01`.
13. `calidad` — uno de: `observado` (leído directamente en fuente oficial/primaria), `declarado` (dicho por un actor: cámara, gobierno, empresa), `prensa` (nota periodística que cita a otro), `estimado` (cálculo propio, explicar en nota), `por verificar` (no se pudo abrir la fuente; valor heredado del trabajo previo).
14. `nota` — definición exacta de la fuente, advertencias de cobertura/corte, y por qué este valor y no otro.

Reglas:
- Un valor por fila. No inventar valores. Si una fuente no abre, dejar la fila con `calidad=por verificar` y describir el intento en `nota`.
- No mezclar cobertura: si la fuente es estatal, `geografia=Sonora`; nunca "convertir" a municipio sin una fila `estimado` con la fórmula en `nota`.
- Definiciones distintas → `serie_id` distintos (ej. `prod-dtu-ruv` vs `prod-hcv-canadevi`). Jamás fusionar.
- 2026: periodo `2026` solo si la fuente da cierre; si es al corte, usar `2026-MM` o `2026-Qn`.

## Archivo 2: `fuentes.csv`
Columnas: `fuente_id`, `nombre`, `organismo`, `nivel` (federal/estatal/municipal/sectorial/comercial/académico/prensa), `url`, `tipo` (pdf/portal/api/cubo/nota), `cobertura`, `periodicidad`, `acceso` (abierto/registro/pago), `fecha_consulta`, `estado` (leída/extraída/no abre), `limite` (advertencia principal).

## Archivo 3: `notas-<frente>.md`
Informe breve (máx. ~1,500 palabras): qué se encontró, qué no, contradicciones entre fuentes (con ambos valores), definiciones, y la lista de valores `por verificar` con el motivo. Terminar con "Hallazgos para el auditor".

## Archivo 4: `checkpoints-<frente>.md`
Una línea por checkpoint con hora real UTC (`date -u`), tarea, qué cambió, evidencia, bloqueo, siguiente paso.

## Prohibido
- Sumar producción y créditos, o restarlos, para hablar de déficit.
- Presentar como observado lo que es declaración o prensa.
- Reutilizar cifras del trabajo previo sin reabrir la fuente (si no se reabre: `por verificar`).
- Comparar año completo con parcial.
- Tocar archivos de otro frente.
