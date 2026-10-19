# Integraciones reversibles de agentes · YOD OS
Fecha: 2026-10-18. Estado: procedimiento de despliegue, **no constancia de instalación**.

## Reglas previas
No correr instaladores automáticamente sobre producción, cuentas de usuarios, contenedores Render o repositorios privados. Primero verificar versión, dependencias, licencia y origen, preparar respaldo del directorio de configuración, ejecutar en un perfil de prueba sin secretos, y comparar los archivos modificados. No copiar credenciales a un repositorio público.

## Matriz de implementación

| Herramienta | Origen oficial | Método para el entorno adecuado | Prueba y reversión |
|---|---|---|---|
| Jev | Conector interno ya disponible en ChatGPT cuando está conectado | Primero `jev_triage`, luego `jev_filtrar_pasajes` sobre fragmentos; skill `jev-ahorro-tokens` solo si existe en el agente | Registrar salida real; desactivar el hook/configuración propia sin borrar conversaciones |
| Agent Skills | https://github.com/addyosmani/agent-skills | Claude Code / Codex CLI: `npx skills add addyosmani/agent-skills --list` para inventariar; instalar selectivamente `npx skills add addyosmani/agent-skills --skill code-review-and-quality` y `--skill test-driven-development` en entorno aislado | Verificar que las skills aparecen en el asistente; desinstalar según el gestor `skills` y restaurar snapshot de config |
| Graphify | https://github.com/Graphify-Labs/graphify | `uv tool install graphifyy`; comprobar `graphify --version`; en entorno de pruebas `graphify install` y `/graphify .` en un repo sintético | Comprobar graph.json / GRAPH_REPORT.md, revisar qué datos salen de la máquina; `graphify claude uninstall` o `graphify kilo uninstall` según adaptador; `uv tool uninstall graphifyy` |
| Ponytail | https://github.com/DietrichGebert/ponytail | Claude Code: `/plugin marketplace add DietrichGebert/ponytail`, `/plugin install ponytail@ponytail`; Codex CLI: `codex plugin marketplace add DietrichGebert/ponytail` y `codex plugin add ponytail@ponytail` | Probar `/ponytail lite`, cambios mínimos con tests; `/ponytail off` o desinstalar desde gestor de plugins, restaurar hooks respaldados |
| OmniRoute | https://github.com/Gmagl/omniroute | **NO ACTIVAR** con información de empresa sin revisión de políticas de cada proveedor, permisos, trazabilidad, costes y residencia. Laboratorio optativo en máquina aislada con datos sintéticos. | Prueba de rutas de fallback, auditoría de destinos y privacidad; parar servicio, quitar proxy de configuración y tokens de laboratorio |

**No usar etiquetas de marketing como garantía de ahorro**: medir en 5 tareas representativas el tiempo, tokens, calidad, tasa de pruebas y regresiones, con y sin cada complemento.

## Política de permisos
- Nivel A: instrucciones locales Jev / Plan-Build-Test-Review-Ship, sin acceso externo nuevo.
- Nivel B: Graphify local con archivos sin confidencialidad; prohibida indexación de información de clientes sin clasificación y permiso.
- Nivel C: skills/herramientas de terceros instaladas en perfil aislado, sin claves.
- Nivel D: enrutador OmniRoute con APIs externas: desactivado hasta consentimiento específico sobre proveedores/datos.

## Orden de despliegue
1. Aprobar el PR central, respetando los checks de protección de ramas.
2. Fusionar referencias de agentes en cada repo solo después de CI local de ese repo.
3. Tomar respaldo de configuración de herramientas de desarrollo en estación o entorno de ejecución real.
4. Instalar selectivamente las herramientas de nivel B/C en perfil de prueba, no globalmente.
5. Ejecutar matriz de pruebas A/B, registrar evidencias y activar solo las que mejoren resultados.
6. Documentar versiones, destinos de datos, fecha, responsable, instrucciones de desinstalación y retroceso.

## Límites de cobertura
`AGENTS.md` y `CLAUDE.md` se interpretan por herramientas de desarrollo que leen esos archivos; no reprograman chats existentes de ChatGPT ni ChatGPT.com. Las instrucciones globales de ChatGPT deben cambiarse en la configuración permitida por el producto; no hay API de este repositorio que las active.

## Reversión de toda esta fase
Revertir PR central y PR de cada repositorio que haya sido integrado; desinstalar plugins/herramientas una a una en el mismo entorno donde fueron activadas. No eliminar bitácoras de negocio, credenciales ni transcripciones.
