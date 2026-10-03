# Entrada EMD en GitHub

Destino canónico: https://yodesarrollomx.github.io/yod-portal/emd/.
Wrapper público; no contiene preguntas, frontend privado, registros ni backend.
El endpoint existente se publica por autorización expresa. La evaluación completa
permanece en Google HTMLService y conserva `google.script.run`.

## Contrato con el portal privado

- Canal `emd-github-v1`; nonce criptográfico nuevo de 16 bytes, 32 caracteres hex.
- Iframe al endpoint existente con solo `?embed=1&nonce=<nonce>`, sin fragmento.
- El hijo envía `{channel, nonce, type:'ready'}` a `window.top` con targetOrigin
  `https://yodesarrollomx.github.io`.
- El padre acepta solo `https://script.google.com` o un host que cumpla
  `/^https:\/\/[A-Za-z0-9-]+\.googleusercontent\.com$/`, con nonce coincidente.
  El primer ready fija `event.source` y `event.origin`, incluido el hijo anidado GAS.
- El padre envía una sola vez `{channel, nonce, type:'access', fragment:location.hash}`
  exclusivamente a la ventana y origen fijados. Nunca usa `*`.
- El hijo debe comprobar origen `https://yodesarrollomx.github.io`,
  `event.source === window.top`, canal y nonce antes de aceptar acceso. Solo entonces
  inicia el portal y responde `{channel, nonce, type:'authorized'}` al padre.
  El padre revela el iframe únicamente tras ese ACK desde la fuente y origen fijados.
- Fragmento permitido: vacío o exactamente `#token=` / `#reviewer=` seguido de
  40..200 caracteres ASCII alfanuméricos o guiones. Vacío debe mostrar la entrada
  sin realizar RPC anónimos; esa garantía corresponde al arranque del hijo privado.
- El fragmento permanece en la URL padre para recarga. Cualquier query padre o
  fragmento inválido impide cargar el iframe. Cambiar el hash detiene la sesión.
- Timeout de 35 segundos retira el iframe y ofrece reintento manual con otro nonce.
  No hay reintento automático de conexión ni de escrituras desde este wrapper.

## Revisión e integración

Pruebas sintéticas: `node --test emd/protocol.test.cjs`. No contactan Google.
El agente principal verifica el arranque privado y hace E2E de navegador; estas
pruebas no acreditan backend desplegado, autorización de negocio ni producción.
Referencia de arquitectura: `CHG-EMD-GITHUB-009`, propuesta integrada en
`38ea095dfd0f706667ece2a4fcdc4240251cea58`, revisión
`2026-10-02.38-emd-github-embed-propuesta`.
Atlas/impacto se coordinan en el árbol separado de Linnaeus; esta rama solo toca `emd/`.

Sin compilación: Pages sirve estos archivos directamente desde `main` raíz usando
el workflow existente `pages-build-deployment`. No cambiar configuración de Pages.
Integrar solamente después de revisión del agente principal y pruebas coordinadas.
Reversión del wrapper: retirar/revertir solo `emd/`; conservar las evaluaciones,
el endpoint Google y los cambios de arquitectura de otros agentes.
