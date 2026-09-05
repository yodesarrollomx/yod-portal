# Plan operativo · MOAC, decisiones, pendientes y el mensaje diario por WhatsApp

> Este documento dice **cómo opera la semana** a partir del lunes 7-sep-2026: quién hace qué, a qué
> hora, desde qué fuente, y qué corre solo. Se escribió el 5-sep-2026 con la evidencia de abajo.
> Lo que no se pudo comprobar está en «Por confirmar», no en el cuerpo.

**Escrito por:** Claude (sesión `claude/moac-operational-plan-v5tkfd`) · **Decide:** Alejandro.

---

## 0 · En qué quedamos (lo que ya estaba decidido, con fecha)

| Fecha | Decisión de Alejandro | Dónde consta |
|---|---|---|
| 16-ago | **MOAC** = Meta → Objetivo → Acción. 5 metas, 26 objetivos, libro vivo en el Sheet `MOAC · Metas, Objetivos y Acciones`. Regla D.2: una tarea entra a la semana **solo si cierra un objetivo**. | pestaña «Método» del Sheet MOAC; `CLAUDE.md` de board-aurum |
| 16-ago | Ritual: **diario** el sapo (la acción que más destraba) · **lunes 60 min** (10 por meta: semáforo de objetivos + qué entra a la semana) · **mensual** meta vs punto de partida · **trimestral** ¿siguen siendo estas 5? | pestaña «Método» del Sheet MOAC |
| 25-ago | Fase 2: el board **lee** el libro MOAC y liga cada tarea a un objetivo (panel MOAC en board-aurum, GAS propio). Convención `X-0` = fuera del MOAC a propósito. | commits `25fa5ed`→`a373eae` de board-aurum |
| 1-ago | **Centro de Decisión v2**: tarjetas del proyecto «Decisiones» (`D-nn`), post-its al entrar, solo Dirección. Opción A = la recomendada; ✓ rápido la acepta. La decisión queda como comentario `✅ DECISIÓN:` y la ejecución como `🤖 Ejecutado:`. | `DecisionCenter` en `src/App.jsx` |
| 27-ago | **El Sheet del board es LA bandeja única de pendientes.** Nada se guarda aparte. | memoria `pendientes-metodo-unificado` |
| 5-ago | **YodBot v1.0 apagado** («voy a analizar qué se puede mejorar y correr otra versión pronto»). Se retomó el 24-ago en modo ligero: solo el cierre de las 18:00 al grupo + resumen privado. | mensaje de Alejandro en el grupo *Au - Tareas Cu*, 5-ago 19:40; bitácora YodBot 24 y 26-ago |
| — (regla de YodBot) | **Invariante 7:** pagos, cobranza y riesgos de conducta van **solo al chat privado de Alejandro**, nunca al grupo. | bitácora YodBot, renglones 28-jul y 29-jul |

## 1 · Estado real hoy (5-sep-2026, leído del Sheet del board y del Sheet MOAC)

| Qué | Cifra | Qué significa |
|---|---|---|
| Tareas abiertas en el board | **53** (32 Pendiente · 17 En proceso · 4 En standby) | 30 son de Alejandro. La Cercada concentra 19, y su GATE del IMPLAN cierra en septiembre. |
| Tarjetas «Decisiones» vivas | **11** (D-07, D-08, D-09, D-11, D-12, D-13, D-14, D-15, D-16, D-18, D-19) | **Las 11 ya tienen `✅ DECISIÓN`** y **ninguna tiene `🤖 Ejecutado`.** Están decididas, pero nadie ha cerrado el ciclo. La más vieja espera desde el 3-jul (D-18). |
| Tareas asignadas a `Claude` | **1** (A-123, cotizaciones de suelos + topografía, Torre Ruiseñor) | En proceso, fecha «Agosto · Esta semana»: vencida. |
| Objetivo C-6 «MOAC operando» | **En proceso**, vence **15-sep-2026** | OKR: 0 tareas de la semana sin objetivo y **4 lunes seguidos revisados**. A-135 (primer lunes MOAC, 24-ago) ya está Terminado: va 1 de 4. |
| Objetivos del MOAC vencidos al día de hoy | D-2 (31-ago), D-4 (31-ago) | Los dos son de La Cercada. El semáforo del panel MOAC ya los pinta en rojo. |
| Evento de calendario para el lunes MOAC | **No existe** (búsqueda en el calendario principal, 5-sep) | El ritual vive en un Sheet, no en la agenda. |
| Rutinas programadas en la nube | 1: «Vigía DNS yodesarrollo.mx» (cada hora) | Nada del MOAC ni del cierre diario estaba programado. |

## 2 · Cómo va a operar (el reloj)

Una sola fuente, tres ritmos, dos canales.

**Fuente:** el Sheet del board (`11SU8pE4…`) para tareas y decisiones; el Sheet MOAC (`1HaUMdoc…`)
para metas y objetivos. Todo lo que se reporta sale de ahí. **Lo que no está en el Sheet no existe.**

### Diario · el cierre de las 18:00 (lunes a viernes) — corre solo
1. **18:00 Hermosillo** una rutina en la nube lee los dos Sheets y arma **dos textos**:
   - **Para el grupo *Au - Tareas Cu*:** un mensaje por persona (Alma, Mariana, Sayri; y los relevos
     Fernando / Miguel / Genaro / PG cuando tengan algo): qué se movió hoy, qué arranca mañana, con qué
     fecha. **Sin dinero ni riesgos** (invariante 7). Máximo ~120 palabras por persona.
   - **Privado para Alejandro:** su sapo de mañana, las decisiones que siguen sin `🤖 Ejecutado` y cuántos
     días llevan, los pagos y riesgos que sí van en privado, y las tareas de Claude.
2. La rutina **manda los dos textos por correo a `direccion@aurumarquitectos.com`** y un aviso al teléfono.
3. **El envío al WhatsApp lo da Alejandro** (copiar y pegar, un minuto) **o la tarea programada de la
   Mac** que ya lo hacía, hasta que exista el canal de WhatsApp de la sección 4.
4. Si un día el Sheet no cambió, el mensaje lo dice («sin movimientos registrados hoy»): **el silencio
   no informa** (regla del Centro de Decisión).

### Semanal · el lunes MOAC (60 minutos) — la agenda llega sola
1. **Lunes 07:00 Hermosillo** una rutina lee los dos Sheets y manda a Alejandro **la agenda de la
   revisión**: por cada meta (10 min), el semáforo de sus objetivos (vencido / ≤14 días / a tiempo),
   las tareas abiertas ligadas, y la lista **«sin objetivo · decidir»** (regla D.2: se le pone objetivo
   o se archiva ese mismo lunes). Cierra con las decisiones sin ejecutar y la **apertura del lunes**
   para el grupo (por persona, lista para pegar).
2. **Alejandro corre la revisión** en el panel MOAC del board (`https://yodesarrollomx.github.io/board-aurum/`):
   cambia estados de objetivos, liga tareas, archiva lo que no sirve a una meta. Se registra en el Sheet.
3. **Evidencia de que el lunes se hizo:** una tarea en el board «Lunes MOAC · <fecha>» marcada Terminado
   (como A-135 el 24-ago). Cuatro seguidas cierran el objetivo C-6.

### Decisiones · el ciclo completo
- **Abrir:** una tarjeta `D-nn` en el proyecto «Decisiones» con `QUIEN:` `PREGUNTA:` `PORQUE:` `RIESGO:`
  `DESDE: AAAA-MM-DD` y opciones `A)`…; la A es la recomendada. Quien la abre: Claude o quien detecte
  que algo espera la palabra de Dirección.
- **Decidir:** Alejandro, en el post-it, con ✓ (acepta A) o escribiendo la decisión. El board deja
  `✅ DECISIÓN:` y pasa la tarjeta a «En proceso».
- **Ejecutar y cerrar:** el responsable ejecuta; se deja `🤖 Ejecutado: …` y la tarjeta pasa a Terminado.
  **Aquí está roto hoy:** 11 tarjetas decididas y 0 ejecutadas. Dos causas: nadie tiene asignada la
  ejecución (todas son de Alejandro), y Claude no puede dejar la marca porque no tiene credencial de
  escritura (pendiente de la sección 5).
- **Regla nueva propuesta:** al decidir, la tarjeta cambia de responsable a **quien ejecuta**, o se abre
  la tarea de ejecución ligada al objetivo. Una decisión sin ejecutor asignado no cuenta como decidida.

### Mensual y trimestral
- **Primer lunes de cada mes** la agenda incluye «meta vs punto de partida» (columnas `punto_de_partida`
  y `valor_hoy` del Sheet MOAC). Alejandro actualiza `valor_hoy` ese día.
- **Primer lunes de octubre, enero, abril y julio:** «¿siguen siendo estas 5?». Se anota en la pestaña
  Método con fecha.

## 3 · Lo que quedó programado hoy (5-sep) desde la nube — creado, pero APAGADO

| Rutina | Cuándo (Hermosillo, UTC-7 sin horario de verano) | Qué hace | Qué NO hace |
|---|---|---|---|
| **Cierre YodBot · 18:00** (`trig_011bAe7ZVsK6rdpcBuNq7ize`) | lunes a viernes 18:00 (`0 1 * * 2-6` UTC) | Lee los dos Sheets, arma el mensaje del grupo y el privado, los manda por correo a Alejandro + aviso al teléfono | No escribe el board, no manda WhatsApp, no lee el chat |
| **Lunes MOAC · 07:00** (`trig_015zRMtskh7WSrq7rbvcDS6j`) | lunes 07:00 (`0 14 * * 1` UTC) | Lee los dos Sheets, manda la agenda de 60 min + la apertura del lunes por persona | Lo mismo |

**Por qué están apagadas:** una rutina creada desde Claude Code **no puede llevar conectores** en esta
organización (la API lo rechazó: «connectors parameter is not available»), y sin Google Drive ni Gmail
la sesión que dispara no puede leer los Sheets ni mandar el correo. Se dejaron creadas con el prompt
completo y deshabilitadas para que no generen corridas fallidas. Los prompts, palabra por palabra,
están en [`rutinas/`](rutinas/README.md). **Encenderlas es el clic 0 de la sección 4.**

Cuando corran: sesión nueva cada vez, solo Drive y Gmail. **Si alguna falla dos días seguidos, ese es
el aviso: no hay que esperar a que alguien lo note.**

## 4 · Lo que sigue en manos de Alejandro (sin esto no es reloj, es alarma)

| # | Clic | Por qué | Evidencia para cerrarlo |
|---|---|---|---|
| 0 | **Encender las dos rutinas con conectores:** en claude.ai → Rutinas, abrir «Cierre YodBot · 18:00» y «Lunes MOAC · 07:00», agregarles **Google Drive** y **Gmail**, y activarlas (o crearlas de nuevo desde ahí pegando los prompts de `docs/rutinas/`) | Desde Claude Code no se pueden adjuntar conectores; desde la interfaz sí (la rutina «Vigía DNS» se creó así y los trae) | El primer correo «YodBot · Cierre <fecha>» en la bandeja, mandado por la rutina |
| 1 | **Canal de WhatsApp:** conectar en Zapier «WhatsApp Business» (o «WhatsApp Notifications») con la cuenta desde la que hoy escribe YodBot | Desde la nube no hay WhatsApp. Con el canal, las dos rutinas mandan directo al grupo y al privado, sin copiar y pegar | Un mensaje de prueba «YodBot: prueba de canal» recibido en el grupo, mandado por la rutina |
| 2 | **Credencial de servicio de 90 días para Claude** en el Portero (fila de Accesos con `TA`) | Sin ella Claude no puede dejar `🤖 Ejecutado`, ni crear tarjetas D-nn, ni cerrar A-123 | Un comentario `🤖 Ejecutado` puesto por la rutina, no a mano |
| 3 | **Desactivar `board-aurum-whatsapp-sync-ligero` en la Mac** (o dejarla solo como el brazo que envía) | Para que no haya dos cierres de las 18:00 distintos | La UI de tareas programadas mostrando el cambio |
| 4 | **Ejecutar o reasignar las 11 decisiones decididas** (D-07…D-19): quién ejecuta cada una | Hoy las 11 están en Alejandro; decididas sin ejecutor es la «decisión zombi» que la auditoría de julio ya cazó | Cada tarjeta con `🤖 Ejecutado` o con responsable ≠ Alejandro |
| 5 | Poner el **evento recurrente «Lunes MOAC» en el calendario** (lunes 07:30–08:30) | El ritual tiene que ocupar agenda, no solo Sheet | El evento en el calendario principal |
| 6 | Los cuatro clics de backend de [`BACKENDS-PENDIENTES.md`](BACKENDS-PENDIENTES.md) que sigan abiertos | Son de otros tableros, pero el catálogo lento (tema 12) afecta cómo entra Alejandro cada mañana | Ver ese archivo |

## 5 · Qué NO se va a hacer (a propósito)
- **No se escribe el board por POST desde la nube** sin credencial (regla del repo: no hay POST «para probar»).
- **No se manda nada al grupo con dinero o riesgos.** Eso va al privado (invariante 7).
- **No se vuelve a las 4 franjas de YodBot v1** (08/11/13/18). Fallaban una de cada tres corridas
  (bitácora: huecos del 7-jul, 15-jul, 23-27-jul, 2-23-ago). Una franja fiable vale más que cuatro
  intermitentes. Si Alejandro quiere la apertura de las 08:00 además del cierre, se agrega una rutina más.
- **No se lee el chat de WhatsApp para armar el reporte.** La fuente es el Sheet. Lo que el equipo diga
  por chat y no esté en el board, no se reporta: esa es la forma de que el board se llene.

## Por confirmar (NO afirmar sin respuesta de Alejandro)
- ¿La tarea programada de la Mac (`board-aurum-whatsapp-sync-ligero`) sigue corriendo hoy? La bitácora
  de YodBot no tiene renglones después del 26-ago.
- ¿La cuenta de WhatsApp que manda como «YodBot» es la personal de Alejandro? Si sí, el canal de Zapier
  necesitaría WhatsApp Business con un número aparte; decide él.
- ¿A-123 (cotizaciones de suelos y topografía) ya se mandó fuera del board? Sigue «En proceso» con fecha de agosto.
