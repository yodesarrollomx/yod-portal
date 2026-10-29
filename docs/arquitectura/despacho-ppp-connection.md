# Despacho · recepción y confirmación del PPP

CHG-DESPACHO-PPP-CONNECTION-20261028. Base inspeccionada: `b792c117977a3281538e0628dd792458ce43b043`. Propuesta registrada en el modelo antes de implementar. Estado: implementado localmente; publicación y comprobación productiva pendientes.

El puesto iniciaba un temporizador de quince segundos al montar el PPP, pero sólo lo cancelaba después de que el motor confirmara la lectura. Si el iframe respondía y la sesión temporal o la respuesta del motor demoraba, aparecía el aviso incorrecto de que el PPP todavía no había compartido su lectura.

La recepción desde el origen, ventana y nonce esperados, con caso y escenario vinculados, ahora cancela esa espera. La interfaz indica que recibió la lectura y espera confirmación. El estado compartido sólo se actualiza después del acuse existente. Una respuesta o error de un caso abandonado no cambia el puesto nuevo. La recuperación explícita conserva el iframe y vuelve a esperar una respuesta suya.

Los expedientes marcados `record_only` por el servidor pueden mostrar la lectura local de su PPP registrado. La interfaz declara que no tienen motor conectado y no solicita sesiones temporales ni rutas `/board/state`, `/board/snapshot` o conciliación de recibos. Esa lectura no se guarda como tablero compartido ni habilita propuestas de escritura.

## Validación

- Antes del cambio, las pruebas reprodujeron dos fallos: aviso de silencio después de recibir el PPP y solicitud al motor para un expediente documental.
- Siete pruebas aisladas ejecutan el bloque de conexión de producción con temporizador, etiquetas y transporte controlados: confirmación demorada, origen/ventana/nonce/caso/escenario rechazados, acuse tardío, error tardío, recuperación y consulta documental sin llamadas al motor.
- `node --check despacho3d/agent-workspace.mjs` aprobado. Suite completa y verificadores corresponden a la integración del cambio.

Las pruebas usan identidades sintéticas. No acreditan carga del PPP privado, tiempos reales, lectura financiera canónica ni estabilidad de la sesión. El fallo de lectura del índice de fuentes observado en el piloto es independiente y no se da por resuelto con este ajuste.

## Recuperación de lecturas ocupadas

El transporte permite hasta tres intentos exclusivamente para `read` y `readGoals` tras un rechazo JSON explícito `lock_busy` previo a ejecución. El plazo total de 45 segundos incluye todas las solicitudes y las pausas de 500 y 1,000 ms. La identidad y el cuerpo se fijan al iniciar; un cambio de sesión descarta respuestas y veta otro intento. Cerrar el transporte aborta solicitudes y esperas. Los timeouts, fallos de red, denegaciones, otros métodos y escrituras no se repiten.

Siete pruebas adicionales cubren recuperación, agotamiento, plazo total, resultado incierto, métodos excluidos, cambio de sesión y cancelación. El bloqueo es una causa compatible con el mensaje observado, pero no se confirmó como respuesta productiva en la revisión previa a publicar.

## Reversión

Revertir este cambio de interfaz. No cambia permisos, modelos financieros, registros, etapas comerciales ni recibos durables.
