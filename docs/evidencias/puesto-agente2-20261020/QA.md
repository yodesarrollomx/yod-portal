# Puesto del agente 2.0 — evidencia de interfaz

Fecha: 2026-10-20. Piloto de interfaz: Ruiseñor.

Publicación: https://yodesarrollomx.github.io/yod-portal/os/#/despacho

Código publicado: `a5a8301390883b3600912e2cad8565930ab1b10f`.
PR: [297](https://github.com/yodesarrollomx/yod-portal/pull/297), [298](https://github.com/yodesarrollomx/yod-portal/pull/298), [299](https://github.com/yodesarrollomx/yod-portal/pull/299).
Pages: [ejecución 39479969553](https://github.com/yodesarrollomx/yod-portal/actions/runs/39479969553), completada con éxito para ese commit. Recursos finales HTTP 200, coincidentes con el árbol probado.

## Qué prueban estas capturas

Recorrido en Chromium mediante fixture publicada que importa el adaptador y los estilos reales del puesto. Todos los datos, avatar, historial, workspace, envío y micrófono de esta fixture son sintéticos. CSP bloquea conexiones, medios y envío de formularios; contadores verificaron red 0 durante el recorrido. No se abrió el PPP real ni se llamó a servicios de negocio o de audio.

Estas capturas comprueban distribución y navegación de la interfaz. No prueban una sesión autenticada completa, proveedor de voz, lectura real del PPP, animación del avatar o persistencia después de recargar.

| Captura | Ventana CSS medida | Estado |
|---|---|---|
| puesto2-desktop.png | 1280 × 900 | Reposo; mic 0, envíos 0, red 0 |
| puesto2-mobile.png | 390 × 843 | Reposo; mic 0, envíos 0, red 0 |

El navegador tenía zoom 80%; las imágenes físicas son 1024 × 720 y 312 × 675. Las dimensiones CSS se midieron en el DOM, no se dedujeron de la imagen.

## Comprobaciones finales

- En móvil, compositor y avatar visibles; compositor al fondo del diálogo (843.73 px), sin desbordamiento horizontal. En escritorio: fondo del compositor 890.72 px y del diálogo 891.97 px, diferencia del borde.
- Plan completo, Trabajo y Expediente abren su vista; avatar y conversación se conservan. Regreso a conversación correcto.
- Envío sintético: un envío sólo tras pulsar Enviar. Micrófono simulado: una activación sólo tras el toque explícito, nunca al entrar. Red 0.
- Vista clásica con `?puesto=clasico`: árbol y manejadores originales restaurados; borrador conservado; un único botón de envío; sin contenedor de Puesto2.
- Otro agente: piloto desactivado. Retirar acceso desde Ruiseñor: sin piloto ni cifras anteriores; mic 0, envíos 0, red 0.
- Suite local: 867/867 pruebas. Arquitectura, OS, portal, accesos, obra e impacto: correctos. CI requerido correcto antes de cada integración. La primera PR también completó la regresión Chromium/WebKit.

La revisión visual detectó y corrigió dos errores reales: distribución de `details` y precedencia del CSS móvil. Las capturas corresponden a la versión corregida `puesto2fix2`.

## Límite funcional

Esta entrega cambia la interfaz y conserva el contrato de datos y seguridad. La entrada muestra el avatar existente con acercamiento y mantiene su presencia al consultar el plan. El micrófono requiere un toque explícito.

Cambiar «20 a 17 departamentos» mediante voz y ver al agente operar el PPP requiere un contrato de navegación y edición que la conexión vertical actual no expone. No se implementó ni se simuló como capacidad real. Tampoco se introdujo un nuevo caché duradero: se reutiliza el estado disponible del sistema existente.

No se modificaron el plano del Despacho, Render, Apps Script ni Sheets de negocio. El Buzón de coordinación sí se actualizó por encargo expreso.
