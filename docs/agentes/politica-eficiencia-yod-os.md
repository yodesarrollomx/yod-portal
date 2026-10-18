# Política transversal de eficiencia de agentes — YOD OS
Versión: 2026-10-18. Estado: propuesta reversible. Alcance: ChatGPT Work/Codex, Claude Code y otros agentes que lean estas instrucciones en repositorios YOD OS.

## Jerarquía y límites
Seguir instrucciones de sistema, usuario y repositorio. No sustituye AGENTS.md, CLAUDE.md, planes de pruebas ni controles de seguridad. No se aplica automáticamente a todos los chats históricos ni instala complementos por sí sola. Nunca afirmar que un agente usó una herramienta no disponible.

## Antes de recuperar contexto
1. Leer la petición y determinar fuentes mínimas. Para documentos, Gmail, Calendar, Contacts, GitHub o Render usar primero skill jev-ahorro-tokens si está instalada y jev_triage si el conector está disponible. Si no, registrar ausencia y aplicar selección equivalente sin fingir ejecución.
2. Listar rutas/títulos/metadata y obtener pasajes breves antes de leer archivos completos. Pasar hasta 40 pasajes a jev_filtrar_pasajes; confianza >=0.95 permite lectura selectiva directa; con incertidumbre, conflicto, resultado incompleto o tarea de alto impacto, examinar contenido y fuentes primarias en profundidad.
3. Aplicar una sola estrategia de recuperación y escalar gradualmente. Reutilizar referencias, SHA, identificadores y resultados ya verificados; no repetir escaneos sin cambios detectables.
4. Priorizar consulta a índice/grafo de dependencias (Graphify, si instalado y actualizado), luego archivos afectados; el grafo es una pista, no prueba de estado real. Verificar contra código y pruebas.

## Ejecución
- **Plan**: definición de terminado, responsable, entorno, alcance, dependencias, riesgos y reversión.
- **Build**: parche mínimo, localizado e idempotente; evitar reformatear archivos no relacionados. Ponytail, si está disponible, es opcional: medir legibilidad, cambios y coste antes de adoptarlo.
- **Test**: ejecutar pruebas aplicables al proyecto; nunca asumir que un test local acredita un despliegue.
- **Review**: revisar diff, datos privados, accesos, seguridad, costes, conflictos y trazabilidad.
- **Ship**: PR y verificaciones, y despliegue solo por flujo autorizado; registrar URL/commit/pruebas y pendiente real.
- Si se bloquea una fase, conservar resultado parcial y siguiente acción; no decir «terminado» por generar documentación.

## Modelos y costes
OmniRoute es **optativo y desactivado por defecto**. Nunca enviar datos de clientes, claves, repositorios privados o comunicaciones a modelos/proveedores externos sin consentimiento específico, evaluación de privacidad y reglas de residencia. No perseguir límites gratuitos ni crear cuentas de evasión. Estimar coste total (latencia, exactitud, retrabajo), no solo tokens. Nunca cambiar modelos silenciosamente en una operación sensible.

## Salidas y bitácora
Cada cambio: ID, fecha, sistema, fuente de verdad, antes/después, archivos y commits, pruebas ejecutadas y no ejecutadas, responsable, siguiente paso y rollback. Separar **propuesto / implementado / probado / publicado**. Evitar repetición narrativa y citas inventadas.

## Desactivación y reversión
Esta política no ejecuta código, proxies ni llamadas externas: quitar las referencias a este archivo revierte su aplicación en agentes que lo lean. Cada paquete instalado debe tener manifest, versión, permisos, origen, procedimiento de desinstalación y prueba de regresión independiente. Revertir mediante PR/commit; nunca borrar datos de negocio para desinstalar herramientas.
