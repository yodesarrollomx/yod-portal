# Plan de entregas y decisiones

Las letras A–L se eligen en [propuestas.md](propuestas.md). Cada una contiene tareas, requisitos y criterios de aceptación en el [modelo](modelo.json). Esfuerzo M significa alcance concentrado en pocos contratos; L implica varias fuentes o migración. Son tamaños relativos, no promesas de duración.

## Entrega 1 · Base técnica autorizada

Atlas de arquitectura, fichas, contratos, diagramas, controles de GitHub y correcciones técnicas comprobadas. Resolver acceso a Apps Script, contrastar despliegues, tratar alertas de dependencias y conciliar diferencias sin alterar datos por inferencia. Esta entrega no activa las nuevas reglas comerciales.

## Entrega 2 · Ventas y continuidad comercial

Implementar las letras elegidas entre A, B, C y D, con A antes de las dependientes. Seleccionar un recorrido completo, verificarlo con casos de aceptación y observar resultados antes de ampliar. En paralelo, preparar E si los identificadores impiden unir los pasos; no migrar registros sin conciliación.

## Entrega 3 · Margen, operación y cobro

Con E validada, abordar F, G y H según decisiones. I depende de E/H y J de I. K acompaña la medición y L mantiene versiones, contratos y trazabilidad. No automatizar confirmaciones bancarias, permisos o comunicaciones por el mero hecho de figurar en el plan.

Estas tres entregas agrupan el trabajo para decidir y revisar. El número real de sesiones depende del acceso a motores, el tamaño de las migraciones y las letras seleccionadas. Cada entrega termina con pruebas de aceptación, comparación del diagrama con el código y registro del despliegue.

## Forma de decidir

`A sí, con plazo de …`; `B después de …`; `C no`; `E solo para proyectos nuevos`. Se conserva la decisión literal y se ajustan tareas y contratos antes de implementar. Las mejoras ya autorizadas y de alcance técnico se registran en `changes`; las decisiones de negocio continúan pendientes en `proposals`.
