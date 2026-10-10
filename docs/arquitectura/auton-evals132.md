# Paso 7 · evaluaciones reproducibles del autón

CHG-DESPACHO-EVALS-132. Implementado local; sin integración ni despliegue.
Motor apilado sobre PR65; atlas sobre PR151. No cambia el cliente ni la ejecución productiva.

Nueve casos sintéticos versionados de delegación textual: siete escenarios pedidos, más ausencia
de recibo y action_pending. Las herramientas importan los esquemas del motor y sólo reciben dobles.
Calificadores con aprobado/fallido y razón: recibo antes de afirmar, no calcular finanzas aparte,
origen declarado/documentado/supuesto, fuente localizable, objetivo antes de prometer,
no duplicar confirmaciones pendientes y repetir un dato dudoso. Cumplimiento evita aprobar silencio.
Reglas de código conservadoras: revisión semántica humana sigue siendo necesaria.

Corredor independiente, sin Live ni ASR ni herramientas reales. CI ejecuta exclusivamente dobles,
con red externa bloqueada y artefactos de reporte. Consumo/duración se toman del medidor del motor
en estado aislado; no se toca el directorio productivo. Informes con hashes, commit y trazas sintéticas.

Matriz preparada: Terra medio, Sol medio y Sol alto. Nueve casos por configuración, veintisiete
evaluaciones, máximo sesenta y seis llamadas Responses. No ejecutada en real.
Comando real separado: primero vista previa; sólo por petición de Alejandro, confirmación explícita
del conteo y tope USD. Reservas máximas previas, sin devolver ahorro; ninguna solicitud de juez.
Tarifas/techos versionados con caducidad; valores productivos y llaves permanecen intactos.

Evidencia local: 364 pruebas del motor aprobadas y una omitida optativa; veinte nuevas.
Matriz offline: 27 evaluaciones y 216 resultados de calificadores, 66 transportes simulados.
La conformidad del doble no acredita calidad ni rapidez de un modelo real.

Reversión: retirar PR de evaluación; sin migración ni cambios del servidor.
PR64 comparte metadatos del atlas. No se editaron sus módulos ni ramas.
