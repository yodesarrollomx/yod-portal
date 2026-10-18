# Aceptación previa de Equipo

Preparación local para revisión técnica. La autorización de implementación/publicación
ya existe; no se solicita una nueva aprobación genérica. No hay aceptación productiva.

## Alcance

Entrada explícita `os/?equipo-aceptacion=1#/despacho`, sujeta además a sesión Dirección
confirmada con correo verificado, permiso Despacho y época actual. El parámetro no otorga autoridad.
`os/app.js` monta sólo `despacho3d/equipo-aceptacion.mjs` mediante el host cercado de PR225.
Se reutilizan su transporte y modelo de recibos. No se importa ni monta `equipo.mjs`.
No cambian backend, scopes, credenciales, ACL, fuentes ni el catálogo.

La pantalla permite leer, introducir el ID de una tarea existente y el texto exacto
revisado del paquete privado, y guardar exclusivamente una nota. No crea solicitudes,
reasigna responsables, modifica estados o inventa un ACK. Los insumos privados sólo
entran durante el uso; no se incorporan al repositorio.

Antes del envío conserva en sessionStorage únicamente request_id, task_id y hash del
texto, en una clave aislada por SHA-256 del correo verificado de Dirección. El host
revoca al cambiar sesión/época; una identidad distinta no carga esos IDs. Sin correo
verificado no monta el panel. No copia tokens, correo ni el texto. Una respuesta incierta exige consultar el mismo
recibo. Tras recarga sólo hace lookup, nunca reenvía. Compara ID, tarea, tipo, texto por
hash y metadatos del recibo; el servidor comprueba autoría. Un resultado no encontrado
se informa sin reenviar ni generar otro ID. No hay borrado automático de pendientes.

## Secuencia de aceptación pendiente

1. Dirección abre la entrada acotada en su sesión existente y lee el Buzón.
2. Revisa ID y nota real del paquete privado; guarda una única nota vinculada.
3. Conserva el identificador de recibo; recarga la misma pestaña y comprueba recuperación.
4. Se cotejan nota y recibo en Intercom/Equipo_Recibos, y otro agente registra su ACK real.
5. Sólo con estos comprobantes se integra/activa el compositor general de PR225.

La retención del panel general proviene del paquete de aceptación y su continuidad
registrada, no de una falta de autorización de Alejandro. AGENTS exige propuesta previa,
pruebas y entrega revisable; no impone pedir de nuevo una aprobación rutinaria.
Este paso previo es una propuesta técnica para resolver la dependencia circular entre
interfaz aún no publicada y recibo exigido antes de publicar dicha interfaz.

Rollback: retirar la entrada/panel. Conservar notas, recibos, Buzón y backend.

## Transición preparada para PR225

Después de comprobar la aceptación real, PR225 conserva este módulo, sus pruebas y
el almacenamiento privado, pero sustituye su montaje por el único panel Equipo.
La URL con `?equipo-aceptacion=1#/despacho` abre entonces Equipo; el parámetro ya
no monta el panel previo. No hay dos compositores ni borrado de recibos. Esta
conciliación local no acredita aceptación ni autoriza saltar su comprobación.

## Entrada liviana

El parámetro de aceptación omite exclusivamente la escena iframe y controles 3D.
La sección sigue exigiendo la misma ruta, sesión y permiso; el panel conserva
además Dirección y correo verificado. No concede acceso ni cambia el transporte.
La oficina sin ese parámetro mantiene su escena. Se corrige una dependencia
inútil para esta aceptación; la causa de los timeouts CDP no está demostrada.

En PR225 conciliado, el mismo parámetro conserva la presentación sin iframe,
pero monta sólo Equipo. El botón Equipo abre el diálogo completo; sin parámetro
se mantiene la oficina 3D. No se elimina ni reenvía ninguna nota previa.
