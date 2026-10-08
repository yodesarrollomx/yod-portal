# Preparación de varios autónomos y versiones del mismo PPP

Dirección autoriza preparar los primeros proyectos seleccionados en el registro privado. Sustituye la exclusión anterior del proyecto incorporado por su decisión del 7 de octubre. Las identidades y datos comerciales permanecen fuera del portal público.

## Cambios implementados

- `listAuthorized({})` y `resolveCurrent({case_id?})` atraviesan el transporte existente. Sin selector se conserva el piloto. El servidor debe autorizar cada selección; el catálogo no otorga permisos.
- Catálogo privado en memoria, revalidación por selección, caducidad, limpieza por pérdida de autorización y rechazo de respuestas tardías. El cambio de caso se impide durante conversación de voz o puesto abierto.
- `AUTONES_MULTIPLES=false` mantiene desactivada la nueva interfaz. Cuando el backend esté instalado, el selector y las figuras usan exclusivamente perfiles autorizados. Los puestos proceden de las seis mesas existentes, con la navegación y renderer originales.
- El descriptor privado distingue el ID canónico del agente y `board_case_id` usado por `?open=`. Nunca derivarlo de un nombre o alias.
- Se abre el tablero original, con sus versiones y comparador. El puente de observación en Macro Lotes y Vertical distingue versión defendida y consultada. Las propuestas de escritura del autón quedan bloqueadas en esos dos modelos; el puente nativo de Patrimonial sigue igual.
- La política de última inscrita usa el orden de registro de escenarios guardados: los datos históricos no tienen fecha individual fiable. El alta privada debe fijar el ID elegido; navegar por versiones no cambia la defensa. No inventar fechas de alta. La versión congelada conserva su ID y bloqueo.

## Contrato coordinado

`ppp:{case_id,board_case_id,url,scenario_id}` procede de la resolución autenticada. El handshake comunica ambos IDs y el escenario defendido. El puente valida origen, parent, nonce y correspondencia con el caso efectivamente cargado. Una copia local no restaura autoridad.

`version_context` comunica `defended_scenario_id`, `viewed_scenario_id`, catálogo de versiones y `read_only:true`. Macro Lotes envía solo cantidades guardadas, sin etiquetar sus resultados locales como cálculo de Sheets. Vertical puede enviar resultados del modelo nativo recibido. El motor valida y conserva estas diferencias.

## Entrega y límites

Código preparado y pruebas sintéticas no equivalen a activación. Falta integrar el núcleo del registro con el Code.gs vivo y sus ACL, completar los IDs/datos del alta, asignar workers distintos y fijar versiones, antes del clic de publicación/activación de Dirección. No se modifican ACL, documentos de negocio ni versiones de Sheets en estas pruebas.

La preparación del paso de varios autónomos no cierra conversación fiable, PPP compartido ni aceptación del piloto. Probar dos casos antes de ampliar. Cambiar la figura no acredita ejecución simultánea.

Edición automática futura: usar el contrato nativo por modelo con control de revisión, recibos durables y bloqueo de versiones congeladas. No envolver el guardado completo legacy para aparentar una edición segura.

Reversión: apagar `AUTONES_MULTIPLES`, revertir los PR y conservar estado, IDs, conversaciones y versiones. Motor y Portero se entregan por separado en el repositorio privado.

## Continuidad y alta adicional · 8 de octubre

Dirección autoriza libros operativos, conexión y activación de los casos seleccionados en la misma oficina. El expediente conserva case_id, memoria y personaje al pasar de PPP a proyecto; la etapa cambia de forma explícita, sin asumir contratación ni conceder facultades nuevas. Las fichas y cuatro libros operativos viven en almacenamiento privado.

Patrimonial legacy agrega observación de versiones guardadas. Su puente se desmonta al abrir un modelo nativo, cuyo contrato de edición permanece intacto. Las cantidades observadas no se presentan como resultados calculados en Sheets. El catálogo conserva figuras durante el refresco de una autorización vigente; error, caducidad o revocación las retira.

La conexión productiva, credenciales independientes, publicación del Portero y validación de cada motor siguen pendientes. No se certifica trabajo autónomo por animar una figura.

## Activación de presencia · 8 de octubre

Los workers privados fueron emparejados y las lecturas firmadas confirmaron el expediente de cada credencial. El motor con varios casos está desplegado. Este cambio enciende AUTONES_MULTIPLES y conserva la oficina existente: las figuras sólo provienen del catálogo autorizado, se interactúa directamente con ellas y no se añade un selector flotante.

Cada figura puede recorrer rutas existentes y volver a su puesto. Es movimiento visual, no evidencia de haber terminado tareas. Los recorridos se pausan al interactuar, ocultar la página o pedir movimiento reducido. Los objetivos y resultados siguen en los libros operativos privados. La aceptación productiva de voz y experiencia completa continúa separada de las pruebas sintéticas.
