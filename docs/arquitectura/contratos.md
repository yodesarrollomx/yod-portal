# Contratos de datos e identidad

> Generado desde modelo.json. No editar a mano. Revisión 2026-10-09.126-despacho-integral · 2026-10-09.

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
- Salida: Confirmación de revisión y mutación sin exponer ubicación privada, Imagen autenticada en memoria, sin URL de Drive, o perfil sin foto, Foto o silueta con apariencia derivada del estado confirmado y respaldo textual accesible, Conflicto o error explícito que conserva el estado confirmado, Original visible exclusivamente en Mi foto de su propietario; tableros reciben solo derivado homologado vigente o silueta, Extensión propuesta getProfiles: indicadores hasOriginal y hasPublishedDerivative para identidades ya autorizadas; coordinación distingue foto faltante de original pendiente de homologación..

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
- Los indicadores de seguimiento respetan la misma ACL y segregación QA; no revelan original, archivo, hash ni respuesta de otra persona. Originales retirados y derivados invalidados no se presentan como vigentes.
- Lectura de seguimiento no crea recursos ni implica envío de recordatorios. Foto subida y foto publicada son estados diferentes; no inferirlos únicamente de image:null.

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

## CTR-DESPACHO-CORCHO

- Componentes: SYS-DESPACHO, SYS-TAREAS, GAS-OPERACION, STORE-DESPACHO-CORCHO, GAS-PORTERO, EXT-DRIVE.
- Evidencia: Fuente Corcho integrada en board-aurum PR #4 y frontend en yod-despacho PR #3; CHG-DESPACHO-CORCHO-PROVISIONAL-035 autoriza adapter provisional en Portero existente. Infraestructura privada preparada y preflight V57 comunicado; persistencia autenticada aún pendiente..
- Entrada/campos: `Sesión canjeada y validada servidor a servidor por Portero; identidad de propietario exacta con permiso DP vigente`, `Acción corchoGet o corchoSave; ID estable, versión esperada y payload JSON validado`, `Ejes configurables, notas con título/cuerpo, posición, color y estado activo o archivado`, `corchoGet: POST {action:corchoGet,k}; corchoSave: POST {action:corchoSave,k,version,data}`, `data:{axes:{ejeX,ejeY},notes}; versión CAS global, no versión independiente por nota`.
- Salida: Configuración y notas solo del propietario autorizado, ACK con versión confirmada o conflicto sin sobrescritura, Archivo/restauración con historial y sin borrado físico, Éxito sólo {ok:true,version,data:{axes:{ejeX,ejeY},notes}}; Save exige versión nueva y snapshot válido confirmado. Conflicto o ACK incompleto conserva el editor..

- El servidor deriva la identidad real de Portero; ignora identidad/rol enviados por el cliente. No amplía accesos de otros tableros ni sustituye getAll/update.
- Las lecturas no crean recursos ni exponen notas en getAll, catálogos, frontend estático, logs públicos u otros usuarios.
- La escritura exige LockService y versión esperada exacta. Rechaza conflicto, dato inválido o ID inconsistente antes de modificar el almacén.
- STORE-DESPACHO-CORCHO/Corcho contiene ID, versión y payload_json; @config conserva los ejes. JSON neutraliza fórmulas. No borrar notas ni filas.
- Archivo y restauración mantienen createdAt/updatedAt y versión; posiciones y ejes se validan con límites explícitos.
- No declarar guardado hasta ACK; fallos de red/carga muestran recuperación. No enviar borradores a terceros desde este contrato.
- Deploy usa implementación y permisos existentes, respaldando fuente y versión previa. Revert de código conserva notas y registros.
- CORCHO_SPREADSHEET_ID identifica un archivo independiente privado; no almacenar notas en el libro general de Operación ni alterar sus permisos.
- Antes de toda lectura/escritura comprobar principal de ejecución y propiedad única exacta del archivo y sus ancestros; revisar permissions.list paginado incl permisos publicados. Rechazar anyone, domain, otros usuarios, unidades compartidas, herencia no verificada o metadatos incompletos.
- Validación fresca sin caché ni fallback; las consultas de metadatos y permisos son solo GET. Si Drive o scopes no permiten certificar acceso, fallar cerrado con consentimiento_requerido sin añadir scopes, compartir archivos ni degradar protección automáticamente.
- Preparación del archivo puede crear únicamente pestaña Corcho y encabezados id/version/payload_json; cero notas de prueba, cero lecturas que creen recursos. La configuración del backend requiere identificar el proyecto vigente y su principal de ejecución.
- Provisional autorizado: sólo corchoGet/corchoSave de SYS-DESPACHO usan la URL Portero conocida actual. getAll/update y demás acciones conservan GAS-OPERACION; sin fallback de servidor para lectura ni escritura de Corcho.
- En GAS-PORTERO resolver localmente con canjearLigaLento_(key,'DP'): sin canje HTTP a sí mismo, sin renovar sesión y sin caché positiva. Exigir ok, correo de servidor igual al owner configurado y DP vigente según política existente; un rol administrativo de otro owner no basta.
- Mantener el Drive full guard existente: about.user del token efectivo, permissionId y correo coincidentes con owner único de archivo y ancestros; ACL completa paginada incluida vista published y raíz de Mi unidad. No sustituirlo por shared:false ni por una ACL histórica owner-only.
- La configuración puede usar propiedades existentes o fallback de módulo privado ya autorizado. Su resolución no escribe PropertiesService, no crea ni inicializa Sheet y no incluye IDs/correos/credenciales en fuentes o logs públicos.
- El dispatcher Corcho se integra antes del lock y de guards/caches genéricos sin alterar otras rutas; conserva JSON, límites, respuesta y semántica de error. LockService y CAS pertenecen al handler Corcho.
- Migración futura a Ops cambia sólo endpoint/adapter y conserva CTR-DESPACHO-CORCHO, identidad, full guard, archivo, IDs, versiones y archivo/restauración. Cortar el escritor provisional antes de habilitar Ops: locks de proyectos distintos no serializan entre sí.
- Rollback restaura frontend anterior por PR y versión activa anterior del backend en la misma implementación/URL, conservando cambios concurrentes del editor, configuración y ACL. Nunca borrar, recrear, limpiar ni restaurar Sheet/notas/ejes/versiones. Ante escritura incierta conciliar con corchoGet autenticado sin repetir Save a ciegas.

## CTR-AMALAYA-CHINCHES-ESTADO

- Componentes: SYS-AMALAYA, GAS-AMALAYA, SHEET-AMALAYA.
- Evidencia: Extensión compatible propuesta para conciliar chinches con el cierre real de GitHub..
- Entrada/campos: `Token del puente existente; lectura accion=chinches con incluirTomadas=si`, `POST action=chincheEstado con ID, URL canónica de issue, estado previo, destino terminada/descartada y evidencia del cierre GitHub`, `Consulta GitHub puede usar github_token efímero del job de conciliación con contents:read/issues:read, además del token actual que autoriza CAS.`.
- Salida: Lectura acotada de nuevas/tomadas para conciliación; consulta original mantiene solo nuevas, Cambio confirmado por ID con historial o conflicto sin sobrescritura; reintento idéntico idempotente.

- No confiar en un estado GitHub inventado por cliente: comprobar cierre y motivo autoritativos. Solo CLOSED/completed permite terminada y CLOSED/not_planned permite descartada.
- Validar repositorio canónico, issue, ID y estado previo bajo candado. Rechazar identidad distinta, URL arbitraria, conflicto o transición inválida.
- No editar texto original, roles, permisos, datos comerciales ni cerrar issues desde el puente. Lectura no crea datos.
- Registrar cambio en Historial y comprobar ok de la respuesta; HTTP 200 por sí solo no acredita éxito.
- Preservar token, implementación, URL, configuración y trabajo pendiente del editor. Revertir código conserva historial y registros.
- Pruebas aisladas; conciliación real limitada a IDs revisados y autorizados. Supuestos financieros y estados vacíos se muestran como tales sin inventar datos.
- github_token solo en Authorization hacia api.github.com/repos/yodesarrollo/amalaya-board/issues/<n> canónico. No almacenar, registrar, devolver ni reenviar a otro host. No reemplaza CHINCHES_TOKEN ni amplía autorización de estados.
- Separar conciliación de creación de issues; errores HTTP GitHub se devuelven como códigos controlados sin cuerpos privados ni credenciales. No imprimir payload ni URL con token.

## CTR-MOAC-ENCARGOS

- Componentes: SYS-TAREAS, GAS-OPERACION, SHEET-OPERACION, GAS-MOAC-METAS, SHEET-MOAC-METAS.
- Evidencia: Mejora de interfaz sobre contratos de tareas y objetivos existentes; implementación pendiente de integración..
- Entrada/campos: `Encargo original y acciones editables con título conciso`, `Proyecto y objetivo existentes elegidos explícitamente; identidad actual autorizada`.
- Salida: Creación de acción confirmada con ID y posterior vínculo confirmado a objetivo, Resultado parcial explícito si creación o vínculo no se confirma; conservación de texto original y trazabilidad.

- No inferir ni crear proyectos/objetivos para resolver una referencia ambigua. Conservar IDs, historia y fuente original.
- Interpretar TRUE/FALSE explícitamente: borrada siempre se excluye y archivada se oculta por defecto; no usar truthiness de strings.
- Datos sin clasificación quedan visibles para corregir y fuera de indicadores semanales válidos; no inventar fecha o pertenencia.
- No anunciar guardado completo hasta confirmación de tarea y vínculo. Con ACK perdido, conciliar marcador exacto antes de crear otra vez; ambigüedad permanece pendiente.
- Fallo de vínculo conserva el ID ya creado y permite completar ese vínculo sin duplicar la acción.
- Pruebas sintéticas fuera de producción; no modificar catálogo central ni permisos. Revertir frontend conserva registros de negocio.

## CTR-SALA-CONTENIDO-VETADO

- Componentes: SYS-SALA, GAS-SALA, SHEET-SALA, SVC-SALA-PRODUCTOR, SVC-SALA-EJECUTOR, EXT-MOTORES-MEDIA.
- Evidencia: Instrucción editorial y propuesta de cierre #49. Usa REGLAS existente sin nuevas pestañas, columnas, roles o endpoints..
- Entrada/campos: `Regla contenido_ubicaciones_vetadas como lista CSV aditiva en nombre/valor/descripcion`, `Textos nuevos de ideas, premisas, promesas, guiones, láminas, recetas y candidatas`.
- Salida: Rechazo de contenido o lote inválido antes de motores, red, montaje o escritura, Salida validada para etapas existentes sin alterar notas, IDs ni historial.

- Hermosillo, Sonora y México son el mínimo solicitado; configuración añade vetos y no retira ese mínimo. Comparación por palabra completa, sin distinguir mayúsculas o acentos.
- No inspeccionar ni reescribir URLs, IDs, zona horaria, notas editoriales, bitácora o historial como contenido editorial nuevo.
- Recepción proponer/ideas/arbol y compuertas nube frenan el lote completo antes de efectos. No producir primero y validar después.
- Conservar autorización y contratos de REGLAS y escritura actuales. No aprobar decisiones humanas ni publicar marketing como parte de una prueba.
- Código integrado, workflows, frontend y GAS se verifican por separado; fuente GAS versionada no prueba instalación.

## CTR-PPP-PATRIMONIAL-NATIVO

- Componentes: SYS-POTENCIALES, GAS-PORTERO, SHEET-PORTERO, SHEET-PPP-MODELOS.
- Evidencia: Propuesta de extensión nativa Patrimonial para #47; fórmulas, campos y datos se contrastan con fuente canónica antes de publicar..
- Entrada/campos: `Modelo Patrimonial tipado por caso registrado en PPP_LIBROS`, `Entradas allowlisted en tabla Campos; CUS máximo, pasillos en porcentaje y puertas Depa/Local con rentas independientes`, `Identidad PT/PA vigente, caso_id, revisión esperada y CAS existente`.
- Salida: Resultados, conciliación de áreas y años calculados por fórmulas protegidas en Sheets, Resultados confirmados conservados al editar; ausencia y demanda sobre capacidad informadas explícitamente.

- Frontend no calcula financieramente estas magnitudes ni sustituye fórmulas por resultados hardcodeados. No inventar reglas comerciales o límites normativos.
- CUS rige también en Profundizar; pasillos usan solo porcentaje. Mezcla de puertas conserva cantidades, áreas y rentas distintas.
- Dato ausente permanece pendiente, no se convierte en cero. Demanda que excede capacidad conserva el número y muestra discrepancia, sin recorte silencioso.
- Mantener endpoint, ACL PT/PA, IDs, caso_id, palabra, históricos, CAS y revisión. No cambiar lectura vertical ni datos de otros casos.
- Lectura tipada en pppLeerLibro_/sheet-cantidades conserva compatibilidad vertical. Registro y creación de modelo canónico documentados con fuente y rollback.
- Pruebas mixtas vivienda/comercio, CUS cero/ausente, pasillos 0/20, 1/N puertas, rentas distintas y exceso; cero POST de prueba de negocio.
- Recuperación #47 conserva caché y borrador vinculados al caso al navegar A/B/A; persistir metadatos de borrador antes de pintar y no presentar pendientes como confirmados.
- ACK perdido tras reload: recuperar el job exacto con request_id, payload y revisión originales sólo tras GET fresco autorizado. La caché de recibos de seis horas se consulta antes de CAS; recibo evictado y revisión obsoleta producen conflicto sin overwrite. No sustituir el job ni elevar revisión esperada para forzar escritura.
- Recuperación sobre activo/editor V65 preserva los otros siete archivos, manifest, URLs, scopes y ACL; adaptador presente en activo y editor final. Pruebas sintéticas y propuesta Atlas no certifican despliegue ni cierre de Sala #47.

## CTR-EMD-INVITES

- Componentes: GAS-EMD, SHEET-EMD, EXT-DRIVE, EXT-GMAIL.
- Evidencia: Propuesta de preparación privada y entrega controlada de invitaciones con enlaces existentes; consentimiento y lote real se acreditan antes de activar envío..
- Entrada/campos: `Coordinación reviewer vigente, catálogo y asignaciones autorizados con segregación QA/normal`, `Personas únicas 1..25, finalidad welcome/reminder/photo, ronda explícita estable y contactos verificados con revisión`, `Enlace participante existente, vigente y vinculado a identidad desde archivo privado autorizado; no emitir ni reiniciar accesos`, `Review HMAC privado con actor, personas, finalidad, ronda, digest y expiración15min; mutation estable; confirmación humana del lote exacto para enviar`.
- Salida: Preview con asunto, destinatario y cuerpo con enlace enmascarado; sin crear recursos, Borrador privado con enlaces existentes solo tras mutación explícita, Recibo por actor y mutation para consultar incluso tras expiración; submitted no acredita entrega, Ubicación privada de borrador confirmado sin compartir ni publicar enlaces, getInvitationPreparationStatus(admin) solo declara flags de preparación/envío, QA y maxBatch25 bajo ACL reviewer; sin leer ledger, participantes, enlaces o respuestas y sin crear recursos..

- Preparación y envío deshabilitados por defecto; secreto de firma y configuración se preparan por el propietario. No añadir scopes ni consentimiento automáticamente.
- Coordinación vigente en cada llamada y separación QA/normal. QA nunca envía correos reales. No leer ni convertir respuestas o puntajes como parte de esta propuesta.
- Validar correo, contacto/revisión, nombre e identidad del enlace existente antes de efectos. Dato ausente, formato legado incompatible, enlace vencido o revocado se rechazan, no se adivinan ni reemiten.
- Certificar privacidad y propietario único de archivo, carpeta, ancestros y libro de ledger mediante Drive con permisos exhaustivos antes de leer/escribir; fallar cerrado ante datos incompletos, otros permisos o unidades compartidas. No modificar permisos de almacenes de negocio para acomodar este contrato.
- Ledger InvitacionesLotes preserva MUTATION,DIGEST,ACTOR,OPERATION,STATUS,RECIPIENTS,DRAFT_FILE,UPDATED. Crear recurso solo por mutación explícita; reserva y flush antes de Mail; lecturas y preview sin creación.
- Mutation/digest/actor/operación inmutables y deduplicación por persona/correo/hash enlace/finalidad/ronda; reserva/resultado incierto o ACK perdido no permiten reenvío automático. Consultar y conciliar recibo. Nueva ronda exige elección humana.
- Borrador nuevo se crea vacío, se certifica privacidad antes de contenido y se revalida después; no reparar ACL silenciosamente. Drive y Sheets no ofrecen transacción conjunta de permisos y datos.
- Máximo25 y cuota suficiente para todo lote con reserva5; revalidar por destinatario y pausar restantes not_attempted si cae la cuota. No afirmar entrega por aceptación MailApp.
- Enviar exige scope script.send_mail consentido personalmente, configuración habilitada y aprobación humana explícita del lote concreto revisado. Ningún envío desde auditoría o pruebas.
- Sin tokens en tableros generales, Git, Atlas, logs o almacenamiento persistente del navegador. Limpiar UI al cambiar sesión y conservar mutation para conciliar ACK perdido.
- Publicar fuente con funciones deshabilitadas no acredita activación ni envío. Mantener manifest, endpoint, identidad y permisos actuales salvo consentimiento específico posterior.

## CTR-EMD-ENTRADA-CORPORATIVA

- Componentes: GAS-EMD.
- Evidencia: Propuesta de entrada HTTPS corporativa para #9, condicionada a dominio/ruta y alojamiento reales..
- Entrada/campos: `Ruta HTTPS corporativa elegida por propietario y endpoint GAS existente confirmado`, `Fragmento personal recibido en navegador sin trasladarlo a querystrings`.
- Salida: Redirección al portal Apps Script existente conservando fragmento personal.

- No copiar HTMLService a una web estática ni reemplazar google.script.run. No emitir/reiniciar enlaces.
- No publicar dominio inventado; configuración de DNS/alojamiento/certificado se verifica antes de activar.
- Enlace corporativo de entrada redirige a GAS: mantener toda sesión bajo dominio corporativo requeriría otra migración y contrato.
- No registrar ni publicar fragmentos personales o tokens; no ampliar permisos ni cambiar endpoint.

## CTR-SALA-PRODUCCION-ACOTADA

- Componentes: SYS-SALA, GAS-SALA, SHEET-SALA, SVC-SALA-PRODUCTOR, SVC-SALA-EJECUTOR, EXT-MOTORES-MEDIA, EXT-DRIVE.
- Evidencia: Propuesta de recuperación acotada de medio faltante para el encargo editorial #44; no ejecutar rescate global ni publicar marketing como parte del cierre..
- Entrada/campos: `ID exacto de trabajo existente y hash de fuente aprobado, con estado y evidencia vigentes contrastados`, `Fuentes canónicas existentes, decisiones editoriales y regla de contenido vigente`, `Modo offline explícito sin descargas, motores remotos ni cargos; dependencias locales aisladas`.
- Salida: Artefacto local privado verificado por hash, duración e integridad, o dependencia real explícita, Evidencia de producción real y durable solo cuando acceso y ubicación se acreditan; sin inventar IDs, rutas o marcas de completado.

- Filtrar objetivo antes de todo rescate, reintento, red, montaje o escritura. ID/hash no coincidentes se rechazan; no ampliar objetivo por --limite ni activar trabajos ajenos.
- Conservar decisiones del editor, versiones y contenido histórico; solo producir material vigente aprobado y que cumple CTR-SALA-CONTENIDO-VETADO. No reaprobar ni sobrescribir no.
- Offline prohíbe descargas de modelos y motores remotos; no sustituir silenciosamente el motor por otro no autorizado. Artefactos nuevos se mantienen privados y trazables a fuente aprobada.
- No marcar HECHO por generación local, prueba sintética o estado antiguo. Exigir archivo durable, integridad y acceso del ejecutor verificados; si falta credencial/ubicación, conservar pendiente y entregar evidencia privada.
- No alterar ACL de archivos o almacenes de negocio para acomodar recuperación. Cualquier actualización real requiere estado esperado fresco y manejo de conflicto, no reemplazo del historial.
- Pruebas usan fuentes sintéticas/dobles sin endpoints de negocio; una producción real específicamente autorizada se registra aparte y nunca se llama prueba. No lanzar workflows globales ni publicar a redes sociales.

## CTR-DESPACHO-3D-SECTION

- Componentes: SYS-YOD-OS, SYS-DESPACHO, GAS-PORTERO, SYS-SALA, GAS-SALA, SHEET-SALA, SYS-DESPACHO-3D.
- Evidencia: Petición del propietario del 3 de octubre de 2026: alojamiento directo GitHub e ingreso inmersivo desde Despacho, eliminando el segundo login del Site privado..
- Entrada/campos: `Ruta exacta #/despacho y perfil confirmado por Portero con permiso DP vigente`, `Destino fijo ../despacho3d/index.html de mismo origen; frontend neutro sin identidad o registros de negocio incluidos en el código público.`, `Evento yod:despacho:pin version 1 de la ventana/origen exactos del iframe activo: requestId UUID, target id/zone/kind/point, view position/quaternion/fov/mode, modelVersion y viewport`, `Evento compatible yod:despacho:pin version 2: mismo envelope/target interface más ui {surface,path,item}. Surface lista fija, path tag:nth-of-type sin atributos/IDs/texto máx600 y item ordinal nullable0..9999. Fallback UI mode map exige position/quaternion/fov null.`, `Extensión de view para panorama ortográfico: mode overview, fov null y orthographic {left,right,top,bottom,zoom} con límites finitos ordenados. Perspectiva v1/v2 y fallback map se conservan; ningún dato privado adicional.`.
- Salida: Sección Despacho inmersiva con recorrido, paneles de agentes, regreso a Inicio y enlace a Bandeja canónica., Iframe desmontado al salir, cerrar, cambiar usuario o invalidar autorización, Chinche revisable con ancla/cámara/versiones geométricas y encargo humano; contexto técnico en campo codigo existente.

- Conservar SYS-DESPACHO, DP, catálogo, allowlists y destinos canónicos. El Portero controla la entrada OS; cada backend sigue validando sus propios permisos.
- No añadir credenciales al iframe, URLs, hashes o mensajes. Ninguna credencial ni registro operativo se incluye en archivos estáticos públicos.
- No montar la oficina desde OS antes de perfil confirmado ni después de cambiar sesión, negar DP o abandonar la ruta. Ignorar mensajes de ventanas anteriores. El frontend estático público por sí solo no acredita acceso a datos.
- Aceptar solo metadatos geométricos v1 o referencias UI v2 de superficie/ruta/ordinal allowlisted, con claves, tipos, valores finitos y límites explícitos; rechazar campos extra, identidad, casos, nombres, hojas, URLs y credenciales.
- Un evento geométrico prepara un encargo revisable; no crea aprobación comercial ni escribe automáticamente en negocio. Reutilizar Chinches y el canal existente, con deduplicación por requestId.
- Cada borrador 3D conserva un guard efímero de ventana y sesión vigentes; al salir o invalidar autorización se cierra el compositor y se cancela su guard. Tras recargar o cambiar persona no se autoenvía un borrador 3D antiguo; su exportación manual conserva el contexto. Las Chinches generales mantienen su comportamiento existente.
- Sólo copiar interfaz, modelos y recursos visuales neutros al repositorio público. Datos, memoria, documentos, nombres de casos e identificadores privados permanecen en Drive y sus transportes autorizados.
- Probar mediante dobles y red interceptada; ninguna prueba escribe en endpoints de negocio.
- Cobertura dinámica de tarjetas de revisión, fuentes, PPP, actividad, objetivos, conocimiento y paneles del agente: abrir/señalar/cancelar no ejecuta sus controles de negocio ni copia su contenido; solamente Clavar del humano usa el envío existente. Vista alternativa sin WebGL sólo referencia UI, jamás punto/cámara inventados.

## CTR-EMD-ESCALA-CAPTURA

- Componentes: SYS-EMD, GAS-EMD, SHEET-EMD.
- Evidencia: Aprobación explícita del propietario del 2 de octubre de 2026 para EMD issue #39; propuesta compatible, no evidencia de código ni producción. Detalle público y matriz sintética en emd-escala-captura.md..
- Entrada/campos: `Sesión y asignación vigentes, misma evaluación y pregunta canónicas, revisión y mutación conforme al contrato privado existente`, `Nueva respuesta numérica entera 1..5; NA solo como conservación de NA ya confirmado por servidor en esa misma evaluación y pregunta`, `Estado confirmado vigente del servidor; borradores locales y payload del cliente no acreditan NA histórico`.
- Salida: Captura nueva limitada a 1..5; representación ascendente 1 rojo, 2 naranja, 3 amarillo, 4 verde claro, 5 verde con número/etiqueta accesibles, NA histórico legible y conservado con su representación existente, sin ofrecerlo como opción nueva; confirmación real o rechazo explícito sin escritura parcial, Guard de servidor también frente a clientes antiguos; no se introducen campos, endpoints, recursos ni permisos nuevos.

- La aprobación autoriza únicamente retirar NA de nuevas capturas y orientar colores 1 rojo → 5 verde para las 28 preguntas actuales favorables. No cambia textos, IDs ni cantidad de preguntas, asignaciones, ponderación, cálculo, accesos o cierre.
- NA no se admite en preguntas vacías ni en respuestas numéricas. Solo se puede conservar cuando el valor confirmado vigente de esa misma evaluación y pregunta ya es NA; un NA de otra pregunta, evaluación, usuario, borrador o snapshot obsoleto no autoriza introducirlo.
- El backend valida la excepción con su estado autorizado y revisión vigentes, antes de persistir el lote. Cliente, restauración local, payload manipulado y cliente antiguo no pueden concederla. Conservar controles de autorización, concurrencia e idempotencia existentes.
- Conservar un NA histórico no es una migración: no normalizar, convertir a cero o vacío, imputar puntaje ni reescribir su registro al guardar otras preguntas o cerrar. No recalcular historia ni modificar el tratamiento existente de NA en cálculos.
- Una edición autorizada de NA a 1..5 en evaluación abierta puede confirmarse bajo las reglas existentes; después, la misma pregunta ya no tiene NA confirmado y no puede volver a NA. Una evaluación cerrada no se reabre.
- Las opciones nuevas son los enteros 1..5; vacío y validación de obligatoriedad conservan las reglas existentes. El color es presentación y no invierte, transforma ni pondera respuestas; mantener texto, foco y accesibilidad sin depender solo del color.
- NA histórico debe poder cargarse, verse y conservarse incluso en payloads completos o reintentos exactos válidos. El guard no debe rechazar una edición de otra pregunta por contener NA confirmado sin cambios; tampoco aceptar nuevos NA mezclados en ese lote.
- Esta excepción acotada precisa las menciones previas a escala intacta en propuestas/contratos EMD; todos sus demás límites permanecen. No ampliar el instrumento a preguntas desfavorables por inferencia.
- Pruebas funcionales y versión activa pendientes en sistema privado; usar dobles sintéticos, no endpoints de negocio ni datos Google para probar. La integración del atlas no acredita despliegue de EMD.
- Rollback conserva datos e historial: revertir documentación por PR y regenerar vistas; restaurar frontend sin quitar el guard. Solo volver a GAS con guard equivalente; si no existe versión compatible, suspender captura afectada hasta parche. No restaurar NA como opción nueva ni reescribir históricos.

## CTR-DESPACHO-CONVERSACION

- Componentes: SYS-YOD-OS, SYS-DESPACHO, GAS-PORTERO, EXT-DRIVE.
- Evidencia: Continuación autorizada del bloque de conversación del Despacho. Contrato local por instalar sobre el backend existente, no nuevas rutas HTTP supuestas..
- Entrada/campos: `resolveCurrent sin selector: el servidor resuelve expediente y permiso del actor autenticado.`, `read con case_id previamente resuelto; enqueue con case_id, expected_revision, request_id y message.`.
- Salida: Identidad y enlace privado procedentes del servidor; historial y estado desde Sheets., Recibo de encolado confirmado; respuesta recuperada por lectura posterior, sin regenerar resultados al abrir..

- Cada operación exige autorización fresca de servidor; el puente de navegador no sustituye Portero.
- Origen y ventana exactos, método permitido y época de sesión conservada. Credenciales sólo en adaptador autorizado del OS.
- Sin datos privados estáticos, sin almacenamiento local de conversaciones ni inferencia de guardado a partir del eco visual.
- Cierre o revocación descartan datos en memoria y respuestas tardías; toda reapertura relee Sheets.
- Un fallo de ACK conserva el mismo request_id para reconciliar, nunca encola con ID nuevo automáticamente.
- Sin adaptador verificado no se habilita envío. Pruebas sintéticas no acreditan conexión productiva.
- Un fallo transitorio de red conserva sólo la lectura ya visible, marcada desactualizada; bloquea nuevos envíos hasta revalidar. Revocación o cambio de caso limpia datos. Recuperación consulta Sheets sin reenviar inferencia.
- La voz del navegador dicta un borrador y lee una respuesta ya guardada por acción del usuario; no escucha al cerrar ni se presenta como voz realtime.

## CTR-EMD-GITHUB-EMBED

- Componentes: SYS-EMD, GAS-EMD, SHEET-EMD, SYS-YOD-OS.
- Evidencia: Autorización del propietario del 2 de octubre de 2026 y plan EMD #9; propuesta local, no evidencia de despliegue. Detalle en emd-github-embed.md..
- Entrada/campos: `Modo embed explícito del doGet existente; origen top autorizado https://yodesarrollomx.github.io`, `Handshake versionado, nonce efímero y ready del frame Google activo; fragmento personal solo después de canal confirmado`, `Wrapper en https://yodesarrollomx.github.io/yod-portal/emd/, publicado por yod-portal main/raíz en PR separado`, `CHG-EMD-DOMINIO-045: nueva entrada https://emd-evaluacion-360.github.io/; lista cerrada de este origen y https://yodesarrollomx.github.io por compatibilidad. Conservar source top, nonce y destinos exactos.`.
- Salida: Cuestionario real fullscreen desde Google manteniendo dirección GitHub, Entrada normal DEFAULT intacta y confirmaciones de backend existentes.

- Wrapper público mínimo fullscreen de HTMLService real; URL GitHub persistente, sin redirección ni copia estática del cuestionario.
- doGet normal conserva XFrameOptions DEFAULT; únicamente embed explícito permite enmarcado con UI oculta y portalboot bloqueado hasta handshake.
- Orígenes exactos https://yodesarrollomx.github.io y https://emd-evaluacion-360.github.io (CHG-EMD-DOMINIO-045), event.source igual a window.top en cliente embed y wrapper ejecutado solo como top; nonce criptográfico fresco, timeout, ready y confirmación antes del acceso.
- Wrapper fija origen Google efectivo y ventana del montaje activo incluso con frames HTMLService intermedios; validar esquema/estado/nonce y rechazar mensajes obsoletos. Nunca targetOrigin wildcard ni confianza por sufijo.
- Fragmento personal existente solo en memoria y canal confirmado; no tokens en query, iframe src, logs, analytics o almacenamiento del wrapper. Backend conserva autorización.
- google.script.run, tokens, ACL, CAS, idempotencia, Sheets, cierre y contratos EMD vigentes sin cambios. Sin preguntas o fuentes privadas en repo público.
- Hosting yod-portal main/raíz y ruta /yod-portal/emd/ confirmados por propietario; origen compartido GitHub no autentica pathname. Contrato de redirección anterior se conserva como historia y no satisface #9.
- Propuesta local previa; implementación EMD a cargo del agente principal. Tests del atlas no acreditan pruebas privadas, Pages o GAS desplegados.

## CTR-DESPACHO-TERMINAL-LOCAL

- Componentes: SYS-YOD-OS, SYS-DESPACHO, GAS-PORTERO, EXT-DRIVE.
- Evidencia: Continuación autorizada del propietario tras r4; terminal y herramientas reales por puesto..
- Entrada/campos: `Perfil vigente resuelto por servidor; acción explícita Conectar mi terminal.`, `Ventana de127.0.0.1 con cookie HttpOnly, aprobación local para caso configurado y origenYOD fijo.`.
- Salida: MessageChannel efímero para pantalla PTY, tamaño, estado y controles de sesión locales., Cierre/revocación corta el canal, conserva proceso y memoria en sus almacenes existentes..

- No abrir listener externo, CORS global, URL con token ni copiar loginCodex.
- Origen, ventana, nonce y caso exactos; datos privados sin localStorage.
- Consentimiento local antes de emitir pantalla. Sólo acciones start/resume/stop/room y mensajesinput/resize; sin shell HTTP arbitrario.
- Room sigue siendo ejecutor acotado y no acepta teclado; terminal manual es interactiva y sus cambios no se guardan automáticamente en Sheets.
- Un proceso activo; no stop automático al conectar/desconectar; heartbeat y revocación cierran el canal.
- Ventana local debe permanecer abierta para el puente; móvil en otro equipo conserva chat pero no tiene acceso a localhostChromebook.

## CTR-DESPACHO-ACTIVIDAD-V1

- Componentes: SYS-YOD-OS, SYS-DESPACHO.
- Evidencia: Plan del Despacho, acción 1.1. Especificación nueva, no RPC del servidor vigente..
- Entrada/campos: `Actividad con IDs estables y vínculos a IDs canónicos existentes; eventos ligados a actividad y caso.`, `Cada evento identifica secuencia, fuente, evidencia y hora; el adaptador deberá autorizar antes de aceptar eventos de servidor.`.
- Salida: Proyección de estados validada y reproducción de eventos, con recibo local explícito., Reintento idéntico no duplica; identidad distinta, desorden, cambios de contenido y eventos tardíos se rechazan..

- Llegar confirma desplazamiento, no completa la consulta ni concede aprobación.
- Resultado terminado requiere la misma referencia de entrega presentada para revisión.
- El reductor local no certifica identidad, permisos ni persistencia; fase 1.2 requiere adapter de servidor autorizado.
- Demostración siempre sintética, sin credenciales, red, almacenamiento ni datos privados.
- Mantener message_id, job_id, event_id y request_id existentes; vincular sin migración ni sustitución de historial.

## CTR-DESPACHO-VISITAS-V1

- Componentes: SYS-YOD-OS, SYS-DESPACHO, GAS-PORTERO, EXT-DRIVE.
- Evidencia: Registro durable de visitas de la sala; independiente del contrato de conversación..
- Entrada/campos: `readVisits: case_id; recordVisit: case_id, request_id, visit_id, expected_revision, space_id, visitor_kind, reason_code, arrival_ref.`, `Actor, libro y caso canónico resueltos y reautorizados por servidor. El navegador no elige actor ni destino de almacenamiento.`.
- Salida: Historial acotado con revisión y recibos persistidos; read no crea pestañas., ACK ligado a visita, caso, solicitud y actor con revision y receipt_id; reintento idéntico recupera el mismo recibo aunque avanzó la revisión..

- ScriptLock, reautorización vigente dentro del bloqueo, CAS y batchUpdate único que conserva visita, recibo y estado.
- Mismo request_id con otro contenido o actor se rechaza; visit_id ya usado no se reatribuye.
- Llegada informada por cliente acredita registro, no verificación física por servidor, ejecución de herramientas ni aprobación.
- Horas del servidor; ningún nombre, secreto, URL o identificador de libro privado en archivos públicos.
- No modifica conversación, trabajos, metas ni sus IDs; pruebas conectadas usan archivo sintético aislado.
- Solicitud ambigua conserva IDs; nunca cambia revisión y reintenta automáticamente una escritura sin reconciliar.

## CTR-DESPACHO-PERMISOS-V1

- Componentes: SYS-YOD-OS, SYS-DESPACHO, GAS-PORTERO, EXT-DRIVE.
- Evidencia: Acción 1.3; política de la oficina preparada para Portero, separada de permisos de otros tableros..
- Entrada/campos: `Sesión autenticada por Portero y expediente canónico en servidor; nunca actor, libro o nivel elegidos por navegador.`, `readOfficePermissions: case_id; readOfficePending: case_id, space_id=juntas. Contratos existentes readVisits/recordVisit conservados.`.
- Salida: Matriz de espacios con operaciones y nivel máximo inicial observar; snapshot informativo no es un permiso reutilizable., Lecturas reautorizadas al terminar; datos de una respuesta tardía no se entregan tras revocación o cambio de actor..

- Solo juntas, biblioteca y edición tienen registro de visitas implementado; observar no concede acceso a NotebookLM/Drive ni envíos.
- Borrador y acción aprobada no concedidos por defecto; espacios no conectados y operaciones desconocidas se deniegan.
- Cada mutación verifica autorización vigente antes del commit; se conservan CAS, IDs y recibos.
- Pruebas sintéticas sin endpoints de negocio, credenciales, mensajes ni escrituras de producción.

## CTR-DESPACHO-BIBLIOTECA

- Componentes: SYS-YOD-OS, SYS-DESPACHO, GAS-PORTERO, EXT-DRIVE, SVC-AUTON-CLOUD, EXT-JEV.
- Evidencia: Continuación autorizada 5-oct-2026 de la biblioteca indexada de Jev; Documentos del expediente y lector Drive actuales..
- Entrada/campos: `Contexto autenticado del expediente y referencias de Documentos; cliente no elige otro actor/expediente o amplía alcance.`, `Credencial temporal del carril rápido, consulta acotada y sólo lectura.`.
- Salida: Estado de preparación y fuentes reales antes de cargar contenidos., Pasajes con fuente/página/pestaña/rango/versión/fecha, cobertura y límites; historial conserva referencias aparte de deltas exactos..

- El índice vive en volumen privado del servidor, nunca en repositorio público, URL o almacenamiento persistente del navegador.
- Documento accesible por cuenta de servicio no basta: debe seguir registrado en Documentos del expediente actual.
- Revalidar acceso y versión de cada candidato antes de devolver texto; no mostrar contenido obsoleto durante actualización, revocación o error.
- Preparar y refrescar índice en segundo plano; ninguna inferencia Live/micrófono por abrir Biblioteca.
- Reusar contenido sólo si identidad, archivo, selección y versión coinciden; no usar extracción visual de una pregunta como transcripción completa.
- Sheets conserva cifras y cálculos canónicos. No tratar índice derivado o respuesta guardada como dato financiero actualizado.
- Límites y truncado explícitos; búsqueda léxica y ranking Jev no demuestran cobertura integral ni verdad de una respuesta.
- Conservar configuración Live exacta, autorización DP/carril, historial/recibos y fuentes no confiables como datos, nunca instrucciones.
- modifiedTime no acredita frescura de fórmulas de Sheets: pasajes de hojas marcan datos_vigentes=false; drive_leer siempre relee valores originales, sin responder desde el índice.

## CTR-DESPACHO-VOZ-BASICA

- Componentes: SYS-YOD-OS, SYS-DESPACHO, GAS-PORTERO, EXT-DRIVE, SVC-AUTON-CLOUD, EXT-OPENAI.
- Evidencia: Prioridad explícita de Dirección el 5-oct-2026: voz básica primero y contexto después..
- Entrada/campos: `Credencial efímera válida para el expediente autorizado y gesto explícito de Hablar.`, `SDP WebRTC y JSON GPT-Live exacto ya proporcionado; claves sólo servidor.`.
- Salida: Audio remoto y escucha al recibir session.started; no depende de ACK de contexto/herramientas., Transcripciones exactas por start_ms/end_ms, journal durable y estado de respaldo separado..

- Modo básico predeterminado no anexa contexto documental ni herramientas del expediente. Una única instrucción de identidad/saludo después de session.started no bloquea la escucha ni repite la configuración inicial. No presenta respuestas como informadas por documentos.
- Mantener controles actor/caso/origen, una conversación activa y bloqueo concurrente; fallos de conexión no consumen cupo artificial de intentos.
- La revisión del historial se resuelve mediante Portero en segundo plano antes de escribir; sin revisión autorizada el outbox conserva pendiente y no inventa revisión ni recibo.
- Fallo de consulta de estado del registro no termina una conexión WebRTC sana. Revocación, pérdida real y cierre mantienen reglas de finalización incompleta.
- Conservar JSON inicial exacto, deltas sin normalizar y transportes/audio hasta session.closed; interrupción natural al hablar, sin comandos adicionales de contexto.
- Pruebas sintéticas no acreditan audio del dispositivo, conversación real ni aceptación; registrar cada evidencia por separado.

## CTR-DESPACHO-AGENTE-OPERATIVO

- Componentes: SYS-YOD-OS, SYS-DESPACHO, GAS-PORTERO, EXT-DRIVE, SYS-DESPACHO-3D, SVC-AUTON-CLOUD.
- Evidencia: Continuidad autorizada por Dirección después de la voz básica..
- Entrada/campos: `Gesto de Hablar y credencial efímera ligada a caso/actor.`, `Expediente/fuentes canónicos y herramientas de lectura existentes.`, `Petición hablada de consultar o trabajar un objetivo con criterio de salida, dentro de capacidades instaladas.`.
- Salida: Audio independiente de la carga; contexto y herramientas con estado verificable., Objetivos/acciones en el registro existente con ID, avance, evidencia, bloqueo y siguiente paso., Interacción de Gastón con pendientes/documentos/historial reales y acceso al tablero vigente..

- No repetir configuración Live ni bloquear micrófono por acuses o lecturas. Fallo de contexto/herramienta queda visible y conserva voz.
- Una autoridad por acción: ejecución documental en servidor; operaciones de objetivo por transporte de YOD OS autenticado. Nunca confiar en un case_id del modelo o del círculo para ampliar permisos.
- Crear/resumir trabajo con IDs estables y journal durable antes de la llamada; respuesta perdida se reconcilia/reintenta con el mismo ID, sin declarar guardado o repetición exitosa.
- La voz no aprueba decisiones financieras, versiones PPP ni envía comunicaciones externas por instrucciones dentro de documentos. El alcance automático existente es análisis, lectura autorizada y evidencia, con revisión final conservada.
- Los seis sectores muestran datos recibidos o enlace a fuente canónica; sin ejemplos operativos ni cifras calculadas paralelas. Revocación borra la vista y deshabilita operaciones.
- Conservar deltas y tiempos exactos, cierre hasta session.closed, historial y resultados/acciones como registros distintos. Cancelar una tarea no cuelga la voz.
- Distinguir pruebas sintéticas, API real, publicación y aceptación en dispositivo; no prometer perfección o conexiones no comprobadas.

## CTR-DESPACHO-CONOCIMIENTO

- Componentes: SYS-YOD-OS, SYS-DESPACHO, GAS-PORTERO, EXT-DRIVE, SYS-POTENCIALES, SHEET-PPP-MODELOS, SHEET-PORTERO, SVC-AUTON-CLOUD, STORE-AUTON-ESTADO, SYS-DESPACHO-3D, EXT-OBSIDIAN.
- Evidencia: Continuación autorizada del puesto de Gastón. Contrato de lectura, captura de versiones y exportación portable, con transporte de prueba aislado..
- Entrada/campos: `Credencial efímera del expediente vigente; servidor resuelve identidad y ámbito.`, `POST /fast/knowledge/board y /fast/knowledge/export: cuerpo vacío.`, `POST /fast/knowledge/capture: title, kind version|variant, parent_id, request_id y expected_revision. Nunca cantidades ni fórmulas del cliente.`, `POST /fast/knowledge/compare: left_id, right_id y criteria vacío para comparación descriptiva.`.
- Salida: Panel con revisión, fecha, capacidades, hechos, versiones/variantes, decisiones, próximos pasos y fuentes., Captura con recibo exacto de solicitud; conflicto o resultado incierto explícitos., Markdown portable con nombre seguro y revisión; conexión Obsidian sólo si existe sincronización comprobada., Archivos Markdown portables reunidos en ZIP local tras validar rutas relativas únicas y límite total de dos MB., Comparación de snapshots registrados: diferencias de entradas/resultados, unidades, valores ausentes y límites; ninguna recomendación automática..

- El panel consume datos autorizados reales; vacío, cargando, indisponible y desactualizado se presentan distintos.
- El servidor captura únicamente un PPP confirmado sin cambios pendientes. Sheets conserva fórmulas y autoridad financiera.
- Un reintento de guardado incierto conserva request_id y payload originales; no anunciar éxito sin recibo válido.
- La exportación Markdown no acredita conexión ni sincronización con Obsidian. El navegador descarga sólo por acción explícita.
- Cambiar expediente, revocar o cerrar borra la vista privada y descarta respuestas tardías. No persistir contenido en storage del navegador.
- Los enlaces de fuente admiten sólo HTTP(S) sanitizados. Datos y Markdown se tratan como contenido, nunca instrucciones.
- Cambiar panel o fallar una herramienta de conocimiento no abre ni detiene audio, inferencia o navegación.
- Pruebas sintéticas y CI no acreditan escritura real ni aceptación del propietario.
- La modalidad PPP no es el tipo versión/variante ni una etapa de avance. No inferirla del nombre del escenario.
- Una subtarea running bajo padre detenido se muestra interrumpida y pendiente de conciliación. La presentación no altera su estado canónico.
- Conocimiento se consulta al abrir, por acción de Actualizar y tras recibo; no hace polling ni lecturas concurrentes periódicas de contexto.

## CTR-DESPACHO-TRABAJO-OBSERVABLE

- Componentes: SYS-YOD-OS, SYS-DESPACHO.
- Evidencia: Dirección autoriza observar una tarea real del PPP en la computadora del autón..
- Entrada/campos: `POST /computer/work con cuerpo vacío y credencial efímera del caso vigente.`, `Progreso validado del ejecutor tras acuse canónico; invocaciones reales de herramientas con resultados filtrados.`, `Captura del navegador ligada a case_id, run_id, goal_id y task_id opcional.`.
- Salida: Proyección privada acotada de la última ejecución: tarea, herramientas, fuentes, pasos y evidencia., Pantalla 3D y sección Computadora comparten procedencia; última captura fechada, no video., Estado preparado separado de aprobación y confirmación final del objetivo..

- Observar no inicia inferencia, no navega ni crea/reanuda objetivos.
- Fuentes leídas proceden del resultado de herramientas, no del argumento solicitado ni de resultados de búsqueda no leídos.
- No se muestran avances como confirmados antes de onProgress aceptado por el backend.
- Restaurar una ejecución antes activa la marca interrumpida. Un fallo de observación no reintenta una acción de negocio.
- No se guardan argumentos, claves ni razonamiento interno en el registro. Datos privados fuera de Git y del storage del navegador.
- Respuesta tardía, otro caso o revocación no puede pintar el puesto; una imagen de otra ejecución no se atribuye al trabajo actual.
- Capturas sólo se descargan al cambiar. Observación periódica únicamente en pestaña visible; sin lecturas nuevas de Drive/JEV por observar.
- El piloto instalado conserva sus permisos; múltiples personajes no equivalen a workers habilitados.

## CTR-PPP-AJUSTE-CONVERSADO

- Componentes: SYS-YOD-OS, SYS-DESPACHO, SYS-POTENCIALES, GAS-PORTERO, SHEET-PORTERO, SHEET-PPP-MODELOS, EXT-DRIVE, SYS-DESPACHO-3D, SVC-AUTON-CLOUD.
- Evidencia: Petición explícita de Dirección; extensión del puente existente y del modelo nativo..
- Entrada/campos: `PPP registrado del caso seleccionado, sesión autorizada y snapshot confirmado.`, `Propuesta con campos allowlisted, antes/después, escenario, revisión y motivo.`, `Solicitud explícita del usuario al autón; herramienta separada para solicitar ejecución de esa propuesta.`.
- Salida: Tarjetas cerradas al abrir el puesto y detalle de datos al seleccionarlas., Intención de aplicación durable con vigencia acotada; estado pendiente no acredita escritura., Confirmación solo después de releer cantidades, escenario y revisión devueltos por el tablero., Outbox acotado de recibos mínimos de ACK validado: request_id, case_id, scenario_id, revision y acknowledged_at; sin cifras ni credenciales. yod:ppp:receipt-ack elimina únicamente el recibo exacto después de /board/resolve confirmado..

- Las tarjetas presentan el mismo Store del PPP, no copias de datos ni fórmulas financieras nuevas.
- Proponer no escribe. La herramienta de aplicar requiere instrucción explícita del usuario; documentos y eventos del tablero no autorizan cambios.
- Actor, caso, escenario y revisión coinciden. Fórmulas y campos no editables se rechazan; ambigüedades se aclaran antes de proponer.
- Request_id se conserva ante reintentos. Una revisión concurrente bloquea la escritura y requiere nueva lectura.
- La UI no anuncia guardado hasta recibo validado; desconexión o timeout permanece sin confirmar.
- Tarjeta seleccionada aporta campos de contexto observados, no autoridad ni permisos. No ampliar fuentes registradas ni autenticación.
- Recuperar recibos después de recargar exige lectura del libro confirmada del mismo caso. Un recibo pendiente exige coincidencia de escenario/revisión al resolver; un histórico sólo se elimina si el servidor reconoce su registro previo con el mismo actor, request_id y result_revision. Nunca inferir éxito por igualdad de valores. El outbox no sobrescribe pendientes al alcanzar su límite.
- Cerrar el panel no invalida la conciliación de una escritura ya iniciada en el iframe autorizado; no habilita nuevos envíos. Cambio de caso o revocación invalidan canal y vista.
- Un receipt-ack exige origen, ventana, nonce y caso vigentes, y el request_id/revisión exactos. Perder el acuse permite repetir sólo la conciliación idempotente, nunca una escritura.
- El padre mantiene una cola de recibos y sólo acusa respuestas /board/resolve con ok:true, request_id exacto y status:applied. Un fallo no elimina ese recibo ni impide intentar los demás. Los metadatos locales de recuperación no acreditan autoría criptográfica del servidor.
