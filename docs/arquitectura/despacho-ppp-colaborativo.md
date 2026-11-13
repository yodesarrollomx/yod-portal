# Plan de potencial junto a Gastón

CHG-DESPACHO-PPP-COLABORATIVO-093. Dirección pidió abrir el PPP desde el círculo y completarlo junto al agente.

## Recorrido

1. Círculo de Gastón → Plan de potencial. Abre el puesto compartido: conversación izquierda y tablero derecha en escritorio; disposición vertical en móvil. No inicia micrófono por abrir un tablero.
2. Iniciar conversación conserva la misma instancia del PPP y sus borradores. Terminar la voz tampoco cierra el tablero. Cambiar entre PPP, Conocimiento y navegador conserva esa instancia.
3. Gastón consulta la última lectura compartida con tablero_consultar y prepara cantidades con tablero_proponer_ajuste, herramientas ya instaladas. Cada propuesta muestra motivo y antes/después. Aplicar en el tablero usa su revisión, escenario y request_id originales; no crea fórmulas ni aprueba un escenario.
4. La aplicación permanece pendiente hasta el recibo y la revisión confirmada. Cambios manuales, escenario distinto o revisión nueva impiden aplicar una propuesta vieja. Un timeout muestra confirmación pendiente y no dispara otra escritura.
5. Conservar y comparar variantes abre Conocimiento. Las versiones capturan resultados confirmados; comparar exige unidades, horizonte y criterios pertinentes. No se declara una alternativa ganadora sólo por elevar un indicador.

El puente actual corresponde al piloto PPP Patrimonial. No amplía modalidades financieras ni garantiza rendimientos. El modelo de Sheets conserva los cálculos; la contención del servicio y la aceptación con datos reales siguen pendientes. Reabrir un iframe no acredita ejecución correcta del backend.

## Evidencia

Pruebas de contratos y navegador sintético en scripts/probar-ppp-colaborativo-browser.cjs: círculo, apertura sin micrófono, borrador conservado al hablar, misma instancia entre pestañas/cierre de voz, propuesta, aplicación única y confirmación sólo tras recibo. Datos/protocolo sintéticos; cero escrituras en expedientes reales.

## Reversión

Revertir módulos de navegación/vista compartida y cache bumps. Mantener versiones, cantidades, historial, recibos, credenciales privadas y contratos del puente.
