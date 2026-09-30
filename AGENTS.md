# Trabajar en YOD OS

Antes de modificar código, leer `docs/arquitectura/README.md`, el componente y sus conexiones en `docs/arquitectura/modelo.json`, y las instrucciones específicas `CLAUDE.md`. La arquitectura describe versiones comprobadas; contrastar siempre con el código y despliegue actuales.

1. Registrar primero la propuesta y su impacto en el modelo y `architecture-impact.json`.
2. Distinguir existente, propuesto, implementado y verificado en producción. No dar por automático un paso manual ni por desplegado un archivo fuente.
3. Conservar IDs y contratos. Las reglas comerciales pendientes se consultan por las letras de `docs/arquitectura/propuestas.md`.
4. Implementar y probar fuera de producción. No llamar endpoints de negocio para «probar» escrituras ni asumir que GET carece de efectos.
5. Ejecutar `node scripts/arquitectura.cjs --check`, `node --test tests/*.cjs`, `node verify-os.cjs`, `node verify-portal.cjs`, `node verify-accesos.cjs` y `node verify-obra-app.cjs` cuando se cambie este portal. Usar el commit de Potenciales previsto mediante `ACCESOS_REF` para comprobaciones coordinadas.
6. Entregar PR con evidencia, referencias y reversión. No omitir las verificaciones para publicar directamente.

El repositorio es público. Nunca publicar datos reales de clientes, secretos, exportaciones de hojas privadas o detalles de vulnerabilidades pendientes. Usar ejemplos sintéticos y avisos privados de seguridad para los hallazgos restringidos.

Prioridad del propietario: vender más, luego mejorar margen/control y después acelerar cobros. Seguridad e integridad de datos no se sacrifican por ese orden.
