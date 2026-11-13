---
name: yod-contexto-eficiente
description: Recupera solo contexto necesario de YOD OS usando Jev, atlas y lectura selectiva, y deja evidencia comprobable.
---
# YOD · Contexto y ejecución eficiente
1. Confirma objetivo, entorno, fuente de verdad y criterio de cierre. Conserva la jerarquía AGENTS.md / CLAUDE.md y las instrucciones de seguridad del proyecto.
2. Antes de buscar en Drive, Gmail, Calendar, Contacts, GitHub o Render, usa `jev_triage` si está disponible; si la skill `jev-ahorro-tokens` está disponible, léela primero. Si no existen, anota la ausencia sin simular.
3. Recupera metadatos y pasajes breves. Usa `jev_filtrar_pasajes` antes de leer archivos extensos; con p>=0.95 y evidencia coherente limita lectura, con duda revisa fuentes primarias.
4. Lee primero atlas y archivos afectados; usa Graphify únicamente cuando esté instalado, actualizado y clasificado para el repositorio.
5. Plan -> Build -> Test -> Review -> Ship. Mantén los cambios mínimos sin omitir validación de seguridad, errores, dinero o permisos. Prueba en entorno seguro.
6. Informa claramente: propuesto, implementado, probado o desplegado; fecha, commit, pruebas, riesgos, responsable y cómo revertir.
7. No habilites Ponytail, Agent Skills de terceros ni OmniRoute por mencionarlos en el repositorio. No envíes datos privados a proveedores nuevos sin permiso.
Consulta `docs/agentes/politica-eficiencia-yod-os.md` y `docs/agentes/instalacion-reversible.md` para detalles.
