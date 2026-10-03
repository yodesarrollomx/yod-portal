# EMD #9 · cuestionario completo bajo dirección GitHub

Registro: `CHG-EMD-GITHUB-009`. Contrato: `CTR-EMD-GITHUB-EMBED`.
Estado: **propuesto; registrado localmente antes de implementación**.
Origen autorizado: `https://yodesarrollomx.github.io` (comparación exacta).
Ruta canónica autorizada: `https://yodesarrollomx.github.io/yod-portal/emd/`.
Hosting: yod-portal público, Pages desde main/raíz confirmado por el propietario.
Componentes: `SYS-EMD`, `GAS-EMD`, `SHEET-EMD`; `SYS-YOD-OS`
participa por el atlas y por publicación del wrapper mínimo en `emd/`.
Popper implementa solo `emd/` en rama aislada y PR separado; esta rama no toca esa ruta.

## Alcance y relación con propuestas anteriores

La autorización exige recorrer el cuestionario real completo conservando la
URL GitHub en la barra del navegador. Una página pública mínima contiene a
pantalla completa la aplicación Google HTMLService existente. Preguntas,
identidad, respuestas y lógica privada se sirven desde Google a participantes
autorizados; no se copian al repositorio público. No sustituir el cuestionario
por una muestra, copia estática o redirección.

Este contrato reemplaza la alternativa de redirección de
`CTR-EMD-ENTRADA-CORPORATIVA` únicamente para la entrega #9 bajo GitHub.
Conservar ese registro histórico; no presentarlo como solución de esta entrega.
No se altera la captura aprobada en `CTR-EMD-ESCALA-CAPTURA`, recuperación local,
invitaciones, roles, asignaciones ni reglas de evaluación.

## Distribución y fronteras

1. Wrapper público: contenedor responsive, estado de conexión neutro y puente
   mínimo. Rechaza ejecutarse en un frame (`window.self !== window.top`) antes
   de crear el iframe o procesar el fragmento. Sin shell OS, preguntas, fuentes
   privadas, analytics, logs de mensajes, datos ni credenciales estáticas.
2. `doGet` existente: entrada normal mantiene `XFrameOptionsMode.DEFAULT` y
   su arranque actual. Solo el selector explícito de embed habilita una salida
   separada enmarcable; no cambiar el modo global ni otros endpoints. Selector
   ausente, inválido o ambiguo conserva entrada normal o error cerrado.
3. Salida embed: invisible y sin iniciar acceso, RPC, carga de respuestas,
   recuperación de borradores ni manejadores de interacción hasta verificar
   el handshake. Un querystring embed no concede confianza ni autorización.
4. HTMLService conserva `google.script.run`; backend conserva tokens, ACL,
   revisión/CAS, idempotencia, cierre y Sheets. El wrapper no implementa proxy
   RPC ni lee/resume respuestas. No nuevas hojas, scopes o permisos.

Google solo ofrece DEFAULT o ALLOWALL para esta propiedad: ALLOWALL no fija
un origen permitido; el modo embed exige protección propia antes del arranque.
Referencia: [XFrameOptionsMode](https://developers.google.com/apps-script/reference/html/x-frame-options-mode).
HTMLService añade frames sandbox: [restricciones oficiales](https://developers.google.com/apps-script/guides/html/restrictions).
La topología y el origen Google efectivo deben comprobarse en navegador; no
suponer que la ventana que emite ready es `iframe.contentWindow` externo.

## Contrato de handshake antes de portalboot

Protocolo versionado con estados bloqueado → challenge → ready validado →
canal confirmado → arranque único. Nombre exacto de eventos y límites de
payload deben fijarse en la implementación privada y sus pruebas.

- Nonce criptográfico fresco por montaje/sesión; limitado, de un solo uso,
  con tiempo de espera y descartado al recargar, navegar, desmontar o fallar.
  No usar Math.random, constantes, identidad, token ni fragmento como nonce.
  Nonce es correlación; no reemplaza autenticación de persona en el backend.
- El cliente embed comunica exclusivamente con `window.top`. Acepta solo
  `event.origin === "https://yodesarrollomx.github.io"` y
  `event.source === window.top`; rechaza top igual a self. No confiar en
  document.referrer, origen declarado en payload, querystring o parent Google.
- El wrapper usa un destino Google fijo de la implementación existente, sin
  credencial en src/query. La implementación debe acreditar y fijar el origen
  Google exacto del cliente HTMLService y la ventana emisora de su frame activo.
  No confiar en sufijos google.com/googleusercontent.com, regex abiertos,
  `origin === "null"`, el primer mensaje recibido o cualquier iframe vecino.
- El challenge no contiene credenciales. Con frames Google intermedios,
  demostrar cómo se vincula ready al montaje activo y al nonce fresco antes
  de aceptar la ventana emisora. Documentar el transporte exacto; no debilitar
  las comprobaciones para hacer pasar la topología real.
- Validar tipo/version, esquema acotado, nonce pendiente y estado permitido
  en ambos extremos. Rechazar ready espontáneo, duplicado, expirado, de otro
  frame, montaje o sesión. Fijar origen y ventana del canal confirmado;
  emitir mensajes con targetOrigin exacto, nunca `*`, especialmente con token.
- Solo después de validar ready y confirmación del canal puede transferirse
  el fragmento personal existente, en memoria, al cliente autorizado. Validar
  formato sin emitir, canjear de otra forma o regenerar enlaces. Limpiar el
  fragmento de la URL del wrapper mediante replaceState una vez capturado;
  no copiarlo a consultas, iframe.src, almacenamiento, telemetría o mensajes
  de error. No transferir respuestas al wrapper.
- El cliente embed valida el mensaje de acceso del top/origen/nonce vigentes
  y arranca una sola vez con el flujo de token existente. Cualquier timeout,
  origen/ventana/nonce inválido deja la aplicación oculta y sin RPC; muestra
  solo error neutro. Recarga o cambio de sesión invalida callbacks tardíos.

El origen GitHub es compartido entre repositorios de la cuenta: postMessage
no autentica una ruta. La ruta final identifica hosting y evidencia, sin
pretender que una comparación de pathname refuerza la frontera de origen.

## Aceptación pendiente de implementación privada

| Caso sintético | Resultado exigido |
|---|---|
| doGet normal, selector ausente/incorrecto | DEFAULT y comportamiento normal conservados; sin ALLOWALL global |
| Embed abierto directamente, padre ajeno o wrapper enmarcado | Oculto; no portalboot, acceso, RPC ni lectura de borradores |
| Origen parecido, puerto distinto, null, parent intermedio, source ajeno | Rechazo antes de acceso |
| Nonce inválido/viejo/repetido, ready fuera de orden o payload extra | Rechazo; ninguna credencial transferida |
| Cadena real de frames HTMLService y ready válido | Ventana/origen Google exactos vinculados al montaje; top GitHub autenticado |
| Frame reemplazado, recarga, timeout, cambio de sesión, callback tardío | Invalidar canal y nonce; nunca reactivar sesión anterior |
| Fragmento válido o malformado | Canal confirmado antes de transferir; backend valida token; sin token en src/query/logs/storage |
| Cuestionario completo móvil/escritorio/teclado | Aplicación real fullscreen; dirección GitHub persistente; foco y errores accesibles |
| Guardado, reapertura y cierre sintéticos | RPC, ACL, CAS, reintento exacto y cierre actuales; ninguna escritura de prueba humana |
| Conflicto, caída de red y ACK perdido | Confirmación autoritativa; no duplicar mutación ni declarar cierre por eco visual |
| Inspección de archivos públicos | Solo wrapper neutro; sin preguntas, código privado, identidad, datos ni secretos |

Estas filas son criterios pendientes, no resultados observados. La revisión
del atlas no acredita que el modo embed o el hosting estén implementados.

## Archivos y validadores para el agente principal

Propuesta canónica: `docs/arquitectura/emd-github-embed.md`.
Registro: `docs/arquitectura/modelo.json` → changes y data_contracts;
manifest de impacto: `architecture-impact.json` con la misma model_revision.
Vistas: regenerar con `node scripts/arquitectura.cjs`; no editarlas a mano.
Antes del PR documental ejecutar:

```sh
node scripts/arquitectura.cjs --check
node --test tests/*.cjs
node verify-os.cjs
node verify-portal.cjs
ACCESOS_REF=3ee8ca50bf14ef17d95e72523e54506eb996f262 node verify-accesos.cjs
node verify-obra-app.cjs
git diff --check
BASE_SHA=<base-completo> HEAD_SHA=<head-completo> node scripts/verificar-impacto.cjs
```

El agente principal mantiene fuente EMD, pruebas sintéticas y despliegue GAS.
Cada manifest consumidor debe referenciar CHG-EMD-GITHUB-009, contrato,
revisión/commit integrado del atlas, IDs afectados y rollback. Concretar ruta,
repo, protocolo, ventana/origen Google y evidencia privada de pruebas antes
de publicar. No publicar endpoints completos GAS ni IDs privados en el atlas.

## Integración, evidencia y reversión

Registro local previo permite iniciar implementación aislada. Ruta final recibida y coordinación de ramas confirmada por el propietario;
preparar e integrar el PR documental tras checks. Rebasar sobre origin/main y conservar aportes concurrentes;
registrar SYS-YOD-OS como publicador y conexión propuesta del wrapper, con
ownership de emd/. Hosting confirmado no acredita wrapper desplegado.

Con la ruta concreta confirmada, después de checks preparar PR documental y manifests
coordinados; PR/merge están autorizados. Integrar atlas y fijar su commit en
el manifest EMD antes de publicar. Registrar por separado código integrado,
Pages publicado, versión GAS y recorrido comprobado. #9 permanece abierta
hasta acreditar cuestionario completo y URL GitHub publicada.

Actualizar la implementación GAS existente con respaldo privado y evidencia
de compatibilidad antes de servir el wrapper. Verificación publicada sin leer
respuestas humanas ni realizar escrituras de prueba en producción.
Rollback: retirar/desactivar wrapper y restaurar versión GAS respaldada solo
si mantiene los guards vigentes, incluida escala #39. La versión previa citada
por el plan privado requiere comprobar esa compatibilidad; no asumirla. Entrada
normal y enlaces existentes conservados. Revertir atlas por PR regenerando
vistas, sin eliminar aportes concurrentes. No tocar Sheets ni datos históricos.
