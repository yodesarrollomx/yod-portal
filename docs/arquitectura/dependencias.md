# Dependencias y comprobaciones pendientes

La instalación y compilación de MOAC (`board-aurum`) y Codesarrolladores pasan. La revisión del 2026-09-30 detectó alertas en su árbol de dependencias; esto requiere tratamiento adicional y no se considera resuelto por compilar correctamente.

## MOAC

Las alertas examinadas corresponden a herramientas de compilación y desarrollo. Revisar versiones compatibles del árbol fijado, ejecutar una instalación limpia y repetir la compilación. Mantener los servidores de desarrollo fuera de producción. No asumir que una alerta de una herramienta implica una ruta explotable en el sitio estático; comprobar su alcance concreto.

## Codesarrolladores

Además de herramientas de compilación, la librería que genera PDF llega al navegador. La migración propuesta requiere verificar la compatibilidad entre el motor PDF y tablas, conservar el diseño de documentos y probar acentos, montos, saltos de página y exportaciones de varias páginas con datos sintéticos. Las pruebas deben cubrir también entradas inválidas y las funciones de la librería realmente utilizadas. No activar una versión mayor únicamente para silenciar el informe de dependencias.

## Disponibilidad de correcciones

Las versiones de parche sugeridas por el informe de auditoría no estaban disponibles en las consultas exactas al registro utilizado durante esta revisión: el registro respondió E404. La actualización selectiva compatible no aportó una corrección verificable. Se conservaron los lockfiles; no se registran esas alertas como corregidas ni se introducen paquetes desde fuentes alternativas.

La evidencia detallada y las versiones examinadas están en el registro restringido. Antes de actuar, repetir la consulta al registro oficial, confirmar que la versión está publicada, declarar el impacto y ejecutar las pruebas sobre el lockfile resultante. Los cambios de dependencias también pasan por el control de arquitectura.

Esta tarea amplía la propuesta L. Criterio de cierre: versiones disponibles e íntegras, ausencia de las alertas tratadas en el árbol resultante o análisis documentado de alcance, compilaciones limpias y exportaciones de referencia correctas. No se promete eliminar todas las alertas sin comprobar cada dependencia.
