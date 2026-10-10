# Paso 5 · Voz bajo demanda

Estado: implementado y probado localmente; pendiente de revisión. Sin integración ni despliegue.

El expediente queda una vez al final de las instrucciones de Responses; las reglas estables conservan el prefijo. No se repite por thinking.append.

Inactividad propuesta: YOD_VOICE_IDLE_SECONDS=60 (rango 15–600). El servidor cierra sólo con telemetría acústica reciente de ambos lados, reproducción drenada y sin respuestas/herramientas pendientes. Silenciar no congela el reloj. Un objetivo en cola o ejecutándose continúa por su motor y se anuncia en el puesto al cambiar de estado.

Al cerrar se conservan texto, revisión, contexto y recibos de tareas en el diario privado por caso y actor. Al pulsar Hablar se crea una sesión nueva con historia textual acotada (128 mensajes, presupuesto conservador menor de 8192 tokens); nunca se restaura autoridad de ese historial. El micrófono espera session.started. Acercarse al puesto no crea sesiones.

store:false explícito. La selección de transporte fork se prepara como interfaz deshabilitada por constante; no se guardan grabaciones ni se habilita por navegador. Activarla requiere decisión posterior de Alejandro.

Bitácora: usage.seconds acumulativo del proveedor por sesión, motivo de cierre aplicativo y motivo del proveedor; la duración de pared permanece separada. Sin transcripción ni expediente en JSONL de consumo.

Pruebas: dobles sin red externa, medición reproducible del contexto sintético, silencios/mute/solapamiento/reproducción/trabajo pendiente, reapertura y aislamiento, validadores atlas y navegador local. No acredita hardware físico ni uso en producción.

Reversión: revertir los PR conservando diarios y objetivos; sin cambio de esquema canónico ni Apps Script.

Referencias: https://developers.openai.com/api/docs/guides/live-conversations y https://developers.openai.com/api/docs/guides/live-delegation (consultadas 2026-10-10).

## Evidencia local

- Motor: 325 aprobadas, 0 fallidas, 1 prueba optativa de Chromium omitida.
- Portal: 608 aprobadas, 0 fallidas. Validadores de arquitectura, OS, portal, accesos y obra aprobados.
- Chromium local: escritorio 1280 px y móvil 390 px, oscilador sintético reproducido, detección y drenado, pausa/liberación de dispositivos, estado de objetivo y nueva apertura que espera session.started. Señalización y datos con dobles, sin red externa.
- Fixture de expediente: instrucciones + copia heredada previa = 13,666 bytes; instrucciones sin la copia = 8,884 bytes. Disminuye 4,782 bytes (34.99%). Excluye el resto de la conversación, esquemas de herramientas y envoltura del protocolo; no estima tokens ni dinero.

La pausa automática necesita muestreo acústico reciente. Si el navegador no permite Web Audio, suspende el procesamiento o bloquea reproducción, el motor conserva la llamada en vez de interpretar la ausencia de telemetría como silencio; siguen disponibles Finalizar y el límite existente de 15 minutos. No se acredita micrófono físico ni producción.

Revisión de concurrencia: las ramas de PR55/PR149 son la base, no se modifican. En portal PR64 comparte el atlas y architecture-impact.json (posible conciliación al integrar); PR62/PR66 no comparten archivos de esta implementación.
