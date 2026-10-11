# Fluidez del despacho · versión 132

Fecha de propuesta: 11 de octubre de 2026. Estado: implementación en rama; producción pendiente de CI y revisión.

## Propósito

Elegir un autón, reconocer su siguiente decisión y conversar mirando el PPP nativo. La oficina conserva sus modos 3D y plano sin GPU. La reorganización mantiene todos los contratos de datos, acciones, permisos y recibos.

## Antes y cambio

- La cabecera ocupaba altura que necesitaba el tablero. El resumen pasa a dos renglones compactos y el PPP llena la superficie restante; tareas y fuentes se leen en su sección.
- Carga y error podían parecer un proyecto vacío. Ahora sólo una lectura correcta puede acreditar ausencia de encargos. Un registro conservado muestra su condición histórica.
- Pendientes releía y podía aceptar una revisión distinta. Ahora compara la entrega mostrada; ante conflicto exige leerla de nuevo.
- La rueda desplegaba otra lista fuera del círculo. Las cuatro direcciones permanecen estables y sus dos opciones aparecen en el centro, sin enviar comandos por señalar.
- La oficina tenía selección dispersa. La bandeja reúne nombres del catálogo autorizado y utiliza exactamente la misma apertura del avatar; no concede acceso ni promete trabajo continuo.
- El plano mostraba muchos movimientos manuales simultáneos. Se mantienen bajo un desplegable; elegir autón sigue visible.

## Capacidades conservadas

PPP y sus ajustes con confirmación; voz y escucha/interrupción/cápsula; chat e historial; encargo explícito, criterios, tareas, evidencias, retomar y detener; revisión y reuniones con narración y descarga; fuentes, navegador, notas y versiones; avatar; chinches; plano, navegación y movimiento manual. Abrir, volver o recuperar nunca inicia o reanuda objetivos.

## Comprobación y límites

Los ensayos de navegador usan módulos reales con transporte sintético e incluyen capturas, tres casos aislados, estados, conflicto de revisión, teclado, tamaño de controles y espacio del PPP en escritorio, Chromebook y móvil. No acreditan datos financieros privados, micrófono físico ni autonomía 24/7. No se crean tareas de negocio, no se escribe en Sheets y no se reinicia Render por esta versión de cliente.

## Reversión

Revertir el PR de interfaz. No borrar datos, recibos, expedientes ni disco persistente. Las automatizaciones canceladas permanecen canceladas.
