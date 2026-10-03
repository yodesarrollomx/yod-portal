# Recomendaciones de Claude · 3-oct-2026

Autor: Claude (Claude Code, sesión en la nube de Alejandro). Para: ChatGPT/Codex y cualquier agente que trabaje en YOD OS.
Propósito: que los dos agentes colaboremos sobre la misma base. Cada punto distingue **comprobado** (lo vi en código, logs o datos), **observado** (lo leí en documentación de otro agente) y **propuesto** (mi recomendación; requiere decisión del propietario).

Este documento es solo de lectura y discusión: no cambia comportamiento. Respeta `AGENTS.md`, `docs/arquitectura/` y el orden de prioridad del propietario: **vender más → margen y control → cobrar antes**.

---

## 0. Cómo coordinarnos (propuesto)

1. **Una sola puerta de entrada.** Hoy los encargos llegan por cuatro vías: chinches (Sheet de la Sala → puente `sala-chinches.yml` → issues 📌 en `sala-edicion`), Bandeja del Despacho (`BANDEJA …` en el Sheet de Operación), issues de GitHub y Corcho. Se pierden cosas: chinches que el puente no convirtió (ver §2.3) e issues cerrados sin comentario. Propuesta: todo encargo vive como **tarjeta del Despacho** con ID estable; la chinche es el atajo para crearla, y el issue es solo su espejo técnico.
2. **Quién toma qué.** Antes de trabajar un encargo, comentarlo en su issue con «tomado por <agente>»; al cerrar, comentar qué cambió, commit y cómo se verificó. Nunca cerrar sin comentario.
3. **Mismas verificaciones.** Seguir los pasos de `AGENTS.md` de cada repo (impacto, pruebas, PR). Claude se compromete a abrir PR en los repos que ya exigen PR (yod-portal, yod-despacho, sala-edicion) y a no empujar directo a `main` en ellos.

---

## 1. Sala de Edición (sala-edicion) · URGENTE

### 1.1 La producción está detenida desde el 2-oct (comprobado)
- Desde la propuesta `CHG-SALA-PUBLICACION-001`, cada proceso (mesa, arranque, chinches, máquinas) guarda vía `nube/publicar_git.py integrar` abriendo un PR y **no monta cartas hasta que el PR se integra con checks obligatorios**.
- Resultado al 3-oct 14:20 UTC: **>30 PRs abiertos (#90–#121), todos `mergeable_state: blocked`**. El único check reportado (`Arquitectura YOD`) sale `success`; falta otro requisito que nunca llega.
- Log del arranque (corrida 37129005760): `No se pudieron comprobar los checks obligatorios. Revisar PR #121. No montar cartas.`
- Los PRs de mesa (#92, #96, #98, #103, #108, #113) contienen **láminas nuevas ya producidas** de piezas aprobadas por el propietario: «Doble vía», «La identidad no se improvisa», «La ruta autónoma», «Qué pasa en la llamada», «La mesa vacía». #92 y #96 traen 32 láminas cada uno y se repiten entre sí.
- Hipótesis a verificar (no comprobada): los PRs creados con `GITHUB_TOKEN` no disparan otros workflows; si la protección de `main` exige un check que solo corre en `pull_request` (p. ej. `verificar.yml`), nunca reportará y el PR queda bloqueado para siempre. También puede faltar una aprobación requerida.

**Propuesto (orden):**
1. Leer la regla exacta de `main` (requiere permiso de admin; la integración de Claude recibe 403 en `branches/main/protection`).
2. Si la causa es la del token: que `publicar_git.py` dispare los checks requeridos por `workflow_dispatch` sobre el SHA del PR, o que use un token de GitHub App para crear el PR.
3. Integrar **solo el PR más reciente por proceso** (los anteriores quedan contenidos o son duplicados), cerrar los demás con comentario «reemplazado por #N», sin borrar ramas hasta confirmar.
4. Agregar alarma: si un PR generado lleva >2 h bloqueado, aviso rojo en Vigía y en el Despacho.

### 1.2 Falsas alarmas en Vigía (comprobado)
- Issue `sala-edicion#3` acumula 93+ comentarios. El arranque reporta «falló» cuando simplemente hay `ideas elegidas sin arrancar: 0`. Propuesto: 0 ideas elegidas = salida 0 con aviso informativo, no 🔴.

### 1.3 Productor sale con código 2 en cada corrida (comprobado)
- Regla del Sheet `productor_ejecuta_etapas = «escena,voz,corte,prospectos»`, pero la nube no ejecuta etapas (no hay GPU en el runner). Propuesto: ajustar esa regla (vía `sala-regla.yml`, que usa la clave del agente) o que el productor la ignore en la nube con aviso, no error.

### 1.4 Cuota de imágenes (comprobado)
- Cloudflare Workers AI gratis: 10,000 neuronas/día → ~7–8 piezas/día con 2 tomas. Cuando se agota (429) quedan láminas «sin tomas». Se renueva 00:00 UTC. Propuesto: bajar a 1 toma por lámina cuando la cola sea grande, o agregar un segundo motor de imagen.

### 1.5 Producción depende de que el propietario elija ideas (comprobado, decisión pendiente)
- El arranque solo produce ideas en estado `elegida`. El semillero propone ideas nuevas cada corrida. Hubo días sin producción por 0 elegidas.
- Propuesto (requiere «sí» explícito del propietario, ya pedido varias veces): regla `arranque_auto_por_corrida` (por defecto 0) que tome N ideas propuestas más antiguas y las mande a la mesa **como propuesta** (no aprueba nada; INVIOLABLE 3 intacto). El propietario lo pidió («5 días de producción constante») pero el cambio quedó bloqueado por permisos de Claude; no está implementado.

### 1.6 El puente de chinches casi no corre (comprobado)
- `sala-cada-hora.yml` depende de crons que GitHub omite con frecuencia; la chinche del PPP (CHN-20260928-1930-abdd) tardó >12 h en volverse issue (#47). Propuesto: además del cron, que el «al-día» dispare `chinches` si la última corrida tiene >60 min, o que el GAS llame `repository_dispatch` al recibir una chinche.

### 1.7 Aprobar en bloque (issue #44, propuesto)
- `nube/sala_cliente.py` prohíbe `accion:'decidir'` al agente (correcto). Propuesto: botón en la mesa «Aprobar las que pasan reglas» que ejecuta el propietario con un toque.

---

## 2. El Despacho (yod-despacho + yod-portal/despacho3d)

### 2.1 Lo bueno (observado)
- Disciplina de evidencia (código / ejecución / declarado / pendiente), atlas, idempotencia, privacidad y pruebas. Bandeja «Listo para tu sí» y Corcho privado (Sala #35) resuelven necesidades reales.

### 2.2 Riesgos (propuesto)
1. **Dependencia de una sola máquina.** El agente piloto y su terminal corren en la Chromebook. Es el mismo punto de falla que la Mac (que ya se perdió). Antes de sumar agentes: mover el worker a la nube (GitHub Actions o sesión remota) con la misma cola durable.
2. **Forma antes que fondo.** 56 avatares, 3D y voz no mueven «vender más». Un solo agente comprobado, ~66 s por turno. Propuesto: aceptar **un agente que cierre una tarea real de punta a punta** (recibir → ejecutar → evidencia → guardar → recuperar) antes de más personajes.
3. **Corcho provisional en el backend del Portero.** Bien documentado como deuda (`CHG-DESPACHO-CORCHO-PROVISIONAL-035`); fijar fecha para moverlo.
4. **Issue #36** (decisión vieja de tareas vencidas) quedó superada por el Despacho nuevo: proponer cerrarla con comentario.

### 2.3 Tres metas medibles para la próxima semana (propuesto)
- Aprobar en un toque (Bandeja + Sala).
- Ver qué hizo cada agente con su evidencia, en una sola vista.
- Agente piloto trabajando en la nube, no en la Chromebook.

---

## 3. PPP Patrimonial (potenciales-yod/patrimonial.html) · hecho por Claude

Comprobado y publicado (commits `10a5776`, `ef164ed`, `52ee507`, `4694f7d`):
- CUS manda: terreno × CUS = m² construidos; − % pasillos = m² rentables; ÷ puertas = tamaño promedio.
- Profundizar: cada puerta Depa o Local con renta propia.
- Mercado de la zona: comparables, $/m² ponderado, supuestos ±10 %, botón «usar renta de mercado».
- KPIs arriba: departamentos, m² promedio, renta por depa, valor por depa.
- **Mismo método que el Excel de Real del Arco (Drive):** inversión por partes ($/m² rentable y no rentable, proyecto, permisos, legales, terreno si no es aportado), valor por m² rentable de la zona (1,444 × $25,000 = $36.1 M), vacancia y OpEx sobre renta bruta (NOI $2,842,560), retorno bruto 11.4 % / 8.8 años, cap implícito 7.9 %. Verificado con Playwright: cuadra con el Excel (diferencia de $798 en inversión por redondeo de $383/m²).
- Versiones guardadas antes conservan su cálculo (campos nuevos en 0).

Pendiente (propuesto): integrar COS 0.8, altura máx. 12 m y 3 niveles del Excel «Marco Díaz» para calcular cuánto cabe en el terreno; escenarios de venta de terreno van en el tablero de venta, no en patrimonial.

> Nota: estos cambios de potenciales-yod se publicaron directo a `main` antes de que existiera el esquema de PR + impacto. Si el atlas debe registrarlos, Claude puede preparar el `architecture-impact.json` correspondiente.

---

## 4. Otros pendientes del propietario
- `board-aurum`: franja «Esta semana» compacta (#34) y errores de datos mostrados como error, no como tarea (#32) — opciones A/B quedaron en los issues (ya cerrados).
- MOAC: resumir y desglosar tareas al capturarlas (#42) — opción A recomendada: propuesta de IA + confirmación en un toque.
- Voz de Gemini (TTS) en la Sala: única mejora del video de Alejavi Rivera que se puede automatizar (API con la llave de Gemini existente); el resto (Google Vids, Flow, Meta Vibes/Muse) son interfaces web sin API gratuita.

---

## 5. Reglas que Claude respeta (para que ChatGPT sepa qué esperar)
- Nunca toca Apps Script, códigos de acceso ni secretos; nunca POST a `/exec` para probar; no borra filas del Sheet.
- No decide por los editores (INVIOLABLE 3): no aprueba piezas.
- No envía correos a terceros sin el clic del propietario.
- Reporta resultados reales («qué llegó a la mesa»), nunca un «ya» sin evidencia.
