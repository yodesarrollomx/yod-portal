# Paso 6 · comparar Decisions y Jev

CHG-DESPACHO-DECISIONS-131. Implementado local; sin integración ni despliegue.
Motor en rama apilada sobre PR60; este PR documental sobre PR150. No cambia el cliente.

El servidor conserva Jev predeterminado. YOD_JEV_PROVIDER selecciona jev, decisions o sombra.
Sombra ejecuta ambos, entrega sólo Jev y registra la comparación sin esperar a Decisions.
El segundo proveedor usa POST /v1/decisions, gpt-6-luna, texto y preguntas choice/predicate.
Sólo afecta triage, clasificar, filtrarPasajes y verificar; no reemplaza el asesor de objetivos.
Refusal/error/timeout se consideran sin decisión y en modo decisions caen a Jev.
Dinero, cantidades y aprobaciones se excluyen conservadoramente de clasificación/verificación;
los permisos comerciales siguen siendo responsabilidad de los servidores canónicos.

Diario privado sin contenido en YOD_STATE_DIR, rotación UTC; /fast/usage mantiene autenticación
y añade comparación por operación, duración, consumo, coincidencias y fallos. Ambas probabilidades
predicate quedan en el diario; choice se guarda por índice para no divulgar etiquetas del cliente.
El resumen mide concordancia; no acredita exactitud ni costo monetario ni disponibilidad de la beta.

Pruebas del motor con dobles: 344 aprobadas y una omitida optativa de navegador. Proveedor fijo,
contratos, límites, timeout, rechazo, fallback, sombra, umbrales, privacidad y autenticación.
Documentación oficial consultada 2026-10-10: developers.openai.com/api/docs/guides/decisions y
/api/reference/resources/decisions/methods/create. Sin llamadas de prueba a proveedores ni negocio.

Reversión: jev o revertir el PR; conservar diarios. Activación depende de Alejandro.
PR64 comparte metadatos del atlas; no se tocaron sus módulos ni sus ramas.
