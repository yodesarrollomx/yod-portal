# Contratos de datos e identidad

> Generado desde modelo.json. No editar a mano. Revisión 2026-10-01.23-ppp-versiones-lectura · 2026-10-01.

Estos contratos no contienen registros reales. Su alcance de evidencia se indica individualmente.

## CTR-PORTERO

- Componentes: GAS-PORTERO, SYS-YOD-OS.
- Evidencia: Cliente yod-acceso/app/shell; backend vivo pendiente.
- Entrada/campos: `credencial de sesión`, `código de tablero cuando aplica`.
- Salida: ok, nombre, correo, rol, boards.

- Cada backend autoriza su operación
- Rechazo explícito no se convierte en permiso por cache o respaldo
- Cambio de token invalida datos y respuestas pendientes

## CTR-MOVIMIENTOS

- Componentes: SYS-FLUJO, SHEET-FLUJO.
- Evidencia: Encabezados Sheets leídos el 2026-09-30; no se publican filas.
- Entrada/campos: `id`, `fecha`, `tipo`, `monto`, `beneficiario`, `proyecto`, `notas`, `capturadoPor`, `timestamp`, `borrada`, `facturado`, `linkComprobante`, `historial`.
- Salida: saldos por bolsa, historial.

- Conservar trazabilidad y referencias
- Confirmar escritor servidor antes de afirmar guardado
- Transferencias parciales requieren conciliación; no reintentar automáticamente sin idempotencia servidor

## CTR-PAGOS

- Componentes: SYS-FLUJO, SYS-YOD-OS, SHEET-FLUJO.
- Evidencia: Encabezados Sheets y contrato frontend comprobados.
- Entrada/campos: `id`, `concepto`, `monto`, `fechaLimite`, `tipoPago`, `prioridad`, `proyecto`, `estado`, `timestamp`, `historial`.
- Salida: obligaciones pendientes, proyección de efectivo.

- El campo canónico de pagos es estado
- Compatibilidad con estatus solo cuando estado no existe
- Los pagos Pagado no cuentan como obligación pendiente

## CTR-INGRESOS

- Componentes: SYS-FLUJO, SHEET-FLUJO.
- Evidencia: Encabezados Sheets y frontend comprobados.
- Entrada/campos: `id`, `concepto`, `monto`, `fechaEsperada`, `estatus`, `proyecto`, `timestamp`.
- Salida: seguimiento de ingresos esperados.

- El campo canónico de ingresos esperados es estatus
- Las etapas visibles son Por gestionar, Por facturar, Facturado y Cobrado
- Cobrado en una pantalla no demuestra conciliación bancaria automática

## CTR-CATALOGO

- Componentes: SYS-YOD-OS, GAS-CATALOGO, SHEET-CATALOGO.
- Evidencia: Control Maestro y catálogo técnico; hay diferencias registradas.
- Entrada/campos: `system_id`, `sistema`, `función`, `url`, `repositorio`, `fuente_datos`, `estado`, `sensibilidad`, `responsable_id`, `última_revisión`, `notas`.
- Salida: menú y destinos permitidos.

- Un system_id identifica el sistema; resolver alias de portal explícitamente
- El catálogo no concede permisos de backend
- Dependencias institucionales de Sheets no equivalen al grafo de software

## CTR-PPP-SHEETS

- Componentes: SYS-POTENCIALES, GAS-PORTERO, SHEET-PORTERO, SHEET-PPP-MODELOS, SYS-CONTROL.
- Evidencia: Decisión explícita de Dirección y contrato público de cálculo nativo; pruebas aisladas y lectura de piloto documentadas en registro privado..
- Entrada/campos: `caso_id`, `escenario_id`, `campos de cantidad permitidos`, `revision_esperada`, `request_id`, `actor autenticado`.
- Salida: revision, versión activa, entradas canónicas, resultados calculados, flujo mensual, geometría y etapas, fuentes y auditoría.

- Datos y fórmulas viven en el libro privado por caso; no mantener motor financiero paralelo
- Las fórmulas están protegidas para propietario; AI actúa con su autorización y registra cambios
- Servidor resuelve el destino y verifica permisos, límites y revisión antes de escribir
- Una respuesta pendiente, conflicto o desconexión conserva el último dato confirmado con estado explícito
- Auditar antes/después y no marcar producción comprobada sin lectura pública final
- No modificar Portero ni crear otra implementación; conservar contratos y URL existentes
- El transporte leído conserva entradas y resultados de todas las versiones; el flujo mensual puede enviarse solo para la activa. Validar ese flujo al abrirla y no exigir ni inventar flujo de versiones inactivas.

## CTR-PUBLICADOR-GITHUB

- Componentes: SYS-YOD-OS, SYS-SALA, GAS-SALA, SYS-MARKETING, EXT-ACTIONS, EXT-GITHUB-PUBLISHER-APP.
- Evidencia: Fallo observado de PR automáticos y política oficial de GitHub para GITHUB_TOKEN; diseño de identidad propia con privilegios limitados..
- Entrada/campos: `commit de rama preparado`, `repositorio permitido`, `identidad temporal de App`.
- Salida: PR revisable, checks del commit exacto, publicación confirmada o fallo explícito.

- App privada instalada solamente en sala-edicion y aurum-board; contents:read y pull_requests:write
- La identidad App se usa exclusivamente en POST /pulls; push, comprobación y merge conservan GITHUB_TOKEN
- Nunca reemplazar revisiones requeridas por checks sintéticos, quitar protección ni omitir aprobación de GitHub
- Verificar SHA exacto, comprobaciones completas y merge permitido por el proveedor; espera limitada ante checks vacíos
- Sala confirma publicación de recursos antes de montar sus referencias en Apps Script
- Sin cambios o en simulación no se necesita ni se crea token App
- Llave privada solo en secretos cifrados y registro privado; ninguna credencial personal en CI

## CTR-AUTORIZACION-OPERACIONES

- Componentes: SYS-YOD-OS, SYS-POTENCIALES, SYS-OBRA, SYS-FLUJO, GAS-PORTERO, GAS-OBRA, GAS-FLUJO, GAS-CRM, GAS-CATALOGO, SHEET-PORTERO, SHEET-CATALOGO.
- Evidencia: Revisión de fuentes activas y pruebas aisladas con datos sintéticos; evidencia sensible preservada en el registro privado..
- Entrada/campos: `credencial vigente`, `operación y recurso explícitos`, `identidad canónica del servidor`, `solicitud y clave de repetición cuando corresponde`.
- Salida: resultado permitido o rechazo explícito, actor comprobado y revisión para auditoría, estado parcial explícito ante fallo de escritura.

- La caché conserva permisos explícitos y jamás amplía una autorización; vacío no equivale a acceso universal
- Leer todos los tableros no concede administración de identidades
- Autorizar una operación requiere identidad y rol comprobados por el servidor; un nombre enviado por el cliente no acredita a quien firma
- Los datos de negocio exigen el recurso autorizado; salud pública solo informa estado técnico general
- Prevalidar todas las columnas y valores antes de escribir; conservar semántica de reintento y detectar otra solicitud con la misma clave
- Preservar endpoints e implementaciones existentes y cualquier trabajo concurrente del editor
- No probar operaciones financieras ni permisos escribiendo en producción; usar dobles y contraste de esquema autorizado

## CTR-EMD-PINS-ACK

- Componentes: SYS-EMD, GAS-EMD, SHEET-EMD, EXT-ACTIONS.
- Evidencia: Propuesta de corrección del sistema privado; evidencia técnica y operativa restringida..
- Entrada/campos: `Diana estructural de pantalla y nota de mejora`, `Identificador de nota para repetición segura`, `Configuración explícita del puente manual`.
- Salida: Confirmación válida por nota o error visible, Cola conservada ante rechazo o confirmación inválida, Resultado final de revisión con pruebas y bloqueos.

- La diana no depende del texto de respuestas ni contiene datos personales
- Una nota rechazada no detiene el envío de otras; solo una confirmación válida permite retirarla de la cola
- Configuración ausente nunca se informa como éxito de revisión
- El puente manual no compite con la ronda programada del agente
- Inicio y configuración no equivalen a ejecución terminada ni a recuperación validada
- No se alteran respuestas, 28 preguntas, escala, matriz, asignaciones ni permisos existentes

## CTR-EMD-TIMING

- Componentes: SYS-EMD, GAS-EMD, SHEET-EMD.
- Evidencia: Propuesto; contrato y evidencia restringidos al repositorio privado.
- Entrada/campos: `sesión autorizada`, `asignación propia`, `duración activa acumulada`, `secuencia idempotente`.
- Salida: confirmación sin respuestas, estimación agregada cuando exista muestra suficiente, Disponibilidad explícita de instrumentación y muestra agregada.

- No altera preguntas, escala, asignaciones o respuestas
- La medición no bloquea el recorrido de evaluación
- Pausas, sesiones concurrentes, QA y observaciones incompletas no contaminan el promedio
- No publica tiempos individuales ni permite acceso anónimo al agregado
- No infiere duración a partir de marcas de última modificación
- El cliente solo inicia medición cuando el servidor declara instrumentación compatible; QA no habilita instrumentación
- La estimación exige al menos cinco cuestionarios completos de tres evaluadores de una misma campaña
- Los reintentos validan la misma secuencia, acumulado y flags de cierre/pausa; no mezclan solicitudes diferentes

## CTR-EMD-PROFILES

- Componentes: SYS-EMD, GAS-EMD, SHEET-EMD, EXT-DRIVE.
- Evidencia: Propuesta del sistema privado; detalles físicos y evidencia restringidos al repositorio privado..
- Entrada/campos: `Sesión autorizada e identidad canónica propia`, `JPEG normalizado localmente a 512 × 512 píxeles, máximo 256 KiB, con recorte manual`, `Revisión esperada e identificador de mutación`, `Consulta de hasta 30 asignaciones autorizadas por solicitud`, `Estado de evaluación ya confirmado: off, yellow o green`, `Publicación interna del agente: identidad canónica, revisión/hash/archivo del original y archivo derivado privado verificado`, `Derivado homologado interno JPEG existente o PNG estricto de 512 × 512 con transparencia; nunca PNG como original subido por participante`.
- Salida: Confirmación de revisión y mutación sin exponer ubicación privada, Imagen autenticada en memoria, sin URL de Drive, o perfil sin foto, Foto o silueta con apariencia derivada del estado confirmado y respaldo textual accesible, Conflicto o error explícito que conserva el estado confirmado, Original visible exclusivamente en Mi foto de su propietario; tableros reciben solo derivado homologado vigente o silueta.

- Carga y retirada derivan propietario de la identidad canónica del servidor, incluida compatibilidad de acceso legado; no aceptar identidad del cliente ni inventar personas o cargos
- Lectura de evaluador y evaluado solo para asignaciones propias autorizadas; revisor limitado a asignaciones activas y QA separado, sin leer respuestas
- Carpeta dedicada dentro de carpeta existente, ambas privadas y sin editores/lectores explícitos; verificar también privacidad del archivo y rechazar destinos compartidos
- Pestaña privada de perfiles con identidad, archivo, revisión, mutación, digest, MIME, bytes y actualización; nunca guardar base64 en metadatos ni mezclar respuestas
- Servidor valida JPEG baseline, firma, dimensiones, cierre y máximo de 256 KiB; rechaza EXIF, comentarios y segmentos no permitidos tras normalización local
- La apariencia del perfil no crea ni infiere estados: usa exclusivamente off/yellow/green ya recibidos; conservar foco y nombre/estado accesibles sin depender solo del color, aunque no haya etiqueta visible de estado o relación.
- Revisión, mutación y digest deben coincidir para repetir resultado; conflicto o ACK inválido conserva el estado confirmado y no anuncia éxito
- Conservar implementación, URL, roles, 28 preguntas, escala, matriz y asignaciones; reutilizar autorización Drive existente
- La reversión de código no borra ni restaura datos de perfil o evaluación
- Drive y metadatos no forman una transacción atómica: preservar foto anterior hasta confirmación y documentar recuperación de escrituras parciales y archivos huérfanos
- La consulta no crea carpetas, archivos ni metadatos; solo una carga propia autorizada puede inicializarlos
- Verificar propietario, privacidad y ausencia de lectores/editores explícitos en ancestros; rechazar unidades compartidas y revalidar privacidad antes de confirmar un reintento
- La identidad de mutación vincula propietario, revisión base, MIME y bytes normalizados mediante digest
- Servicio avanzado Drive v3 obligatorio: listar permisos con paginación en archivo, carpeta y todos los ancestros hasta la raíz de Mi unidad; admitir únicamente el propietario esperado, coincidente con la identidad de ejecución
- Rechazar permisos de usuario, grupo, dominio o cualquiera distintos del único propietario, unidades compartidas y recursos sin propietario; Access.PRIVATE por sí solo no prueba ausencia de permisos heredados o de grupo
- Si el servicio avanzado o la inspección completa de ACL no están disponibles, mostrar error y rechazar operación sin fallback a DriveApp; habilitar servicio/API requiere comprobación de configuración y reutiliza el alcance Drive existente
- La codificación JPEG del recorte usa solo píxeles RGBA sRGB de 512 × 512, con calidad acotada; no copia EXIF, ICC, comentarios ni metadatos del archivo o del codificador del navegador. El código versionado se incorpora al cliente; sin ejecución o envío a un servicio tercero.
- El portal no ejecuta eliminación de fondo ni envía imágenes a editores externos. El tratamiento solicitado corresponde al agente en recorridos autorizados, usando su herramienta de imagen y preservando identidad; no inventar rostro, ropa o pose ausente.
- Separar original y derivado: original solo en Mi foto del propietario, nunca en tableros de participante/coordinación ni compartido con evaluadores. Un upload no equivale a homologación.
- Publicar únicamente por función interna privada, con ACL e integridad comprobadas, respaldo y comparación de identidad, revisión, hash y archivo fuente bajo bloqueo; upload posterior invalida derivado obsoleto.
- Reintento de publicación vincula mutación, fuente y derivado mediante digest; no duplica revisión y no puede sustituir una foto más reciente.
- Lecturas de originales/derivados vacías no crean archivos, carpetas ni tablas; el tratamiento del agente no altera respuestas, instrumento, matriz o accesos.
- Permitir PNG únicamente en publicación interna de derivados: validar formato íntegro, dimensiones exactas, tamaño acotado y ausencia de metadatos no permitidos; conservar JPEG baseline para originales y derivados existentes
- El formato del derivado no amplía RPC, acceso, ACL, revisión, comparación de fuente o repetición idempotente; MIME y digest deben corresponder a bytes validados
- Nombre completo y cargo solo desde fuente verificada; no inventar cargos ni identidades. El borde usa exclusivamente estado confirmado, con alternativa accesible aunque se retiren etiquetas visibles de estado/relación
- Sin cargo verificado, la segunda línea puede mostrar el marcador Puesto identificado de forma accesible como pendiente; no representa un cargo real ni modifica matriz o asignaciones
- PNG interno: estático 512 × 512, 8 bits RGB/RGBA, sin interlazado, máximo 256 KiB; solo IHDR inicial, IDAT consecutivos e IEND final. Verificar CRC, zlib/DEFLATE completo sin diccionario, expansión exacta y Adler32; rechazar metadatos auxiliares, animación, paleta y bytes sobrantes. Límites de chunks/bloques acotan validación. MIME y extensión privados deben coincidir con bytes y digest

## CTR-EMD-DRAFTS

- Componentes: SYS-EMD, STORE-EMD-DRAFTS, GAS-EMD, SHEET-EMD.
- Evidencia: Diseño propuesto con fallos reproducidos mediante datos sintéticos; evidencia y detalle operativo privados..
- Entrada/campos: `Sesión actualmente autenticada y evaluación asignada`, `Snapshot clonado sincrónicamente de revisión base, respuestas confirmadas, borrador y mutación pendiente`, `Decisión explícita de revisar y recuperar una copia local`.
- Salida: Copia cifrada confirmada únicamente al completar la transacción local, Comparación local/servidor para revisión de la persona, Aviso de copia local indisponible, conflicto o confirmación real del servidor.

- Alcance de base local derivado con SHA-256 del enlace vigente, con separación de dominio; nunca persistir la credencial
- AES-GCM de 256 bits con clave no exportable derivada por HKDF-SHA256 en memoria; IV aleatorio nuevo por escritura y datos autenticados que vinculan esquema, alcance, evaluación, escritor y versión
- Campos de respuestas y mutación permanecen cifrados; la credencial y la clave no se almacenan en el payload ni en registros locales
- Identificador aleatorio nuevo por carga/pestaña y control atómico de versión evitan que otra pestaña o snapshot atrasado reemplace el borrador
- Clonar snapshot antes de operaciones asíncronas; cifrar fuera de la transacción y confirmar durabilidad solo en oncomplete
- Recuperar solo después de autenticar y obtener la evaluación propia vigente; revisar local frente a servidor antes de enviar, sin recuperación automática ni rebase ciego
- Mutación con confirmación perdida se repite con el mismo identificador y payload solo tras revisión; un cierre pendiente requiere consentimiento nuevo y explícito
- Evaluación cerrada en servidor permanece cerrada; copia local solo se puede inspeccionar o descartar, sin reabrir ni escribir
- Restaurar como copia independiente y retirar el original solo con revisión/confirmación exactas y compare-and-swap; no borrar otra pestaña a ciegas
- Ediciones hechas durante un envío sobreviven a su confirmación; cambios de identidad/evaluación invalidan callbacks anteriores
- Fallo o ausencia de IndexedDB/criptografía se informa sin bloquear memoria ni envío al servidor; nunca mostrar cierre confirmado por persistencia local
- Copia del mismo navegador y enlace únicamente; no prometer recuperación en otro dispositivo ni cambiar 28 preguntas, escala, asignaciones, permisos o backend

## CTR-EMD-CONTACTS

- Componentes: SYS-EMD, GAS-EMD, SHEET-EMD.
- Evidencia: Diseño propuesto del sistema privado; el atlas no contiene nombres, correos, enlaces ni archivos..
- Entrada/campos: `Sesión de revisor autorizada y separación normal/QA`, `Archivo CSV, TSV o XLSX acotado a 250 filas`, `Identificador de persona exacto o nombre normalizado único y correo`, `Revisión esperada e identificador de mutación del lote`.
- Salida: Vista previa por fila sin escritura, Confirmación exacta del lote o conflicto sin sobrescritura, Asunto y recordatorio copiable sin envío.

- La lectura de preparación no crea pestañas ni lee respuestas o notas; solo usa asignaciones activas autorizadas
- Un nombre ambiguo, persona inexistente, correo inválido o duplicado bloquea el guardado completo
- Revisor normal y QA no comparten catálogos ni contactos
- La escritura exige revisión vigente; el reintento de ACK perdido reutiliza la misma mutación y contenido
- Una mutación reutilizada con otro contenido falla de forma explícita
- No emitir accesos, regenerar enlaces, reiniciar evaluaciones, enviar correos ni exponer enlaces personales
- No modificar 28 preguntas, escala, matriz, asignaciones, permisos, respuestas o estados de evaluación
- La reversión de código conserva contactos y registros de negocio; no borrar datos como parte del rollback

## CTR-EMD-DIRECTORY

- Componentes: SYS-EMD, GAS-EMD, SHEET-EMD.
- Evidencia: Excel aportado, coincidencias y detalles privados fuera del atlas..
- Entrada/campos: `Padrón nominal con identificador canónico, nombre exacto, puesto, nivel y jefe canónico`, `Hash esperado del directorio privado vigente`.
- Salida: Cargo solo de asignación propia, Organigrama de negocio únicamente para coordinación autorizada, ACK de importación verificado o conflicto.

- No inferir cargos/jerarquía de letras de matriz, ni inventar integrantes
- Rechazar identidad distinta, jefe desconocido, ciclo y ausencia de cargo/nivel
- Respaldar privado antes de escribir; lectura no crea recursos; reintento exacto no duplica
- Separar QA y negocio; no leer respuestas para directorio ni escribir asignaciones, accesos, cuestionarios o estados
