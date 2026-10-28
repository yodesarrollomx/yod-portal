# Propuestas para decidir

> Generado desde modelo.json. No editar a mano. Revisión 2026-10-28.despacho-estados.2 · 2026-10-20.

Prioridad: vender más → margen y control → cobrar antes. Son hipótesis de mejora: no se activan por aparecer en este archivo. Responde por ID: «A sí», «B con estos cambios», «C no».

## A · Atención comercial sin leads olvidados

- Tableros: SYS-MARKETING, SYS-PLAN-POTENCIAL, SYS-CROKISS, SYS-DESPACHO.
- Problema: Seguimientos fragmentados y confirmación de citas no verificada
- Beneficio esperado: Más conversaciones y citas atendidas
- Medición: Mediana de primer contacto; porcentaje de leads sin tocar a 24 h; citas confirmadas/lead
- Dependencias: Sin dependencias previas.
- Esfuerzo: M. Decisión: **pendiente**.

### Requisitos previos

- Definir plazo de respuesta y roles comerciales
- Acceso al backend vigente de cada captador

### Tareas

1. Acordar responsable, plazo y etapas de atención por origen
2. Mostrar bandeja de leads sin contacto, próximo paso y citas por confirmar
3. Probar asignación, deduplicación y cierre con casos sintéticos

### Criterios de aceptación

- Ningún lead activo queda sin responsable y próximo paso
- Se mide primer contacto y conversión a cita sin enviar mensajes automáticos no autorizados

## B · Atribución desde campaña hasta venta

- Tableros: SYS-SALA, SYS-MARKETING, SYS-PLAN-POTENCIAL, SYS-CROKISS.
- Problema: Ya existe atribución por campaña/pieza a leads y citas; falta comprobar cobertura del backend y continuidad hasta contrato, venta y margen
- Beneficio esperado: Invertir pauta y contenido en fuentes que generan ventas
- Medición: Venta y margen por campaña; conversión por etapa
- Dependencias: A.
- Esfuerzo: L. Decisión: **pendiente**.

### Requisitos previos

- Decidir ventana de atribución y qué evento cuenta como venta

### Tareas

1. Conservar campaña y pieza desde captación hasta oportunidad
2. Vincular oportunidad, propuesta y venta con folios
3. Comparar ventas y margen por origen, separando datos incompletos

### Criterios de aceptación

- Una venta de prueba conserva su origen verificable
- Las ventas sin atribución se muestran como pendientes

## C · Cotización, plan y siguiente paso comercial

- Tableros: SYS-CODES-PORTAL, SYS-INVERSION, SYS-PLAN-POTENCIAL, SYS-POTENCIALES, SYS-TRACK.
- Problema: No se comprobó continuidad folio de lead a propuesta y contrato
- Beneficio esperado: Aumentar cierre y reducir propuestas detenidas
- Medición: Propuestas ganadas/enviadas; días por etapa
- Dependencias: A.
- Esfuerzo: M. Decisión: **pendiente**.

### Requisitos previos

- Acordar estados comerciales y evidencia de aceptación

### Tareas

1. Definir folio y estados de propuesta comercial
2. Vincular propuesta con proyecto, responsable y siguiente contacto
3. Registrar aceptación o pérdida con motivo y fecha

### Criterios de aceptación

- Se sigue un caso desde lead hasta contrato sin duplicar proyecto
- Cada propuesta detenida tiene responsable y siguiente acción

## D · Referidos y reactivación con control humano

- Tableros: SYS-CODES-PORTAL, SYS-DESPACHO.
- Problema: El portal tiene referidos, pero integración comercial completa no comprobada
- Beneficio esperado: Más oportunidades desde clientes y asesores existentes
- Medición: Referidos calificados; ventas atribuidas; tiempo de atención
- Dependencias: A; B.
- Esfuerzo: M. Decisión: **pendiente**.

### Requisitos previos

- Definir elegibilidad de referidos y reglas de contacto

### Tareas

1. Relacionar referido con origen y consentimiento operativo
2. Preparar lista revisable de reactivación con motivos
3. Medir aceptación, citas y ventas referidas

### Criterios de aceptación

- Se conserva el origen del referido sin multiplicar personas
- Cualquier contacto saliente requiere la aprobación prevista

## E · Folio común de proyecto y datos conciliados

- Tableros: SYS-CONTROL, SYS-TAREAS, SYS-FLUJO, SYS-MIRAMAR, SYS-INTERIORES, SYS-OBRA.
- Problema: Identidad de proyecto se deriva parcialmente de nombres y alias
- Beneficio esperado: Evitar duplicados y conocer resultado de cada proyecto
- Medición: Porcentaje de registros con folio válido; duplicados pendientes
- Dependencias: Sin dependencias previas.
- Esfuerzo: L. Decisión: **pendiente**.

### Requisitos previos

- Responsable de conciliación
- Respaldo y fuente de servidor vigentes

### Tareas

1. Inventariar identificadores actuales y proponer correspondencias
2. Crear catálogo de folios preservando alias e historia
3. Migrar por lotes reversibles tras conciliación de muestra

### Criterios de aceptación

- Todo cambio conserva referencia al registro anterior
- No se fusionan proyectos por similitud de nombre sin validación

## F · Margen por proyecto y compromisos

- Tableros: SYS-ALQUIMIA, SYS-FLUJO, SYS-INTERIORES, SYS-MIRAMAR, SYS-OBRA.
- Problema: Caja por bolsa no demuestra rentabilidad y obligaciones por partida
- Beneficio esperado: Detectar desviaciones antes de perder margen
- Medición: Margen presupuestado/previsto/real; costo comprometido no pagado
- Dependencias: E.
- Esfuerzo: L. Decisión: **pendiente**.

### Requisitos previos

- Definición contable/operativa de margen
- Catálogo conciliado de proyectos y partidas

### Tareas

1. Acordar ingresos, costos, compromisos y partidas por proyecto
2. Calcular previsto y real con fecha y fuente
3. Mostrar desvíos y pendientes sin confundir caja con margen

### Criterios de aceptación

- Un proyecto de prueba reconcilia con sus partidas
- Los costos pendientes y datos incompletos quedan visibles

## G · Bloqueos y decisiones que frenan ventas y obra

- Tableros: SYS-DESPACHO, SYS-TAREAS, SYS-ALQUIMIA, SYS-MIRAMAR.
- Problema: Dependencias entre decisiones, trámites y tareas dispersas
- Beneficio esperado: Reducir días detenidos y retrabajo
- Medición: Edad de bloqueos; tiempo aprobación; hitos liberados
- Dependencias: E.
- Esfuerzo: M. Decisión: **pendiente**.

### Requisitos previos

- Acordar quién puede liberar cada tipo de bloqueo

### Tareas

1. Identificar bloqueos, decisión requerida y responsable
2. Relacionar tareas e hitos con dependencias reales
3. Presentar antigüedad y consecuencia del bloqueo

### Criterios de aceptación

- Un hito bloqueado identifica quién debe decidir y qué falta
- La liberación conserva evidencia e historial

## H · Autorizaciones y evidencia antes de afectar dinero

- Tableros: SYS-OBRA, SYS-OBRA-CLIENTE, SYS-CODES-PORTAL, SYS-FLUJO.
- Problema: Estados y segregación de responsabilidades necesitan revisión transversal
- Beneficio esperado: Menos pagos duplicados y correcciones
- Medición: Duplicados evitados; movimientos con comprobante; excepciones de autorización
- Dependencias: E.
- Esfuerzo: M. Decisión: **pendiente**.

### Requisitos previos

- Fuente y despliegue activo de motores financieros
- Matriz de autorización aprobada
- LIBRO_ID efectivo de Obra y cobertura de su tabla de roles
- Contrato de pagos que distinga operación incompleta, confirmada y repetida, compatible con datos históricos

### Tareas

1. Documentar quién propone, autoriza y confirma cada operación
2. Implementar validación del servidor e idempotencia donde corresponda
3. Probar reintentos, duplicados y transiciones fuera de orden
4. Confirmar libro efectivo de Obra y vinculación de identidad; definir cuándo se permite representar a otra persona y cómo se registra al firmante
5. Definir permisos de lectura, captura, ajustes de saldo, importación y mantenimiento por acción
6. Diseñar registro persistente de pago, referencias de cada efecto y respuesta canónica del servidor; probar recuperación tras fallo o respuesta perdida

### Criterios de aceptación

- Un reintento no produce un segundo efecto monetario
- Los permisos se rechazan en servidor y quedan auditables

## I · Calendario único de cobros y aportaciones

- Tableros: SYS-FLUJO, SYS-CODES-PORTAL, SYS-OBRA-CLIENTE.
- Problema: Cobros y aportaciones viven en contratos diferentes
- Beneficio esperado: Cobrar antes sin duplicar registros
- Medición: Monto vencido; días de atraso; compromisos cumplidos
- Dependencias: E; H.
- Esfuerzo: L. Decisión: **pendiente**.

### Requisitos previos

- Acordar estados y dueño de gestión de cobro

### Tareas

1. Relacionar obligaciones por contrato y proyecto
2. Unificar vistas de vencimiento sin duplicar fuentes de verdad
3. Registrar promesa, cumplimiento y siguiente gestión

### Criterios de aceptación

- Cada vencimiento conserva vínculo a su origen
- Los totales coinciden con fuentes conciliadas

## J · Conciliación de recibido, banco y Tesorería

- Tableros: SYS-FLUJO, SYS-CODES-PORTAL, SYS-OBRA-CLIENTE.
- Problema: Confirmar recibido no prueba conciliación bancaria
- Beneficio esperado: Conocer caja real y evitar cobros repetidos
- Medición: Porcentaje conciliado; días para conciliar; diferencias abiertas
- Dependencias: I.
- Esfuerzo: L. Decisión: **pendiente**.

### Requisitos previos

- Fuente bancaria o exportación autorizada
- Reglas de conciliación y revisión humana

### Tareas

1. Definir identificadores de comprobante y reglas de coincidencia
2. Preparar conciliación asistida con excepciones revisables
3. Aplicar confirmación autorizada y trazable

### Criterios de aceptación

- No se confirma conciliación solo por marcar recibido
- Toda diferencia conserva responsable y evidencia

## K · Indicadores confiables y rendimiento medido

- Tableros: SYS-AURUM-EXPERIENCIA, SYS-FLUJO, SYS-MARKETING, SYS-TAREAS, SYS-YOD-OS.
- Problema: Contratos estado/estatus y salud/frescura pueden mostrar indicadores incorrectos
- Beneficio esperado: Decisiones comerciales y operativas con cifras comprobables
- Medición: Indicadores con fuente y fecha; p95 carga; pruebas de contrato aprobadas
- Dependencias: Sin dependencias previas.
- Esfuerzo: M. Decisión: **pendiente**.

### Requisitos previos

- Acceso de prueba por roles
- Línea base de rendimiento; sin prometer p95 antes de medir

### Tareas

1. Definir contrato, fecha y calidad de cada indicador
2. Medir carga representativa y registrar fallos por fuente
3. Optimizar cuellos medidos y repetir prueba comparable

### Criterios de aceptación

- Se distingue falta de permiso, vacío, error y dato antiguo
- Se entrega comparación de latencia con misma muestra

## L · Mapa vivo, contratos y cambios verificables

- Tableros: SYS-YOD-OS, SYS-CONTROL.
- Problema: Documentos y despliegues divergen; varios GAS no están versionados
- Beneficio esperado: Cambiar procesos con menor riesgo y recuperación trazable
- Medición: Componentes verificados; cambios con impacto y pruebas; tiempo de recuperación
- Dependencias: Sin dependencias previas.
- Esfuerzo: L. Decisión: **pendiente**.

### Requisitos previos

- Permisos de repositorios y Apps Script
- Cerrar los vacíos de evidencia registrados

### Tareas

1. Completar inventario de fuentes y versiones desplegadas
2. Aplicar controles de impacto y pruebas en cada repositorio
3. Registrar cambios, despliegues, decisiones y reversión

### Criterios de aceptación

- Los cambios funcionales requieren impacto y propuesta registrada
- El atlas distingue commit integrado y backend desplegado

## PPP · Unificar tablero y fórmulas de potencial en Sheets

- Tableros: SYS-POTENCIALES, GAS-PORTERO, SHEET-PORTERO, SHEET-PPP-MODELOS, SYS-CONTROL.
- Problema: Entradas y escenarios se guardan en Sheets mientras los motores HTML calculan; una lectura de cada superficie puede reflejar motores distintos.
- Beneficio esperado: Una sola fuente de cálculo, versiones trazables y resultados comparables para venta, renta y lotificación.
- Medición: Cobertura de libros; igualdad de cantidades/resultados/flujos por revisión; escrituras con auditoría y rechazos de conflicto.
- Dependencias: Sin dependencias previas.
- Esfuerzo: L. Decisión: **aprobada**.

### Requisitos previos

- Backend vivo contrastado y pruebas aisladas
- Integrar propuesta central y fijar commit del atlas antes de integrar frontend
- Actualizar únicamente implementación existente después de frontend compatible
- Registrar despliegue y verificar conexión pública por separado del modelo nativo

### Tareas

1. Mapear y validar fórmulas nativas de cada motor con escenarios conservados
2. Registrar libro/carpeta por caso y proteger fórmulas para propietario
3. Conectar cantidades, resultados, versiones y diagramas con revisión esperada
4. Completar flujos operativos y por etapas sin inventar datos ausentes
5. Integrar casos existentes y fábrica de altas
6. Auditar escrituras y ediciones directas; resolver conflicto sin sobrescribir

### Criterios de aceptación

- Leer tablero o Sheets da los mismos resultados y revisión
- Cambiar cantidad actualiza fórmulas nativas; ninguna fórmula financiera paralela en cliente/servidor
- No mostrar datos locales como sincronizados ni confirmar una escritura fallida
- Cada versión conserva identidad, fuente e historial; datos faltantes permanecen pendientes

## INV · Presentación pública para inversionistas desde Masterbrokers

- Tableros: SYS-INVERSION, GAS-PLAN-POTENCIAL, SHEET-PLAN-POTENCIAL.
- Problema: La propuesta comercial requiere relato concreto y completo, lectura móvil y continuidad visual, sin duplicar datos editoriales en Git ni presentar un esquema como caso aprobado.
- Beneficio esperado: Explicar qué hace YoDesarrollo, cómo decide y cómo se participa, conservando toda la fuente original y compartiendo la misma URL desde Material del Masterbroker.
- Medición: Cobertura de ocho familias originales, 21 momentos en siete escenas, un path continuo, lectura y navegación móvil comprobadas; respuesta comercial real por medir.
- Dependencias: Sin dependencias previas.
- Esfuerzo: M. Decisión: **aprobada**.

### Requisitos previos

- Conservar la autorización del tablero privado y usar sólo textos comerciales en el endpoint público existente.
- Contrastar el contrato de textos; no exponer cartera, identidad, precios ni criterios financieros privados.

### Tareas

1. Guardar copy y configuración de escena en las filas de textos comerciales en Sheets.
2. Publicar gráfico vectorial responsive y animación ligada al scroll con controles.
3. Añadir acceso y copia del enlace en Material, sin modificar autorización ni registros CRM.
4. Verificar móvil, escritorio, movimiento reducido y publicación de texto en línea.
5. Implementar 4r4 con un único path maestro, un solo inicio, puentes exteriores y retrazados exactos; no sustituir avenidas por edificios ni codificar cifras financieras como longitudes.
6. Guardar mono_version y mono_config editorial en TEXTOS POTENCIAL; reutilizar GET recurso=textos sin nuevo backend.
7. Preservar la apertura y los siete capítulos anteriores bajo Versión anterior en la misma página; no crear otro deck ni ampliar acceso a expedientes.

### Criterios de aceptación

- El enlace comercial abre sin sesión y muestra únicamente contenido editorial público.
- Los textos y duración se cambian desde Sheets; Git contiene lógica y esquema conceptual sintético.
- Los controles funcionan y el inmueble de la escena se conserva en el puente a la evaluación.
- Un perfil sin identidad vinculada no se activa ni se suplanta para comprobar la integración.
- Nueva versión: ocho familias preservadas, mercado antes de producto, revisión y acuerdos antes de formalizar adquisición/aportación, proyecto/permisos antes de obra y cobros antes de recuperación efectiva.
- Nueva versión: un path SVG acumulativo con una sola orden M, A posible compra/B posible aportación persistentes, scroll reversible y mismo dibujo estático en movimiento reducido.
- Detalle, fórmulas y condiciones permanecen visibles mediante scroll normal; CTA conversación sin compromiso de inversión, alcance/entregables/costos por acordar.

## NAV · Navegación constante y mesa compartida del autón

- Tableros: SYS-YOD-OS, SYS-DESPACHO, SYS-POTENCIALES.
- Problema: El menú cambia entre la cabina y los tableros; el inicio tiene accesos redundantes y el puesto del autón dispersa conversación y PPP.
- Beneficio esperado: Un recorrido predecible con la barra compactable existente, acceso al inicio desde el logo y una propuesta visual del puesto con PPP y conversación simultáneos.
- Medición: Mismos IDs y orden relativo para un conjunto autorizado en cabina y marco; sin duplicados ni botón Inicio añadido; propuesta navegable sin datos reales.
- Dependencias: Sin dependencias previas.
- Esfuerzo: M. Decisión: **aprobada**.

### Requisitos previos

- Reutilizar ui-chrome.js y su preferencia persistente; no duplicar el control de compactación.
- Conservar códigos, URLs permitidas y filtrado por sesión antes de construir el menú.
- El mockup usa ejemplos y no acredita voz, PPP privado o trabajo autónomo.

### Tareas

1. Registrar la propuesta antes de tocar el frontend.
2. Generar una política de orden y eliminación de duplicados desde os/catalogo.js para la cabina y el marco.
3. Mantener Real de Miramar dentro de Codesarrollos cuando el padre está disponible, incluso al visitarlo.
4. Usar el logo como acceso al inicio y retirar botones Inicio redundantes.
5. Entregar un mockup navegable con PPP protagonista, conversación lateral, voz compacta y un único lugar para avances; verificar y publicar navegación por PR.

### Criterios de aceptación

- Compactación existente conserva la preferencia entre pantallas.
- Cabina y marco usan la misma política generada sin conceder accesos nuevos.
- El menú no añade el proyecto hijo al cambiar de pantalla y lo conserva cuando es el único acceso autorizado.
- Logo retorna a Inicio; no se añade un botón principal alternativo.
- Mockup claramente identificado, con ejemplos y sin llamadas a sistemas de negocio; verificadores del portal pasan.

## MINI · PPP persistente con mini dashboards y evidencia inspeccionable

- Tableros: SYS-YOD-OS, SYS-DESPACHO, SYS-POTENCIALES.
- Problema: La propuesta previa ofrece etiquetas genéricas, oculta el PPP al cambiar recursos y no permite seguir cada dato a una fuente; la comparación de escenarios y viabilidad permanece indeterminada.
- Beneficio esperado: Revisar el PPP al hablar con el autón, abrir mapa y fuentes, cotejar pasajes y escenarios sin perder conversación ni contexto; conservar una única navegación global.
- Medición: Dos auditorías internas separadas con rúbricas publicadas, mínimo 9/10 de diseño sin gates críticos abiertos; recorridos y responsive comprobados en Chromium con ejemplos, sin aceptación operativa de voz o negocio.
- Dependencias: NAV.
- Esfuerzo: M. Decisión: **implementada**.

### Requisitos previos

- Reutilizar barra y control global existentes, sin duplicación a derecha.
- Fuente financiera canónica sigue en Sheets; maqueta usa ejemplos identificados y no recalcula un motor financiero paralelo.
- Distinguir código disponible, configuración requerida y operación verificada; no declarar integraciones por existencia de un marcador.

### Tareas

1. Auditar la propuesta anterior y conservar hallazgos numerados con marcas visuales.
2. Construir mini dashboards: mapa, documentos, normativa, mercado, versiones y viabilidad enlazados a evidencia local de ejemplo.
3. Mantener PPP y compositor visibles al consultar fuentes; preservar borrador/selección y aislar ejemplos por agente.
4. Separar escenario consultado y defendido; TIR con periodo, tipo y supuestos; viabilidad dependiente de selección.
5. Comprobar recorridos desktop, Chromebook y móvil en navegador aislado; entregar capturas y reauditar hasta resolver hallazgos.
6. Registrar conexiones encontradas con evidencia de código y límites; entregar mockup corregido y bitácora.

### Criterios de aceptación

- Una única barra global; logo como Inicio y mismo control de compactación.
- Seis mini dashboards útiles; fuente con tipo, fecha, ubicación, alcance y distinción entre cita e interpretación.
- TIR no calculada no aparece como cero; ejemplos explícitos y escenarios comparables identificados.
- Cambiar escenario consultado actualiza viabilidad sin modificar la versión defendida.
- Fuente faltante o desactualizada muestra causa y acción; lectura de hojas exige valores canónicos vigentes.
- Abrir una evidencia y alternar PPP/conversación en móvil conserva el estado del mismo proyecto.
- Auditorías tienen evidencia, puntajes por criterio y límites; ninguna puntuación del mockup acredita producción.

## DUMMY · Dummy integral de interacción del autón y PPP

- Tableros: SYS-YOD-OS, SYS-DESPACHO, SYS-POTENCIALES.
- Problema: Las pantallas del mockup muestran estructura, pero no reúnen una conversación completa desde un dato hasta su entrega y siguiente decisión.
- Beneficio esperado: Recorrer y corregir un flujo concreto sin salir del PPP, comprobar fuentes y fórmulas, ver pendientes y presentación con la misma lógica para los tres personajes.
- Medición: Un único dummy navegable con escenas necesarias, evidencia inspectable y continuidad del mismo expediente. Pruebas con fixtures, sin aceptación operativa.
- Dependencias: MINI.
- Esfuerzo: M. Decisión: **implementada**.

### Requisitos previos

- Reusar la navegación existente y el PPP persistente, sin duplicar motores de negocio.
- Datos y respuestas locales ficticios; fórmulas de ejemplo separadas de Sheets canónico.
- No crear tareas autónomas ni conexiones reales.

### Tareas

1. Construir recorrido completo con estados aislados por personaje.
2. Mostrar antes/después de un dato y su fuente, sin simular una escritura real.
3. Añadir fórmulas con tipo, periodo, unidad y límites, vinculadas a escenarios.
4. Unificar trabajo/entregables y presentación de dos láminas con conversación.
5. Probar desktop/móvil y consolidar hallazgos y decisiones en documento.

### Criterios de aceptación

- Una navegación global y mismo PPP en todas las escenas.
- Corrección ficticia únicamente tras petición explícita, repetición local sin nuevo efecto.
- Escenarios consultado/defendido separados y datos ausentes no convertidos en cero.
- Trabajo simulado rotulado y resultados no presentados como ejecución en servidor.
- Fuentes, borrador y presentación comparten proyecto e hilo.

## HILO · Conversación fija y detalle útil por interacción

- Tableros: SYS-YOD-OS, SYS-DESPACHO, SYS-POTENCIALES.
- Problema: El chat se comparte con un visor que corta su altura, la transcripción no tiene un turno único explícito y el detalle de tarjetas funciona como texto expuesto sin jerarquía de tarea.
- Beneficio esperado: Conversar continuamente mientras se interpreta una evidencia concreta a izquierda; cada interacción conserva fuente, contexto y una próxima acción sin paneles superpuestos.
- Medición: Cumplimiento de las tres correcciones de Dirección mediante capturas reales y geometría/estado; ningún score anterior acredita esta UX.
- Dependencias: DUMMY.
- Esfuerzo: M. Decisión: **implementada**.

### Requisitos previos

- Cambiar sólo dummy/mockup, sin runtime, datos, permisos o fórmulas nuevos.
- Navegación global a izquierda conserva control y orden existentes.
- Transcripción y texto se dibujan como mensajes del mismo hilo.

### Tareas

1. Reposicionar chat a derecha con altura completa y lectura/contexto a izquierda.
2. Unificar actualizaciones parciales/finales de voz en el mismo mensaje sin borrar texto escrito.
3. Dar a cada detalle estructura específica de dato/evidencia/interpretación/acción.
4. Mejorar lectura compacta de mini tarjetas con estado y referencia útiles.
5. Verificar todos los estados y publicar evidencia con límites.

### Criterios de aceptación

- En escritorio abrir detalle no cambia posición, altura o cantidad de paneles de conversación.
- Un mismo turno actualiza una sola burbuja y el final no duplica transcripción.
- Fuentes y detalles se contienen dentro del área izquierda, sin tapar chat ni abrir otra superficie.
- Cerrar detalle restaura tarjetas y foco, preservando borrador/referencia/caso.
- Móvil mantiene un único hilo y lectura navegable, sin forzar columnas ilegibles.

## MANDO · Puesto de decisión del autón con avance trazable

- Tableros: SYS-YOD-OS, SYS-DESPACHO, SYS-POTENCIALES.
- Problema: El prototipo conserva continuidad pero se percibe burocrático; muestra fuentes sin jerarquizar decisión ni cantidades/ruta.
- Beneficio esperado: Comprender qué resolver, qué bloquea y dónde actuar con identidad YOD y conversación continua.
- Medición: Tres revisores simulados independientes, mínimo9.5 cadauno sin gates. Juicio interno de prototipo, no aceptación operativa.
- Dependencias: HILO.
- Esfuerzo: M. Decisión: **implementada**.

### Requisitos previos

- Chat derecho fullheight, fuente izquierda, hilo único.
- Datos ficticios explícitos; no avance legal por botones/visitas/tiempo.
- Navegación y compactación globales, capacidades conservadas.

### Tareas

1. Cabecera de decisión y ruta de cuatro hitos.
2. Seis tarjetas numéricas con unidades/fecha y fuentes.
3. Inspector progresivo; conservar utilidades.
4. Revisión de commit/capturas, corregir sin rebajar rúbrica.
5. Publicar dummy y bitácora de resultados y límites.

### Criterios de aceptación

- Próximo resultado/bloqueo/CTA dominantes.
- Toda cantidad define alcance; normativa real no acreditada por simulación.
- Ruta avanza por recibos locales, no exploración.
- Hilo/caso/borrador/ref/versión defendida/capacidades conservadas.
- Colores y gráficos para decidir sin XP ni trabajo fingido.

## NUBE · Sala existente con producción y publicación comprobables en nube

- Tableros: SYS-SALA, SYS-CONTROL.
- Problema: Una mesa sin pendientes, una ejecución solicitada o un producto generado pueden confundirse con falta de decisiones o con una publicación terminada; fallos de red y acumulación de medios dificultan la continuidad.
- Beneficio esperado: Mantener producción autorizada continua y distinguir pendiente, producido y publicado mediante recibos conservando decisiones e historia.
- Medición: Publicaciones comprobadas por recibo exacto; errores de lectura visibles; cero mutaciones inciertas reenviadas sin conciliación y cero cumplimientos sólo por dispatch.
- Dependencias: Sin dependencias previas.
- Esfuerzo: M. Decisión: **aprobada**.

### Requisitos previos

- Autorización técnica expresa de Dirección en la conversación actual, conservando revisión humana y ACL existentes.
- Fuentes canónicas del backend vivo; un espejo de Apps Script no acredita su despliegue.
- Propuesta y contratos registrados antes de la implementación; CI y PR de los repositorios afectados.
- Rollout lector v1/v2 antes del emisor incremental; emisión v1 por defecto y drenaje acreditado antes de activar el flag.

### Tareas

1. Aplicar recuperación acotada sólo a lecturas declaradas y reconciliar mutaciones con efecto incierto.
2. Acumular snapshots compatibles mediante manifiestos, padre y replay verificables; mutex por ejecución e intento real y presupuesto antes de Pages.
3. Separar conteos históricos editoriales, producción durable y publicación confirmada en informes/correo existentes.
4. Conciliar chinches por evidencia real y deduplicación; mantener el vigilante residente y comprobar su conexión por separado.

### Criterios de aceptación

- Restaurar snapshot histórico y sus deltas preserva medios; error, conflicto o exceso de presupuesto no publica ni monta.
- El mismo run/attempt puede conciliar su recibo; otro attempt no hereda un candado ni una escritura incierta sin comprobarla.
- Una mesa vacía no borra decisiones anteriores; error de lectura no se comunica como cero ni como producción terminada.
- Dispatch de una idea sólo acredita solicitud; not_planned conserva su motivo; cumplimiento exige evidencia y registro confirmado sin duplicación.
- Ninguna prueba decide por el editor, cambia permisos, destinatarios, reglas de negocio o publica a redes.
- Un push de cierre no solicita entrada por correo ni repite comparación histórica; opciones manuales explícitas conservadas. Antes de rollback con deltas, snapshot completo v1 comprobado usando lector v2.

## MEDIOS · Continuidad de Sala con historial completo e imágenes nuevas inmutables

- Tableros: SYS-SALA, SYS-CONTROL.
- Problema: El artefacto inspeccionado ocupa 897647868 bytes, cerca del 95% del presupuesto de 900 MiB; recomprimir históricos cambia huellas y sólo ahorró 2.57% en cinco muestras PNG. Además, limitar la lectura a14 días puede omitir fuentes no retiradas con decisiones históricas: omisión por ventana no equivale a desaparición o retiro.
- Beneficio esperado: Frenar el crecimiento de imágenes nuevas sin romper rutas históricas, identidad editorial, snapshots ni permisos de Drive.
- Medición: Bytes nuevos servidos por release inmutable y comprobados anónimamente; cero referencias sin pin/bytes verificados, cero históricos modificados y Pages siempre dentro de 900 MiB.
- Dependencias: NUBE.
- Esfuerzo: M. Decisión: **aprobada**.

### Requisitos previos

- Autorización técnica de migración de Sala del 14-oct-2026 persiste; no autoriza decisiones editoriales, nuevos pagos, ACL o ámbitos de App.
- Instalar y publicar primero lectores compatibles de UI, FULL y consumidores; comprobar recibo fresco con media_manifest_sha256 y meta sala-medios-publicos=1 antes de cualquier emisión.
- SALA_MEDIOS_PUBLICOS=1 es opt-in y permanece OFF. Inmutabilidad de release/activos, canario anónimo de bytes y ausencia de lectores antiguos incompatibles deben acreditarse antes de habilitarlo.
- Mantener presupuesto 900 MiB y datos históricos. Sólo imágenes nuevas no presentes en Git ni baseline pueden externalizarse; ningún activo/configuración se crea o activa por este registro.
- CTR-SALA-PRODUCCION-HISTORICA pertenece a la reparación NUBE ya autorizada. GET sólo lectura con el rol agente existente; SALA_PRODUCCION_HISTORICA=0 hasta despliegue por propietario y contrato completo verificado. No ampliar ACL, scopes ni activar backend por este registro.

### Tareas

1. Aplicar schema 1 estricto de datos/medios-publicos.json, límites antes de parse/emisión y pin SHA256 de sus bytes exactos en version-online.json.
2. Resolver rutas lógicas en UI con comprobación del recibo y manifiesto; fallar cerrado ante ausencia de pin, error de lectura, hash distinto o schema inválido.
3. Mantener snapshots privados y FULL compatibles: transportar el manifiesto y excluir sólo bytes externos ya comprobados; hidratar bytes verificados para Mesa/corte y file_is_published exacto.
4. Publicar únicamente imágenes nuevas en releases públicos inmutables del mismo repo, con journal previo a POST, conciliación por GET y reentrada que no repite un POST ambiguo.
5. Probar contratos sintéticos, despliegue de lectores y canario anónimo antes de habilitar emisión; conservar rutas, MD5 y aprobaciones existentes.
6. Integrar el lector de historial completo y su esquema propuesto sin decidir nuevas aprobaciones ni reencolar históricos; resolver última PROP y DEC con sellos reales y vetos propios/ajenos conservados.

### Criterios de aceptación

- Manifest máximo 2 MiB; imagen de 1 a 25 MiB; máximo 1000 assets únicos por release, sin tope arbitrario de entradas distinto del límite de bytes del manifest.
- Una URL o metadato no acredita publicación: exigir repo/tag/asset inmutable, GET anónimo de bytes exactos, SHA256/tamaño/tipo válidos y pin del recibo fresco.
- Crash tras POST aceptado con ACK perdido, pérdida total del runner y nuevo attempt con el mismo payload: GET del mismo tag estable y asset, cero POST adicionales. Cambiar run/attempt/source no cambia la identidad; cambiar repo/proceso/archivo/hash/tamaño/MIME/nombre sí. Consulta inconclusa conserva pendiente sin mutación.
- UI legacy acepta 404 del manifest sólo cuando el recibo tampoco declara pin; demás inconsistencias cierran imágenes/aprobaciones y no inventan estados de producción.
- Todos los históricos conservan bytes y URLs. Vídeo, audio y muestras siguen en Pages en fase1; snapshots de datos siguen siendo releases draft privados.
- Desactivar SALA_MEDIOS_PUBLICOS detiene sólo nuevas externalizaciones. Si ya existe un medio externo, conservar lector compatible, manifiesto, pin del recibo, releases inmutables y sus activos. No volver a un lector antiguo ni retirar activos hasta repatriar y verificar todos los bytes referenciados, publicar un FULL íntegro dentro de 900 MiB y comprobar recibo fresco y consumidores. No borrar históricos ni alterar ACL, decisiones, destinatarios o reglas de negocio.
- Fuera de ventana14 días no equivale a retirada: lectura de historial completo declarada y validada, latest real por editor/pid/lámina y estado editorial vigente comprobado antes de producir. Retirada más reciente prevalece; cero elegibles actuales no autoriza nuevas decisiones o reencolados. Sin backend verificado, flag0 e historial no confirmado.

## VOLUMENES · Piloto de navegación del agente y borrador por volúmenes

- Tableros: SYS-YOD-OS, SYS-DESPACHO, SYS-DESPACHO-3D, SYS-POTENCIALES.
- Problema: El puesto requería navegación visible y una captura independiente de uno, dos o tres volúmenes sin confundir consulta, intención y aplicación.
- Beneficio esperado: Navega el PPP real por protocolos comprobables y conserva la intención cuando no hay confirmación; captura cantidades por volumen en un borrador explícito.
- Medición: Una navegación se confirma sólo con vista y contexto exactos; cero escrituras de negocio por fallback o selector. Borrador aislado por caso/escenario/base con valor inicial1.
- Dependencias: Sin dependencias previas.
- Esfuerzo: Frontend implementado localmente; QA y publicación pendientes. Segunda etapa canónica separada.. Decisión: **implementada**.

### Requisitos previos

- Perfil autorizado y piloto exacto; contexto actual del mismo caso, escenario y revisión.
- Puente nativo y capacidad de navegación anunciados para certificar sección/versión; DOM legacy sólo acredita apertura visual pendiente.
- Editor de volúmenes aislado: captura cantidades; no activa writer nativo, autosave ni cálculo financiero.

### Tareas

1. A: enviar navegación al puente y aceptar sólo ACK/contexto/visibilidad exactos.
2. B: abrir y mostrar la sección DOM sin focus, click ni input/change; sólo confirmar con contexto nativo fresco, mantener legacy pendiente.
3. C: conservar tarjeta de intención con reintento/confirmación; cambios numéricos siguen sin aplicar y recibos inciertos sólo se concilian.
4. Ofrecer1/2/3 volúmenes inicial1, campos independientes y descarga manual del borrador sin persistencia del navegador, Store ni efectos financieros.
5. Completar QA final, PR/Pages y evidencia diferenciada de publicación y aceptación.

### Criterios de aceptación

- Texto completo del usuario puede navegar; deltas de voz no ejecutan sin confirmación. Prosa del agente, citas y documentos no son instrucciones ejecutables.
- Origen, ventana, nonce, caso, escenario, revisión y capacidad coinciden. Cambio de contexto descarta respuestas tardías y revocación limpia datos.
- RutaB no roba foco ni dispara edición; legacy no se promueve a contexto nativo confirmado.
- Cambiar de ruta no reenvía mutaciones inciertas; la tarjeta conserva intención y límites reales.
- Volúmenes capturan cantidades independientes por caso/escenario/revisión base. No producen utilidad, deuda, TIR, presupuesto ni guardado canónico.

## VOLUMENESCANONICOS · Volúmenes nativos en todos los PPP verticales y mixtos

- Tableros: SYS-POTENCIALES, GAS-PORTERO, SHEET-PORTERO, SHEET-PPP-MODELOS, SYS-DESPACHO-3D, SYS-YOD-OS, SVC-AUTON-CLOUD.
- Problema: El borrador frontend por volúmenes aún no está guardado en el modelo canónico ni participa en fórmulas y flujo por etapas.
- Beneficio esperado: Comparar versiones con cuerpos independientes, recursos comunes contados una sola vez y cálculo nativo trazable.
- Medición: Compatibilidad exacta del caso legado de un cuerpo; agregados sin duplicación y guardado con CAS, recibo y conciliación por solicitud.
- Dependencias: VOLUMENES.
- Esfuerzo: Por estimar tras acordar esquema y fórmulas sobre el modelo canónico.. Decisión: **aprobada**.

### Requisitos previos

- Ampliación expresa autorizada por Dirección20oct: Apps Script, Sheets y backend/Render permitidos dentro de este encargo; conservar identidad, ACL y despliegues existentes.
- Contrastar fuente y esquema vigentes; los contratos propuestos no acreditan despliegue.
- Garantizar equivalencia del modelo de un volumen y cálculo financiero sólo en Sheets.

### Tareas

1. Conciliar contrato por caso/escenario/versión/revisión y capability del modelo, independiente del agente.
2. Persistir cantidades por cuerpo y recursos compartidos una sola vez en el libro canónico, con migración1cuerpo compatible.
3. Extender el backend/puente existente con CAS/request_id/recibo y conciliación; proteger fórmulas y conservar permisos.
4. Validar en aislamiento y publicar consumidores y backend con recibos independientes.

### Criterios de aceptación

- Históricos/base no se sobrescriben ni migran a ciegas; una versión nueva registra el origen y su revisión.
- Núcleos, elevadores y áreas comunes tienen identidad y alcance explícitos y se suman una sola vez; no se multiplican automáticamente por número de cuerpos.
- No se crea motor financiero paralelo: las fórmulas del libro canónico producen resultados y flujos por etapas.
- Sin capability, permiso, revisión o esquema compatibles se rechaza antes de escribir. Request_id ambiguo se concilia sin reenviar ni elevar revisión.
- Autorización de alcance ya concedida; publicar sólo tras pruebas aisladas, recibos de despliegue existente y comprobación de cálculo. No dar por completo un caso que siga pendiente de fábrica/plantilla.
