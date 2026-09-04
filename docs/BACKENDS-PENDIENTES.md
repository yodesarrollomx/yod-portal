# Los cuatro clics que solo puede dar Alejandro

> **Por qué solo tú.** Google no deja publicar un Apps Script a nadie fuera del dominio dueño:
> la API contesta *«Only users in the same domain as the script owner may deploy this script»*.
> Puedo escribir el código y dejar la versión hecha; el botón de Implementar es tuyo.
> Y tres de estos scripts ni siquiera puedo abrirlos: no están compartidos, y el conector de
> Drive tampoco tiene permiso para compartirlos por mí (lo intenté el 4-sep-2026).

Actualizado: **4 de septiembre de 2026**.

---

## 1 · Portero — YA ESTÁ ESCRITO, solo falta publicar (2 minutos)

**Qué arregla:** las dos cosas que decidiste hoy.

- **`TA` nombraba dos tableros distintos.** El código del track salía de la inicial (`'T'+'A'`),
  así que coincidía con el de Operación semanal: quien recibía MOAC se llevaba de pilón el
  expediente de Casa Alysa. Ahora cada track tiene su código propio, tomado del vocabulario que
  ya estaba escrito en el mismo archivo: **AL** (Alysa), **TM** (María), **TC** (Codesarrollos).
  Un track que no esté en el mapa sigue derivando como antes, para no romper ninguno nuevo.
- **Una fila de Accesos a medio llenar abría todo.** El Portero leía `boards` en blanco como `*`
  mientras el tablero lo leía como «nada». Ahora blanco = sin acceso; para abrir todo hay que
  escribir `*` a propósito. El mismo criterio quedó en la copia rápida del canje.

**Ya hice lo que no te toca:** antes de tocar el código le agregué `AL` a las cuatro cuentas que
hoy tienen `TA` (Mariana, Alma, Sayri y tu cuenta personal), **para que nadie pierda el acceso que
ya tenía**. Al publicar, todo sigue funcionando igual; lo que cambia es que a partir de ahora
puedes dar MOAC sin regalar Casa Alysa.

**El clic:**
1. Abre https://script.google.com/d/115k1wTxnEdPaPyAVqDo9-N2mAhS5d50eoQT9W83nxrXe99EfPhwpC_dw/edit
2. Implementar → Administrar implementaciones → lápiz de la implementación activa
3. Versión: **47 · «AL/TM/TC: cada track su código + boards en blanco = sin acceso»** → Implementar

La dirección no cambia. Si algo se ve raro, se vuelve atrás eligiendo la versión 46.

---

## 2 · CroKiss — cambiar una línea (1 minuto)

**Qué arregla:** el backend todavía arma sus ligas con la dirección vieja. El repo ya está
corregido (commit `6779c77`), pero el código que corre es el que está pegado en el editor.

**No puedo hacerlo yo:** ese Apps Script no aparece en tu Drive de trabajo ni está compartido con
la cuenta que opera desde la Mac, así que no tengo por dónde entrar.

**El clic:** abre el Apps Script de CroKiss y en `Code.gs` cambia

```
SITE_BASE: 'https://alexpueblag.github.io/crokiss/',
```
por
```
SITE_BASE: 'https://yodesarrollomx.github.io/crokiss/',
```

Luego Implementar → Administrar implementaciones → lápiz → **Versión nueva** → Implementar.
**Nunca «Nueva implementación»:** cambiaría la dirección y rompería las ligas ya enviadas.

*Si me compartes ese script (o me pasas su identificador, que sale en ⚙️ Configuración del editor),
la próxima vez lo dejo escrito yo.*

---

## 3 · Catálogo del portal — el Sheet dejó de mandar (2 minutos)

**Qué pasa:** hoy corregí las 10 filas del Control Maestro a la casa nueva. Pero ese Apps Script
solo deja pasar direcciones que empiecen con la casa vieja (`allowedPublicUrl_` compara contra una
lista fija), así que ahora entrega la dirección **vacía**.

**No se rompe nada:** la pantalla cae a su destino canónico, que ya es el nuevo — lo verifiqué.
Lo que se perdió es que el Sheet mande: si mañana cambias una dirección ahí, no se va a ver.

**El clic:** en el Apps Script «YOD OS Backend Seguro»
(`1gsz-mY2hDt4OCXuMvf-j6LZmDVsD1K5iD1W3MC3D9zHepwYr4hl23Ap3`), en el bloque
`PUBLIC_PORTAL_DESTINATIONS` (y en el mapa hermano de destinos), cambia cada
`https://alexpueblag.github.io/` por `https://yodesarrollomx.github.io/`. Son sustituciones de
texto, una por línea, sin tocar nada más. Luego versión nueva sobre la implementación existente.

**Comprobación:** después de publicar, esta liga debe traer la dirección nueva dentro de `url`:
`?action=read&resource=Portal` del mismo `/exec`.

---

## 4 · Motor de obra — que la firma salga de la credencial (10 minutos)

**Qué arregla:** la pantalla ya hace lo correcto — el nombre sale del canje del Portero y sin
nombre no se puede firmar (`obra.html`, «Tu sesión no trae nombre en Roles: no puedes firmar»).
El backend, en cambio, sigue creyendo el nombre que le llega en el mensaje: quien sepa armar la
petición puede firmar como cualquiera.

**No puedo hacerlo yo:** el script «YOD · OBRA — Casa Alysa» no está compartido y el conector de
Drive no tiene permiso para compartirlo.

**El cambio, en palabras:** en cada acción que escribe (capturar avance, verificar, autorizar,
cerrar), **ignora** el campo con el nombre que viene en el cuerpo y resuélvelo del lado del
servidor a partir de la credencial `k`, con el mismo canje que ya usa para validar:

```js
// arriba, junto a las demás constantes
var PORTERO = 'https://script.google.com/macros/s/AKfycbwlDDCWWzOWYZsUpBU9uqsQ7aenQ469PF6s6FkNlBFS1_cJSU5njG9oQmuyELy5zlqzFg/exec';

function quienFirma_(k) {                       // el servidor decide quién eres, no el mensaje
  var r = UrlFetchApp.fetch(PORTERO + '?recurso=canje&t=' + encodeURIComponent(k),
                            { muteHttpExceptions: true });
  var j = JSON.parse(r.getContentText());
  if (!j || !j.ok || !j.nombre) throw new Error('sin_identidad');   // sin nombre no se firma
  return { nombre: j.nombre, correo: j.correo || '', rol: j.rol || 'vista' };
}
```

y en cada escritura, sustituir `d.persona` / `d.quien` por `quienFirma_(d.k).nombre`.
Si el canje no trae nombre, la escritura se rechaza — es exactamente lo que ya dice la pantalla.

**Comprobación:** mandar una escritura con un nombre inventado en el cuerpo debe quedar
registrada con **el nombre real de la sesión**, no con el inventado.

---

## Lo que ya quedó cerrado sin ti

- **Dominio propio:** se queda como está hasta que exista el DNS. Decisión tuya, 4-sep.
- **Obra San Francisco:** se queda fuera de la organización. Decisión tuya, 4-sep.
- **La Sala arranca en «editor»:** se queda. Tu razón: el acceso ya lo filtra YOD OS —
  quien no lo tenga seleccionado no la ve. Decisión tuya, 4-sep.
