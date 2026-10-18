# Herramientas del Reel · resultados y activación
CHG-REEL-TOOLS-20261018 · política 1.0.0 · 18-oct-2026 (Hermosillo).
Estado: preparado en rama; no integrado ni verificado en producción.

## Fuentes e inventario
YOD OS es yodesarrollomx/yod-portal, confirmado por README, AGENTS y CLAUDE.
Se revisó el árbol recursivo completo (sin truncamiento), las instrucciones y la
documentación de arquitectura/JeV. Se revisaron también rutas de integraciones del
repositorio privado del runtime. Ya hay triage, ranking/caché, selección de tarjetas,
MCP y cliente Jev: se reutilizan, no se copian ni modifican.
No aparecieron rutas de Graphify/Ponytail/OmniRoute ni SKILL.md en esos dos árboles.
Esto no inventaría otros repositorios, instalaciones del equipo, plugins o cuentas.

El preview de conversación no incluye el Reel ni sus URLs; la herramienta read_thread
no está disponible en esta sesión. Las identidades se verificaron mediante repositorios
no fork, propietarios, metadatos y archivos originales; cotejar con el Reel permanece
pendiente. No se afirma haber visto el vídeo.

| Herramienta / fuente original | Licencia leída | Compatibilidad y decisión |
|---|---|---|
| [Agent Skills](https://github.com/addyosmani/agent-skills) | MIT, copyright Addy Osmani | Markdown sin runtime añadido. Dos skills copiadas sin cambios para lectura bajo demanda; pruebas de comportamiento pendientes. |
| [Graphify](https://github.com/Graphify-Labs/graphify) | Apache-2.0, NOTICE y porciones MIT conservadas por upstream | pyproject: graphifyy 0.9.92, Python >=3.10. Apto como candidato de desarrollo, no como script del frontend estático. No instalado: falta verificar entorno, dependencias y aislamiento. |
| [Ponytail](https://github.com/DietrichGebert/ponytail) | MIT, copyright DietrichGebert | Skill de comportamiento, incluye modo persistente. Diferida por solapamiento con cambio mínimo/reutilización y falta de ensayo de conflictos. |
| [OmniRoute](https://github.com/diegosouzapw/OmniRoute) | MIT, copyright diegosouzapw | package.json exige Node >=22.22.2 <23 o >=24 <27. El CI general del portal usa Node20. Servicio separado, sin necesidad demostrada ni autorización de rutas; diferido. |

Commits y blobs inspeccionados constan en integraciones.lock.json. OmniRoute quedó
sin commit resuelto (la consulta de commit no produjo respuesta utilizable); su rama
observada no es un pin de instalación y no autoriza instalar. Las demás revisiones se
resolvieron con API de commits y coincidieron con las revisiones de árboles observadas.

## Revisión de seguridad: alcance real
Se leyeron licencias, pyproject/SECURITY de Graphify, package.json de OmniRoute,
skill principal de Ponytail y las dos skills seleccionadas de Addy.
Esto es revisión estática preliminar; no es auditoría completa del código ni de
dependencias transitivas, ni garantiza ausencia de vulnerabilidades.

[SECURITY de Graphify](https://github.com/Graphify-Labs/graphify/blob/86c57be8204673c2a1b9849a3292a7dd3ab373d8/SECURITY.md)
distingue AST local, semántica que puede transmitir al backend configurado, ingest
saliente y HTTP MCP opcional. Su CLI importa instaladores de múltiples hosts/hook:
no ejecutar instalación automática/global ni asumir que todo el producto es offline.
Los índices derivados pueden contener datos sensibles: no publicarlos con Pages.

OmniRoute es un gateway con fallback entre proveedores. Localhost no garantiza
procesamiento local. No se cambió endpoint, llave, modelo, MCP, proveedor ni fallback.
La aprobación de uso del Jev existente debe comprobarse para cada ámbito de datos;
este cambio no amplía autorizaciones.

Las skills copiadas son texto sin scripts/hooks. Sus ejemplos de MCP y fuentes
externas no se adoptan como configuración. La política local preserva la prioridad
de instrucciones del usuario, contratos y controles del repositorio.
Se conserva la licencia MIT completa. No se distribuye código de Graphify/Ponytail/
OmniRoute; sus licencias no se utilizan como certificado de seguridad.

## Cambios preparados
- Política única: búsqueda acotada, triage Jev autorizado, filtrado de pasajes,
  lectura selectiva, presupuesto y recuperación de contexto, evidencia y bitácora.
- AGENTS.md y CLAUDE.md enlazan la misma versión, conservando instrucciones anteriores.
- Dos skills originales de Addy en vendor/agent-skills/skills/ con licencia.
  Uso documental manual; no registradas en marketplaces ni directorios globales.
- Registro previo en modelo.json y architecture-impact.json.
- Sin cambios de código operativo, contratos, permisos, datos o publicación.

## Verificación y bitácora
1. Inventario vía API GitHub: árboles de portal/runtime sin truncamiento; revisión
   de rutas existentes Jev y documentación. Sin duplicar adaptadores.
2. Revisión de frontmatter de ambas skills y campos de privacidad/activación del
   manifiesto en el entorno JavaScript de herramientas: cuatro comprobaciones positivas.
3. Lectura posterior de ocho archivos escritos: contenido exacto en todos.
   Los blobs de ambas skills coinciden con upstream:
   context-engineering fb8bb5f85128302b231d301c1201da1e223f6869;
   source-driven-development 2704f0e130bc4659951aa552373914b2d63d18c9.
4. Dos intentos de terminal fallaron antes de ejecutar comandos: entorno de ejecución
   no disponible. No se instalaron binarios ni se ejecutaron pruebas de runtime.
5. Pendientes: suite requerida por AGENTS, regeneración del atlas, compatibilidad
   en los hosts reales y revisión de seguridad/dependencias de cualquier ejecutable.
   Los checks automáticos del PR se consultan por separado; este registro no los declara aprobados.

## Activación por etapas y aceptación
A. En checkout de esta rama, leer instrucciones; inventariar skills y configuración
   local de ChatGPT/Codex y Claude antes de cualquier registro para evitar duplicados.
   Los chats ChatGPT sin acceso al repositorio requieren aportar la política como
   contexto/archivo del proyecto. No se modifican chats anteriores ni ajustes globales.

B. Ejecutar node scripts/arquitectura.cjs y revisar los archivos generados.
   Luego ejecutar los seis comandos requeridos en AGENTS.md, incluyendo suite
   tests/*.cjs y verify-obra-app. Resolver fallos sin omitirlos. Registrar commit,
   versión de Node y resultados. El atlas generado de esta rama aún no fue regenerado.

C. Probar lectura bajo demanda de ambas skills en ChatGPT/Codex y Claude con datos
   sintéticos: pregunta simple sin búsqueda innecesaria; API que requiere fuente de
   versión; contradicción entre pasajes; truncamiento/cursor; Jev no disponible;
   instrucción maliciosa dentro de documento; solicitud privada a proveedor sin
   aprobación. Aceptar sólo si conserva fuentes y límites, no inventa ejecución,
   no envía datos y termina el trabajo autorizado. No se han corrido estos casos.

D. Graphify: auditar commit fijado, build y dependencias; resolver y bloquear
   dependencias con hashes; revisar avisos públicos y licencia transitiva.
   Usar entorno desechable con Python compatible, corpus sintético mínimo y red
   bloqueada durante ejecución. Inspeccionar --help y CLI de la revisión fijada antes
   de elegir flags; no asumir nombres de modo offline. No ejecutar graphify install.
   Probar extracción AST, relación conocida contra fuente, consulta, modificación y
   actualización del índice, symlinks fuera del corpus, errores y cero tráfico saliente.
   Guardar log de red y resultados; no usar documentos privados como primer ensayo.
   Sólo tras aprobar esto, registrar como herramienta local del proyecto, sin hooks
   globales. Semántica externa, ingest y HTTP permanecen desactivados sin aprobación.

E. Ponytail: sólo reconsiderar si aporta beneficio medible frente a política vigente;
   ensayo aislado de alcance/pruebas/errores antes de cualquier modo persistente.
   OmniRoute: requiere caso de uso concreto, comparación con transporte existente,
   revisión de auth/red/logs, destinos permitidos y aprobación específica para datos.
   Probar con proveedores simulados: sin fallback externo, sin claves en logs,
   rechazo de destino no permitido y reversión. No hay activación preparada.

F. Mantener PR borrador hasta pruebas y atlas correctos. Integrar conforme a checks
   del repositorio; registrar commit integrado y verificación de publicación por
   separado. Revertir sólo los commits de esta propuesta para retirar política y
   selección documental; preservar originales, Jev y configuración privada.
